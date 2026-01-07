mysql规范

  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `ctime` datetime(6) NOT NULL DEFAULT current_timestamp(6) COMMENT '创建时间',
  `mtime` datetime(6) NOT NULL DEFAULT current_timestamp(6) ON UPDATE current_timestamp(6) COMMENT '修改时间',
  `is_deleted` tinyint(4) NOT NULL DEFAULT 0 COMMENT '软删除：0否1是'

1. 需要有ctime、mtime字段
2. 删除必须是软删除
3. mtime字段必须建索引
4. id与strapi规范一样，忽略
