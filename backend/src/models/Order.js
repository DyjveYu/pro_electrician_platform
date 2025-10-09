/**
 * 工单模型
 * 用于存储维修工单相关信息
 */
const { DataTypes } = require('sequelize');
const sequelize = require('../config/sequelize');

const Order = sequelize.define('Order', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    comment: '工单ID'
  },
  
  order_no: {
    type: DataTypes.STRING(32),
    allowNull: false,
    unique: true,
    comment: '工单编号'
  },
  
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '用户ID'
  },
  
  electrician_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: '电工ID'
  },
  
  service_type_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '服务类型ID'
  },
  
  title: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: '工单标题'
  },
  
  description: {
    type: DataTypes.TEXT,
    allowNull: false,
    comment: '问题描述'
  },
  
  images: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: '问题图片URLs'
  },
  
  contact_name: {
    type: DataTypes.STRING(50),
    allowNull: false,
    comment: '联系人'
  },
  
  contact_phone: {
    type: DataTypes.STRING(11),
    allowNull: false,
    comment: '联系电话',
    validate: {
      is: /^1[3-9]\d{9}$/
    }
  },
  
  service_address: {
    type: DataTypes.TEXT,
    allowNull: false,
    comment: '服务地址'
  },
  
  longitude: {
    type: DataTypes.DECIMAL(10, 7),
    allowNull: true,
    comment: '经度'
  },
  
  latitude: {
    type: DataTypes.DECIMAL(10, 7),
    allowNull: true,
    comment: '纬度'
  },
  
  estimated_amount: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
    comment: '预估金额'
  },
  
  final_amount: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
    comment: '最终金额'
  },
  
  repair_content: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '维修内容'
  },
  
  repair_images: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: '维修图片URLs'
  },
  
  status: {
    type: DataTypes.ENUM('pending', 'accepted', 'in_progress', 'completed', 'paid', 'cancelled'),
    defaultValue: 'pending',
    comment: '工单状态'
  },
  
  cancel_reason: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '取消原因'
  },
  
  accepted_at: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '接单时间'
  },
  
  completed_at: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '完成时间'
  },
  
  paid_at: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '支付时间'
  },
  
  cancelled_at: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '取消时间'
  }
  
}, {
  tableName: 'orders',
  timestamps: true,
  indexes: [
    { fields: ['user_id'] },
    { fields: ['electrician_id'] },
    { fields: ['service_type_id'] },
    { fields: ['status'] },
    { fields: ['order_no'], unique: true }
  ]
});

module.exports = Order;