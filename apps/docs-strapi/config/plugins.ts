export default ({ env }) => ({
  // 禁用 upload 插件（媒体库）- 减少数据库表
  upload: {
    enabled: false,
  },
  // 禁用 email 插件 - 减少数据库表
  email: {
    enabled: false,
  },
});
