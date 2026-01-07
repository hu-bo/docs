-- Database: strapi
-- Generated at: 2025-12-29T13:47:55.024Z
-- Total tables: 45

-- ----------------------------
-- Table: access_requests
-- ----------------------------
DROP TABLE IF EXISTS `access_requests`;
CREATE TABLE `access_requests` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `document_id` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `type` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `target_id` bigint DEFAULT NULL,
  `username` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `requested_perm` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `reason` longtext COLLATE utf8mb4_unicode_ci,
  `status` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `reviewed_by` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `reviewed_at` datetime(6) DEFAULT NULL,
  `is_deleted` tinyint(1) DEFAULT NULL,
  `ctime` datetime(6) DEFAULT NULL,
  `mtime` datetime(6) DEFAULT NULL,
  `created_at` datetime(6) DEFAULT NULL,
  `updated_at` datetime(6) DEFAULT NULL,
  `published_at` datetime(6) DEFAULT NULL,
  `created_by_id` int unsigned DEFAULT NULL,
  `updated_by_id` int unsigned DEFAULT NULL,
  `locale` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `access_requests_documents_idx` (`document_id`,`locale`,`published_at`),
  KEY `access_requests_created_by_id_fk` (`created_by_id`),
  KEY `access_requests_updated_by_id_fk` (`updated_by_id`),
  KEY `idx_access_requests_mtime` (`mtime`),
  CONSTRAINT `access_requests_created_by_id_fk` FOREIGN KEY (`created_by_id`) REFERENCES `admin_users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `access_requests_updated_by_id_fk` FOREIGN KEY (`updated_by_id`) REFERENCES `admin_users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------
-- Table: admin_permissions
-- ----------------------------
DROP TABLE IF EXISTS `admin_permissions`;
CREATE TABLE `admin_permissions` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `document_id` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `action` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `action_parameters` json DEFAULT NULL,
  `subject` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `properties` json DEFAULT NULL,
  `conditions` json DEFAULT NULL,
  `created_at` datetime(6) DEFAULT NULL,
  `updated_at` datetime(6) DEFAULT NULL,
  `published_at` datetime(6) DEFAULT NULL,
  `created_by_id` int unsigned DEFAULT NULL,
  `updated_by_id` int unsigned DEFAULT NULL,
  `locale` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ctime` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT '创建时间',
  `mtime` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6) COMMENT '修改时间',
  `is_deleted` tinyint NOT NULL DEFAULT '0' COMMENT '软删除：0否1是',
  PRIMARY KEY (`id`),
  KEY `admin_permissions_documents_idx` (`document_id`,`locale`,`published_at`),
  KEY `admin_permissions_created_by_id_fk` (`created_by_id`),
  KEY `admin_permissions_updated_by_id_fk` (`updated_by_id`),
  KEY `idx_admin_permissions_mtime` (`mtime`),
  CONSTRAINT `admin_permissions_created_by_id_fk` FOREIGN KEY (`created_by_id`) REFERENCES `admin_users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `admin_permissions_updated_by_id_fk` FOREIGN KEY (`updated_by_id`) REFERENCES `admin_users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=228 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------
-- Table: admin_permissions_role_lnk
-- ----------------------------
DROP TABLE IF EXISTS `admin_permissions_role_lnk`;
CREATE TABLE `admin_permissions_role_lnk` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `permission_id` int unsigned DEFAULT NULL,
  `role_id` int unsigned DEFAULT NULL,
  `permission_ord` double unsigned DEFAULT NULL,
  `ctime` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT '创建时间',
  `mtime` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6) COMMENT '修改时间',
  `is_deleted` tinyint NOT NULL DEFAULT '0' COMMENT '软删除：0否1是',
  PRIMARY KEY (`id`),
  UNIQUE KEY `admin_permissions_role_lnk_uq` (`permission_id`,`role_id`),
  KEY `admin_permissions_role_lnk_fk` (`permission_id`),
  KEY `admin_permissions_role_lnk_ifk` (`role_id`),
  KEY `admin_permissions_role_lnk_oifk` (`permission_ord`),
  KEY `idx_admin_permissions_role_lnk_mtime` (`mtime`),
  CONSTRAINT `admin_permissions_role_lnk_fk` FOREIGN KEY (`permission_id`) REFERENCES `admin_permissions` (`id`) ON DELETE CASCADE,
  CONSTRAINT `admin_permissions_role_lnk_ifk` FOREIGN KEY (`role_id`) REFERENCES `admin_roles` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=228 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------
-- Table: admin_roles
-- ----------------------------
DROP TABLE IF EXISTS `admin_roles`;
CREATE TABLE `admin_roles` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `document_id` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `code` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `description` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime(6) DEFAULT NULL,
  `updated_at` datetime(6) DEFAULT NULL,
  `published_at` datetime(6) DEFAULT NULL,
  `created_by_id` int unsigned DEFAULT NULL,
  `updated_by_id` int unsigned DEFAULT NULL,
  `locale` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ctime` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT '创建时间',
  `mtime` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6) COMMENT '修改时间',
  `is_deleted` tinyint NOT NULL DEFAULT '0' COMMENT '软删除：0否1是',
  PRIMARY KEY (`id`),
  KEY `admin_roles_documents_idx` (`document_id`,`locale`,`published_at`),
  KEY `admin_roles_created_by_id_fk` (`created_by_id`),
  KEY `admin_roles_updated_by_id_fk` (`updated_by_id`),
  KEY `idx_admin_roles_mtime` (`mtime`),
  CONSTRAINT `admin_roles_created_by_id_fk` FOREIGN KEY (`created_by_id`) REFERENCES `admin_users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `admin_roles_updated_by_id_fk` FOREIGN KEY (`updated_by_id`) REFERENCES `admin_users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------
-- Table: admin_users
-- ----------------------------
DROP TABLE IF EXISTS `admin_users`;
CREATE TABLE `admin_users` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `document_id` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `firstname` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `lastname` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `username` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `password` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `reset_password_token` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `registration_token` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT NULL,
  `blocked` tinyint(1) DEFAULT NULL,
  `prefered_language` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime(6) DEFAULT NULL,
  `updated_at` datetime(6) DEFAULT NULL,
  `published_at` datetime(6) DEFAULT NULL,
  `created_by_id` int unsigned DEFAULT NULL,
  `updated_by_id` int unsigned DEFAULT NULL,
  `locale` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ctime` datetime(6) DEFAULT NULL COMMENT '创建时间',
  `mtime` datetime(6) DEFAULT NULL COMMENT '修改时间',
  `is_deleted` tinyint NOT NULL DEFAULT '0' COMMENT '软删除：0否1是',
  PRIMARY KEY (`id`),
  KEY `admin_users_documents_idx` (`document_id`,`locale`,`published_at`),
  KEY `admin_users_created_by_id_fk` (`created_by_id`),
  KEY `admin_users_updated_by_id_fk` (`updated_by_id`),
  KEY `idx_admin_users_mtime` (`mtime`),
  CONSTRAINT `admin_users_created_by_id_fk` FOREIGN KEY (`created_by_id`) REFERENCES `admin_users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `admin_users_updated_by_id_fk` FOREIGN KEY (`updated_by_id`) REFERENCES `admin_users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------
-- Table: admin_users_roles_lnk
-- ----------------------------
DROP TABLE IF EXISTS `admin_users_roles_lnk`;
CREATE TABLE `admin_users_roles_lnk` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `user_id` int unsigned DEFAULT NULL,
  `role_id` int unsigned DEFAULT NULL,
  `role_ord` double unsigned DEFAULT NULL,
  `user_ord` double unsigned DEFAULT NULL,
  `ctime` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT '创建时间',
  `mtime` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6) COMMENT '修改时间',
  `is_deleted` tinyint NOT NULL DEFAULT '0' COMMENT '软删除：0否1是',
  PRIMARY KEY (`id`),
  UNIQUE KEY `admin_users_roles_lnk_uq` (`user_id`,`role_id`),
  KEY `admin_users_roles_lnk_fk` (`user_id`),
  KEY `admin_users_roles_lnk_ifk` (`role_id`),
  KEY `admin_users_roles_lnk_ofk` (`role_ord`),
  KEY `admin_users_roles_lnk_oifk` (`user_ord`),
  KEY `idx_admin_users_roles_lnk_mtime` (`mtime`),
  CONSTRAINT `admin_users_roles_lnk_fk` FOREIGN KEY (`user_id`) REFERENCES `admin_users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `admin_users_roles_lnk_ifk` FOREIGN KEY (`role_id`) REFERENCES `admin_roles` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------
