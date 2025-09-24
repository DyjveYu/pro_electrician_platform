-- 电工维修平台数据库初始化脚本
-- 创建数据库
CREATE DATABASE IF NOT EXISTS pro_electrician 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

USE pro_electrician;

-- 设置时区
SET time_zone = '+08:00';

-- 1. 用户表
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT COMMENT '用户ID',
    phone VARCHAR(11) UNIQUE NOT NULL COMMENT '手机号',
    nickname VARCHAR(50) DEFAULT NULL COMMENT '昵称',
    avatar VARCHAR(255) DEFAULT NULL COMMENT '头像URL',
    current_role ENUM('user', 'electrician') DEFAULT 'user' COMMENT '当前角色',
    can_be_electrician BOOLEAN DEFAULT FALSE COMMENT '是否可以成为电工',
    status ENUM('active', 'banned') DEFAULT 'active' COMMENT '用户状态',
    last_login_at TIMESTAMP NULL COMMENT '最后登录时间',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间'
) COMMENT='用户表';

-- 2. 服务类型表
CREATE TABLE service_types (
    id INT PRIMARY KEY AUTO_INCREMENT COMMENT '服务类型ID',
    name VARCHAR(50) NOT NULL COMMENT '服务类型名称',
    description TEXT COMMENT '服务描述',
    icon_url VARCHAR(255) COMMENT '图标URL',
    sort_order INT DEFAULT 0 COMMENT '排序',
    status ENUM('active', 'inactive') DEFAULT 'active' COMMENT '状态',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间'
) COMMENT='服务类型表';

-- 3. 电工信息表
CREATE TABLE electricians (
    id INT PRIMARY KEY AUTO_INCREMENT COMMENT '电工ID',
    user_id INT NOT NULL COMMENT '用户ID',
    real_name VARCHAR(50) NOT NULL COMMENT '真实姓名',
    id_card VARCHAR(18) NOT NULL COMMENT '身份证号',
    certification_status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending' COMMENT '认证状态',
    work_years INT DEFAULT 0 COMMENT '工作年限',
    service_area VARCHAR(255) COMMENT '服务区域',
    certification_images JSON COMMENT '认证图片URLs',
    reject_reason TEXT COMMENT '驳回原因',
    reviewed_at TIMESTAMP NULL COMMENT '审核时间',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) COMMENT='电工信息表';

-- 4. 电工认证表
CREATE TABLE electrician_certifications (
    id INT PRIMARY KEY AUTO_INCREMENT COMMENT '认证ID',
    user_id INT NOT NULL COMMENT '用户ID',
    real_name VARCHAR(50) NOT NULL COMMENT '真实姓名',
    id_card VARCHAR(18) NOT NULL COMMENT '身份证号',
    electrician_cert_no VARCHAR(50) NOT NULL COMMENT '电工证编号',
    cert_start_date DATE NOT NULL COMMENT '电工证有效期开始日期',
    cert_end_date DATE NOT NULL COMMENT '电工证有效期结束日期',
    status ENUM('pending', 'approved', 'rejected') DEFAULT 'approved' COMMENT '认证状态',
    reject_reason TEXT COMMENT '驳回原因',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) COMMENT='电工认证表';

-- 5. 用户地址表
CREATE TABLE user_addresses (
    id INT PRIMARY KEY AUTO_INCREMENT COMMENT '地址ID',
    user_id INT NOT NULL COMMENT '用户ID',
    contact_name VARCHAR(50) NOT NULL COMMENT '联系人姓名',
    contact_phone VARCHAR(11) NOT NULL COMMENT '联系电话',
    province VARCHAR(50) NOT NULL COMMENT '省份',
    city VARCHAR(50) NOT NULL COMMENT '城市',
    district VARCHAR(50) NOT NULL COMMENT '区县',
    detail_address VARCHAR(255) NOT NULL COMMENT '详细地址',
    longitude DECIMAL(10,7) DEFAULT NULL COMMENT '经度',
    latitude DECIMAL(10,7) DEFAULT NULL COMMENT '纬度',
    is_default BOOLEAN DEFAULT FALSE COMMENT '是否默认地址',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) COMMENT='用户地址表';

-- 6. 工单表
CREATE TABLE orders (
    id INT PRIMARY KEY AUTO_INCREMENT COMMENT '工单ID',
    order_no VARCHAR(32) UNIQUE NOT NULL COMMENT '工单编号',
    user_id INT NOT NULL COMMENT '用户ID',
    electrician_id INT DEFAULT NULL COMMENT '电工ID',
    service_type_id INT NOT NULL COMMENT '服务类型ID',
    title VARCHAR(100) NOT NULL COMMENT '工单标题',
    description TEXT NOT NULL COMMENT '问题描述',
    images JSON COMMENT '问题图片URLs',
    contact_name VARCHAR(50) NOT NULL COMMENT '联系人',
    contact_phone VARCHAR(11) NOT NULL COMMENT '联系电话',
    service_address TEXT NOT NULL COMMENT '服务地址',
    longitude DECIMAL(10,7) DEFAULT NULL COMMENT '经度',
    latitude DECIMAL(10,7) DEFAULT NULL COMMENT '纬度',
    estimated_amount DECIMAL(10,2) DEFAULT 0 COMMENT '预估金额',
    final_amount DECIMAL(10,2) DEFAULT 0 COMMENT '最终金额',
    repair_content TEXT COMMENT '维修内容',
    repair_images JSON COMMENT '维修图片URLs',
    status ENUM('pending', 'accepted', 'in_progress', 'completed', 'paid', 'cancelled') DEFAULT 'pending' COMMENT '工单状态',
    cancel_reason TEXT COMMENT '取消原因',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    accepted_at TIMESTAMP NULL COMMENT '接单时间',
    completed_at TIMESTAMP NULL COMMENT '完成时间',
    paid_at TIMESTAMP NULL COMMENT '支付时间',
    cancelled_at TIMESTAMP NULL COMMENT '取消时间',
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (electrician_id) REFERENCES users(id),
    FOREIGN KEY (service_type_id) REFERENCES service_types(id)
) COMMENT='工单表';

