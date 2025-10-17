/*
MySQL Backup
Database: pro_electrician
Backup Time: 2025-10-17 10:25:13
*/

SET FOREIGN_KEY_CHECKS=0;
DROP TABLE IF EXISTS `pro_electrician`.`admins`;
DROP TABLE IF EXISTS `pro_electrician`.`deleted_electricians`;
DROP TABLE IF EXISTS `pro_electrician`.`electrician_certifications`;
DROP TABLE IF EXISTS `pro_electrician`.`messages`;
DROP TABLE IF EXISTS `pro_electrician`.`order_status_logs`;
DROP TABLE IF EXISTS `pro_electrician`.`orders`;
DROP TABLE IF EXISTS `pro_electrician`.`payments`;
DROP TABLE IF EXISTS `pro_electrician`.`regions`;
DROP TABLE IF EXISTS `pro_electrician`.`reviews`;
DROP TABLE IF EXISTS `pro_electrician`.`service_types`;
DROP TABLE IF EXISTS `pro_electrician`.`system_configs`;
DROP TABLE IF EXISTS `pro_electrician`.`system_messages`;
DROP TABLE IF EXISTS `pro_electrician`.`test_recipe`;
DROP TABLE IF EXISTS `pro_electrician`.`user_addresses`;
DROP TABLE IF EXISTS `pro_electrician`.`user_message_reads`;
DROP TABLE IF EXISTS `pro_electrician`.`users`;
CREATE TABLE `admins` (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '管理员ID',
  `username` varchar(50) NOT NULL COMMENT '用户名',
  `password` varchar(255) NOT NULL COMMENT '密码(加密)',
  `real_name` varchar(50) NOT NULL COMMENT '真实姓名',
  `email` varchar(100) DEFAULT NULL COMMENT '邮箱',
  `status` enum('active','inactive') DEFAULT 'active' COMMENT '状态',
  `last_login_at` timestamp NULL DEFAULT NULL COMMENT '最后登录时间',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='管理员表';
CREATE TABLE `deleted_electricians` (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '电工ID',
  `user_id` int NOT NULL COMMENT '用户ID',
  `real_name` varchar(50) NOT NULL COMMENT '真实姓名',
  `id_card` varchar(18) NOT NULL COMMENT '身份证号',
  `certification_status` enum('pending','approved','rejected') DEFAULT 'pending' COMMENT '认证状态',
  `work_years` int DEFAULT '0' COMMENT '工作年限',
  `service_area` varchar(255) DEFAULT NULL COMMENT '服务区域',
  `certification_images` json DEFAULT NULL COMMENT '认证图片URLs',
  `reject_reason` text COMMENT '驳回原因',
  `reviewed_at` timestamp NULL DEFAULT NULL COMMENT '审核时间',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_electricians_status_created` (`certification_status`,`created_at`),
  KEY `idx_electricians_certification_status` (`certification_status`),
  KEY `idx_electricians_service_area` (`service_area`),
  KEY `idx_electricians_user_id` (`user_id`),
  KEY `idx_electricians_user_cert` (`user_id`,`certification_status`),
  CONSTRAINT `deleted_electricians_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='电工信息表';
CREATE TABLE `electrician_certifications` (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '认证ID',
  `user_id` int NOT NULL COMMENT '用户ID',
  `real_name` varchar(50) NOT NULL COMMENT '真实姓名',
  `id_card` varchar(18) NOT NULL COMMENT '身份证号',
  `electrician_cert_no` varchar(50) NOT NULL COMMENT '电工证编号',
  `cert_start_date` date NOT NULL COMMENT '电工证有效期开始日期',
  `cert_end_date` date NOT NULL COMMENT '电工证有效期结束日期',
  `status` enum('pending','approved','rejected') DEFAULT 'approved' COMMENT '认证状态',
  `reject_reason` text COMMENT '驳回原因',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `idx_certifications_status` (`status`),
  CONSTRAINT `electrician_certifications_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='电工认证表';
CREATE TABLE `messages` (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '消息ID',
  `user_id` int NOT NULL COMMENT '接收用户ID',
  `type` enum('order','system') NOT NULL COMMENT '消息类型',
  `title` varchar(100) NOT NULL COMMENT '消息标题',
  `content` text NOT NULL COMMENT '消息内容',
  `related_id` int DEFAULT NULL COMMENT '关联ID(如工单ID)',
  `is_read` tinyint(1) DEFAULT '0' COMMENT '是否已读',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `read_at` timestamp NULL DEFAULT NULL COMMENT '阅读时间',
  PRIMARY KEY (`id`),
  KEY `idx_messages_is_read` (`is_read`),
  KEY `idx_messages_type` (`type`),
  KEY `idx_messages_user_read` (`user_id`,`is_read`),
  KEY `idx_messages_user_type` (`user_id`,`type`),
  KEY `idx_messages_created_at` (`created_at`),
  CONSTRAINT `messages_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='消息表';
CREATE TABLE `order_status_logs` (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '日志ID',
  `order_id` int NOT NULL COMMENT '工单ID',
  `from_status` varchar(20) DEFAULT NULL COMMENT '原状态',
  `to_status` varchar(20) NOT NULL COMMENT '新状态',
  `operator_id` int DEFAULT NULL COMMENT '操作人ID',
  `operator_type` enum('user','electrician','admin','system') NOT NULL COMMENT '操作人类型',
  `remark` text COMMENT '备注',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  KEY `order_id` (`order_id`),
  KEY `operator_id` (`operator_id`),
  KEY `idx_status_logs_created_at` (`created_at`),
  CONSTRAINT `order_status_logs_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE,
  CONSTRAINT `order_status_logs_ibfk_2` FOREIGN KEY (`operator_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='工单状态日志表';
CREATE TABLE `orders` (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '工单ID',
  `order_no` varchar(32) NOT NULL COMMENT '工单编号',
  `user_id` int NOT NULL COMMENT '用户ID',
  `electrician_id` int DEFAULT NULL COMMENT '电工ID',
  `service_type_id` int NOT NULL COMMENT '服务类型ID',
  `title` varchar(100) NOT NULL COMMENT '工单标题',
  `description` text NOT NULL COMMENT '问题描述',
  `images` json DEFAULT NULL COMMENT '问题图片URLs',
  `contact_name` varchar(50) NOT NULL COMMENT '联系人',
  `contact_phone` varchar(11) NOT NULL COMMENT '联系电话',
  `service_address` text NOT NULL COMMENT '服务地址',
  `longitude` decimal(10,7) DEFAULT NULL COMMENT '经度',
  `latitude` decimal(10,7) DEFAULT NULL COMMENT '纬度',
  `estimated_amount` decimal(10,2) DEFAULT '0.00' COMMENT '预估金额',
  `final_amount` decimal(10,2) DEFAULT '0.00' COMMENT '最终金额',
  `repair_content` text COMMENT '维修内容',
  `repair_images` json DEFAULT NULL COMMENT '维修图片URLs',
  `status` enum('pending','accepted','in_progress','completed','paid','cancelled') DEFAULT 'pending' COMMENT '工单状态',
  `cancel_reason` text COMMENT '取消原因',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `accepted_at` timestamp NULL DEFAULT NULL COMMENT '接单时间',
  `completed_at` timestamp NULL DEFAULT NULL COMMENT '完成时间',
  `paid_at` timestamp NULL DEFAULT NULL COMMENT '支付时间',
  `cancelled_at` timestamp NULL DEFAULT NULL COMMENT '取消时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `order_no` (`order_no`),
  KEY `idx_orders_electrician_id` (`electrician_id`),
  KEY `idx_orders_status` (`status`),
  KEY `idx_orders_user_id` (`user_id`),
  KEY `idx_orders_status_created` (`status`,`created_at`),
  KEY `idx_orders_created_at` (`created_at`),
  KEY `idx_orders_service_type` (`service_type_id`),
  CONSTRAINT `orders_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`),
  CONSTRAINT `orders_ibfk_2` FOREIGN KEY (`electrician_id`) REFERENCES `users` (`id`),
  CONSTRAINT `orders_ibfk_3` FOREIGN KEY (`service_type_id`) REFERENCES `service_types` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='工单表';
CREATE TABLE `payments` (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '支付ID',
  `order_id` int NOT NULL COMMENT '工单ID',
  `user_id` int NOT NULL COMMENT '用户ID',
  `amount` decimal(10,2) NOT NULL COMMENT '支付金额',
  `payment_method` enum('wechat','test') DEFAULT 'wechat' COMMENT '支付方式',
  `transaction_id` varchar(64) DEFAULT NULL COMMENT '微信交易号',
  `out_trade_no` varchar(32) NOT NULL COMMENT '商户订单号',
  `status` enum('pending','success','failed','refunded') DEFAULT 'pending' COMMENT '支付状态',
  `paid_at` timestamp NULL DEFAULT NULL COMMENT '支付时间',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `out_trade_no` (`out_trade_no`),
  KEY `order_id` (`order_id`),
  KEY `idx_payments_out_trade_no` (`out_trade_no`),
  KEY `idx_payments_status` (`status`),
  KEY `idx_payments_user_id` (`user_id`),
  CONSTRAINT `payments_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`),
  CONSTRAINT `payments_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='支付记录表';
CREATE TABLE `regions` (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '地区ID',
  `code` varchar(20) NOT NULL COMMENT '地区编码',
  `name` varchar(50) NOT NULL COMMENT '地区名称',
  `parent_code` varchar(20) DEFAULT NULL COMMENT '父级地区编码',
  `level` tinyint NOT NULL COMMENT '级别：1省份，2城市，3区县',
  `sort_order` int DEFAULT '0' COMMENT '排序',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_code` (`code`),
  KEY `idx_parent_code` (`parent_code`),
  KEY `idx_level` (`level`)
) ENGINE=InnoDB AUTO_INCREMENT=57 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='地区表';
CREATE TABLE `reviews` (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '评价ID',
  `order_id` int NOT NULL COMMENT '工单ID',
  `user_id` int NOT NULL COMMENT '用户ID',
  `electrician_id` int NOT NULL COMMENT '电工ID',
  `rating` tinyint NOT NULL COMMENT '评分(1-5)',
  `content` text COMMENT '评价内容',
  `images` json DEFAULT NULL COMMENT '评价图片URLs',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `order_id` (`order_id`),
  KEY `idx_reviews_user_id` (`user_id`),
  KEY `idx_reviews_electrician_id` (`electrician_id`),
  CONSTRAINT `reviews_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`),
  CONSTRAINT `reviews_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`),
  CONSTRAINT `reviews_ibfk_3` FOREIGN KEY (`electrician_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='评价表';
CREATE TABLE `service_types` (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '服务类型ID',
  `name` varchar(50) NOT NULL COMMENT '服务类型名称',
  `description` text COMMENT '服务描述',
  `icon_url` varchar(255) DEFAULT NULL COMMENT '图标URL',
  `sort_order` int DEFAULT '0' COMMENT '排序',
  `status` enum('active','inactive') DEFAULT 'active' COMMENT '状态',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='服务类型表';
CREATE TABLE `system_configs` (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '配置ID',
  `config_key` varchar(100) NOT NULL COMMENT '配置键',
  `config_value` text COMMENT '配置值',
  `description` varchar(255) DEFAULT NULL COMMENT '配置描述',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `config_key` (`config_key`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='系统配置表';
CREATE TABLE `system_messages` (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '通知ID',
  `title` varchar(100) NOT NULL COMMENT '通知标题',
  `content` text NOT NULL COMMENT '通知内容',
  `target_users` enum('all','users','electricians') DEFAULT 'all' COMMENT '目标用户',
  `type` enum('system','activity','maintenance','urgent') DEFAULT 'system' COMMENT '通知类型',
  `priority` enum('low','medium','high','urgent') DEFAULT 'medium' COMMENT '优先级',
  `status` enum('draft','published','scheduled') DEFAULT 'published' COMMENT '状态',
  `scheduled_at` timestamp NULL DEFAULT NULL COMMENT '定时发布时间',
  `published_at` timestamp NULL DEFAULT NULL COMMENT '发布时间',
  `created_by` int DEFAULT NULL COMMENT '创建者ID',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `created_by` (`created_by`),
  KEY `idx_system_messages_status` (`status`),
  CONSTRAINT `system_messages_ibfk_1` FOREIGN KEY (`created_by`) REFERENCES `admins` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=40 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='系统通知表';
CREATE TABLE `test_recipe` (
  `id` int NOT NULL AUTO_INCREMENT,
  `recipe` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
CREATE TABLE `user_addresses` (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '地址ID',
  `user_id` int NOT NULL COMMENT '用户ID',
  `contact_name` varchar(50) NOT NULL COMMENT '联系人姓名',
  `contact_phone` varchar(11) NOT NULL COMMENT '联系电话',
  `province` varchar(50) NOT NULL COMMENT '省份',
  `city` varchar(50) NOT NULL COMMENT '城市',
  `district` varchar(50) NOT NULL COMMENT '区县',
  `detail_address` varchar(255) NOT NULL COMMENT '详细地址',
  `longitude` decimal(10,7) DEFAULT NULL COMMENT '经度',
  `latitude` decimal(10,7) DEFAULT NULL COMMENT '纬度',
  `is_default` tinyint(1) DEFAULT '0' COMMENT '是否默认地址',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_addresses_default` (`user_id`,`is_default`),
  CONSTRAINT `user_addresses_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='用户地址表';
CREATE TABLE `user_message_reads` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL COMMENT '用户ID',
  `message_id` int NOT NULL COMMENT '消息ID',
  `read_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '已读时间',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_user_message` (`user_id`,`message_id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_message_id` (`message_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户消息已读记录表';
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '用户ID',
  `phone` varchar(11) NOT NULL COMMENT '手机号',
  `nickname` varchar(50) DEFAULT NULL COMMENT '昵称',
  `avatar` varchar(255) DEFAULT NULL COMMENT '头像URL',
  `current_role` enum('user','electrician') DEFAULT 'user' COMMENT '当前角色',
  `can_be_electrician` tinyint(1) DEFAULT '0' COMMENT '是否可以成为电工',
  `status` enum('active','banned') DEFAULT 'active' COMMENT '用户状态',
  `last_login_at` timestamp NULL DEFAULT NULL COMMENT '最后登录时间',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `phone` (`phone`),
  KEY `idx_users_current_role` (`current_role`)
) ENGINE=InnoDB AUTO_INCREMENT=19 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='用户表';
BEGIN;
LOCK TABLES `pro_electrician`.`admins` WRITE;
DELETE FROM `pro_electrician`.`admins`;
INSERT INTO `pro_electrician`.`admins` (`id`,`username`,`password`,`real_name`,`email`,`status`,`last_login_at`,`created_at`,`updated_at`) VALUES (2, 'admin', '$2b$10$dzguSVnWQu0G7Qw6AGgST.dNEBWEp/ufeQzxyA.ZPW2WWZCCG8t.q', '系统管理员', 'admin@example.com', 'active', '2025-10-16 15:18:13', '2025-09-24 13:28:01', '2025-10-16 15:18:13')
;
UNLOCK TABLES;
COMMIT;
BEGIN;
LOCK TABLES `pro_electrician`.`deleted_electricians` WRITE;
DELETE FROM `pro_electrician`.`deleted_electricians`;
UNLOCK TABLES;
COMMIT;
BEGIN;
LOCK TABLES `pro_electrician`.`electrician_certifications` WRITE;
DELETE FROM `pro_electrician`.`electrician_certifications`;
INSERT INTO `pro_electrician`.`electrician_certifications` (`id`,`user_id`,`real_name`,`id_card`,`electrician_cert_no`,`cert_start_date`,`cert_end_date`,`status`,`reject_reason`,`created_at`,`updated_at`) VALUES (1, 1, '张三师傅', '110101199001011234', 'CERT123456', '2024-01-01', '2026-01-01', 'pending', NULL, '2025-10-10 21:42:28', '2025-10-10 21:42:28'),(2, 2, '李四2师傅', '110101199001011235', 'CERT123457', '2024-01-02', '2026-01-02', 'pending', NULL, '2025-10-11 11:52:02', '2025-10-11 11:52:02'),(3, 18, '666师傅', '110101199001016666', 'CERT66666', '2024-01-06', '2026-01-06', 'approved', NULL, '2025-10-15 21:45:25', '2025-10-16 16:07:49')
;
UNLOCK TABLES;
COMMIT;
BEGIN;
LOCK TABLES `pro_electrician`.`messages` WRITE;
DELETE FROM `pro_electrician`.`messages`;
INSERT INTO `pro_electrician`.`messages` (`id`,`user_id`,`type`,`title`,`content`,`related_id`,`is_read`,`created_at`,`read_at`) VALUES (1, 3, 'order', '工单创建成功', '您的工单 WO17603662669821985 已创建成功，等待电工接单。', 2, 0, '2025-10-13 22:37:47', NULL),(2, 3, 'order', '工单创建成功', '您的工单 WO17606059942140206 已创建成功，等待电工接单。', 3, 0, '2025-10-16 17:13:14', NULL),(3, 3, 'order', '工单创建成功', '您的工单 WO17606060077032430 已创建成功，等待电工接单。', 4, 0, '2025-10-16 17:13:27', NULL),(4, 3, 'order', '工单创建成功', '您的工单 WO17606060268722194 已创建成功，等待电工接单。', 5, 0, '2025-10-16 17:13:47', NULL),(5, 3, 'order', '工单创建成功', '您的工单 WO17606060584746076 已创建成功，等待电工接单。', 6, 0, '2025-10-16 17:14:18', NULL),(6, 3, 'order', '工单创建成功', '您的工单 WO17606060699472520 已创建成功，等待电工接单。', 7, 0, '2025-10-16 17:14:30', NULL),(7, 3, 'order', '工单已被接单', '您的工单 WO17606059942140206 已被电工接单，报价: ¥undefined', NULL, 0, '2025-10-16 23:05:32', NULL)
;
UNLOCK TABLES;
COMMIT;
BEGIN;
LOCK TABLES `pro_electrician`.`order_status_logs` WRITE;
DELETE FROM `pro_electrician`.`order_status_logs`;
INSERT INTO `pro_electrician`.`order_status_logs` (`id`,`order_id`,`from_status`,`to_status`,`operator_id`,`operator_type`,`remark`,`created_at`) VALUES (1, 2, NULL, 'pending', 3, 'user', '工单创建成功', '2025-10-13 22:37:47'),(2, 3, NULL, 'pending', 3, 'user', '工单创建成功', '2025-10-16 17:13:14'),(3, 4, NULL, 'pending', 3, 'user', '工单创建成功', '2025-10-16 17:13:27'),(4, 5, NULL, 'pending', 3, 'user', '工单创建成功', '2025-10-16 17:13:46'),(5, 6, NULL, 'pending', 3, 'user', '工单创建成功', '2025-10-16 17:14:18'),(6, 7, NULL, 'pending', 3, 'user', '工单创建成功', '2025-10-16 17:14:30'),(7, 3, NULL, 'accepted', 18, 'electrician', '电工接单，报价: ¥undefined', '2025-10-16 23:05:32')
;
UNLOCK TABLES;
COMMIT;
BEGIN;
LOCK TABLES `pro_electrician`.`orders` WRITE;
DELETE FROM `pro_electrician`.`orders`;
INSERT INTO `pro_electrician`.`orders` (`id`,`order_no`,`user_id`,`electrician_id`,`service_type_id`,`title`,`description`,`images`,`contact_name`,`contact_phone`,`service_address`,`longitude`,`latitude`,`estimated_amount`,`final_amount`,`repair_content`,`repair_images`,`status`,`cancel_reason`,`created_at`,`updated_at`,`accepted_at`,`completed_at`,`paid_at`,`cancelled_at`) VALUES (2, 'WO17603662669821985', 3, NULL, 1, '电路故障维修2', '家里电路跳闸，需要维修', '[]', '张三提交的', '13800138003', '北京市朝阳区建国路1号房间', 116.4074000, 39.9042000, 0.00, 0.00, NULL, NULL, 'pending', NULL, '2025-10-13 22:37:47', '2025-10-13 22:37:47', NULL, NULL, NULL, NULL),(3, 'WO17606059942140206', 3, 18, 1, '电路故障维修333', '家里电路跳闸，需要维修333', '[]', '张三提交的333', '13800138003', '北京市朝阳区建国路1号房间333', 116.4074000, 39.9042000, 0.00, 0.00, NULL, NULL, 'accepted', NULL, '2025-10-16 17:13:14', '2025-10-16 23:05:33', '2025-10-16 23:05:32', NULL, NULL, NULL),(4, 'WO17606060077032430', 3, NULL, 1, '电路故障维修444', '家里电路跳闸，需要维修444', '[]', '张三提交的444', '13800138003', '北京市朝阳区建国路1号房间444', 116.4074000, 39.9042000, 0.00, 0.00, NULL, NULL, 'pending', NULL, '2025-10-16 17:13:27', '2025-10-16 17:13:27', NULL, NULL, NULL, NULL),(5, 'WO17606060268722194', 3, NULL, 1, '电路故障维修555', '家里电路跳闸，需要维修555', '[]', '张三提交的555', '13800138005', '北京市朝阳区建国路1号房间555', 116.4074000, 39.9042000, 0.00, 0.00, NULL, NULL, 'pending', NULL, '2025-10-16 17:13:46', '2025-10-16 17:13:46', NULL, NULL, NULL, NULL),(6, 'WO17606060584746076', 3, NULL, 1, '电路故障维修666', '家里电路跳闸，需要维修666', '[]', '张三提交的666', '13800138005', '北京市朝阳区建国路1号房间666', 116.4074000, 39.9042000, 0.00, 0.00, NULL, NULL, 'pending', NULL, '2025-10-16 17:14:18', '2025-10-16 17:14:18', NULL, NULL, NULL, NULL),(7, 'WO17606060699472520', 3, NULL, 1, '电路故障维修777', '家里电路跳闸，需要维修777', '[]', '张三提交的777', '13800138005', '北京市朝阳区建国路1号房间777', 116.4074000, 39.9042000, 0.00, 0.00, NULL, NULL, 'pending', NULL, '2025-10-16 17:14:29', '2025-10-16 17:14:29', NULL, NULL, NULL, NULL)
;
UNLOCK TABLES;
COMMIT;
BEGIN;
LOCK TABLES `pro_electrician`.`payments` WRITE;
DELETE FROM `pro_electrician`.`payments`;
UNLOCK TABLES;
COMMIT;
BEGIN;
LOCK TABLES `pro_electrician`.`regions` WRITE;
DELETE FROM `pro_electrician`.`regions`;
INSERT INTO `pro_electrician`.`regions` (`id`,`code`,`name`,`parent_code`,`level`,`sort_order`,`created_at`,`updated_at`) VALUES (1, '110000', '北京市', NULL, 1, 1, '2025-09-27 12:21:56', '2025-09-27 12:21:56'),(2, '120000', '天津市', NULL, 1, 2, '2025-09-27 12:21:56', '2025-09-27 12:21:56'),(3, '310000', '上海市', NULL, 1, 3, '2025-09-27 12:21:56', '2025-09-27 12:21:56'),(4, '500000', '重庆市', NULL, 1, 4, '2025-09-27 12:21:56', '2025-09-27 12:21:56'),(5, '440000', '广东省', NULL, 1, 5, '2025-09-27 12:21:56', '2025-09-27 12:21:56'),(6, '320000', '江苏省', NULL, 1, 6, '2025-09-27 12:21:56', '2025-09-27 12:21:56'),(7, '330000', '浙江省', NULL, 1, 7, '2025-09-27 12:21:56', '2025-09-27 12:21:56'),(8, '370000', '山东省', NULL, 1, 8, '2025-09-27 12:21:56', '2025-09-27 12:21:56'),(9, '410000', '河南省', NULL, 1, 9, '2025-09-27 12:21:57', '2025-09-27 12:21:57'),(10, '420000', '湖北省', NULL, 1, 10, '2025-09-27 12:21:57', '2025-09-27 12:21:57'),(11, '110100', '北京市', '110000', 2, 1, '2025-09-27 12:21:57', '2025-09-27 12:21:57'),(12, '120100', '天津市', '120000', 2, 1, '2025-09-27 12:21:57', '2025-09-27 12:21:57'),(13, '310100', '上海市', '310000', 2, 1, '2025-09-27 12:21:57', '2025-09-27 12:21:57'),(14, '500100', '重庆市', '500000', 2, 1, '2025-09-27 12:21:57', '2025-09-27 12:21:57'),(15, '440100', '广州市', '440000', 2, 1, '2025-09-27 12:21:57', '2025-09-27 12:21:57'),(16, '440300', '深圳市', '440000', 2, 2, '2025-09-27 12:21:57', '2025-09-27 12:21:57'),(17, '440600', '佛山市', '440000', 2, 3, '2025-09-27 12:21:57', '2025-09-27 12:21:57'),(18, '441900', '东莞市', '440000', 2, 4, '2025-09-27 12:21:57', '2025-09-27 12:21:57'),(19, '320100', '南京市', '320000', 2, 1, '2025-09-27 12:21:57', '2025-09-27 12:21:57'),(20, '320200', '无锡市', '320000', 2, 2, '2025-09-27 12:21:57', '2025-09-27 12:21:57'),(21, '440104', '越秀区', '440100', 3, 1, '2025-09-27 12:21:57', '2025-09-27 12:21:57'),(22, '440105', '海珠区', '440100', 3, 2, '2025-09-27 12:21:57', '2025-09-27 12:21:57'),(23, '440106', '天河区', '440100', 3, 3, '2025-09-27 12:21:57', '2025-09-27 12:21:57'),(24, '440111', '白云区', '440100', 3, 4, '2025-09-27 12:21:57', '2025-09-27 12:21:57'),(25, '440303', '罗湖区', '440300', 3, 1, '2025-09-27 12:21:57', '2025-09-27 12:21:57'),(26, '440304', '福田区', '440300', 3, 2, '2025-09-27 12:21:57', '2025-09-27 12:21:57'),(27, '440305', '南山区', '440300', 3, 3, '2025-09-27 12:21:57', '2025-09-27 12:21:57'),(28, '440306', '宝安区', '440300', 3, 4, '2025-09-27 12:21:58', '2025-09-27 12:21:58'),(29, '110000', '北京市', NULL, 1, 1, '2025-09-27 12:27:16', '2025-09-27 12:27:16'),(30, '120000', '天津市', NULL, 1, 2, '2025-09-27 12:27:16', '2025-09-27 12:27:16'),(31, '310000', '上海市', NULL, 1, 3, '2025-09-27 12:27:16', '2025-09-27 12:27:16'),(32, '500000', '重庆市', NULL, 1, 4, '2025-09-27 12:27:16', '2025-09-27 12:27:16'),(33, '440000', '广东省', NULL, 1, 5, '2025-09-27 12:27:16', '2025-09-27 12:27:16'),(34, '320000', '江苏省', NULL, 1, 6, '2025-09-27 12:27:16', '2025-09-27 12:27:16'),(35, '330000', '浙江省', NULL, 1, 7, '2025-09-27 12:27:16', '2025-09-27 12:27:16'),(36, '370000', '山东省', NULL, 1, 8, '2025-09-27 12:27:16', '2025-09-27 12:27:16'),(37, '410000', '河南省', NULL, 1, 9, '2025-09-27 12:27:16', '2025-09-27 12:27:16'),(38, '420000', '湖北省', NULL, 1, 10, '2025-09-27 12:27:16', '2025-09-27 12:27:16'),(39, '110100', '北京市', '110000', 2, 1, '2025-09-27 12:27:16', '2025-09-27 12:27:16'),(40, '120100', '天津市', '120000', 2, 1, '2025-09-27 12:27:16', '2025-09-27 12:27:16'),(41, '310100', '上海市', '310000', 2, 1, '2025-09-27 12:27:16', '2025-09-27 12:27:16'),(42, '500100', '重庆市', '500000', 2, 1, '2025-09-27 12:27:16', '2025-09-27 12:27:16'),(43, '440100', '广州市', '440000', 2, 1, '2025-09-27 12:27:16', '2025-09-27 12:27:16'),(44, '440300', '深圳市', '440000', 2, 2, '2025-09-27 12:27:16', '2025-09-27 12:27:16'),(45, '440600', '佛山市', '440000', 2, 3, '2025-09-27 12:27:16', '2025-09-27 12:27:16'),(46, '441900', '东莞市', '440000', 2, 4, '2025-09-27 12:27:16', '2025-09-27 12:27:16'),(47, '320100', '南京市', '320000', 2, 1, '2025-09-27 12:27:16', '2025-09-27 12:27:16'),(48, '320200', '无锡市', '320000', 2, 2, '2025-09-27 12:27:16', '2025-09-27 12:27:16'),(49, '440104', '越秀区', '440100', 3, 1, '2025-09-27 12:27:17', '2025-09-27 12:27:17'),(50, '440105', '海珠区', '440100', 3, 2, '2025-09-27 12:27:17', '2025-09-27 12:27:17'),(51, '440106', '天河区', '440100', 3, 3, '2025-09-27 12:27:17', '2025-09-27 12:27:17'),(52, '440111', '白云区', '440100', 3, 4, '2025-09-27 12:27:17', '2025-09-27 12:27:17'),(53, '440303', '罗湖区', '440300', 3, 1, '2025-09-27 12:27:17', '2025-09-27 12:27:17'),(54, '440304', '福田区', '440300', 3, 2, '2025-09-27 12:27:17', '2025-09-27 12:27:17'),(55, '440305', '南山区', '440300', 3, 3, '2025-09-27 12:27:17', '2025-09-27 12:27:17'),(56, '440306', '宝安区', '440300', 3, 4, '2025-09-27 12:27:17', '2025-09-27 12:27:17')
;
UNLOCK TABLES;
COMMIT;
BEGIN;
LOCK TABLES `pro_electrician`.`reviews` WRITE;
DELETE FROM `pro_electrician`.`reviews`;
UNLOCK TABLES;
COMMIT;
BEGIN;
LOCK TABLES `pro_electrician`.`service_types` WRITE;
DELETE FROM `pro_electrician`.`service_types`;
INSERT INTO `pro_electrician`.`service_types` (`id`,`name`,`description`,`icon_url`,`sort_order`,`status`,`created_at`,`updated_at`) VALUES (1, '电路维修', '家庭电路故障检修，包括短路、断路等问题', NULL, 1, 'active', '2025-09-13 21:23:50', '2025-09-13 21:23:50'),(2, '开关插座', '开关插座安装、维修、更换', NULL, 2, 'active', '2025-09-13 21:23:50', '2025-09-13 21:23:50'),(3, '灯具安装', '各类灯具安装、维修、更换', NULL, 3, 'active', '2025-09-13 21:23:50', '2025-09-13 21:23:50'),(4, '电器维修', '家用电器维修、保养', NULL, 4, 'active', '2025-09-13 21:23:50', '2025-09-13 21:23:50'),(5, '其他电工服务', '其他电工相关服务', NULL, 5, 'active', '2025-09-13 21:23:50', '2025-09-13 21:23:50')
;
UNLOCK TABLES;
COMMIT;
BEGIN;
LOCK TABLES `pro_electrician`.`system_configs` WRITE;
DELETE FROM `pro_electrician`.`system_configs`;
INSERT INTO `pro_electrician`.`system_configs` (`id`,`config_key`,`config_value`,`description`,`created_at`,`updated_at`) VALUES (1, 'nearby_distance', '1000', '附近订单距离范围(米)', '2025-09-13 21:24:04', '2025-09-13 21:24:04'),(2, 'message_poll_interval', '30', '消息轮询间隔(秒)', '2025-09-13 21:24:04', '2025-09-13 21:24:04'),(3, 'max_image_size', '10485760', '图片最大大小(字节)', '2025-09-13 21:24:04', '2025-09-13 21:24:04'),(4, 'max_image_count', '10', '最大图片数量', '2025-09-13 21:24:04', '2025-09-13 21:24:04'),(5, 'supported_image_types', 'jpg,png,jpeg', '支持的图片格式', '2025-09-13 21:24:04', '2025-09-13 21:24:04'),(6, 'test_sms_code', '123456', '测试环境短信验证码', '2025-09-13 21:24:04', '2025-09-13 21:24:04'),(7, 'platform_name', '电工维修平台', '平台名称', '2025-09-13 21:24:04', '2025-09-13 21:24:04'),(8, 'contact_phone', '400-123-4567', '客服电话', '2025-09-13 21:24:04', '2025-09-13 21:24:04'),(9, 'privacy_policy_url', 'https://example.com/privacy', '隐私政策链接', '2025-09-13 21:24:04', '2025-09-13 21:24:04')
;
UNLOCK TABLES;
COMMIT;
BEGIN;
LOCK TABLES `pro_electrician`.`system_messages` WRITE;
DELETE FROM `pro_electrician`.`system_messages`;
INSERT INTO `pro_electrician`.`system_messages` (`id`,`title`,`content`,`target_users`,`type`,`priority`,`status`,`scheduled_at`,`published_at`,`created_by`,`created_at`,`updated_at`) VALUES (4, '系统维护通知', '系统将于今晚进行维护，请提前做好准备', 'all', 'maintenance', 'high', 'published', NULL, NULL, 2, '2025-09-24 20:41:37', '2025-09-24 20:41:37'),(5, '新功能上线', '电工认证功能已上线，欢迎体验', 'electricians', 'system', 'medium', 'published', NULL, NULL, 2, '2025-09-24 20:41:37', '2025-09-24 20:41:37'),(6, '活动通知', '新用户注册送优惠券活动开始了', 'users', 'activity', 'low', 'published', NULL, NULL, 2, '2025-09-24 20:41:37', '2025-09-24 20:41:37'),(7, '11111', '1111111111', 'all', 'system', 'medium', 'published', NULL, '2025-09-24 22:25:05', 2, '2025-09-24 22:25:05', '2025-09-24 22:25:05'),(8, '2222', '22222222222222222', 'all', 'system', 'medium', 'published', NULL, '2025-09-24 22:25:25', 2, '2025-09-24 22:25:25', '2025-09-24 22:25:25'),(17, '平台维护通知', '系统将于今晚23:00-01:00进行维护升级，期间可能影响部分功能使用，请您提前安排。', 'all', 'system', 'high', 'published', NULL, NULL, NULL, '2025-09-25 13:32:05', '2025-09-25 13:32:05'),(18, '服务费用调整通知', '根据市场情况，部分服务项目费用将有所调整，具体请查看最新价格表。', 'all', 'system', 'medium', 'published', NULL, NULL, NULL, '2025-09-25 13:32:05', '2025-09-25 13:32:05'),(19, '新功能上线通知', '我们新增了在线支付功能，现在您可以通过微信、支付宝等方式便捷支付。', 'all', 'system', 'medium', 'published', NULL, NULL, NULL, '2025-09-25 13:32:05', '2025-09-25 13:32:05'),(20, '安全提醒', '请注意保护个人信息安全，不要向他人透露验证码等敏感信息。', 'all', 'system', 'high', 'published', NULL, NULL, NULL, '2025-09-25 13:32:05', '2025-09-25 13:32:05'),(21, '平台维护通知', '系统将于今晚23:00-01:00进行维护升级，期间可能影响部分功能使用，请您提前安排。', 'all', 'maintenance', 'high', 'published', NULL, NULL, NULL, '2025-09-25 13:38:17', '2025-09-25 13:38:17'),(22, '服务费用调整通知', '根据市场情况，部分服务项目费用将有所调整，具体请查看最新价格表。', 'all', 'system', 'medium', 'published', NULL, NULL, NULL, '2025-09-25 13:38:17', '2025-09-25 13:38:17'),(23, '新功能上线通知', '我们新增了在线支付功能，现在您可以通过微信、支付宝等方式便捷支付。', 'all', 'system', 'medium', 'published', NULL, NULL, NULL, '2025-09-25 13:38:17', '2025-09-25 13:38:17'),(24, '安全提醒', '请注意保护个人信息安全，不要向他人透露验证码等敏感信息。', 'all', 'urgent', 'high', 'published', NULL, NULL, NULL, '2025-09-25 13:38:17', '2025-09-25 13:38:17'),(25, '订单已完成', '您的订单已完成，请对本次服务进行评价。', 'all', 'system', 'medium', 'published', NULL, NULL, NULL, '2025-09-25 13:38:17', '2025-09-25 13:38:17'),(26, '师傅已接单', '李师傅已接受您的订单，预计30分钟后到达。', 'all', 'urgent', 'high', 'published', NULL, NULL, NULL, '2025-09-25 13:38:17', '2025-09-25 13:38:17'),(27, '订单已派发', '您的卫生间明修订单已派发给附近师傅，请耐心等待。', 'all', 'system', 'medium', 'published', NULL, NULL, NULL, '2025-09-25 13:38:17', '2025-09-25 13:38:17'),(28, '支付成功', '您已成功支付空调线路检查费用150元。', 'all', 'system', 'medium', 'published', NULL, NULL, NULL, '2025-09-25 13:38:17', '2025-09-25 13:38:17'),(29, '订单已取消', '由于师傅临时有事，您的维修订单已取消，费用将原路退回。', 'all', 'urgent', 'high', 'published', NULL, NULL, NULL, '2025-09-25 13:38:17', '2025-09-25 13:38:17'),(30, '系统维护通知', '系统将于今晚22:00-24:00进行维护升级，期间可能影响部分功能使用，请您提前安排。', 'all', 'system', 'medium', 'published', NULL, NULL, NULL, '2025-09-27 00:20:30', '2025-09-27 00:20:30'),(31, '新功能上线', '平台新增在线支付功能，支持微信支付，让您的服务体验更便捷！', 'all', 'activity', 'medium', 'published', NULL, NULL, NULL, '2025-09-27 00:20:30', '2025-09-27 00:20:30'),(32, '安全提醒', '请注意保护个人信息安全，不要向他人透露验证码等敏感信息。', 'all', 'system', 'medium', 'published', NULL, NULL, NULL, '2025-09-27 00:20:30', '2025-09-27 00:20:30'),(33, '平台活动', '新用户注册即送优惠券，邀请好友还有额外奖励，快来参与吧！', 'all', 'activity', 'medium', 'published', NULL, NULL, NULL, '2025-09-27 00:20:30', '2025-09-27 00:20:30'),(34, '服务升级', '平台客服服务时间调整为9:00-21:00，为您提供更好的服务体验。', 'all', 'maintenance', 'medium', 'published', NULL, NULL, NULL, '2025-09-27 00:20:30', '2025-09-27 00:20:30'),(35, '工单状态更新', '您的工单#12345已被电工接单，电工将在30分钟内联系您。', 'all', 'urgent', 'medium', 'published', NULL, NULL, NULL, '2025-09-27 00:20:31', '2025-09-27 00:20:31'),(36, '服务完成通知', '您的工单#12344已完成服务，请及时确认并评价。', 'all', 'urgent', 'medium', 'published', NULL, NULL, NULL, '2025-09-27 00:20:31', '2025-09-27 00:20:31'),(37, '支付成功通知', '您的工单#12343支付成功，金额￥150.00，感谢您的使用。', 'all', 'urgent', 'medium', 'published', NULL, NULL, NULL, '2025-09-27 00:20:31', '2025-09-27 00:20:31'),(38, '新工单提醒', '您有新的工单需要处理，请及时查看并响应。', 'all', 'urgent', 'medium', 'published', NULL, NULL, NULL, '2025-09-27 00:20:31', '2025-09-27 00:20:31'),(39, '工单取消通知', '您的工单#12342已被取消，如有疑问请联系客服。', 'all', 'urgent', 'medium', 'published', NULL, NULL, NULL, '2025-09-27 00:20:31', '2025-09-27 00:20:31')
;
UNLOCK TABLES;
COMMIT;
BEGIN;
LOCK TABLES `pro_electrician`.`test_recipe` WRITE;
DELETE FROM `pro_electrician`.`test_recipe`;
INSERT INTO `pro_electrician`.`test_recipe` (`id`,`recipe`) VALUES (1, '电扇炒电视'),(2, '电灯炖云彩'),(3, '手机炸汽车')
;
UNLOCK TABLES;
COMMIT;
BEGIN;
LOCK TABLES `pro_electrician`.`user_addresses` WRITE;
DELETE FROM `pro_electrician`.`user_addresses`;
INSERT INTO `pro_electrician`.`user_addresses` (`id`,`user_id`,`contact_name`,`contact_phone`,`province`,`city`,`district`,`detail_address`,`longitude`,`latitude`,`is_default`,`created_at`,`updated_at`) VALUES (1, 1, '张三', '13800138000', '广东省', '广州市', '天河区', '天河路123号', NULL, NULL, 0, '2025-09-27 13:51:56', '2025-09-27 13:52:19'),(2, 1, '张三', '13800138000', '广东省', '广州市', '天河区', '天河路123号', NULL, NULL, 0, '2025-09-27 13:52:20', '2025-09-27 13:52:43'),(3, 1, '张三', '13800138000', '广东省', '广州市', '天河区', '天河路123号', NULL, NULL, 0, '2025-09-27 13:52:43', '2025-09-27 13:53:10'),(4, 1, '张三', '13800138000', '广东省', '广州市', '天河区', '天河路123号', NULL, NULL, 0, '2025-09-27 13:53:10', '2025-09-27 14:12:41'),(5, 1, '张三', '13800138000', '广东省', '广州市', '天河区', '天河路123号', NULL, NULL, 0, '2025-09-27 13:53:30', '2025-09-27 14:12:41'),(6, 1, '??', '13800138003', '???', '???', '????', '???', NULL, NULL, 1, '2025-09-27 14:12:41', '2025-09-27 14:12:41')
;
UNLOCK TABLES;
COMMIT;
BEGIN;
LOCK TABLES `pro_electrician`.`user_message_reads` WRITE;
DELETE FROM `pro_electrician`.`user_message_reads`;
UNLOCK TABLES;
COMMIT;
BEGIN;
LOCK TABLES `pro_electrician`.`users` WRITE;
DELETE FROM `pro_electrician`.`users`;
INSERT INTO `pro_electrician`.`users` (`id`,`phone`,`nickname`,`avatar`,`current_role`,`can_be_electrician`,`status`,`last_login_at`,`created_at`,`updated_at`) VALUES (1, '13800138001', '常非常非常非常长的昵称超过50个字符了', 'https://wx4.sinaimg.cn/mw690/006fiYtfgy1i677fso4knj314l0elq9k.jpg', 'user', 0, 'active', '2025-10-10 21:31:26', '2025-09-24 21:14:48', '2025-10-10 21:31:26'),(2, '13800138002', '李四', NULL, 'electrician', 0, 'active', '2025-10-11 11:50:49', '2025-09-24 21:14:48', '2025-10-11 11:50:49'),(3, '13800138003', '王五', NULL, 'user', 0, 'active', '2025-10-13 22:13:15', '2025-09-24 21:14:48', '2025-10-13 22:13:15'),(4, '13800138004', '赵六', NULL, 'electrician', 0, 'active', NULL, '2025-09-24 21:14:48', '2025-09-24 21:14:48'),(5, '13800138005', '钱七', NULL, 'user', 0, 'banned', NULL, '2025-09-24 21:14:48', '2025-09-24 21:14:48'),(6, '13800138000', '用户8000', '', 'user', 0, 'active', '2025-09-26 23:38:26', '2025-09-25 22:17:08', '2025-09-26 23:38:26'),(7, '13811111111', '谢霆锋', '', 'user', 0, 'active', '2025-10-02 16:39:52', '2025-09-25 22:36:31', '2025-10-02 16:39:52'),(8, '13811111112', '用户1112', '', 'user', 0, 'active', '2025-09-26 23:52:43', '2025-09-26 23:52:43', '2025-09-26 23:52:43'),(9, '13811111113', '用户1113', '', 'user', 0, 'active', '2025-09-26 23:56:18', '2025-09-26 23:56:18', '2025-09-26 23:56:18'),(10, '13811111114', '用户1114', '', 'user', 0, 'active', '2025-09-26 23:57:28', '2025-09-26 23:57:28', '2025-09-26 23:57:28'),(11, '13811111115', '用户1115', '', 'user', 0, 'active', '2025-09-27 00:01:53', '2025-09-27 00:01:53', '2025-09-27 00:01:53'),(12, '13811111116', '用户1116', '', 'user', 0, 'active', '2025-09-27 00:12:50', '2025-09-27 00:12:50', '2025-09-27 00:12:50'),(13, '13811111117', '用户1117', '', 'user', 0, 'active', '2025-09-27 00:16:56', '2025-09-27 00:16:56', '2025-09-27 00:16:56'),(14, '13811111118', '用户1118', '', 'user', 0, 'active', '2025-09-27 00:31:11', '2025-09-27 00:31:11', '2025-09-27 00:31:11'),(15, '13811111119', '用户1119', '', 'user', 0, 'active', '2025-09-27 00:34:27', '2025-09-27 00:34:27', '2025-09-27 00:34:27'),(16, '13811111120', '用户1120', '', 'user', 0, 'active', '2025-09-27 11:40:34', '2025-09-27 11:40:34', '2025-09-27 11:40:34'),(17, '13800000000', '用户0000', '', 'user', 0, 'active', '2025-09-27 20:32:40', '2025-09-27 20:32:40', '2025-09-27 20:32:40'),(18, '13800138006', NULL, NULL, 'electrician', 1, 'active', '2025-10-16 17:06:22', '2025-10-15 21:35:38', '2025-10-16 17:07:02')
;
UNLOCK TABLES;
COMMIT;