-- Table: comments
-- ----------------------------
DROP TABLE IF EXISTS `comments`;
CREATE TABLE `comments` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `document_id` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `doc_id` bigint DEFAULT NULL,
  `parent_id` bigint DEFAULT NULL,
  `username` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `content` longtext COLLATE utf8mb4_unicode_ci,
  `is_deleted` tinyint(1) DEFAULT NULL,
  `ctime` datetime(6) DEFAULT NULL,
  `mtime` datetime(6) DEFAULT NULL,
  `created_at` datetime(6) DEFAULT NULL,
  `updated_at` datetime(6) DEFAULT NULL,
  `published_at` datetime(6) DEFAULT NULL,
  `created_by_id` int unsigned DEFAULT NULL,
  `updated_by_id` int unsigned DEFAULT NULL,
  `locale` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `comments_documents_idx` (`document_id`,`locale`,`published_at`),
  KEY `comments_created_by_id_fk` (`created_by_id`),
  KEY `comments_updated_by_id_fk` (`updated_by_id`),
  KEY `idx_comments_mtime` (`mtime`),
  CONSTRAINT `comments_created_by_id_fk` FOREIGN KEY (`created_by_id`) REFERENCES `admin_users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `comments_updated_by_id_fk` FOREIGN KEY (`updated_by_id`) REFERENCES `admin_users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------
-- Table: doc_space_acls
-- ----------------------------
DROP TABLE IF EXISTS `doc_space_acls`;
CREATE TABLE `doc_space_acls` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `document_id` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `doc_id` bigint DEFAULT NULL,
  `space_id` bigint DEFAULT NULL,
  `folder_id` bigint DEFAULT NULL,
  `perm` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_deleted` tinyint(1) DEFAULT NULL,
  `ctime` datetime(6) DEFAULT NULL,
  `mtime` datetime(6) DEFAULT NULL,
  `created_at` datetime(6) DEFAULT NULL,
  `updated_at` datetime(6) DEFAULT NULL,
  `published_at` datetime(6) DEFAULT NULL,
  `created_by_id` int unsigned DEFAULT NULL,
  `updated_by_id` int unsigned DEFAULT NULL,
  `locale` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `doc_space_acls_documents_idx` (`document_id`,`locale`,`published_at`),
  KEY `doc_space_acls_created_by_id_fk` (`created_by_id`),
  KEY `doc_space_acls_updated_by_id_fk` (`updated_by_id`),
  KEY `idx_doc_space_acls_mtime` (`mtime`),
  CONSTRAINT `doc_space_acls_created_by_id_fk` FOREIGN KEY (`created_by_id`) REFERENCES `admin_users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `doc_space_acls_updated_by_id_fk` FOREIGN KEY (`updated_by_id`) REFERENCES `admin_users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------
-- Table: doc_user_acls
-- ----------------------------
DROP TABLE IF EXISTS `doc_user_acls`;
CREATE TABLE `doc_user_acls` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `document_id` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `doc_id` bigint DEFAULT NULL,
  `username` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `perm` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_deleted` tinyint(1) DEFAULT NULL,
  `ctime` datetime(6) DEFAULT NULL,
  `mtime` datetime(6) DEFAULT NULL,
  `created_at` datetime(6) DEFAULT NULL,
  `updated_at` datetime(6) DEFAULT NULL,
  `published_at` datetime(6) DEFAULT NULL,
  `created_by_id` int unsigned DEFAULT NULL,
  `updated_by_id` int unsigned DEFAULT NULL,
  `locale` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `doc_user_acls_documents_idx` (`document_id`,`locale`,`published_at`),
  KEY `doc_user_acls_created_by_id_fk` (`created_by_id`),
  KEY `doc_user_acls_updated_by_id_fk` (`updated_by_id`),
  KEY `idx_doc_user_acls_mtime` (`mtime`),
  CONSTRAINT `doc_user_acls_created_by_id_fk` FOREIGN KEY (`created_by_id`) REFERENCES `admin_users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `doc_user_acls_updated_by_id_fk` FOREIGN KEY (`updated_by_id`) REFERENCES `admin_users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------
-- Table: doc_user_activities
-- ----------------------------
DROP TABLE IF EXISTS `doc_user_activities`;
CREATE TABLE `doc_user_activities` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `document_id` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `doc_id` bigint DEFAULT NULL,
  `username` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `last_viewed_at` datetime(6) DEFAULT NULL,
  `visit_count` int DEFAULT NULL,
  `last_edited_at` datetime(6) DEFAULT NULL,
  `is_deleted` tinyint(1) DEFAULT NULL,
  `ctime` datetime(6) DEFAULT NULL,
  `mtime` datetime(6) DEFAULT NULL,
  `created_at` datetime(6) DEFAULT NULL,
  `updated_at` datetime(6) DEFAULT NULL,
  `published_at` datetime(6) DEFAULT NULL,
  `created_by_id` int unsigned DEFAULT NULL,
  `updated_by_id` int unsigned DEFAULT NULL,
  `locale` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `doc_user_activities_documents_idx` (`document_id`,`locale`,`published_at`),
  KEY `doc_user_activities_created_by_id_fk` (`created_by_id`),
  KEY `doc_user_activities_updated_by_id_fk` (`updated_by_id`),
  KEY `idx_doc_user_activities_mtime` (`mtime`),
  CONSTRAINT `doc_user_activities_created_by_id_fk` FOREIGN KEY (`created_by_id`) REFERENCES `admin_users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `doc_user_activities_updated_by_id_fk` FOREIGN KEY (`updated_by_id`) REFERENCES `admin_users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------
