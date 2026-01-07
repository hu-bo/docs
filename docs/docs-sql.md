-- 空间表：space
CREATE TABLE `space` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `ctime` datetime(6) NOT NULL DEFAULT current_timestamp(6) COMMENT '创建时间',
  `mtime` datetime(6) NOT NULL DEFAULT current_timestamp(6) ON UPDATE current_timestamp(6) COMMENT '修改时间',
  `is_deleted` tinyint(4) NOT NULL DEFAULT 0 COMMENT '软删除：0否1是',

  `name` varchar(128) NOT NULL,
  `code_name` varchar(128) NOT NULL COMMENT '空间代号',
  `creator` varchar(128) NOT NULL COMMENT '创建人username',
  `icon` varchar(255) NOT NULL DEFAULT '' COMMENT '图标',
  `dataset_id` varchar(255) NOT NULL DEFAULT 0 COMMENT '知识库id',

  PRIMARY KEY (`id`),
  UNIQUE KEY `UK_code_name` (`code_name`),
  KEY `IDX_mtime` (`mtime`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='空间表';


-- 空间映射表：space_dept（用于登录空间时的权限赋予快照：二/三级部门id、部门名字）
CREATE TABLE `space_dept` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `ctime` datetime(6) NOT NULL DEFAULT current_timestamp(6) COMMENT '创建时间',
  `mtime` datetime(6) NOT NULL DEFAULT current_timestamp(6) ON UPDATE current_timestamp(6) COMMENT '修改时间',

  `is_deleted` tinyint(4) NOT NULL DEFAULT 0 COMMENT '软删除：0否1是',
  `space_id` bigint(20) NOT NULL,
  `dept_id` bigint(20) NOT NULL DEFAULT 0  COMMENT '部门ID',
  `dept_name` varchar(128) NOT NULL DEFAULT ''  COMMENT '部门名称',
  `username` varchar(128) NOT NULL DEFAULT ''  COMMENT '用户名',
  PRIMARY KEY (`id`),
  UNIQUE KEY `UK_space_dept` (`space_id`, `dept_id`),
  KEY `IDX_mtime` (`mtime`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='空间-部门映射快照表';


-- 空间授权表：user_space_auth
CREATE TABLE `user_space_auth` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `ctime` datetime(6) NOT NULL DEFAULT current_timestamp(6) COMMENT '创建时间',
  `mtime` datetime(6) NOT NULL DEFAULT current_timestamp(6) ON UPDATE current_timestamp(6) COMMENT '修改时间',
  `is_deleted` tinyint(4) NOT NULL DEFAULT 0 COMMENT '软删除：0否1是',
  `space_id` bigint(20) NOT NULL DEFAULT 0,
  `username` varchar(128) NOT NULL,

  `can_read` tinyint(4) NOT NULL DEFAULT 1 COMMENT '0无,1有权限',
  `can_create_folder` tinyint(4) NOT NULL DEFAULT 0 COMMENT '0无,1有权限',
  `can_create_doc` tinyint(4) NOT NULL DEFAULT 0 COMMENT '0无,1有权限',
  `super_admin` tinyint(4) NOT NULL DEFAULT 0 COMMENT '0无,1空间内全局编辑权',
  `source` enum('AUTO_INIT','MANUAL') NOT NULL DEFAULT 'MANUAL' COMMENT '自动初始化还是手工(AUTOINIT | MANUAL)',

  PRIMARY KEY (`id`),
  UNIQUE KEY `UK_space_user` (`space_id`, `username`),
  KEY `IDX_mtime` (`mtime`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='空间授权表';


-- 文档白名单表：doc_user_acl
CREATE TABLE `doc_user_acl` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `ctime` datetime(6) NOT NULL DEFAULT current_timestamp(6) COMMENT '创建时间',
  `mtime` datetime(6) NOT NULL DEFAULT current_timestamp(6) ON UPDATE current_timestamp(6) COMMENT '修改时间',
  `is_deleted` tinyint(4) NOT NULL DEFAULT 0 COMMENT '软删除：0否1是',

  `doc_id`  bigint(20) NOT NULL DEFAULT 0,
  `username` varchar(128) NOT NULL,
  `perm` enum('READ','EDIT') NOT NULL COMMENT 'READ | EDIT',

  PRIMARY KEY (`id`),
  UNIQUE KEY `UK_doc_user` (`doc_id`, `username`),
  KEY `IDX_mtime` (`mtime`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='文档白名单表';

-- 文档空间表：doc_space_acl（用于文档跨空间绑定）
CREATE TABLE `doc_space_acl` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `ctime` datetime(6) NOT NULL DEFAULT current_timestamp(6) COMMENT '创建时间',
  `mtime` datetime(6) NOT NULL DEFAULT current_timestamp(6) ON UPDATE current_timestamp(6) COMMENT '修改时间',
  `is_deleted` tinyint(4) NOT NULL DEFAULT 0 COMMENT '软删除：0否1是',

  `doc_id`  bigint(20) NOT NULL DEFAULT 0,
  `space_id` bigint(20) NOT NULL DEFAULT 0,
  `folder_id` bigint(20) NOT NULL DEFAULT 0 COMMENT '绑定到的文件夹ID',
  `perm` enum('READ','EDIT') NOT NULL COMMENT 'READ | EDIT',

  PRIMARY KEY (`id`),
  UNIQUE KEY `UK_doc_space` (`doc_id`, `space_id`),
  KEY `IDX_mtime` (`mtime`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='文档空间绑定表';


-- 文档主表：doc
CREATE TABLE `doc` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `ctime` datetime(6) NOT NULL DEFAULT current_timestamp(6) COMMENT '创建时间',
  `mtime` datetime(6) NOT NULL DEFAULT current_timestamp(6) ON UPDATE current_timestamp(6) COMMENT '修改时间',
  `is_deleted` tinyint(4) NOT NULL DEFAULT 0 COMMENT '软删除：0否1是',

  `space_id` bigint(20) NOT NULL  DEFAULT 0,
  `folder_id` bigint(20) NOT NULL  DEFAULT 0,
  `title` varchar(128) NOT NULL DEFAULT "",
  `content` longtext NOT NULL,
  `access_mode` enum('OPEN_EDIT','OPEN_READONLY','WHITELIST_ONLY') NOT NULL DEFAULT 'OPEN
READONLY'
    COMMENT 'OPEN_EDIT | OPEN_READONLY | WHITELIST_ONLY',
  `owner` varchar(64) NOT NULL COMMENT '创建人username',
  `tags` varchar(512) NOT NULL DEFAULT '' COMMENT '示例：直播,跨年,营收',


  PRIMARY KEY (`id`),
  KEY `IDX_mtime` (`mtime`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='文档主表';


-- 目录表：folder
CREATE TABLE `folder` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `space_id` bigint(20) NOT NULL,
  `parent_id` bigint(20) NOT NULL DEFAULT 0 COMMENT '0则是顶级目录',
  <!-- `childrens` json NULL COMMENT '子集folder id列表（可选）', 虚拟字段，关联查询的时候json出这个字段 -->
  `name` varchar(128) NOT NULL,
  `visibility_scope` enum('ALL','DEPT_ONLY') NOT NULL DEFAULT 'ALL' COMMENT 'ALL | DEPT_ONLY',
  `order` int NOT NULL DEFAULT 0 COMMENT '排序',

  `ctime` datetime(6) NOT NULL DEFAULT current_timestamp(6) COMMENT '创建时间',
  `mtime` datetime(6) NOT NULL DEFAULT current_timestamp(6) ON UPDATE current_timestamp(6) COMMENT '修改时间',
  `is_deleted` tinyint(4) NOT NULL DEFAULT 0 COMMENT '软删除：0否1是',

  PRIMARY KEY (`id`),
  KEY `IDX_mtime` (`mtime`),
  KEY `IDX_space_id` (`space_id`),
  KEY `IDX_parent_id` (`parent_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='目录表';


-- 评论表：comment
CREATE TABLE `comment` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `ctime` datetime(6) NOT NULL DEFAULT current_timestamp(6) COMMENT '创建时间',
  `mtime` datetime(6) NOT NULL DEFAULT current_timestamp(6) ON UPDATE current_timestamp(6) COMMENT '修改时间',
  `is_deleted` tinyint(4) NOT NULL DEFAULT 0 COMMENT '软删除：0否1是',

  `doc_id` bigint(20) NOT NULL DEFAULT 0 COMMENT '所属文档ID',
  `parent_id` bigint(20) NOT NULL DEFAULT 0 COMMENT '父评论ID（0为顶级评论）',
  `username` varchar(128) NOT NULL COMMENT '评论者',
  `content` text NOT NULL COMMENT '评论内容',

  PRIMARY KEY (`id`),
  KEY `IDX_mtime` (`mtime`),
  KEY `IDX_doc_id` (`doc_id`),
  KEY `IDX_parent_id` (`parent_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='评论表';


-- 行为表：doc_user_activity
CREATE TABLE `doc_user_activity` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `ctime` datetime(6) NOT NULL DEFAULT current_timestamp(6) COMMENT '创建时间',
  `mtime` datetime(6) NOT NULL DEFAULT current_timestamp(6) ON UPDATE current_timestamp(6) COMMENT '修改时间',
  `is_deleted` tinyint(4) NOT NULL DEFAULT 0 COMMENT '软删除：0否1是',

  `doc_id` bigint(20) NOT NULL DEFAULT 0 ,
  `username` varchar(64) NOT NULL DEFAULT "" ,
  `last_viewed_at` datetime(6) NULL COMMENT '最后访问时间',
  `visit_count` int unsigned NOT NULL DEFAULT 0 COMMENT '访问次数（可选）',
  `last_edited_at` datetime(6) NULL COMMENT '最后修改时间',

  PRIMARY KEY (`id`),
  UNIQUE KEY `UK_doc_user` (`doc_id`, `username`),
  KEY `IDX_mtime` (`mtime`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='文档用户行为表';
