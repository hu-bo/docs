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
  `dataset_id` varchar(255) NOT NULL DEFAULT '' COMMENT '知识库id',
  `space_type` int NOT NULL DEFAULT 0 COMMENT '空间类型',

  PRIMARY KEY (`id`),
  UNIQUE KEY `UK_code_name` (`code_name`),
  KEY `IDX_mtime` (`mtime`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='空间表';


-- 空间部门映射表：space_dept
CREATE TABLE `space_dept` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `ctime` datetime(6) NOT NULL DEFAULT current_timestamp(6) COMMENT '创建时间',
  `mtime` datetime(6) NOT NULL DEFAULT current_timestamp(6) ON UPDATE current_timestamp(6) COMMENT '修改时间',

  `space_id` bigint(20) NOT NULL,
  `dept_id` bigint(20) NOT NULL DEFAULT 0 COMMENT '部门ID',

  PRIMARY KEY (`id`),
  UNIQUE KEY `UK_space_dept` (`space_id`, `dept_id`),
  KEY `IDX_mtime` (`mtime`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='空间-部门映射表';


-- 空间授权表：user_space_auth
CREATE TABLE `user_space_auth` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `ctime` datetime(6) NOT NULL DEFAULT current_timestamp(6) COMMENT '创建时间',
  `mtime` datetime(6) NOT NULL DEFAULT current_timestamp(6) ON UPDATE current_timestamp(6) COMMENT '修改时间',

  `space_id` bigint(20) NOT NULL DEFAULT 0,
  `username` varchar(128) NOT NULL,

  `can_read` tinyint(4) NOT NULL DEFAULT 1 COMMENT '0无,1有权限',
  `can_create_folder` tinyint(4) NOT NULL DEFAULT 0 COMMENT '0无,1有权限',
  `can_create_doc` tinyint(4) NOT NULL DEFAULT 0 COMMENT '0无,1有权限',
  `super_admin` tinyint(4) NOT NULL DEFAULT 0 COMMENT '0无,1空间内全局编辑权',
  `source` enum('AUTO_INIT','MANUAL') NOT NULL DEFAULT 'MANUAL' COMMENT '自动初始化还是手工(AUTO_INIT | MANUAL)',

  PRIMARY KEY (`id`),
  UNIQUE KEY `UK_space_user` (`space_id`, `username`),
  KEY `IDX_mtime` (`mtime`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='空间授权表';


-- 文档白名单表：doc_user_acl
CREATE TABLE `doc_user_acl` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `ctime` datetime(6) NOT NULL DEFAULT current_timestamp(6) COMMENT '创建时间',
  `mtime` datetime(6) NOT NULL DEFAULT current_timestamp(6) ON UPDATE current_timestamp(6) COMMENT '修改时间',

  `doc_id` bigint(20) NOT NULL DEFAULT 0,
  `username` varchar(128) NOT NULL,
  `perm` enum('READ','EDIT') NOT NULL COMMENT 'READ | EDIT',

  PRIMARY KEY (`id`),
  UNIQUE KEY `UK_doc_user` (`doc_id`, `username`),
  KEY `IDX_mtime` (`mtime`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='文档白名单表';


-- 文档空间绑定表：doc_space_acl（用于文档跨空间绑定）
CREATE TABLE `doc_space_acl` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `ctime` datetime(6) NOT NULL DEFAULT current_timestamp(6) COMMENT '创建时间',
  `mtime` datetime(6) NOT NULL DEFAULT current_timestamp(6) ON UPDATE current_timestamp(6) COMMENT '修改时间',

  `doc_id` bigint(20) NOT NULL DEFAULT 0,
  `space_id` bigint(20) NOT NULL DEFAULT 0,
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

  `title` varchar(128) NOT NULL DEFAULT '',
  `content` longtext NOT NULL,
  `access_mode` enum('OPEN_EDIT','OPEN_READONLY','WHITELIST_ONLY') NOT NULL DEFAULT 'OPEN_READONLY'
    COMMENT 'OPEN_EDIT | OPEN_READONLY | WHITELIST_ONLY',
  `owner` varchar(64) NOT NULL COMMENT '创建人username',
  `tags` varchar(512) NOT NULL DEFAULT '' COMMENT '示例：直播,跨年,营收',

  PRIMARY KEY (`id`),
  KEY `IDX_mtime` (`mtime`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='文档主表';


-- 文档文件夹关联表：doc_folder
CREATE TABLE `doc_folder` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `ctime` datetime(6) NOT NULL DEFAULT current_timestamp(6) COMMENT '创建时间',
  `mtime` datetime(6) NOT NULL DEFAULT current_timestamp(6) ON UPDATE current_timestamp(6) COMMENT '修改时间',

  `doc_id` bigint(20) NOT NULL DEFAULT 0 COMMENT '文档ID',
  `space_id` bigint(20) NOT NULL DEFAULT 0 COMMENT '空间ID',

  PRIMARY KEY (`id`),
  KEY `IDX_mtime` (`mtime`),
  KEY `IDX_doc_id` (`doc_id`),
  KEY `IDX_space_id` (`space_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='文档文件夹关联表';


-- 目录表：space_folder
CREATE TABLE `space_folder` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `ctime` datetime(6) NOT NULL DEFAULT current_timestamp(6) COMMENT '创建时间',
  `mtime` datetime(6) NOT NULL DEFAULT current_timestamp(6) ON UPDATE current_timestamp(6) COMMENT '修改时间',
  `is_deleted` tinyint(4) NOT NULL DEFAULT 0 COMMENT '软删除：0否1是',

  `space_id` bigint(20) NOT NULL,
  `parent_id` bigint(20) NOT NULL DEFAULT 0 COMMENT '0则是顶级目录',
  `name` varchar(128) NOT NULL,
  `visibility_scope` enum('ALL','DEPT_ONLY') NOT NULL DEFAULT 'ALL' COMMENT 'ALL | DEPT_ONLY',
  `order` int NOT NULL DEFAULT 0 COMMENT '排序',

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

  `doc_id` bigint(20) NOT NULL DEFAULT 0,
  `username` varchar(64) NOT NULL DEFAULT '',
  `last_viewed_at` datetime(6) NULL COMMENT '最后访问时间',
  `visit_count` int unsigned NOT NULL DEFAULT 0 COMMENT '访问次数',
  `last_edited_at` datetime(6) NULL COMMENT '最后修改时间',

  PRIMARY KEY (`id`),
  UNIQUE KEY `UK_doc_user` (`doc_id`, `username`),
  KEY `IDX_mtime` (`mtime`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='文档用户行为表';


-- 访问申请表：access_request
CREATE TABLE `access_request` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `ctime` datetime(6) NOT NULL DEFAULT current_timestamp(6) COMMENT '创建时间',
  `mtime` datetime(6) NOT NULL DEFAULT current_timestamp(6) ON UPDATE current_timestamp(6) COMMENT '修改时间',

  `type` enum('SPACE','DOC') NOT NULL COMMENT '申请类型：SPACE | DOC',
  `target_id` bigint(20) NOT NULL COMMENT '目标ID（空间ID或文档ID）',
  `username` varchar(128) NOT NULL COMMENT '申请人',
  `requested_perm` varchar(64) DEFAULT NULL COMMENT '申请的权限',
  `reason` text DEFAULT NULL COMMENT '申请理由',
  `status` enum('PENDING','APPROVED','REJECTED') NOT NULL DEFAULT 'PENDING' COMMENT '状态：PENDING | APPROVED | REJECTED',
  `reviewed_by` varchar(128) DEFAULT NULL COMMENT '审核人',
  `reviewed_at` datetime(6) DEFAULT NULL COMMENT '审核时间',

  PRIMARY KEY (`id`),
  KEY `IDX_mtime` (`mtime`),
  KEY `IDX_target` (`type`, `target_id`),
  KEY `IDX_username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='访问申请表';