-- Table: docs
-- ----------------------------
DROP TABLE IF EXISTS `docs`;
CREATE TABLE `docs` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `document_id` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `space_id` bigint DEFAULT NULL,
  `folder_id` bigint DEFAULT NULL,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `content` longtext COLLATE utf8mb4_unicode_ci,
  `access_mode` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `owner` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `tags` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_deleted` tinyint(1) DEFAULT NULL,
  `ctime` datetime(6) DEFAULT NULL,
  `mtime` datetime(6) DEFAULT NULL,
  `created_at` datetime(6) DEFAULT NULL,
  `updated_at` datetime(6) DEFAULT NULL,
  `published_at` datetime(6) DEFAULT NULL,
  `created_by_id` int unsigned DEFAULT NULL,
  `updated_by_id` int unsigned DEFAULT NULL,
  `locale` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `docs_documents_idx` (`document_id`,`locale`,`published_at`),
  KEY `docs_created_by_id_fk` (`created_by_id`),
  KEY `docs_updated_by_id_fk` (`updated_by_id`),
  KEY `idx_docs_mtime` (`mtime`),
  CONSTRAINT `docs_created_by_id_fk` FOREIGN KEY (`created_by_id`) REFERENCES `admin_users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `docs_updated_by_id_fk` FOREIGN KEY (`updated_by_id`) REFERENCES `admin_users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------
-- Table: files
-- ----------------------------
DROP TABLE IF EXISTS `files`;
CREATE TABLE `files` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `document_id` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `alternative_text` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `caption` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `width` int DEFAULT NULL,
  `height` int DEFAULT NULL,
  `formats` json DEFAULT NULL,
  `hash` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ext` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `mime` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `size` decimal(10,2) DEFAULT NULL,
  `url` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `preview_url` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `provider` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `provider_metadata` json DEFAULT NULL,
  `folder_path` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime(6) DEFAULT NULL,
  `updated_at` datetime(6) DEFAULT NULL,
  `published_at` datetime(6) DEFAULT NULL,
  `created_by_id` int unsigned DEFAULT NULL,
  `updated_by_id` int unsigned DEFAULT NULL,
  `locale` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ctime` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT '创建时间',
  `mtime` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6) COMMENT '修改时间',
  `is_deleted` tinyint NOT NULL DEFAULT '0' COMMENT '软删除：0否1是',
  PRIMARY KEY (`id`),
  KEY `upload_files_folder_path_index` (`folder_path`),
  KEY `upload_files_created_at_index` (`created_at`),
  KEY `upload_files_updated_at_index` (`updated_at`),
  KEY `upload_files_name_index` (`name`),
  KEY `upload_files_size_index` (`size`),
  KEY `upload_files_ext_index` (`ext`),
  KEY `files_documents_idx` (`document_id`,`locale`,`published_at`),
  KEY `files_created_by_id_fk` (`created_by_id`),
  KEY `files_updated_by_id_fk` (`updated_by_id`),
  KEY `idx_files_mtime` (`mtime`),
  CONSTRAINT `files_created_by_id_fk` FOREIGN KEY (`created_by_id`) REFERENCES `admin_users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `files_updated_by_id_fk` FOREIGN KEY (`updated_by_id`) REFERENCES `admin_users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------
-- Table: files_folder_lnk
-- ----------------------------
DROP TABLE IF EXISTS `files_folder_lnk`;
CREATE TABLE `files_folder_lnk` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `file_id` int unsigned DEFAULT NULL,
  `folder_id` int unsigned DEFAULT NULL,
  `file_ord` double unsigned DEFAULT NULL,
  `ctime` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT '创建时间',
  `mtime` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6) COMMENT '修改时间',
  `is_deleted` tinyint NOT NULL DEFAULT '0' COMMENT '软删除：0否1是',
  PRIMARY KEY (`id`),
  UNIQUE KEY `files_folder_lnk_uq` (`file_id`,`folder_id`),
  KEY `files_folder_lnk_fk` (`file_id`),
  KEY `files_folder_lnk_ifk` (`folder_id`),
  KEY `files_folder_lnk_oifk` (`file_ord`),
  KEY `idx_files_folder_lnk_mtime` (`mtime`),
  CONSTRAINT `files_folder_lnk_fk` FOREIGN KEY (`file_id`) REFERENCES `files` (`id`) ON DELETE CASCADE,
  CONSTRAINT `files_folder_lnk_ifk` FOREIGN KEY (`folder_id`) REFERENCES `upload_folders` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------
-- Table: files_related_mph
-- ----------------------------
DROP TABLE IF EXISTS `files_related_mph`;
CREATE TABLE `files_related_mph` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `file_id` int unsigned DEFAULT NULL,
  `related_id` int unsigned DEFAULT NULL,
  `related_type` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `field` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `order` double unsigned DEFAULT NULL,
  `ctime` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT '创建时间',
  `mtime` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6) COMMENT '修改时间',
  `is_deleted` tinyint NOT NULL DEFAULT '0' COMMENT '软删除：0否1是',
  PRIMARY KEY (`id`),
  KEY `files_related_mph_fk` (`file_id`),
  KEY `files_related_mph_oidx` (`order`),
  KEY `files_related_mph_idix` (`related_id`),
  KEY `idx_files_related_mph_mtime` (`mtime`),
  CONSTRAINT `files_related_mph_fk` FOREIGN KEY (`file_id`) REFERENCES `files` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------
-- Table: folders
-- ----------------------------
DROP TABLE IF EXISTS `folders`;
CREATE TABLE `folders` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `document_id` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `space_id` bigint DEFAULT NULL,
  `parent_id` bigint DEFAULT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `visibility_scope` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `order` int DEFAULT NULL,
  `is_deleted` tinyint(1) DEFAULT NULL,
  `ctime` datetime(6) DEFAULT NULL,
  `mtime` datetime(6) DEFAULT NULL,
  `created_at` datetime(6) DEFAULT NULL,
  `updated_at` datetime(6) DEFAULT NULL,
  `published_at` datetime(6) DEFAULT NULL,
  `created_by_id` int unsigned DEFAULT NULL,
  `updated_by_id` int unsigned DEFAULT NULL,
  `locale` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `folders_documents_idx` (`document_id`,`locale`,`published_at`),
  KEY `folders_created_by_id_fk` (`created_by_id`),
  KEY `folders_updated_by_id_fk` (`updated_by_id`),
  KEY `idx_folders_mtime` (`mtime`),
  CONSTRAINT `folders_created_by_id_fk` FOREIGN KEY (`created_by_id`) REFERENCES `admin_users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `folders_updated_by_id_fk` FOREIGN KEY (`updated_by_id`) REFERENCES `admin_users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------
-- Table: i18n_locale
-- ----------------------------
DROP TABLE IF EXISTS `i18n_locale`;
CREATE TABLE `i18n_locale` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `document_id` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `code` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime(6) DEFAULT NULL,
  `updated_at` datetime(6) DEFAULT NULL,
  `published_at` datetime(6) DEFAULT NULL,
  `created_by_id` int unsigned DEFAULT NULL,
  `updated_by_id` int unsigned DEFAULT NULL,
  `locale` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ctime` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT '创建时间',
  `mtime` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6) COMMENT '修改时间',
  `is_deleted` tinyint NOT NULL DEFAULT '0' COMMENT '软删除：0否1是',
  PRIMARY KEY (`id`),
  KEY `i18n_locale_documents_idx` (`document_id`,`locale`,`published_at`),
  KEY `i18n_locale_created_by_id_fk` (`created_by_id`),
  KEY `i18n_locale_updated_by_id_fk` (`updated_by_id`),
  KEY `idx_i18n_locale_mtime` (`mtime`),
  CONSTRAINT `i18n_locale_created_by_id_fk` FOREIGN KEY (`created_by_id`) REFERENCES `admin_users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `i18n_locale_updated_by_id_fk` FOREIGN KEY (`updated_by_id`) REFERENCES `admin_users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------
