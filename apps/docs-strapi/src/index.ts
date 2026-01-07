import type { Core } from '@strapi/strapi';

// 递归转换对象中所有 id 字段为字符串
function transformIdsToString(data: unknown): unknown {
  if (Array.isArray(data)) {
    return data.map(transformIdsToString);
  }
  if (data !== null && typeof data === 'object') {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data)) {
      if (key === 'id' && typeof value === 'number') {
        result[key] = String(value);
      } else if (typeof value === 'object') {
        result[key] = transformIdsToString(value);
      } else {
        result[key] = value;
      }
    }
    return result;
  }
  return data;
}

// 定义使用 isDeleted 字段进行软删除的内容类型
const SOFT_DELETION_CONTENT_TYPES = [
  'api::doc.doc',
  'api::space.space'
];
// 业务表使用 isDeleted (驼峰命名)
const CUSTOM_CONTENT_TYPES = [
  'api::access-request.access-request',
  'api::comment.comment',
  'api::doc-folder.doc-folder',
  'api::doc.doc',
  'api::doc-folder.doc-folder',
  'api::doc-space-acl.doc-space-acl',
  'api::doc-user-acl.doc-user-acl',
  'api::doc-user-activity.doc-user-activity',
  'api::space.space',
  'api::space-dept.space-dept',
  'api::space-folder.space-folder',
  'api::user-space-auth.user-space-auth',
];

export default {
  /**
   * An asynchronous register function that runs before
   * your application is initialized.
   *
   * This gives you an opportunity to extend code.
   */
  register({ strapi }: { strapi: Core.Strapi }) {
    // 全局 document middleware，对所有内容类型生效
    strapi.documents.use(async (context, next) => {
      const now = new Date().toISOString();
      const params = context.params as Record<string, any>;
      const uid = context.uid;

      // 判断是否为业务表（使用 isDeleted）还是 Strapi 内部表（使用 is_deleted）
      const isCustomType = CUSTOM_CONTENT_TYPES.includes(uid);
      const deletedField = isCustomType ? 'isDeleted' : 'is_deleted';

      // 处理创建操作 - 设置 ctime 和 mtime
      if (context.action === 'create' && params?.data) {
        params.data.ctime = now;
        params.data.mtime = now;
      }

      // 处理更新操作 - 更新 mtime
      if (context.action === 'update' && params?.data) {
        params.data.mtime = now;
      }

      // 处理删除操作 - 转换为软删除
      if (context.action === 'delete' && SOFT_DELETION_CONTENT_TYPES.includes(uid)) {
        const documentId = params?.documentId;
        if (documentId) {
          // 执行软删除
          await strapi.documents(uid as any).update({
            documentId,
            data: {
              [deletedField]: isCustomType ? true : 1,
              mtime: now,
            } as any,
          });
          // 返回被"删除"的记录，阻止实际删除
          const result = await strapi.documents(uid as any).findOne({
            documentId,
          });
          return result as Awaited<ReturnType<typeof next>>;
        }
      }

      return next();
    });

    // 全局 HTTP 中间件：将响应中的 id 转换为字符串
    strapi.server.use(async (ctx, next) => {
      await next();

      // 只处理 API 请求的 JSON 响应
      if (ctx.url.startsWith('/api/') && ctx.body) {
        ctx.body = transformIdsToString(ctx.body);
      }
    });
  },

  /**
   * An asynchronous bootstrap function that runs before
   * your application gets started.
   *
   * This gives you an opportunity to set up your data model,
   * run jobs, or perform some special logic.
   */
  bootstrap(/* { strapi }: { strapi: Core.Strapi } */) {},
};
