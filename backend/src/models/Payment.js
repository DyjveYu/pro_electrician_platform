/**
 * 支付模型
 * 用于存储支付记录信息
 */
const { DataTypes } = require('sequelize');
const sequelize = require('../config/sequelize');

const Payment = sequelize.define('Payment', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    comment: '支付ID'
  },
  
  order_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '工单ID'
  },
  
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '用户ID'
  },
  
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    comment: '支付金额'
  },
  
  payment_method: {
    type: DataTypes.ENUM('wechat', 'test'),
    defaultValue: 'wechat',
    comment: '支付方式'
  },
  
  transaction_id: {
    type: DataTypes.STRING(64),
    allowNull: true,
    comment: '微信交易号'
  },
  
  out_trade_no: {
    type: DataTypes.STRING(32),
    allowNull: false,
    unique: true,
    comment: '商户订单号'
  },
  
  status: {
    type: DataTypes.ENUM('pending', 'success', 'failed', 'refunded'),
    defaultValue: 'pending',
    comment: '支付状态'
  },
  
  paid_at: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '支付时间'
  }
  
}, {
  tableName: 'payments',
  timestamps: true,
  indexes: [
    { fields: ['order_id'] },
    { fields: ['user_id'] },
    { fields: ['status'] },
    { fields: ['out_trade_no'], unique: true }
  ]
});

module.exports = Payment;