-- Table: spaces
-- ----------------------------
DROP TABLE IF EXISTS `spaces`;
CREATE TABLE `spaces` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `document_id` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `code_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `creator` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `icon` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `dataset_id` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_deleted` tinyint(1) DEFAULT NULL,
  `ctime` datetime(6) DEFAULT NULL,
  `mtime` datetime(6) DEFAULT NULL,
  `created_at` datetime(6) DEFAULT NULL,
  `updated_at` datetime(6) DEFAULT NULL,
  `published_at` datetime(6) DEFAULT NULL,
  `created_by_id` int unsigned DEFAULT NULL,
  `updated_by_id` int unsigned DEFAULT NULL,
  `locale` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `spaces_documents_idx` (`document_id`,`locale`,`published_at`),
  KEY `spaces_created_by_id_fk` (`created_by_id`),
  KEY `spaces_updated_by_id_fk` (`updated_by_id`),
  KEY `idx_spaces_mtime` (`mtime`),
  CONSTRAINT `spaces_created_by_id_fk` FOREIGN KEY (`created_by_id`) REFERENCES `admin_users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `spaces_updated_by_id_fk` FOREIGN KEY (`updated_by_id`) REFERENCES `admin_users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------
-- Table: strapi_api_token_permissions
-- ----------------------------
DROP TABLE IF EXISTS `strapi_api_token_permissions`;
CREATE TABLE `strapi_api_token_permissions` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `document_id` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `action` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime(6) DEFAULT NULL,
  `updated_at` datetime(6) DEFAULT NULL,
  `published_at` datetime(6) DEFAULT NULL,
  `created_by_id` int unsigned DEFAULT NULL,
  `updated_by_id` int unsigned DEFAULT NULL,
  `locale` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ctime` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT '创建时间',
  `mtime` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6) COMMENT '修改时间',
  `is_deleted` tinyint NOT NULL DEFAULT '0' COMMENT '软删除：0否1是',
  PRIMARY KEY (`id`),
  KEY `strapi_api_token_permissions_documents_idx` (`document_id`,`locale`,`published_at`),
  KEY `strapi_api_token_permissions_created_by_id_fk` (`created_by_id`),
  KEY `strapi_api_token_permissions_updated_by_id_fk` (`updated_by_id`),
  KEY `idx_strapi_api_token_permissions_mtime` (`mtime`),
  CONSTRAINT `strapi_api_token_permissions_created_by_id_fk` FOREIGN KEY (`created_by_id`) REFERENCES `admin_users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `strapi_api_token_permissions_updated_by_id_fk` FOREIGN KEY (`updated_by_id`) REFERENCES `admin_users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------
-- Table: strapi_api_token_permissions_token_lnk
-- ----------------------------
DROP TABLE IF EXISTS `strapi_api_token_permissions_token_lnk`;
CREATE TABLE `strapi_api_token_permissions_token_lnk` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `api_token_permission_id` int unsigned DEFAULT NULL,
  `api_token_id` int unsigned DEFAULT NULL,
  `api_token_permission_ord` double unsigned DEFAULT NULL,
  `ctime` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT '创建时间',
  `mtime` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6) COMMENT '修改时间',
  `is_deleted` tinyint NOT NULL DEFAULT '0' COMMENT '软删除：0否1是',
  PRIMARY KEY (`id`),
  UNIQUE KEY `strapi_api_token_permissions_token_lnk_uq` (`api_token_permission_id`,`api_token_id`),
  KEY `strapi_api_token_permissions_token_lnk_fk` (`api_token_permission_id`),
  KEY `strapi_api_token_permissions_token_lnk_ifk` (`api_token_id`),
  KEY `strapi_api_token_permissions_token_lnk_oifk` (`api_token_permission_ord`),
  KEY `idx_strapi_api_token_permissions_token_lnk_mtime` (`mtime`),
  CONSTRAINT `strapi_api_token_permissions_token_lnk_fk` FOREIGN KEY (`api_token_permission_id`) REFERENCES `strapi_api_token_permissions` (`id`) ON DELETE CASCADE,
  CONSTRAINT `strapi_api_token_permissions_token_lnk_ifk` FOREIGN KEY (`api_token_id`) REFERENCES `strapi_api_tokens` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------
-- Table: strapi_api_tokens
-- ----------------------------
DROP TABLE IF EXISTS `strapi_api_tokens`;
CREATE TABLE `strapi_api_tokens` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `document_id` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `description` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `type` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `access_key` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `encrypted_key` longtext COLLATE utf8mb4_unicode_ci,
  `last_used_at` datetime(6) DEFAULT NULL,
  `expires_at` datetime(6) DEFAULT NULL,
  `lifespan` bigint DEFAULT NULL,
  `created_at` datetime(6) DEFAULT NULL,
  `updated_at` datetime(6) DEFAULT NULL,
  `published_at` datetime(6) DEFAULT NULL,
  `created_by_id` int unsigned DEFAULT NULL,
  `updated_by_id` int unsigned DEFAULT NULL,
  `locale` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ctime` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT '创建时间',
  `mtime` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6) COMMENT '修改时间',
  `is_deleted` tinyint NOT NULL DEFAULT '0' COMMENT '软删除：0否1是',
  PRIMARY KEY (`id`),
  KEY `strapi_api_tokens_documents_idx` (`document_id`,`locale`,`published_at`),
  KEY `strapi_api_tokens_created_by_id_fk` (`created_by_id`),
  KEY `strapi_api_tokens_updated_by_id_fk` (`updated_by_id`),
  KEY `idx_strapi_api_tokens_mtime` (`mtime`),
  CONSTRAINT `strapi_api_tokens_created_by_id_fk` FOREIGN KEY (`created_by_id`) REFERENCES `admin_users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `strapi_api_tokens_updated_by_id_fk` FOREIGN KEY (`updated_by_id`) REFERENCES `admin_users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------