-- 7. 工单状态日志表
CREATE TABLE order_status_logs (
    id INT PRIMARY KEY AUTO_INCREMENT COMMENT '日志ID',
    order_id INT NOT NULL COMMENT '工单ID',
    from_status VARCHAR(20) COMMENT '原状态',
    to_status VARCHAR(20) NOT NULL COMMENT '新状态',
    operator_id INT COMMENT '操作人ID',
    operator_type ENUM('user', 'electrician', 'admin', 'system') NOT NULL COMMENT '操作人类型',
    remark TEXT COMMENT '备注',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (operator_id) REFERENCES users(id)
) COMMENT='工单状态日志表';

-- 8. 支付记录表
CREATE TABLE payments (
    id INT PRIMARY KEY AUTO_INCREMENT COMMENT '支付ID',
    order_id INT NOT NULL COMMENT '工单ID',
    user_id INT NOT NULL COMMENT '用户ID',
    amount DECIMAL(10,2) NOT NULL COMMENT '支付金额',
    payment_method ENUM('wechat', 'test') DEFAULT 'wechat' COMMENT '支付方式',
    transaction_id VARCHAR(64) COMMENT '微信交易号',
    out_trade_no VARCHAR(32) UNIQUE NOT NULL COMMENT '商户订单号',
    status ENUM('pending', 'success', 'failed', 'refunded') DEFAULT 'pending' COMMENT '支付状态',
    paid_at TIMESTAMP NULL COMMENT '支付时间',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    FOREIGN KEY (order_id) REFERENCES orders(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
) COMMENT='支付记录表';

-- 9. 评价表
CREATE TABLE reviews (
    id INT PRIMARY KEY AUTO_INCREMENT COMMENT '评价ID',
    order_id INT NOT NULL COMMENT '工单ID',
    user_id INT NOT NULL COMMENT '用户ID',
    electrician_id INT NOT NULL COMMENT '电工ID',
    rating TINYINT NOT NULL COMMENT '评分(1-5)',
    content TEXT COMMENT '评价内容',
    images JSON COMMENT '评价图片URLs',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    FOREIGN KEY (order_id) REFERENCES orders(id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (electrician_id) REFERENCES users(id)
) COMMENT='评价表';

-- 10. 消息表
CREATE TABLE messages (
    id INT PRIMARY KEY AUTO_INCREMENT COMMENT '消息ID',
    user_id INT NOT NULL COMMENT '接收用户ID',
    type ENUM('order', 'system') NOT NULL COMMENT '消息类型',
    title VARCHAR(100) NOT NULL COMMENT '消息标题',
    content TEXT NOT NULL COMMENT '消息内容',
    related_id INT COMMENT '关联ID(如工单ID)',
    is_read BOOLEAN DEFAULT FALSE COMMENT '是否已读',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    read_at TIMESTAMP NULL COMMENT '阅读时间',
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) COMMENT='消息表';

-- 11. 管理员表
CREATE TABLE admins (
    id INT PRIMARY KEY AUTO_INCREMENT COMMENT '管理员ID',
    username VARCHAR(50) UNIQUE NOT NULL COMMENT '用户名',
    password VARCHAR(255) NOT NULL COMMENT '密码(加密)',
    real_name VARCHAR(50) NOT NULL COMMENT '真实姓名',
    email VARCHAR(100) COMMENT '邮箱',
    status ENUM('active', 'inactive') DEFAULT 'active' COMMENT '状态',
    last_login_at TIMESTAMP NULL COMMENT '最后登录时间',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间'
) COMMENT='管理员表';

-- 12. 系统配置表
CREATE TABLE system_configs (
    id INT PRIMARY KEY AUTO_INCREMENT COMMENT '配置ID',
    config_key VARCHAR(100) UNIQUE NOT NULL COMMENT '配置键',
    config_value TEXT COMMENT '配置值',
    description VARCHAR(255) COMMENT '配置描述',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间'
) COMMENT='系统配置表';

-- 13. 系统通知表
CREATE TABLE system_messages (
    id INT PRIMARY KEY AUTO_INCREMENT COMMENT '通知ID',
    title VARCHAR(100) NOT NULL COMMENT '通知标题',
    content TEXT NOT NULL COMMENT '通知内容',
    target_users ENUM('all', 'users', 'electricians') DEFAULT 'all' COMMENT '目标用户',
    type ENUM('system', 'activity', 'maintenance', 'urgent') DEFAULT 'system' COMMENT '通知类型',
    priority ENUM('low', 'medium', 'high', 'urgent') DEFAULT 'medium' COMMENT '优先级',
    status ENUM('draft', 'published', 'scheduled') DEFAULT 'published' COMMENT '状态',
    scheduled_at TIMESTAMP NULL COMMENT '定时发布时间',
    published_at TIMESTAMP NULL COMMENT '发布时间',
    created_by INT NOT NULL COMMENT '创建人ID',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    FOREIGN KEY (created_by) REFERENCES admins(id)
) COMMENT='系统通知表';