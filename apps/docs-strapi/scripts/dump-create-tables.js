/**
 * 导出数据库所有表的 CREATE TABLE 语句
 *
 * 使用方式：
 * node scripts/dump-create-tables.js [--output=filename.sql]
 *
 * --output=filename.sql: 输出到文件（默认输出到控制台）
 */

const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

// 尝试加载 .env 文件
try {
  require('dotenv').config({ path: path.join(__dirname, '../.env') });
} catch (e) {}

// 解析命令行参数
const outputArg = process.argv.find(arg => arg.startsWith('--output='));
const OUTPUT_FILE = path.join(__dirname, '../database/dump.sql');

async function main() {
  const config = {
    host: process.env.DATABASE_HOST || '127.0.0.1',
    port: parseInt(process.env.DATABASE_PORT || '15001', 10),
    database: process.env.DATABASE_NAME || 'strapi',
    user: process.env.DATABASE_USERNAME || 'strapi',
    password: process.env.DATABASE_PASSWORD || '',
  };

  console.log(`连接数据库: ${config.host}:${config.port}/${config.database}`);

  const connection = await mysql.createConnection(config);

  // 1. 获取所有表名
  const [tables] = await connection.query(
    `SELECT TABLE_NAME FROM information_schema.TABLES
     WHERE TABLE_SCHEMA = ? AND TABLE_TYPE = 'BASE TABLE'
     ORDER BY TABLE_NAME`,
    [config.database]
  );

  console.log(`共 ${tables.length} 个表\n`);

  const results = [];

  results.push(`-- Database: ${config.database}`);
  results.push(`-- Generated at: ${new Date().toISOString()}`);
  results.push(`-- Total tables: ${tables.length}`);
  results.push('');

  for (const { TABLE_NAME: tableName } of tables) {
    // 使用 SHOW CREATE TABLE 获取完整建表语句
    const [rows] = await connection.query(`SHOW CREATE TABLE \`${tableName}\``);
    const createSql = rows[0]['Create Table'];

    results.push(`-- ----------------------------`);
    results.push(`-- Table: ${tableName}`);
    results.push(`-- ----------------------------`);
    results.push(`DROP TABLE IF EXISTS \`${tableName}\`;`);
    results.push(createSql + ';');
    results.push('');
  }

  await connection.end();

  const output = results.join('\n');

  if (OUTPUT_FILE) {
    const outputPath = path.resolve(OUTPUT_FILE);
    fs.writeFileSync(outputPath, output, 'utf-8');
    console.log(`✓ 已导出到文件: ${outputPath}`);
  } else {
    console.log('========== CREATE TABLE 语句 ==========\n');
    console.log(output);
  }
}

main().catch((err) => {
  console.error('执行失败:', err);
  process.exit(1);
});