-- Table: strapi_core_store_settings
-- ----------------------------
DROP TABLE IF EXISTS `strapi_core_store_settings`;
CREATE TABLE `strapi_core_store_settings` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `key` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `value` longtext COLLATE utf8mb4_unicode_ci,
  `type` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `environment` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `tag` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ctime` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT '创建时间',
  `mtime` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6) COMMENT '修改时间',
  `is_deleted` tinyint NOT NULL DEFAULT '0' COMMENT '软删除：0否1是',
  PRIMARY KEY (`id`),
  KEY `idx_strapi_core_store_settings_mtime` (`mtime`)
) ENGINE=InnoDB AUTO_INCREMENT=44 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------
-- Table: strapi_database_schema
-- ----------------------------
DROP TABLE IF EXISTS `strapi_database_schema`;
CREATE TABLE `strapi_database_schema` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `schema` json DEFAULT NULL,
  `time` datetime DEFAULT NULL,
  `hash` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ctime` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT '创建时间',
  `mtime` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6) COMMENT '修改时间',
  `is_deleted` tinyint NOT NULL DEFAULT '0' COMMENT '软删除：0否1是',
  PRIMARY KEY (`id`),
  KEY `idx_strapi_database_schema_mtime` (`mtime`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------
-- Table: strapi_history_versions
-- ----------------------------
DROP TABLE IF EXISTS `strapi_history_versions`;
CREATE TABLE `strapi_history_versions` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `content_type` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `related_document_id` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `locale` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `data` json DEFAULT NULL,
  `schema` json DEFAULT NULL,
  `created_at` datetime(6) DEFAULT NULL,
  `created_by_id` int unsigned DEFAULT NULL,
  `ctime` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT '创建时间',
  `mtime` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6) COMMENT '修改时间',
  `is_deleted` tinyint NOT NULL DEFAULT '0' COMMENT '软删除：0否1是',
  PRIMARY KEY (`id`),
  KEY `strapi_history_versions_created_by_id_fk` (`created_by_id`),
  KEY `idx_strapi_history_versions_mtime` (`mtime`),
  CONSTRAINT `strapi_history_versions_created_by_id_fk` FOREIGN KEY (`created_by_id`) REFERENCES `admin_users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------
-- Table: strapi_migrations
-- ----------------------------
DROP TABLE IF EXISTS `strapi_migrations`;
CREATE TABLE `strapi_migrations` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `time` datetime DEFAULT NULL,
  `ctime` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT '创建时间',
  `mtime` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6) COMMENT '修改时间',
  `is_deleted` tinyint NOT NULL DEFAULT '0' COMMENT '软删除：0否1是',
  PRIMARY KEY (`id`),
  KEY `idx_strapi_migrations_mtime` (`mtime`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------
-- Table: strapi_migrations_internal
-- ----------------------------
DROP TABLE IF EXISTS `strapi_migrations_internal`;
CREATE TABLE `strapi_migrations_internal` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `time` datetime DEFAULT NULL,
  `ctime` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT '创建时间',
  `mtime` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6) COMMENT '修改时间',
  `is_deleted` tinyint NOT NULL DEFAULT '0' COMMENT '软删除：0否1是',
  PRIMARY KEY (`id`),
  KEY `idx_strapi_migrations_internal_mtime` (`mtime`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------
-- Table: strapi_release_actions
-- ----------------------------
DROP TABLE IF EXISTS `strapi_release_actions`;
CREATE TABLE `strapi_release_actions` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `document_id` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `type` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `content_type` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `entry_document_id` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `locale` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_entry_valid` tinyint(1) DEFAULT NULL,
  `created_at` datetime(6) DEFAULT NULL,
  `updated_at` datetime(6) DEFAULT NULL,
  `published_at` datetime(6) DEFAULT NULL,
  `created_by_id` int unsigned DEFAULT NULL,
  `updated_by_id` int unsigned DEFAULT NULL,
  `ctime` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT '创建时间',
  `mtime` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6) COMMENT '修改时间',
  `is_deleted` tinyint NOT NULL DEFAULT '0' COMMENT '软删除：0否1是',
  PRIMARY KEY (`id`),
  KEY `strapi_release_actions_documents_idx` (`document_id`,`locale`,`published_at`),
  KEY `strapi_release_actions_created_by_id_fk` (`created_by_id`),
  KEY `strapi_release_actions_updated_by_id_fk` (`updated_by_id`),
  KEY `idx_strapi_release_actions_mtime` (`mtime`),
  CONSTRAINT `strapi_release_actions_created_by_id_fk` FOREIGN KEY (`created_by_id`) REFERENCES `admin_users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `strapi_release_actions_updated_by_id_fk` FOREIGN KEY (`updated_by_id`) REFERENCES `admin_users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------
-- Table: strapi_release_actions_release_lnk
-- ----------------------------
DROP TABLE IF EXISTS `strapi_release_actions_release_lnk`;
CREATE TABLE `strapi_release_actions_release_lnk` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `release_action_id` int unsigned DEFAULT NULL,
  `release_id` int unsigned DEFAULT NULL,
  `release_action_ord` double unsigned DEFAULT NULL,
  `ctime` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT '创建时间',
  `mtime` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6) COMMENT '修改时间',
  `is_deleted` tinyint NOT NULL DEFAULT '0' COMMENT '软删除：0否1是',
  PRIMARY KEY (`id`),
  UNIQUE KEY `strapi_release_actions_release_lnk_uq` (`release_action_id`,`release_id`),
  KEY `strapi_release_actions_release_lnk_fk` (`release_action_id`),
  KEY `strapi_release_actions_release_lnk_ifk` (`release_id`),
  KEY `strapi_release_actions_release_lnk_oifk` (`release_action_ord`),
  KEY `idx_strapi_release_actions_release_lnk_mtime` (`mtime`),
  CONSTRAINT `strapi_release_actions_release_lnk_fk` FOREIGN KEY (`release_action_id`) REFERENCES `strapi_release_actions` (`id`) ON DELETE CASCADE,
  CONSTRAINT `strapi_release_actions_release_lnk_ifk` FOREIGN KEY (`release_id`) REFERENCES `strapi_releases` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------
-- Table: strapi_releases
-- ----------------------------
DROP TABLE IF EXISTS `strapi_releases`;
CREATE TABLE `strapi_releases` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `document_id` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `released_at` datetime(6) DEFAULT NULL,
  `scheduled_at` datetime(6) DEFAULT NULL,
  `timezone` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime(6) DEFAULT NULL,
  `updated_at` datetime(6) DEFAULT NULL,
  `published_at` datetime(6) DEFAULT NULL,
  `created_by_id` int unsigned DEFAULT NULL,
  `updated_by_id` int unsigned DEFAULT NULL,
  `locale` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ctime` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT '创建时间',
  `mtime` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6) COMMENT '修改时间',
  `is_deleted` tinyint NOT NULL DEFAULT '0' COMMENT '软删除：0否1是',
  PRIMARY KEY (`id`),
  KEY `strapi_releases_documents_idx` (`document_id`,`locale`,`published_at`),
  KEY `strapi_releases_created_by_id_fk` (`created_by_id`),
  KEY `strapi_releases_updated_by_id_fk` (`updated_by_id`),
  KEY `idx_strapi_releases_mtime` (`mtime`),
  CONSTRAINT `strapi_releases_created_by_id_fk` FOREIGN KEY (`created_by_id`) REFERENCES `admin_users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `strapi_releases_updated_by_id_fk` FOREIGN KEY (`updated_by_id`) REFERENCES `admin_users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------
-- Table: strapi_transfer_token_permissions
-- ----------------------------
DROP TABLE IF EXISTS `strapi_transfer_token_permissions`;
CREATE TABLE `strapi_transfer_token_permissions` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `document_id` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `action` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime(6) DEFAULT NULL,
  `updated_at` datetime(6) DEFAULT NULL,
  `published_at` datetime(6) DEFAULT NULL,
  `created_by_id` int unsigned DEFAULT NULL,
  `updated_by_id` int unsigned DEFAULT NULL,
  `locale` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ctime` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT '创建时间',
  `mtime` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6) COMMENT '修改时间',
  `is_deleted` tinyint NOT NULL DEFAULT '0' COMMENT '软删除：0否1是',
  PRIMARY KEY (`id`),
  KEY `strapi_transfer_token_permissions_documents_idx` (`document_id`,`locale`,`published_at`),
  KEY `strapi_transfer_token_permissions_created_by_id_fk` (`created_by_id`),
  KEY `strapi_transfer_token_permissions_updated_by_id_fk` (`updated_by_id`),
  KEY `idx_strapi_transfer_token_permissions_mtime` (`mtime`),
  CONSTRAINT `strapi_transfer_token_permissions_created_by_id_fk` FOREIGN KEY (`created_by_id`) REFERENCES `admin_users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `strapi_transfer_token_permissions_updated_by_id_fk` FOREIGN KEY (`updated_by_id`) REFERENCES `admin_users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------
