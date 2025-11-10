/*
 Navicat Premium Dump SQL

 Source Server         : pro_electrician
 Source Server Type    : MySQL
 Source Server Version : 80041 (8.0.41-SQLPub-0.0.1)
 Source Host           : mysql5.sqlpub.com:3310
 Source Schema         : pro_electrician

 Target Server Type    : MySQL
 Target Server Version : 80041 (8.0.41-SQLPub-0.0.1)
 File Encoding         : 65001

 Date: 05/11/2025 10:47:15
*/

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------
-- Table structure for admins
-- ----------------------------
DROP TABLE IF EXISTS `admins`;
CREATE TABLE `admins`  (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '管理员ID',
  `username` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '用户名',
  `password` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '密码(加密)',
  `real_name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '真实姓名',
  `email` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '邮箱',
  `status` enum('active','inactive') CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT 'active' COMMENT '状态',
  `last_login_at` timestamp NULL DEFAULT NULL COMMENT '最后登录时间',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `username`(`username` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 3 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '管理员表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of admins
-- ----------------------------
INSERT INTO `admins` VALUES (2, 'admin', '$2b$10$dzguSVnWQu0G7Qw6AGgST.dNEBWEp/ufeQzxyA.ZPW2WWZCCG8t.q', '系统管理员', 'admin@example.com', 'active', '2025-11-03 14:04:02', '2025-09-24 13:28:01', '2025-11-03 14:04:02');

-- ----------------------------
-- Table structure for deleted_electricians
-- ----------------------------
DROP TABLE IF EXISTS `deleted_electricians`;
CREATE TABLE `deleted_electricians`  (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '电工ID',
  `user_id` int NOT NULL COMMENT '用户ID',
  `real_name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '真实姓名',
  `id_card` varchar(18) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '身份证号',
  `certification_status` enum('pending','approved','rejected') CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT 'pending' COMMENT '认证状态',
  `work_years` int NULL DEFAULT 0 COMMENT '工作年限',
  `service_area` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '服务区域',
  `certification_images` json NULL COMMENT '认证图片URLs',
  `reject_reason` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL COMMENT '驳回原因',
  `reviewed_at` timestamp NULL DEFAULT NULL COMMENT '审核时间',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_electricians_status_created`(`certification_status` ASC, `created_at` ASC) USING BTREE,
  INDEX `idx_electricians_certification_status`(`certification_status` ASC) USING BTREE,
  INDEX `idx_electricians_service_area`(`service_area` ASC) USING BTREE,
  INDEX `idx_electricians_user_id`(`user_id` ASC) USING BTREE,
  INDEX `idx_electricians_user_cert`(`user_id` ASC, `certification_status` ASC) USING BTREE,
  CONSTRAINT `deleted_electricians_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 4 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '电工信息表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of deleted_electricians
-- ----------------------------

-- ----------------------------
-- Table structure for electrician_certifications
-- ----------------------------
DROP TABLE IF EXISTS `electrician_certifications`;
CREATE TABLE `electrician_certifications`  (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '认证ID',
  `user_id` int NOT NULL COMMENT '用户ID',
  `real_name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '真实姓名',
  `id_card` varchar(18) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '身份证号',
  `electrician_cert_no` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '电工证编号',
  `cert_start_date` date NOT NULL COMMENT '电工证有效期开始日期',
  `cert_end_date` date NOT NULL COMMENT '电工证有效期结束日期',
  `status` enum('pending','approved','rejected') CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT 'approved' COMMENT '认证状态',
  `reject_reason` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL COMMENT '驳回原因',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `user_id`(`user_id` ASC) USING BTREE,
  INDEX `idx_certifications_status`(`status` ASC) USING BTREE,
  CONSTRAINT `electrician_certifications_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 9 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '电工认证表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of electrician_certifications
-- ----------------------------
INSERT INTO `electrician_certifications` VALUES (1, 1, '张三师傅', '110101199001011234', 'CERT123456', '2024-01-01', '2026-01-01', 'pending', NULL, '2025-10-10 21:42:28', '2025-10-10 21:42:28');
INSERT INTO `electrician_certifications` VALUES (2, 2, '李四2师傅', '110101199001011235', 'CERT123457', '2024-01-02', '2026-01-02', 'pending', NULL, '2025-10-11 11:52:02', '2025-10-11 11:52:02');
INSERT INTO `electrician_certifications` VALUES (3, 18, '666师傅', '110101199001016666', 'CERT66666', '2024-01-06', '2026-01-06', 'approved', NULL, '2025-10-15 21:45:25', '2025-10-16 16:07:49');
INSERT INTO `electrician_certifications` VALUES (4, 19, '阮小七', '110111198811112222', '123456879', '2024-10-30', '2026-10-30', 'approved', NULL, '2025-10-30 16:46:16', '2025-10-30 16:47:42');
INSERT INTO `electrician_certifications` VALUES (5, 20, '软小八', '110221199511142210', '123456788', '2024-10-30', '2026-10-30', 'approved', NULL, '2025-10-30 21:02:28', '2025-10-30 23:51:35');
INSERT INTO `electrician_certifications` VALUES (6, 21, '阮小九', '110229199001110000', '123456789', '2024-10-31', '2026-10-31', 'approved', NULL, '2025-10-31 11:02:11', '2025-10-31 11:02:41');
INSERT INTO `electrician_certifications` VALUES (7, 23, '小十一', '110102198812122222', '1234567811', '2024-11-03', '2026-11-03', 'approved', NULL, '2025-11-03 14:07:15', '2025-11-03 15:54:19');
INSERT INTO `electrician_certifications` VALUES (8, 25, '于涛', '110221198511111110', '123456789', '2024-11-03', '2026-11-03', 'approved', NULL, '2025-11-03 20:40:48', '2025-11-03 20:43:02');

-- ----------------------------
-- Table structure for messages
-- ----------------------------
DROP TABLE IF EXISTS `messages`;
CREATE TABLE `messages`  (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '消息ID',
  `user_id` int NOT NULL COMMENT '接收用户ID',
  `type` enum('order','system') CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '消息类型',
  `title` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '消息标题',
  `content` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '消息内容',
  `related_id` int NULL DEFAULT NULL COMMENT '关联ID(如工单ID)',
  `is_read` tinyint(1) NULL DEFAULT 0 COMMENT '是否已读',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `read_at` timestamp NULL DEFAULT NULL COMMENT '阅读时间',
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_messages_is_read`(`is_read` ASC) USING BTREE,
  INDEX `idx_messages_type`(`type` ASC) USING BTREE,
  INDEX `idx_messages_user_read`(`user_id` ASC, `is_read` ASC) USING BTREE,
  INDEX `idx_messages_user_type`(`user_id` ASC, `type` ASC) USING BTREE,
  INDEX `idx_messages_created_at`(`created_at` ASC) USING BTREE,
  CONSTRAINT `messages_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 16 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '消息表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of messages
-- ----------------------------
INSERT INTO `messages` VALUES (1, 3, 'order', '工单创建成功', '您的工单 WO17603662669821985 已创建成功，等待电工接单。', 2, 0, '2025-10-13 22:37:47', NULL);
INSERT INTO `messages` VALUES (2, 3, 'order', '工单创建成功', '您的工单 WO17606059942140206 已创建成功，等待电工接单。', 3, 0, '2025-10-16 17:13:14', NULL);
INSERT INTO `messages` VALUES (3, 3, 'order', '工单创建成功', '您的工单 WO17606060077032430 已创建成功，等待电工接单。', 4, 0, '2025-10-16 17:13:27', NULL);
INSERT INTO `messages` VALUES (4, 3, 'order', '工单创建成功', '您的工单 WO17606060268722194 已创建成功，等待电工接单。', 5, 0, '2025-10-16 17:13:47', NULL);
INSERT INTO `messages` VALUES (5, 3, 'order', '工单创建成功', '您的工单 WO17606060584746076 已创建成功，等待电工接单。', 6, 0, '2025-10-16 17:14:18', NULL);
INSERT INTO `messages` VALUES (6, 3, 'order', '工单创建成功', '您的工单 WO17606060699472520 已创建成功，等待电工接单。', 7, 0, '2025-10-16 17:14:30', NULL);
INSERT INTO `messages` VALUES (7, 3, 'order', '工单已被接单', '您的工单 WO17606059942140206 已被电工接单，报价: ¥undefined', NULL, 0, '2025-10-16 23:05:32', NULL);
INSERT INTO `messages` VALUES (8, 3, 'order', '工单已完成', '您的工单 WO17606059942140206 已由电工完成服务，请确认', NULL, 0, '2025-10-19 21:44:06', NULL);
INSERT INTO `messages` VALUES (9, 3, 'order', '工单创建成功', '您的工单 WO17608816402550008 已创建成功，等待电工接单。', 8, 0, '2025-10-19 21:47:20', NULL);
INSERT INTO `messages` VALUES (10, 3, 'order', '工单已被接单', '您的工单 WO17608816402550008 已被电工接单，报价: ¥undefined', NULL, 0, '2025-10-19 21:47:47', NULL);
INSERT INTO `messages` VALUES (11, 3, 'order', '工单创建成功', '您的工单 WO17608838151219800 已创建成功，等待电工接单。', 9, 0, '2025-10-19 22:23:35', NULL);
INSERT INTO `messages` VALUES (12, 3, 'order', '工单已被接单', '您的工单 WO17608838151219800 已被电工接单，报价: ¥undefined', NULL, 0, '2025-10-19 23:31:16', NULL);
INSERT INTO `messages` VALUES (13, 22, 'order', '工单创建成功', '您的工单 WO17621455315664597 已创建成功，等待电工接单。', 10, 0, '2025-11-03 12:52:11', NULL);
INSERT INTO `messages` VALUES (14, 22, 'order', '工单创建成功', '您的工单 WO17621479199029589 已创建成功，等待电工接单。', 11, 0, '2025-11-03 13:32:00', NULL);
INSERT INTO `messages` VALUES (15, 24, 'order', '工单创建成功', '您的工单 WO17621732390958164 已创建成功，等待电工接单。', 12, 0, '2025-11-03 20:33:59', NULL);

-- ----------------------------
-- Table structure for order_status_logs
-- ----------------------------
DROP TABLE IF EXISTS `order_status_logs`;
CREATE TABLE `order_status_logs`  (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '日志ID',
  `order_id` int NOT NULL COMMENT '工单ID',
  `from_status` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '原状态',
  `to_status` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '新状态',
  `operator_id` int NULL DEFAULT NULL COMMENT '操作人ID',
  `operator_type` enum('user','electrician','admin','system') CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '操作人类型',
  `remark` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL COMMENT '备注',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `order_id`(`order_id` ASC) USING BTREE,
  INDEX `operator_id`(`operator_id` ASC) USING BTREE,
  INDEX `idx_status_logs_created_at`(`created_at` ASC) USING BTREE,
  CONSTRAINT `order_status_logs_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT,
  CONSTRAINT `order_status_logs_ibfk_2` FOREIGN KEY (`operator_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 32 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '工单状态日志表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of order_status_logs
-- ----------------------------
INSERT INTO `order_status_logs` VALUES (1, 2, NULL, 'pending', 3, 'user', '工单创建成功', '2025-10-13 22:37:47');
INSERT INTO `order_status_logs` VALUES (2, 3, NULL, 'pending', 3, 'user', '工单创建成功', '2025-10-16 17:13:14');
INSERT INTO `order_status_logs` VALUES (3, 4, NULL, 'pending', 3, 'user', '工单创建成功', '2025-10-16 17:13:27');
INSERT INTO `order_status_logs` VALUES (4, 5, NULL, 'pending', 3, 'user', '工单创建成功', '2025-10-16 17:13:46');
INSERT INTO `order_status_logs` VALUES (5, 6, NULL, 'pending', 3, 'user', '工单创建成功', '2025-10-16 17:14:18');
INSERT INTO `order_status_logs` VALUES (6, 7, NULL, 'pending', 3, 'user', '工单创建成功', '2025-10-16 17:14:30');
INSERT INTO `order_status_logs` VALUES (7, 3, NULL, 'accepted', 18, 'electrician', '电工接单，报价: ¥undefined', '2025-10-16 23:05:32');
INSERT INTO `order_status_logs` VALUES (8, 3, 'accepted', 'in_progress', 3, 'user', '用户确认工单，开始服务', '2025-10-17 14:37:11');
INSERT INTO `order_status_logs` VALUES (9, 3, 'in_progress', 'in_progress', 18, 'electrician', '备注：带上工具', '2025-10-19 17:35:52');
INSERT INTO `order_status_logs` VALUES (10, 3, 'in_progress', 'in_progress', 18, 'electrician', '备注：带上工具', '2025-10-19 18:14:56');
INSERT INTO `order_status_logs` VALUES (11, 3, 'in_progress', 'in_progress', 18, 'electrician', '备注：带上工具', '2025-10-19 18:16:16');
INSERT INTO `order_status_logs` VALUES (12, 3, 'in_progress', 'in_progress', 18, 'electrician', '备注2：带上工具', '2025-10-19 18:16:40');
INSERT INTO `order_status_logs` VALUES (13, 3, 'in_progress', 'in_progress', 18, 'electrician', '备注2：带上工具', '2025-10-19 18:22:19');
INSERT INTO `order_status_logs` VALUES (14, 3, 'in_progress', 'in_progress', 18, 'electrician', '备注2：带上工具', '2025-10-19 18:29:26');
INSERT INTO `order_status_logs` VALUES (15, 3, 'in_progress', 'in_progress', 3, 'user', '用户确认了订单修改', '2025-10-19 18:32:41');
INSERT INTO `order_status_logs` VALUES (16, 3, 'completed', 'completed', 18, 'electrician', '电工完成服务', '2025-10-19 21:44:06');
INSERT INTO `order_status_logs` VALUES (17, 8, NULL, 'pending', 3, 'user', '工单创建成功', '2025-10-19 21:47:20');
INSERT INTO `order_status_logs` VALUES (18, 8, NULL, 'accepted', 18, 'electrician', '电工接单，报价: ¥undefined', '2025-10-19 21:47:47');
INSERT INTO `order_status_logs` VALUES (19, 9, NULL, 'pending', 3, 'user', '工单创建成功', '2025-10-19 22:23:35');
INSERT INTO `order_status_logs` VALUES (20, 8, 'cancelled', 'cancelled', 3, 'user', '用户取消了已接单状态的订单：取消原因（必填，最多500字符）', '2025-10-19 23:30:34');
INSERT INTO `order_status_logs` VALUES (21, 9, NULL, 'accepted', 18, 'electrician', '电工接单，报价: ¥undefined', '2025-10-19 23:31:16');
INSERT INTO `order_status_logs` VALUES (22, 9, 'in_progress', 'in_progress', 18, 'electrician', '备注9：带上工具999', '2025-10-19 23:43:19');
INSERT INTO `order_status_logs` VALUES (23, 9, 'in_progress', 'in_progress', 3, 'user', '用户确认了订单修改', '2025-10-19 23:45:47');
INSERT INTO `order_status_logs` VALUES (24, 9, 'accepted', 'accepted', 3, 'user', '用户发起取消订单请求：取消原因99999', '2025-10-19 23:46:10');
INSERT INTO `order_status_logs` VALUES (25, 9, 'accepted', 'accepted', 3, 'user', '用户发起取消订单请求：取消原因99999', '2025-10-20 09:10:07');
INSERT INTO `order_status_logs` VALUES (26, 9, 'cancel_pending', 'cancel_pending', 3, 'user', '用户发起取消订单请求：取消原因1020', '2025-10-20 10:24:28');
INSERT INTO `order_status_logs` VALUES (27, 9, 'cancel_pending', 'cancel_pending', 3, 'user', '用户发起取消订单请求：取消原因1020', '2025-10-20 10:27:14');
INSERT INTO `order_status_logs` VALUES (28, 9, 'in_progress', 'cancelled', 18, 'electrician', '电工确认取消订单：取消原因说明1020-1，电工', '2025-10-20 10:28:51');
INSERT INTO `order_status_logs` VALUES (29, 10, NULL, 'pending', 22, 'user', '工单创建成功', '2025-11-03 12:52:11');
INSERT INTO `order_status_logs` VALUES (30, 11, NULL, 'pending', 22, 'user', '工单创建成功', '2025-11-03 13:32:00');
INSERT INTO `order_status_logs` VALUES (31, 12, NULL, 'pending', 24, 'user', '工单创建成功', '2025-11-03 20:33:59');

-- ----------------------------
-- Table structure for orders
-- ----------------------------
DROP TABLE IF EXISTS `orders`;
CREATE TABLE `orders`  (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '工单ID',
  `order_no` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '工单编号',
  `user_id` int NOT NULL COMMENT '用户ID',
  `electrician_id` int NULL DEFAULT NULL COMMENT '电工ID',
  `service_type_id` int NOT NULL COMMENT '服务类型ID',
  `title` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '工单标题',
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '问题描述',
  `images` json NULL COMMENT '问题图片URLs',
  `contact_name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '联系人',
  `contact_phone` varchar(11) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '联系电话',
  `service_address` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '服务地址',
  `longitude` decimal(10, 7) NULL DEFAULT NULL COMMENT '经度',
  `latitude` decimal(10, 7) NULL DEFAULT NULL COMMENT '纬度',
  `estimated_amount` decimal(10, 2) NULL DEFAULT 0.00 COMMENT '预估金额',
  `final_amount` decimal(10, 2) NULL DEFAULT 0.00 COMMENT '最终金额',
  `repair_content` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL COMMENT '维修内容',
  `repair_images` json NULL COMMENT '维修图片URLs',
  `status` enum('pending','accepted','in_progress','completed','paid','cancelled','cancel_pending') CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL DEFAULT 'pending' COMMENT '工单状态',
  `cancel_reason` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL COMMENT '取消原因',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `accepted_at` timestamp NULL DEFAULT NULL COMMENT '接单时间',
  `completed_at` timestamp NULL DEFAULT NULL COMMENT '完成时间',
  `paid_at` timestamp NULL DEFAULT NULL COMMENT '支付时间',
  `cancelled_at` timestamp NULL DEFAULT NULL COMMENT '取消时间',
  `needs_confirmation` tinyint(1) NULL DEFAULT 0 COMMENT '是否需要用户再次确认',
  `cancel_initiator_id` int NULL DEFAULT NULL COMMENT '取消请求发起人ID',
  `cancel_initiated_at` datetime NULL DEFAULT NULL COMMENT '取消请求发起时间',
  `cancel_confirm_status` enum('pending','confirmed','rejected','no_confirm_req') CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '取消确认状态',
  `cancel_confirmer_id` int NULL DEFAULT NULL COMMENT '取消请求确认人ID',
  `cancel_confirmed_at` datetime NULL DEFAULT NULL COMMENT '取消请求确认时间',
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `order_no`(`order_no` ASC) USING BTREE,
  INDEX `idx_orders_electrician_id`(`electrician_id` ASC) USING BTREE,
  INDEX `idx_orders_status`(`status` ASC) USING BTREE,
  INDEX `idx_orders_user_id`(`user_id` ASC) USING BTREE,
  INDEX `idx_orders_status_created`(`status` ASC, `created_at` ASC) USING BTREE,
  INDEX `idx_orders_created_at`(`created_at` ASC) USING BTREE,
  INDEX `idx_orders_service_type`(`service_type_id` ASC) USING BTREE,
  CONSTRAINT `orders_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `orders_ibfk_2` FOREIGN KEY (`electrician_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `orders_ibfk_3` FOREIGN KEY (`service_type_id`) REFERENCES `service_types` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 13 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '工单表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of orders
-- ----------------------------
INSERT INTO `orders` VALUES (2, 'WO17603662669821985', 3, NULL, 1, '电路故障维修2', '家里电路跳闸，需要维修', '[]', '张三提交的', '13800138003', '北京市朝阳区建国路1号房间', 116.4074000, 39.9042000, 0.00, 0.00, NULL, NULL, 'pending', NULL, '2025-10-13 22:37:47', '2025-10-13 22:37:47', NULL, NULL, NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL);
INSERT INTO `orders` VALUES (3, 'WO17606059942140206', 3, 18, 1, '电工修改2为维修电路和302元', '工单描述2修改为：维修电路等工作。', '[]', '张三提交的333', '13800138003', '北京市朝阳区建国路1号房间333', 116.4074000, 39.9042000, 10.00, 20.00, '完成说明，已经全修好了，客户表示满意', NULL, 'completed', NULL, '2025-10-16 17:13:14', '2025-10-21 22:02:22', '2025-10-16 23:05:32', '2025-10-19 21:44:06', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL);
INSERT INTO `orders` VALUES (4, 'WO17606060077032430', 3, NULL, 1, '电路故障维修444', '家里电路跳闸，需要维修444', '[]', '张三提交的444', '13800138003', '北京市朝阳区建国路1号房间444', 116.4074000, 39.9042000, 0.00, 0.00, NULL, NULL, 'pending', NULL, '2025-10-16 17:13:27', '2025-10-16 17:13:27', NULL, NULL, NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL);
INSERT INTO `orders` VALUES (5, 'WO17606060268722194', 3, NULL, 1, '电路故障维修555', '家里电路跳闸，需要维修555', '[]', '张三提交的555', '13800138005', '北京市朝阳区建国路1号房间555', 116.4074000, 39.9042000, 0.00, 0.00, NULL, NULL, 'pending', NULL, '2025-10-16 17:13:46', '2025-10-16 17:13:46', NULL, NULL, NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL);
INSERT INTO `orders` VALUES (6, 'WO17606060584746076', 3, NULL, 1, '电路故障维修666', '家里电路跳闸，需要维修666', '[]', '张三提交的666', '13800138005', '北京市朝阳区建国路1号房间666', 116.4074000, 39.9042000, 0.00, 0.00, NULL, NULL, 'pending', NULL, '2025-10-16 17:14:18', '2025-10-16 17:14:18', NULL, NULL, NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL);
INSERT INTO `orders` VALUES (7, 'WO17606060699472520', 3, NULL, 1, '电路故障维修777', '家里电路跳闸，需要维修777', '[]', '张三提交的777', '13800138005', '北京市朝阳区建国路1号房间777', 116.4074000, 39.9042000, 0.00, 0.00, NULL, NULL, 'pending', NULL, '2025-10-16 17:14:29', '2025-10-16 17:14:29', NULL, NULL, NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL);
INSERT INTO `orders` VALUES (8, 'WO17608816402550008', 3, 18, 1, '电路故障维修888', '家里电路跳闸，需要维修888', '[]', '张三提交的888', '13800138005', '北京市朝阳区建国路1号房间888', 116.4074000, 39.9042000, 0.00, 0.00, NULL, NULL, 'cancelled', '取消原因（必填，最多500字符）', '2025-10-19 21:47:20', '2025-10-19 23:30:34', '2025-10-19 21:47:47', NULL, NULL, '2025-10-19 23:30:34', 0, NULL, NULL, NULL, NULL, NULL);
INSERT INTO `orders` VALUES (9, 'WO17608838151219800', 3, 18, 1, '电工修改9为维修电路和302元', '工单描述9修改为：维修电路等工作99。', '[]', '张三提交的999', '13800138005', '北京市朝阳区建国路1号房间999', 116.4074000, 39.9042000, 0.00, 0.00, NULL, NULL, 'cancelled', '取消原因说明1020-1，电工', '2025-10-19 22:23:35', '2025-10-20 10:28:51', '2025-10-19 23:31:16', NULL, NULL, NULL, 0, 3, '2025-10-20 10:27:14', 'confirmed', 18, '2025-10-20 10:28:51');
INSERT INTO `orders` VALUES (10, 'WO17621455315664597', 22, NULL, 1, '电路维修', '维修', '[]', '软小十', '13800138010', '北京市昌平区鼓楼南大街17号新世纪商城(昌平店)F1肯德基(昌平店)', 116.2332270, 40.2185750, 0.00, 0.00, NULL, NULL, 'pending', NULL, '2025-11-03 12:52:11', '2025-11-03 12:52:11', NULL, NULL, NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL);
INSERT INTO `orders` VALUES (11, 'WO17621479199029589', 22, NULL, 1, '电路维修', '维修电灯等线路问题', '[]', '软小十', '13800138010', '北京市昌平区政府街16号鑫隆商厦F1层(昌平地铁站A西北口步行230米)方中山胡辣汤(昌平店)', 116.2321680, 40.2202370, 0.00, 0.00, NULL, NULL, 'pending', NULL, '2025-11-03 13:31:59', '2025-11-03 13:31:59', NULL, NULL, NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL);
INSERT INTO `orders` VALUES (12, 'WO17621732390958164', 24, NULL, 1, '电路维修', '电路电灯维修', '[]', '软小十二', '13800138012', '北京市昌平区新世纪商城(昌平总店)', 116.2329840, 40.2190660, 0.00, 0.00, NULL, NULL, 'pending', NULL, '2025-11-03 20:33:59', '2025-11-03 20:33:59', NULL, NULL, NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL);

-- ----------------------------
-- Table structure for payments
-- ----------------------------
DROP TABLE IF EXISTS `payments`;
CREATE TABLE `payments`  (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '支付ID',
  `order_id` int NOT NULL COMMENT '工单ID',
  `user_id` int NOT NULL COMMENT '用户ID',
  `amount` decimal(10, 2) NOT NULL COMMENT '支付金额',
  `payment_method` enum('wechat','test') CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT 'wechat' COMMENT '支付方式',
  `transaction_id` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '微信交易号',
  `out_trade_no` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '商户订单号',
  `status` enum('pending','success','failed','refunded') CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT 'pending' COMMENT '支付状态',
  `paid_at` timestamp NULL DEFAULT NULL COMMENT '支付时间',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `out_trade_no`(`out_trade_no` ASC) USING BTREE,
  INDEX `order_id`(`order_id` ASC) USING BTREE,
  INDEX `idx_payments_out_trade_no`(`out_trade_no` ASC) USING BTREE,
  INDEX `idx_payments_status`(`status` ASC) USING BTREE,
  INDEX `idx_payments_user_id`(`user_id` ASC) USING BTREE,
  CONSTRAINT `payments_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `payments_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 2 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '支付记录表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of payments
-- ----------------------------
INSERT INTO `payments` VALUES (1, 3, 3, 20.00, 'test', NULL, 'PAY20251021221403150', 'pending', NULL, '2025-10-21 22:14:03', '2025-10-21 22:14:03');

-- ----------------------------
-- Table structure for regions
-- ----------------------------
DROP TABLE IF EXISTS `regions`;
CREATE TABLE `regions`  (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '地区ID',
  `code` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '地区编码',
  `name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '地区名称',
  `parent_code` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '父级地区编码',
  `level` tinyint NOT NULL COMMENT '级别：1省份，2城市，3区县',
  `sort_order` int NULL DEFAULT 0 COMMENT '排序',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_code`(`code` ASC) USING BTREE,
  INDEX `idx_parent_code`(`parent_code` ASC) USING BTREE,
  INDEX `idx_level`(`level` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 57 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '地区表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of regions
-- ----------------------------
INSERT INTO `regions` VALUES (1, '110000', '北京市', NULL, 1, 1, '2025-09-27 12:21:56', '2025-09-27 12:21:56');
INSERT INTO `regions` VALUES (2, '120000', '天津市', NULL, 1, 2, '2025-09-27 12:21:56', '2025-09-27 12:21:56');
INSERT INTO `regions` VALUES (3, '310000', '上海市', NULL, 1, 3, '2025-09-27 12:21:56', '2025-09-27 12:21:56');
INSERT INTO `regions` VALUES (4, '500000', '重庆市', NULL, 1, 4, '2025-09-27 12:21:56', '2025-09-27 12:21:56');
INSERT INTO `regions` VALUES (5, '440000', '广东省', NULL, 1, 5, '2025-09-27 12:21:56', '2025-09-27 12:21:56');
INSERT INTO `regions` VALUES (6, '320000', '江苏省', NULL, 1, 6, '2025-09-27 12:21:56', '2025-09-27 12:21:56');
INSERT INTO `regions` VALUES (7, '330000', '浙江省', NULL, 1, 7, '2025-09-27 12:21:56', '2025-09-27 12:21:56');
INSERT INTO `regions` VALUES (8, '370000', '山东省', NULL, 1, 8, '2025-09-27 12:21:56', '2025-09-27 12:21:56');
INSERT INTO `regions` VALUES (9, '410000', '河南省', NULL, 1, 9, '2025-09-27 12:21:57', '2025-09-27 12:21:57');
INSERT INTO `regions` VALUES (10, '420000', '湖北省', NULL, 1, 10, '2025-09-27 12:21:57', '2025-09-27 12:21:57');
INSERT INTO `regions` VALUES (11, '110100', '北京市', '110000', 2, 1, '2025-09-27 12:21:57', '2025-09-27 12:21:57');
INSERT INTO `regions` VALUES (12, '120100', '天津市', '120000', 2, 1, '2025-09-27 12:21:57', '2025-09-27 12:21:57');
INSERT INTO `regions` VALUES (13, '310100', '上海市', '310000', 2, 1, '2025-09-27 12:21:57', '2025-09-27 12:21:57');
INSERT INTO `regions` VALUES (14, '500100', '重庆市', '500000', 2, 1, '2025-09-27 12:21:57', '2025-09-27 12:21:57');
INSERT INTO `regions` VALUES (15, '440100', '广州市', '440000', 2, 1, '2025-09-27 12:21:57', '2025-09-27 12:21:57');
INSERT INTO `regions` VALUES (16, '440300', '深圳市', '440000', 2, 2, '2025-09-27 12:21:57', '2025-09-27 12:21:57');
INSERT INTO `regions` VALUES (17, '440600', '佛山市', '440000', 2, 3, '2025-09-27 12:21:57', '2025-09-27 12:21:57');
INSERT INTO `regions` VALUES (18, '441900', '东莞市', '440000', 2, 4, '2025-09-27 12:21:57', '2025-09-27 12:21:57');
INSERT INTO `regions` VALUES (19, '320100', '南京市', '320000', 2, 1, '2025-09-27 12:21:57', '2025-09-27 12:21:57');
INSERT INTO `regions` VALUES (20, '320200', '无锡市', '320000', 2, 2, '2025-09-27 12:21:57', '2025-09-27 12:21:57');
INSERT INTO `regions` VALUES (21, '440104', '越秀区', '440100', 3, 1, '2025-09-27 12:21:57', '2025-09-27 12:21:57');
INSERT INTO `regions` VALUES (22, '440105', '海珠区', '440100', 3, 2, '2025-09-27 12:21:57', '2025-09-27 12:21:57');
INSERT INTO `regions` VALUES (23, '440106', '天河区', '440100', 3, 3, '2025-09-27 12:21:57', '2025-09-27 12:21:57');
INSERT INTO `regions` VALUES (24, '440111', '白云区', '440100', 3, 4, '2025-09-27 12:21:57', '2025-09-27 12:21:57');
INSERT INTO `regions` VALUES (25, '440303', '罗湖区', '440300', 3, 1, '2025-09-27 12:21:57', '2025-09-27 12:21:57');
INSERT INTO `regions` VALUES (26, '440304', '福田区', '440300', 3, 2, '2025-09-27 12:21:57', '2025-09-27 12:21:57');
INSERT INTO `regions` VALUES (27, '440305', '南山区', '440300', 3, 3, '2025-09-27 12:21:57', '2025-09-27 12:21:57');
INSERT INTO `regions` VALUES (28, '440306', '宝安区', '440300', 3, 4, '2025-09-27 12:21:58', '2025-09-27 12:21:58');
INSERT INTO `regions` VALUES (29, '110000', '北京市', NULL, 1, 1, '2025-09-27 12:27:16', '2025-09-27 12:27:16');
INSERT INTO `regions` VALUES (30, '120000', '天津市', NULL, 1, 2, '2025-09-27 12:27:16', '2025-09-27 12:27:16');
INSERT INTO `regions` VALUES (31, '310000', '上海市', NULL, 1, 3, '2025-09-27 12:27:16', '2025-09-27 12:27:16');
INSERT INTO `regions` VALUES (32, '500000', '重庆市', NULL, 1, 4, '2025-09-27 12:27:16', '2025-09-27 12:27:16');
INSERT INTO `regions` VALUES (33, '440000', '广东省', NULL, 1, 5, '2025-09-27 12:27:16', '2025-09-27 12:27:16');
INSERT INTO `regions` VALUES (34, '320000', '江苏省', NULL, 1, 6, '2025-09-27 12:27:16', '2025-09-27 12:27:16');
INSERT INTO `regions` VALUES (35, '330000', '浙江省', NULL, 1, 7, '2025-09-27 12:27:16', '2025-09-27 12:27:16');
INSERT INTO `regions` VALUES (36, '370000', '山东省', NULL, 1, 8, '2025-09-27 12:27:16', '2025-09-27 12:27:16');
INSERT INTO `regions` VALUES (37, '410000', '河南省', NULL, 1, 9, '2025-09-27 12:27:16', '2025-09-27 12:27:16');
INSERT INTO `regions` VALUES (38, '420000', '湖北省', NULL, 1, 10, '2025-09-27 12:27:16', '2025-09-27 12:27:16');
INSERT INTO `regions` VALUES (39, '110100', '北京市', '110000', 2, 1, '2025-09-27 12:27:16', '2025-09-27 12:27:16');
INSERT INTO `regions` VALUES (40, '120100', '天津市', '120000', 2, 1, '2025-09-27 12:27:16', '2025-09-27 12:27:16');
INSERT INTO `regions` VALUES (41, '310100', '上海市', '310000', 2, 1, '2025-09-27 12:27:16', '2025-09-27 12:27:16');
INSERT INTO `regions` VALUES (42, '500100', '重庆市', '500000', 2, 1, '2025-09-27 12:27:16', '2025-09-27 12:27:16');
INSERT INTO `regions` VALUES (43, '440100', '广州市', '440000', 2, 1, '2025-09-27 12:27:16', '2025-09-27 12:27:16');
INSERT INTO `regions` VALUES (44, '440300', '深圳市', '440000', 2, 2, '2025-09-27 12:27:16', '2025-09-27 12:27:16');
INSERT INTO `regions` VALUES (45, '440600', '佛山市', '440000', 2, 3, '2025-09-27 12:27:16', '2025-09-27 12:27:16');
INSERT INTO `regions` VALUES (46, '441900', '东莞市', '440000', 2, 4, '2025-09-27 12:27:16', '2025-09-27 12:27:16');
INSERT INTO `regions` VALUES (47, '320100', '南京市', '320000', 2, 1, '2025-09-27 12:27:16', '2025-09-27 12:27:16');
INSERT INTO `regions` VALUES (48, '320200', '无锡市', '320000', 2, 2, '2025-09-27 12:27:16', '2025-09-27 12:27:16');
INSERT INTO `regions` VALUES (49, '440104', '越秀区', '440100', 3, 1, '2025-09-27 12:27:17', '2025-09-27 12:27:17');
INSERT INTO `regions` VALUES (50, '440105', '海珠区', '440100', 3, 2, '2025-09-27 12:27:17', '2025-09-27 12:27:17');
INSERT INTO `regions` VALUES (51, '440106', '天河区', '440100', 3, 3, '2025-09-27 12:27:17', '2025-09-27 12:27:17');
INSERT INTO `regions` VALUES (52, '440111', '白云区', '440100', 3, 4, '2025-09-27 12:27:17', '2025-09-27 12:27:17');
INSERT INTO `regions` VALUES (53, '440303', '罗湖区', '440300', 3, 1, '2025-09-27 12:27:17', '2025-09-27 12:27:17');
INSERT INTO `regions` VALUES (54, '440304', '福田区', '440300', 3, 2, '2025-09-27 12:27:17', '2025-09-27 12:27:17');
INSERT INTO `regions` VALUES (55, '440305', '南山区', '440300', 3, 3, '2025-09-27 12:27:17', '2025-09-27 12:27:17');
INSERT INTO `regions` VALUES (56, '440306', '宝安区', '440300', 3, 4, '2025-09-27 12:27:17', '2025-09-27 12:27:17');

-- ----------------------------
-- Table structure for reviews
-- ----------------------------
DROP TABLE IF EXISTS `reviews`;
CREATE TABLE `reviews`  (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '评价ID',
  `order_id` int NOT NULL COMMENT '工单ID',
  `user_id` int NOT NULL COMMENT '用户ID',
  `electrician_id` int NOT NULL COMMENT '电工ID',
  `rating` tinyint NOT NULL COMMENT '评分(1-5)',
  `content` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL COMMENT '评价内容',
  `images` json NULL COMMENT '评价图片URLs',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `order_id`(`order_id` ASC) USING BTREE,
  INDEX `idx_reviews_user_id`(`user_id` ASC) USING BTREE,
  INDEX `idx_reviews_electrician_id`(`electrician_id` ASC) USING BTREE,
  CONSTRAINT `reviews_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `reviews_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `reviews_ibfk_3` FOREIGN KEY (`electrician_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 1 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '评价表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of reviews
-- ----------------------------

-- ----------------------------
-- Table structure for service_types
-- ----------------------------
DROP TABLE IF EXISTS `service_types`;
CREATE TABLE `service_types`  (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '服务类型ID',
  `name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '服务类型名称',
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL COMMENT '服务描述',
  `icon_url` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '图标URL',
  `sort_order` int NULL DEFAULT 0 COMMENT '排序',
  `status` enum('active','inactive') CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT 'active' COMMENT '状态',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 6 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '服务类型表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of service_types
-- ----------------------------
INSERT INTO `service_types` VALUES (1, '电路维修', '家庭电路故障检修，包括短路、断路等问题', NULL, 1, 'active', '2025-09-13 21:23:50', '2025-09-13 21:23:50');
INSERT INTO `service_types` VALUES (2, '开关插座', '开关插座安装、维修、更换', NULL, 2, 'active', '2025-09-13 21:23:50', '2025-09-13 21:23:50');
INSERT INTO `service_types` VALUES (3, '灯具安装', '各类灯具安装、维修、更换', NULL, 3, 'active', '2025-09-13 21:23:50', '2025-09-13 21:23:50');
INSERT INTO `service_types` VALUES (5, '其他电工服务', '其他电工相关服务', NULL, 5, 'active', '2025-09-13 21:23:50', '2025-09-13 21:23:50');

-- ----------------------------
-- Table structure for system_configs
-- ----------------------------
DROP TABLE IF EXISTS `system_configs`;
CREATE TABLE `system_configs`  (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '配置ID',
  `config_key` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '配置键',
  `config_value` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL COMMENT '配置值',
  `description` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '配置描述',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `config_key`(`config_key` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 10 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '系统配置表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of system_configs
-- ----------------------------
INSERT INTO `system_configs` VALUES (1, 'nearby_distance', '1000', '附近订单距离范围(米)', '2025-09-13 21:24:04', '2025-09-13 21:24:04');
INSERT INTO `system_configs` VALUES (2, 'message_poll_interval', '30', '消息轮询间隔(秒)', '2025-09-13 21:24:04', '2025-09-13 21:24:04');
INSERT INTO `system_configs` VALUES (3, 'max_image_size', '10485760', '图片最大大小(字节)', '2025-09-13 21:24:04', '2025-09-13 21:24:04');
INSERT INTO `system_configs` VALUES (4, 'max_image_count', '10', '最大图片数量', '2025-09-13 21:24:04', '2025-09-13 21:24:04');
INSERT INTO `system_configs` VALUES (5, 'supported_image_types', 'jpg,png,jpeg', '支持的图片格式', '2025-09-13 21:24:04', '2025-09-13 21:24:04');
INSERT INTO `system_configs` VALUES (6, 'test_sms_code', '123456', '测试环境短信验证码', '2025-09-13 21:24:04', '2025-09-13 21:24:04');
INSERT INTO `system_configs` VALUES (7, 'platform_name', '电工维修平台', '平台名称', '2025-09-13 21:24:04', '2025-09-13 21:24:04');
INSERT INTO `system_configs` VALUES (8, 'contact_phone', '400-123-4567', '客服电话', '2025-09-13 21:24:04', '2025-09-13 21:24:04');
INSERT INTO `system_configs` VALUES (9, 'privacy_policy_url', 'https://example.com/privacy', '隐私政策链接', '2025-09-13 21:24:04', '2025-09-13 21:24:04');

-- ----------------------------
-- Table structure for system_messages
-- ----------------------------
DROP TABLE IF EXISTS `system_messages`;
CREATE TABLE `system_messages`  (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '通知ID',
  `title` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '通知标题',
  `content` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '通知内容',
  `target_users` enum('all','users','electricians') CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT 'all' COMMENT '目标用户',
  `type` enum('system','activity','maintenance','urgent') CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT 'system' COMMENT '通知类型',
  `priority` enum('low','medium','high','urgent') CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT 'medium' COMMENT '优先级',
  `status` enum('draft','published','scheduled') CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT 'published' COMMENT '状态',
  `scheduled_at` timestamp NULL DEFAULT NULL COMMENT '定时发布时间',
  `published_at` timestamp NULL DEFAULT NULL COMMENT '发布时间',
  `created_by` int NULL DEFAULT NULL COMMENT '创建者ID',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `created_by`(`created_by` ASC) USING BTREE,
  INDEX `idx_system_messages_status`(`status` ASC) USING BTREE,
  CONSTRAINT `system_messages_ibfk_1` FOREIGN KEY (`created_by`) REFERENCES `admins` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 40 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '系统通知表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of system_messages
-- ----------------------------
INSERT INTO `system_messages` VALUES (4, '系统维护通知', '系统将于今晚进行维护，请提前做好准备', 'all', 'maintenance', 'high', 'published', NULL, NULL, 2, '2025-09-24 20:41:37', '2025-09-24 20:41:37');
INSERT INTO `system_messages` VALUES (5, '新功能上线', '电工认证功能已上线，欢迎体验', 'electricians', 'system', 'medium', 'published', NULL, NULL, 2, '2025-09-24 20:41:37', '2025-09-24 20:41:37');
INSERT INTO `system_messages` VALUES (6, '活动通知', '新用户注册送优惠券活动开始了', 'users', 'activity', 'low', 'published', NULL, NULL, 2, '2025-09-24 20:41:37', '2025-09-24 20:41:37');
INSERT INTO `system_messages` VALUES (7, '11111', '1111111111', 'all', 'system', 'medium', 'published', NULL, '2025-09-24 22:25:05', 2, '2025-09-24 22:25:05', '2025-09-24 22:25:05');
INSERT INTO `system_messages` VALUES (8, '2222', '22222222222222222', 'all', 'system', 'medium', 'published', NULL, '2025-09-24 22:25:25', 2, '2025-09-24 22:25:25', '2025-09-24 22:25:25');
INSERT INTO `system_messages` VALUES (17, '平台维护通知', '系统将于今晚23:00-01:00进行维护升级，期间可能影响部分功能使用，请您提前安排。', 'all', 'system', 'high', 'published', NULL, NULL, NULL, '2025-09-25 13:32:05', '2025-09-25 13:32:05');
INSERT INTO `system_messages` VALUES (18, '服务费用调整通知', '根据市场情况，部分服务项目费用将有所调整，具体请查看最新价格表。', 'all', 'system', 'medium', 'published', NULL, NULL, NULL, '2025-09-25 13:32:05', '2025-09-25 13:32:05');
INSERT INTO `system_messages` VALUES (19, '新功能上线通知', '我们新增了在线支付功能，现在您可以通过微信、支付宝等方式便捷支付。', 'all', 'system', 'medium', 'published', NULL, NULL, NULL, '2025-09-25 13:32:05', '2025-09-25 13:32:05');
INSERT INTO `system_messages` VALUES (20, '安全提醒', '请注意保护个人信息安全，不要向他人透露验证码等敏感信息。', 'all', 'system', 'high', 'published', NULL, NULL, NULL, '2025-09-25 13:32:05', '2025-09-25 13:32:05');
INSERT INTO `system_messages` VALUES (21, '平台维护通知', '系统将于今晚23:00-01:00进行维护升级，期间可能影响部分功能使用，请您提前安排。', 'all', 'maintenance', 'high', 'published', NULL, NULL, NULL, '2025-09-25 13:38:17', '2025-09-25 13:38:17');
INSERT INTO `system_messages` VALUES (22, '服务费用调整通知', '根据市场情况，部分服务项目费用将有所调整，具体请查看最新价格表。', 'all', 'system', 'medium', 'published', NULL, NULL, NULL, '2025-09-25 13:38:17', '2025-09-25 13:38:17');
INSERT INTO `system_messages` VALUES (23, '新功能上线通知', '我们新增了在线支付功能，现在您可以通过微信、支付宝等方式便捷支付。', 'all', 'system', 'medium', 'published', NULL, NULL, NULL, '2025-09-25 13:38:17', '2025-09-25 13:38:17');
INSERT INTO `system_messages` VALUES (24, '安全提醒', '请注意保护个人信息安全，不要向他人透露验证码等敏感信息。', 'all', 'urgent', 'high', 'published', NULL, NULL, NULL, '2025-09-25 13:38:17', '2025-09-25 13:38:17');
INSERT INTO `system_messages` VALUES (25, '订单已完成', '您的订单已完成，请对本次服务进行评价。', 'all', 'system', 'medium', 'published', NULL, NULL, NULL, '2025-09-25 13:38:17', '2025-09-25 13:38:17');
INSERT INTO `system_messages` VALUES (26, '师傅已接单', '李师傅已接受您的订单，预计30分钟后到达。', 'all', 'urgent', 'high', 'published', NULL, NULL, NULL, '2025-09-25 13:38:17', '2025-09-25 13:38:17');
INSERT INTO `system_messages` VALUES (27, '订单已派发', '您的卫生间明修订单已派发给附近师傅，请耐心等待。', 'all', 'system', 'medium', 'published', NULL, NULL, NULL, '2025-09-25 13:38:17', '2025-09-25 13:38:17');
INSERT INTO `system_messages` VALUES (28, '支付成功', '您已成功支付空调线路检查费用150元。', 'all', 'system', 'medium', 'published', NULL, NULL, NULL, '2025-09-25 13:38:17', '2025-09-25 13:38:17');
INSERT INTO `system_messages` VALUES (29, '订单已取消', '由于师傅临时有事，您的维修订单已取消，费用将原路退回。', 'all', 'urgent', 'high', 'published', NULL, NULL, NULL, '2025-09-25 13:38:17', '2025-09-25 13:38:17');
INSERT INTO `system_messages` VALUES (30, '系统维护通知', '系统将于今晚22:00-24:00进行维护升级，期间可能影响部分功能使用，请您提前安排。', 'all', 'system', 'medium', 'published', NULL, NULL, NULL, '2025-09-27 00:20:30', '2025-09-27 00:20:30');
INSERT INTO `system_messages` VALUES (31, '新功能上线', '平台新增在线支付功能，支持微信支付，让您的服务体验更便捷！', 'all', 'activity', 'medium', 'published', NULL, NULL, NULL, '2025-09-27 00:20:30', '2025-09-27 00:20:30');
INSERT INTO `system_messages` VALUES (32, '安全提醒', '请注意保护个人信息安全，不要向他人透露验证码等敏感信息。', 'all', 'system', 'medium', 'published', NULL, NULL, NULL, '2025-09-27 00:20:30', '2025-09-27 00:20:30');
INSERT INTO `system_messages` VALUES (33, '平台活动', '新用户注册即送优惠券，邀请好友还有额外奖励，快来参与吧！', 'all', 'activity', 'medium', 'published', NULL, NULL, NULL, '2025-09-27 00:20:30', '2025-09-27 00:20:30');
INSERT INTO `system_messages` VALUES (34, '服务升级', '平台客服服务时间调整为9:00-21:00，为您提供更好的服务体验。', 'all', 'maintenance', 'medium', 'published', NULL, NULL, NULL, '2025-09-27 00:20:30', '2025-09-27 00:20:30');
INSERT INTO `system_messages` VALUES (35, '工单状态更新', '您的工单#12345已被电工接单，电工将在30分钟内联系您。', 'all', 'urgent', 'medium', 'published', NULL, NULL, NULL, '2025-09-27 00:20:31', '2025-09-27 00:20:31');
INSERT INTO `system_messages` VALUES (36, '服务完成通知', '您的工单#12344已完成服务，请及时确认并评价。', 'all', 'urgent', 'medium', 'published', NULL, NULL, NULL, '2025-09-27 00:20:31', '2025-09-27 00:20:31');
INSERT INTO `system_messages` VALUES (37, '支付成功通知', '您的工单#12343支付成功，金额￥150.00，感谢您的使用。', 'all', 'urgent', 'medium', 'published', NULL, NULL, NULL, '2025-09-27 00:20:31', '2025-09-27 00:20:31');
INSERT INTO `system_messages` VALUES (38, '新工单提醒', '您有新的工单需要处理，请及时查看并响应。', 'all', 'urgent', 'medium', 'published', NULL, NULL, NULL, '2025-09-27 00:20:31', '2025-09-27 00:20:31');
INSERT INTO `system_messages` VALUES (39, '工单取消通知', '您的工单#12342已被取消，如有疑问请联系客服。', 'all', 'urgent', 'medium', 'published', NULL, NULL, NULL, '2025-09-27 00:20:31', '2025-09-27 00:20:31');

-- ----------------------------
-- Table structure for test_recipe
-- ----------------------------
DROP TABLE IF EXISTS `test_recipe`;
CREATE TABLE `test_recipe`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `recipe` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 4 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of test_recipe
-- ----------------------------
INSERT INTO `test_recipe` VALUES (1, '电扇炒电视');
INSERT INTO `test_recipe` VALUES (2, '电灯炖云彩');
INSERT INTO `test_recipe` VALUES (3, '手机炸汽车');

-- ----------------------------
-- Table structure for user_addresses
-- ----------------------------
DROP TABLE IF EXISTS `user_addresses`;
CREATE TABLE `user_addresses`  (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '地址ID',
  `user_id` int NOT NULL COMMENT '用户ID',
  `contact_name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '联系人姓名',
  `contact_phone` varchar(11) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '联系电话',
  `province` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '省份',
  `city` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '城市',
  `district` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '区县',
  `detail_address` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '详细地址',
  `longitude` decimal(10, 7) NULL DEFAULT NULL COMMENT '经度',
  `latitude` decimal(10, 7) NULL DEFAULT NULL COMMENT '纬度',
  `is_default` tinyint(1) NULL DEFAULT 0 COMMENT '是否默认地址',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_addresses_default`(`user_id` ASC, `is_default` ASC) USING BTREE,
  CONSTRAINT `user_addresses_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 17 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '用户地址表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of user_addresses
-- ----------------------------
INSERT INTO `user_addresses` VALUES (1, 1, '张三', '13800138000', '广东省', '广州市', '天河区', '天河路123号', NULL, NULL, 0, '2025-09-27 13:51:56', '2025-09-27 13:52:19');
INSERT INTO `user_addresses` VALUES (9, 3, '纪晓岚更新', '13811111113', '北京市', '北京市', '东城区', '安定门北路123号', NULL, NULL, 0, '2025-10-21 10:10:24', '2025-10-21 11:44:29');
INSERT INTO `user_addresses` VALUES (11, 3, '林冲', '13811111113', '上海市', '上海市', '东城区', '水泊梁山北路123号', NULL, NULL, 1, '2025-10-21 11:42:38', '2025-10-21 11:44:29');
INSERT INTO `user_addresses` VALUES (12, 19, '阮小七', '13800138007', '北京市', '北京市', '昌平区', '天通苑东三区33号', NULL, NULL, 0, '2025-10-28 22:29:45', '2025-10-29 09:37:07');
INSERT INTO `user_addresses` VALUES (13, 19, '阮小七2', '13800138007', '北京市', '北京市', '朝阳区', '东大桥33号', NULL, NULL, 1, '2025-10-29 09:37:07', '2025-10-29 09:37:07');
INSERT INTO `user_addresses` VALUES (14, 19, '阮小七3', '13800138558', '北京市', '北京市', '丰台区', '大红门2号', NULL, NULL, 0, '2025-10-29 09:49:09', '2025-10-29 09:49:09');
INSERT INTO `user_addresses` VALUES (15, 20, '软小8', '13800138008', '北京市', '北京市', '东城区', '东四大街2号', NULL, NULL, 1, '2025-11-02 15:45:36', '2025-11-02 15:45:36');
INSERT INTO `user_addresses` VALUES (16, 22, '软小十', '13800138010', '北京市', '北京市', '东城区', '东四大街10号', NULL, NULL, 1, '2025-11-02 15:51:43', '2025-11-02 15:51:43');

-- ----------------------------
-- Table structure for user_message_reads
-- ----------------------------
DROP TABLE IF EXISTS `user_message_reads`;
CREATE TABLE `user_message_reads`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL COMMENT '用户ID',
  `message_id` int NOT NULL COMMENT '消息ID',
  `read_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '已读时间',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `unique_user_message`(`user_id` ASC, `message_id` ASC) USING BTREE,
  INDEX `idx_user_id`(`user_id` ASC) USING BTREE,
  INDEX `idx_message_id`(`message_id` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 2 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '用户消息已读记录表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of user_message_reads
-- ----------------------------
INSERT INTO `user_message_reads` VALUES (1, 3, 39, '2025-10-21 16:33:27', '2025-10-21 16:33:27', '2025-10-21 16:33:27');

-- ----------------------------
-- Table structure for users
-- ----------------------------
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users`  (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '用户ID',
  `phone` varchar(11) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '手机号',
  `nickname` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '昵称',
  `avatar` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '头像URL',
  `current_role` enum('user','electrician') CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT 'user' COMMENT '当前角色',
  `can_be_electrician` tinyint(1) NULL DEFAULT 0 COMMENT '是否可以成为电工',
  `status` enum('active','banned') CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT 'active' COMMENT '用户状态',
  `last_login_at` timestamp NULL DEFAULT NULL COMMENT '最后登录时间',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `phone`(`phone` ASC) USING BTREE,
  INDEX `idx_users_current_role`(`current_role` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 26 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '用户表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of users
-- ----------------------------
INSERT INTO `users` VALUES (1, '13800138001', '常非常非常非常长的昵称超过50个字符了', 'https://wx4.sinaimg.cn/mw690/006fiYtfgy1i677fso4knj314l0elq9k.jpg', 'electrician', 1, 'active', '2025-11-03 15:23:04', '2025-09-24 21:14:48', '2025-11-03 15:53:12');
INSERT INTO `users` VALUES (2, '13800138002', '李四', NULL, 'electrician', 1, 'active', '2025-10-11 11:50:49', '2025-09-24 21:14:48', '2025-11-03 15:53:13');
INSERT INTO `users` VALUES (3, '13800138003', '王五', NULL, 'user', 0, 'active', '2025-10-21 21:51:54', '2025-09-24 21:14:48', '2025-10-21 21:51:54');
INSERT INTO `users` VALUES (4, '13800138004', '赵六', NULL, 'electrician', 1, 'active', NULL, '2025-09-24 21:14:48', '2025-11-03 15:53:18');
INSERT INTO `users` VALUES (5, '13800138005', '钱七', NULL, 'user', 0, 'banned', NULL, '2025-09-24 21:14:48', '2025-09-24 21:14:48');
INSERT INTO `users` VALUES (6, '13800138000', '用户8000', '', 'user', 0, 'active', '2025-09-26 23:38:26', '2025-09-25 22:17:08', '2025-09-26 23:38:26');
INSERT INTO `users` VALUES (7, '13811111111', '谢霆锋', '', 'user', 0, 'active', '2025-10-22 17:49:53', '2025-09-25 22:36:31', '2025-10-22 17:49:53');
INSERT INTO `users` VALUES (8, '13811111112', '用户1112', '', 'user', 0, 'active', '2025-09-26 23:52:43', '2025-09-26 23:52:43', '2025-09-26 23:52:43');
INSERT INTO `users` VALUES (9, '13811111113', '武松1113', '', 'user', 0, 'active', '2025-10-22 13:15:39', '2025-09-26 23:56:18', '2025-10-22 13:16:04');
INSERT INTO `users` VALUES (10, '13811111114', '用户1114', '', 'user', 0, 'active', '2025-09-26 23:57:28', '2025-09-26 23:57:28', '2025-09-26 23:57:28');
INSERT INTO `users` VALUES (11, '13811111115', '用户1115', '', 'user', 0, 'active', '2025-09-27 00:01:53', '2025-09-27 00:01:53', '2025-09-27 00:01:53');
INSERT INTO `users` VALUES (12, '13811111116', '用户1116', '', 'user', 0, 'active', '2025-09-27 00:12:50', '2025-09-27 00:12:50', '2025-09-27 00:12:50');
INSERT INTO `users` VALUES (13, '13811111117', '用户1117', '', 'user', 0, 'active', '2025-09-27 00:16:56', '2025-09-27 00:16:56', '2025-09-27 00:16:56');
INSERT INTO `users` VALUES (14, '13811111118', '用户1118', '', 'user', 0, 'active', '2025-09-27 00:31:11', '2025-09-27 00:31:11', '2025-09-27 00:31:11');
INSERT INTO `users` VALUES (15, '13811111119', '用户1119', '', 'user', 0, 'active', '2025-09-27 00:34:27', '2025-09-27 00:34:27', '2025-09-27 00:34:27');
INSERT INTO `users` VALUES (16, '13811111120', '用户1120', '', 'user', 0, 'active', '2025-09-27 11:40:34', '2025-09-27 11:40:34', '2025-09-27 11:40:34');
INSERT INTO `users` VALUES (17, '13800000000', '用户0000', '', 'user', 0, 'active', '2025-09-27 20:32:40', '2025-09-27 20:32:40', '2025-09-27 20:32:40');
INSERT INTO `users` VALUES (18, '13800138006', NULL, NULL, 'electrician', 1, 'active', '2025-10-20 10:28:31', '2025-10-15 21:35:38', '2025-10-20 10:28:31');
INSERT INTO `users` VALUES (19, '13800138007', '阮小七', 'http://localhost:3000/uploads/avatars/avatar_d56adf5169c0d5b27915fca10d0f13bd.jpg', 'electrician', 1, 'active', '2025-10-30 16:53:43', '2025-10-22 21:21:00', '2025-11-03 15:52:40');
INSERT INTO `users` VALUES (20, '13800138008', NULL, NULL, 'electrician', 1, 'active', '2025-11-02 15:44:30', '2025-10-22 21:25:34', '2025-11-03 15:52:42');
INSERT INTO `users` VALUES (21, '13800138009', NULL, NULL, 'electrician', 1, 'active', '2025-11-03 13:48:19', '2025-10-31 11:00:41', '2025-11-03 15:52:41');
INSERT INTO `users` VALUES (22, '13800138010', '软小十', NULL, 'user', 0, 'active', '2025-11-03 13:32:38', '2025-11-02 15:50:47', '2025-11-03 15:52:46');
INSERT INTO `users` VALUES (23, '13800138011', '电工2', NULL, 'electrician', 1, 'active', '2025-11-04 22:43:13', '2025-11-03 14:06:23', '2025-11-04 22:43:13');
INSERT INTO `users` VALUES (24, '13800138012', NULL, NULL, 'user', 0, 'active', '2025-11-03 20:31:08', '2025-11-03 20:31:08', '2025-11-03 20:31:08');
INSERT INTO `users` VALUES (25, '13800138013', NULL, NULL, 'electrician', 1, 'active', '2025-11-03 20:45:59', '2025-11-03 20:38:35', '2025-11-03 20:45:59');

SET FOREIGN_KEY_CHECKS = 1;
