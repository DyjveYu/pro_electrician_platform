/**
 * 用户地址模型
 * 用于存储用户服务地址信息
 */
const { DataTypes } = require('sequelize');
const sequelize = require('../config/sequelize');

const Address = sequelize.define('Address', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    comment: '地址ID'
  },
  
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '用户ID'
  },
  
  contact_name: {
    type: DataTypes.STRING(50),
    allowNull: false,
    comment: '联系人姓名'
  },
  
  contact_phone: {
    type: DataTypes.STRING(11),
    allowNull: false,
    comment: '联系电话',
    validate: {
      is: /^1[3-9]\d{9}$/
    }
  },
  
  province: {
    type: DataTypes.STRING(50),
    allowNull: false,
    comment: '省份'
  },
  
  city: {
    type: DataTypes.STRING(50),
    allowNull: false,
    comment: '城市'
  },
  
  district: {
    type: DataTypes.STRING(50),
    allowNull: false,
    comment: '区县'
  },
  
  detail_address: {
    type: DataTypes.STRING(255),
    allowNull: false,
    comment: '详细地址'
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
  
  is_default: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: '是否默认地址'
  }
  
}, {
  tableName: 'user_addresses',
  timestamps: true,
  indexes: [
    { fields: ['user_id'] },
    { fields: ['user_id', 'is_default'] }
  ]
});

module.exports = Address;