-- Table: strapi_transfer_token_permissions_token_lnk
-- ----------------------------
DROP TABLE IF EXISTS `strapi_transfer_token_permissions_token_lnk`;
CREATE TABLE `strapi_transfer_token_permissions_token_lnk` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `transfer_token_permission_id` int unsigned DEFAULT NULL,
  `transfer_token_id` int unsigned DEFAULT NULL,
  `transfer_token_permission_ord` double unsigned DEFAULT NULL,
  `ctime` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT '创建时间',
  `mtime` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6) COMMENT '修改时间',
  `is_deleted` tinyint NOT NULL DEFAULT '0' COMMENT '软删除：0否1是',
  PRIMARY KEY (`id`),
  UNIQUE KEY `strapi_transfer_token_permissions_token_lnk_uq` (`transfer_token_permission_id`,`transfer_token_id`),
  KEY `strapi_transfer_token_permissions_token_lnk_fk` (`transfer_token_permission_id`),
  KEY `strapi_transfer_token_permissions_token_lnk_ifk` (`transfer_token_id`),
  KEY `strapi_transfer_token_permissions_token_lnk_oifk` (`transfer_token_permission_ord`),
  KEY `idx_strapi_transfer_token_permissions_token_lnk_mtime` (`mtime`),
  CONSTRAINT `strapi_transfer_token_permissions_token_lnk_fk` FOREIGN KEY (`transfer_token_permission_id`) REFERENCES `strapi_transfer_token_permissions` (`id`) ON DELETE CASCADE,
  CONSTRAINT `strapi_transfer_token_permissions_token_lnk_ifk` FOREIGN KEY (`transfer_token_id`) REFERENCES `strapi_transfer_tokens` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------
-- Table: strapi_transfer_tokens
-- ----------------------------
DROP TABLE IF EXISTS `strapi_transfer_tokens`;
CREATE TABLE `strapi_transfer_tokens` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `document_id` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `description` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `access_key` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `last_used_at` datetime(6) DEFAULT NULL,
  `expires_at` datetime(6) DEFAULT NULL,
  `lifespan` bigint DEFAULT NULL,
  `created_at` datetime(6) DEFAULT NULL,
  `updated_at` datetime(6) DEFAULT NULL,
  `published_at` datetime(6) DEFAULT NULL,
  `created_by_id` int unsigned DEFAULT NULL,
  `updated_by_id` int unsigned DEFAULT NULL,
  `locale` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ctime` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT '创建时间',
  `mtime` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6) COMMENT '修改时间',
  `is_deleted` tinyint NOT NULL DEFAULT '0' COMMENT '软删除：0否1是',
  PRIMARY KEY (`id`),
  KEY `strapi_transfer_tokens_documents_idx` (`document_id`,`locale`,`published_at`),
  KEY `strapi_transfer_tokens_created_by_id_fk` (`created_by_id`),
  KEY `strapi_transfer_tokens_updated_by_id_fk` (`updated_by_id`),
  KEY `idx_strapi_transfer_tokens_mtime` (`mtime`),
  CONSTRAINT `strapi_transfer_tokens_created_by_id_fk` FOREIGN KEY (`created_by_id`) REFERENCES `admin_users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `strapi_transfer_tokens_updated_by_id_fk` FOREIGN KEY (`updated_by_id`) REFERENCES `admin_users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------
-- Table: strapi_webhooks
-- ----------------------------
DROP TABLE IF EXISTS `strapi_webhooks`;
CREATE TABLE `strapi_webhooks` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `url` longtext COLLATE utf8mb4_unicode_ci,
  `headers` json DEFAULT NULL,
  `events` json DEFAULT NULL,
  `enabled` tinyint(1) DEFAULT NULL,
  `ctime` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT '创建时间',
  `mtime` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6) COMMENT '修改时间',
  `is_deleted` tinyint NOT NULL DEFAULT '0' COMMENT '软删除：0否1是',
  PRIMARY KEY (`id`),
  KEY `idx_strapi_webhooks_mtime` (`mtime`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------
-- Table: strapi_workflows
-- ----------------------------
DROP TABLE IF EXISTS `strapi_workflows`;
CREATE TABLE `strapi_workflows` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `document_id` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `content_types` json DEFAULT NULL,
  `created_at` datetime(6) DEFAULT NULL,
  `updated_at` datetime(6) DEFAULT NULL,
  `published_at` datetime(6) DEFAULT NULL,
  `created_by_id` int unsigned DEFAULT NULL,
  `updated_by_id` int unsigned DEFAULT NULL,
  `locale` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ctime` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT '创建时间',
  `mtime` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6) COMMENT '修改时间',
  `is_deleted` tinyint NOT NULL DEFAULT '0' COMMENT '软删除：0否1是',
  PRIMARY KEY (`id`),
  KEY `strapi_workflows_documents_idx` (`document_id`,`locale`,`published_at`),
  KEY `strapi_workflows_created_by_id_fk` (`created_by_id`),
  KEY `strapi_workflows_updated_by_id_fk` (`updated_by_id`),
  KEY `idx_strapi_workflows_mtime` (`mtime`),
  CONSTRAINT `strapi_workflows_created_by_id_fk` FOREIGN KEY (`created_by_id`) REFERENCES `admin_users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `strapi_workflows_updated_by_id_fk` FOREIGN KEY (`updated_by_id`) REFERENCES `admin_users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------
-- Table: strapi_workflows_stage_required_to_publish_lnk
-- ----------------------------
DROP TABLE IF EXISTS `strapi_workflows_stage_required_to_publish_lnk`;
CREATE TABLE `strapi_workflows_stage_required_to_publish_lnk` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `workflow_id` int unsigned DEFAULT NULL,
  `workflow_stage_id` int unsigned DEFAULT NULL,
  `ctime` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT '创建时间',
  `mtime` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6) COMMENT '修改时间',
  `is_deleted` tinyint NOT NULL DEFAULT '0' COMMENT '软删除：0否1是',
  PRIMARY KEY (`id`),
  UNIQUE KEY `strapi_workflows_stage_required_to_publish_lnk_uq` (`workflow_id`,`workflow_stage_id`),
  KEY `strapi_workflows_stage_required_to_publish_lnk_fk` (`workflow_id`),
  KEY `strapi_workflows_stage_required_to_publish_lnk_ifk` (`workflow_stage_id`),
  KEY `idx_strapi_workflows_stage_required_to_publish_lnk_mtime` (`mtime`),
  CONSTRAINT `strapi_workflows_stage_required_to_publish_lnk_fk` FOREIGN KEY (`workflow_id`) REFERENCES `strapi_workflows` (`id`) ON DELETE CASCADE,
  CONSTRAINT `strapi_workflows_stage_required_to_publish_lnk_ifk` FOREIGN KEY (`workflow_stage_id`) REFERENCES `strapi_workflows_stages` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------
