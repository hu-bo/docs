/**
 * 自动为数据库中所有表添加公司规范字段
 *
 * 规则：
 * 1. ctime - 创建时间
 * 2. mtime - 修改时间（需建索引）
 * 3. is_deleted - 软删除标记
 *
 * 使用方式：
 * node scripts/auto-compliance-fields.js [--dry-run]
 *
 * --dry-run: 只生成 SQL，不执行
 */

const mysql = require('mysql2/promise');
const path = require('path');

// 尝试加载 .env 文件
try {
  require('dotenv').config({ path: path.join(__dirname, '../.env') });
} catch (e) {}

const DRY_RUN = process.argv.includes('--dry-run');

async function main() {
  const config = {
    host: process.env.DATABASE_HOST || '127.0.0.1',
    port: parseInt(process.env.DATABASE_PORT || '15001', 10),
    database: process.env.DATABASE_NAME || 'strapi',
    user: process.env.DATABASE_USERNAME || 'strapi',
    password: process.env.DATABASE_PASSWORD || '',
  };

  console.log(`连接数据库: ${config.host}:${config.port}/${config.database}`);
  if (DRY_RUN) {
    console.log('【DRY RUN 模式】只生成 SQL，不执行\n');
  }

  const connection = await mysql.createConnection(config);

  // 1. 获取所有表名
  const [tables] = await connection.query(
    `SELECT TABLE_NAME FROM information_schema.TABLES
     WHERE TABLE_SCHEMA = ? AND TABLE_TYPE = 'BASE TABLE'`,
    [config.database]
  );

  console.log(`共 ${tables.length} 个表\n`);

  const statements = [];

  for (const { TABLE_NAME: tableName } of tables) {
    // 2. 获取表的列信息
    const [columns] = await connection.query(
      `SELECT COLUMN_NAME FROM information_schema.COLUMNS
       WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?`,
      [config.database, tableName]
    );
    const columnNames = new Set(columns.map(c => c.COLUMN_NAME));

    // 3. 获取表的索引信息
    const [indexes] = await connection.query(
      `SELECT INDEX_NAME, COLUMN_NAME FROM information_schema.STATISTICS
       WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?`,
      [config.database, tableName]
    );
    const indexedColumns = new Set(indexes.map(i => i.COLUMN_NAME));

    // 4. 检查并生成 SQL
    if (!columnNames.has('ctime')) {
      statements.push({
        table: tableName,
        type: 'ADD COLUMN ctime',
        sql: `ALTER TABLE \`${tableName}\` ADD COLUMN \`ctime\` datetime(6) NOT NULL DEFAULT current_timestamp(6) COMMENT '创建时间';`,
      });
    }

    if (!columnNames.has('mtime')) {
      statements.push({
        table: tableName,
        type: 'ADD COLUMN mtime',
        sql: `ALTER TABLE \`${tableName}\` ADD COLUMN \`mtime\` datetime(6) NOT NULL DEFAULT current_timestamp(6) ON UPDATE current_timestamp(6) COMMENT '修改时间';`,
      });
      // 新增 mtime 列，同时添加索引
      statements.push({
        table: tableName,
        type: 'ADD INDEX mtime',
        sql: `ALTER TABLE \`${tableName}\` ADD INDEX \`idx_${tableName}_mtime\` (\`mtime\`);`,
      });
    } else if (!indexedColumns.has('mtime')) {
      // mtime 存在但没有索引
      statements.push({
        table: tableName,
        type: 'ADD INDEX mtime',
        sql: `ALTER TABLE \`${tableName}\` ADD INDEX \`idx_${tableName}_mtime\` (\`mtime\`);`,
      });
    }
  }

  if (statements.length === 0) {
    console.log('✓ 所有表都已符合规范，无需修改');
    await connection.end();
    return;
  }

  console.log(`需要执行 ${statements.length} 条语句:\n`);

  // 按表分组显示
  const byTable = {};
  for (const s of statements) {
    if (!byTable[s.table]) byTable[s.table] = [];
    byTable[s.table].push(s);
  }

  for (const [table, items] of Object.entries(byTable)) {
    console.log(`表 ${table}:`);
    for (const item of items) {
      console.log(`  - ${item.type}`);
    }
  }
  console.log('');

  if (DRY_RUN) {
    console.log('========== 生成的 SQL ==========\n');
    for (const s of statements) {
      console.log(s.sql);
    }
    await connection.end();
    return;
  }

  // 执行 SQL
  let success = 0;
  let skipped = 0;
  let failed = 0;

  for (let i = 0; i < statements.length; i++) {
    const { sql, table, type } = statements[i];
    const shortSql = sql.length > 80 ? sql.substring(0, 80) + '...' : sql;

    try {
      await connection.execute(sql);
      console.log(`✓ [${i + 1}/${statements.length}] ${table}: ${type}`);
      success++;
    } catch (err) {
      // 1060: Duplicate column name
      // 1061: Duplicate key name
      if (err.errno === 1060 || err.errno === 1061) {
        console.log(`○ [${i + 1}/${statements.length}] 已存在，跳过: ${table} ${type}`);
        skipped++;
      } else {
        console.error(`✗ [${i + 1}/${statements.length}] 失败: ${table} ${type}`);
        console.error(`  SQL: ${shortSql}`);
        console.error(`  错误: ${err.message}`);
        failed++;
      }
    }
  }

  await connection.end();

  console.log('\n========== 执行完成 ==========');
  console.log(`成功: ${success}`);
  console.log(`跳过（已存在）: ${skipped}`);
  console.log(`失败: ${failed}`);
  console.log(`总计: ${statements.length}`);
}

main().catch((err) => {
  console.error('执行失败:', err);
  process.exit(1);
});