-- Table: strapi_workflows_stages
-- ----------------------------
DROP TABLE IF EXISTS `strapi_workflows_stages`;
CREATE TABLE `strapi_workflows_stages` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `document_id` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `color` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime(6) DEFAULT NULL,
  `updated_at` datetime(6) DEFAULT NULL,
  `published_at` datetime(6) DEFAULT NULL,
  `created_by_id` int unsigned DEFAULT NULL,
  `updated_by_id` int unsigned DEFAULT NULL,
  `locale` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ctime` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT '创建时间',
  `mtime` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6) COMMENT '修改时间',
  `is_deleted` tinyint NOT NULL DEFAULT '0' COMMENT '软删除：0否1是',
  PRIMARY KEY (`id`),
  KEY `strapi_workflows_stages_documents_idx` (`document_id`,`locale`,`published_at`),
  KEY `strapi_workflows_stages_created_by_id_fk` (`created_by_id`),
  KEY `strapi_workflows_stages_updated_by_id_fk` (`updated_by_id`),
  KEY `idx_strapi_workflows_stages_mtime` (`mtime`),
  CONSTRAINT `strapi_workflows_stages_created_by_id_fk` FOREIGN KEY (`created_by_id`) REFERENCES `admin_users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `strapi_workflows_stages_updated_by_id_fk` FOREIGN KEY (`updated_by_id`) REFERENCES `admin_users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------
-- Table: strapi_workflows_stages_permissions_lnk
-- ----------------------------
DROP TABLE IF EXISTS `strapi_workflows_stages_permissions_lnk`;
CREATE TABLE `strapi_workflows_stages_permissions_lnk` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `workflow_stage_id` int unsigned DEFAULT NULL,
  `permission_id` int unsigned DEFAULT NULL,
  `permission_ord` double unsigned DEFAULT NULL,
  `ctime` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT '创建时间',
  `mtime` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6) COMMENT '修改时间',
  `is_deleted` tinyint NOT NULL DEFAULT '0' COMMENT '软删除：0否1是',
  PRIMARY KEY (`id`),
  UNIQUE KEY `strapi_workflows_stages_permissions_lnk_uq` (`workflow_stage_id`,`permission_id`),
  KEY `strapi_workflows_stages_permissions_lnk_fk` (`workflow_stage_id`),
  KEY `strapi_workflows_stages_permissions_lnk_ifk` (`permission_id`),
  KEY `strapi_workflows_stages_permissions_lnk_ofk` (`permission_ord`),
  KEY `idx_strapi_workflows_stages_permissions_lnk_mtime` (`mtime`),
  CONSTRAINT `strapi_workflows_stages_permissions_lnk_fk` FOREIGN KEY (`workflow_stage_id`) REFERENCES `strapi_workflows_stages` (`id`) ON DELETE CASCADE,
  CONSTRAINT `strapi_workflows_stages_permissions_lnk_ifk` FOREIGN KEY (`permission_id`) REFERENCES `admin_permissions` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------
-- Table: strapi_workflows_stages_workflow_lnk
-- ----------------------------
DROP TABLE IF EXISTS `strapi_workflows_stages_workflow_lnk`;
CREATE TABLE `strapi_workflows_stages_workflow_lnk` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `workflow_stage_id` int unsigned DEFAULT NULL,
  `workflow_id` int unsigned DEFAULT NULL,
  `workflow_stage_ord` double unsigned DEFAULT NULL,
  `ctime` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT '创建时间',
  `mtime` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6) COMMENT '修改时间',
  `is_deleted` tinyint NOT NULL DEFAULT '0' COMMENT '软删除：0否1是',
  PRIMARY KEY (`id`),
  UNIQUE KEY `strapi_workflows_stages_workflow_lnk_uq` (`workflow_stage_id`,`workflow_id`),
  KEY `strapi_workflows_stages_workflow_lnk_fk` (`workflow_stage_id`),
  KEY `strapi_workflows_stages_workflow_lnk_ifk` (`workflow_id`),
  KEY `strapi_workflows_stages_workflow_lnk_oifk` (`workflow_stage_ord`),
  KEY `idx_strapi_workflows_stages_workflow_lnk_mtime` (`mtime`),
  CONSTRAINT `strapi_workflows_stages_workflow_lnk_fk` FOREIGN KEY (`workflow_stage_id`) REFERENCES `strapi_workflows_stages` (`id`) ON DELETE CASCADE,
  CONSTRAINT `strapi_workflows_stages_workflow_lnk_ifk` FOREIGN KEY (`workflow_id`) REFERENCES `strapi_workflows` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------
-- Table: up_permissions
-- ----------------------------
DROP TABLE IF EXISTS `up_permissions`;
CREATE TABLE `up_permissions` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `document_id` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `action` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime(6) DEFAULT NULL,
  `updated_at` datetime(6) DEFAULT NULL,
  `published_at` datetime(6) DEFAULT NULL,
  `created_by_id` int unsigned DEFAULT NULL,
  `updated_by_id` int unsigned DEFAULT NULL,
  `locale` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ctime` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT '创建时间',
  `mtime` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6) COMMENT '修改时间',
  `is_deleted` tinyint NOT NULL DEFAULT '0' COMMENT '软删除：0否1是',
  PRIMARY KEY (`id`),
  KEY `up_permissions_documents_idx` (`document_id`,`locale`,`published_at`),
  KEY `up_permissions_created_by_id_fk` (`created_by_id`),
  KEY `up_permissions_updated_by_id_fk` (`updated_by_id`),
  KEY `idx_up_permissions_mtime` (`mtime`),
  CONSTRAINT `up_permissions_created_by_id_fk` FOREIGN KEY (`created_by_id`) REFERENCES `admin_users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `up_permissions_updated_by_id_fk` FOREIGN KEY (`updated_by_id`) REFERENCES `admin_users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------
-- Table: up_permissions_role_lnk
-- ----------------------------
DROP TABLE IF EXISTS `up_permissions_role_lnk`;
CREATE TABLE `up_permissions_role_lnk` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `permission_id` int unsigned DEFAULT NULL,
  `role_id` int unsigned DEFAULT NULL,
  `permission_ord` double unsigned DEFAULT NULL,
  `ctime` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT '创建时间',
  `mtime` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6) COMMENT '修改时间',
  `is_deleted` tinyint NOT NULL DEFAULT '0' COMMENT '软删除：0否1是',
  PRIMARY KEY (`id`),
  UNIQUE KEY `up_permissions_role_lnk_uq` (`permission_id`,`role_id`),
  KEY `up_permissions_role_lnk_fk` (`permission_id`),
  KEY `up_permissions_role_lnk_ifk` (`role_id`),
  KEY `up_permissions_role_lnk_oifk` (`permission_ord`),
  KEY `idx_up_permissions_role_lnk_mtime` (`mtime`),
  CONSTRAINT `up_permissions_role_lnk_fk` FOREIGN KEY (`permission_id`) REFERENCES `up_permissions` (`id`) ON DELETE CASCADE,
  CONSTRAINT `up_permissions_role_lnk_ifk` FOREIGN KEY (`role_id`) REFERENCES `up_roles` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------
-- Table: up_roles
-- ----------------------------
DROP TABLE IF EXISTS `up_roles`;
CREATE TABLE `up_roles` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `document_id` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `description` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `type` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime(6) DEFAULT NULL,
  `updated_at` datetime(6) DEFAULT NULL,
  `published_at` datetime(6) DEFAULT NULL,
  `created_by_id` int unsigned DEFAULT NULL,
  `updated_by_id` int unsigned DEFAULT NULL,
  `locale` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ctime` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT '创建时间',
  `mtime` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6) COMMENT '修改时间',
  `is_deleted` tinyint NOT NULL DEFAULT '0' COMMENT '软删除：0否1是',
  PRIMARY KEY (`id`),
  KEY `up_roles_documents_idx` (`document_id`,`locale`,`published_at`),
  KEY `up_roles_created_by_id_fk` (`created_by_id`),
  KEY `up_roles_updated_by_id_fk` (`updated_by_id`),
  KEY `idx_up_roles_mtime` (`mtime`),
  CONSTRAINT `up_roles_created_by_id_fk` FOREIGN KEY (`created_by_id`) REFERENCES `admin_users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `up_roles_updated_by_id_fk` FOREIGN KEY (`updated_by_id`) REFERENCES `admin_users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------
-- Table: up_users
-- ----------------------------
DROP TABLE IF EXISTS `up_users`;
CREATE TABLE `up_users` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `document_id` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `username` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `provider` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `password` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `reset_password_token` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `confirmation_token` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `confirmed` tinyint(1) DEFAULT NULL,
  `blocked` tinyint(1) DEFAULT NULL,
  `created_at` datetime(6) DEFAULT NULL,
  `updated_at` datetime(6) DEFAULT NULL,
  `published_at` datetime(6) DEFAULT NULL,
  `created_by_id` int unsigned DEFAULT NULL,
  `updated_by_id` int unsigned DEFAULT NULL,
  `locale` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ctime` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT '创建时间',
  `mtime` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6) COMMENT '修改时间',
  `is_deleted` tinyint NOT NULL DEFAULT '0' COMMENT '软删除：0否1是',
  PRIMARY KEY (`id`),
  KEY `up_users_documents_idx` (`document_id`,`locale`,`published_at`),
  KEY `up_users_created_by_id_fk` (`created_by_id`),
  KEY `up_users_updated_by_id_fk` (`updated_by_id`),
  KEY `idx_up_users_mtime` (`mtime`),
  CONSTRAINT `up_users_created_by_id_fk` FOREIGN KEY (`created_by_id`) REFERENCES `admin_users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `up_users_updated_by_id_fk` FOREIGN KEY (`updated_by_id`) REFERENCES `admin_users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------
-- Table: up_users_role_lnk
-- ----------------------------
DROP TABLE IF EXISTS `up_users_role_lnk`;
CREATE TABLE `up_users_role_lnk` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `user_id` int unsigned DEFAULT NULL,
  `role_id` int unsigned DEFAULT NULL,
  `user_ord` double unsigned DEFAULT NULL,
  `ctime` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT '创建时间',
  `mtime` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6) COMMENT '修改时间',
  `is_deleted` tinyint NOT NULL DEFAULT '0' COMMENT '软删除：0否1是',
  PRIMARY KEY (`id`),
  UNIQUE KEY `up_users_role_lnk_uq` (`user_id`,`role_id`),
  KEY `up_users_role_lnk_fk` (`user_id`),
  KEY `up_users_role_lnk_ifk` (`role_id`),
  KEY `up_users_role_lnk_oifk` (`user_ord`),
  KEY `idx_up_users_role_lnk_mtime` (`mtime`),
  CONSTRAINT `up_users_role_lnk_fk` FOREIGN KEY (`user_id`) REFERENCES `up_users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `up_users_role_lnk_ifk` FOREIGN KEY (`role_id`) REFERENCES `up_roles` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------
-- Table: upload_folders
-- ----------------------------
DROP TABLE IF EXISTS `upload_folders`;
CREATE TABLE `upload_folders` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `document_id` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `path_id` int DEFAULT NULL,
  `path` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime(6) DEFAULT NULL,
  `updated_at` datetime(6) DEFAULT NULL,
  `published_at` datetime(6) DEFAULT NULL,
  `created_by_id` int unsigned DEFAULT NULL,
  `updated_by_id` int unsigned DEFAULT NULL,
  `locale` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ctime` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT '创建时间',
  `mtime` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6) COMMENT '修改时间',
  `is_deleted` tinyint NOT NULL DEFAULT '0' COMMENT '软删除：0否1是',
  PRIMARY KEY (`id`),
  UNIQUE KEY `upload_folders_path_id_index` (`path_id`),
  UNIQUE KEY `upload_folders_path_index` (`path`),
  KEY `upload_folders_documents_idx` (`document_id`,`locale`,`published_at`),
  KEY `upload_folders_created_by_id_fk` (`created_by_id`),
  KEY `upload_folders_updated_by_id_fk` (`updated_by_id`),
  KEY `idx_upload_folders_mtime` (`mtime`),
  CONSTRAINT `upload_folders_created_by_id_fk` FOREIGN KEY (`created_by_id`) REFERENCES `admin_users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `upload_folders_updated_by_id_fk` FOREIGN KEY (`updated_by_id`) REFERENCES `admin_users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------
-- Table: upload_folders_parent_lnk
-- ----------------------------
DROP TABLE IF EXISTS `upload_folders_parent_lnk`;
CREATE TABLE `upload_folders_parent_lnk` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `folder_id` int unsigned DEFAULT NULL,
  `inv_folder_id` int unsigned DEFAULT NULL,
  `folder_ord` double unsigned DEFAULT NULL,
  `ctime` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT '创建时间',
  `mtime` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6) COMMENT '修改时间',
  `is_deleted` tinyint NOT NULL DEFAULT '0' COMMENT '软删除：0否1是',
  PRIMARY KEY (`id`),
  UNIQUE KEY `upload_folders_parent_lnk_uq` (`folder_id`,`inv_folder_id`),
  KEY `upload_folders_parent_lnk_fk` (`folder_id`),
  KEY `upload_folders_parent_lnk_ifk` (`inv_folder_id`),
  KEY `upload_folders_parent_lnk_oifk` (`folder_ord`),
  KEY `idx_upload_folders_parent_lnk_mtime` (`mtime`),
  CONSTRAINT `upload_folders_parent_lnk_fk` FOREIGN KEY (`folder_id`) REFERENCES `upload_folders` (`id`) ON DELETE CASCADE,
  CONSTRAINT `upload_folders_parent_lnk_ifk` FOREIGN KEY (`inv_folder_id`) REFERENCES `upload_folders` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------
-- Table: user_space_auths
-- ----------------------------
DROP TABLE IF EXISTS `user_space_auths`;
CREATE TABLE `user_space_auths` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `document_id` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `space_id` bigint DEFAULT NULL,
  `username` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `can_read` tinyint(1) DEFAULT NULL,
  `can_create_folder` tinyint(1) DEFAULT NULL,
  `can_create_doc` tinyint(1) DEFAULT NULL,
  `super_admin` tinyint(1) DEFAULT NULL,
  `source` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_deleted` tinyint(1) DEFAULT NULL,
  `ctime` datetime(6) DEFAULT NULL,
  `mtime` datetime(6) DEFAULT NULL,
  `created_at` datetime(6) DEFAULT NULL,
  `updated_at` datetime(6) DEFAULT NULL,
  `published_at` datetime(6) DEFAULT NULL,
  `created_by_id` int unsigned DEFAULT NULL,
  `updated_by_id` int unsigned DEFAULT NULL,
  `locale` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `user_space_auths_documents_idx` (`document_id`,`locale`,`published_at`),
  KEY `user_space_auths_created_by_id_fk` (`created_by_id`),
  KEY `user_space_auths_updated_by_id_fk` (`updated_by_id`),
  KEY `idx_user_space_auths_mtime` (`mtime`),
  CONSTRAINT `user_space_auths_created_by_id_fk` FOREIGN KEY (`created_by_id`) REFERENCES `admin_users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `user_space_auths_updated_by_id_fk` FOREIGN KEY (`updated_by_id`) REFERENCES `admin_users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
