/**
 * 用户模型
 * 处理用户相关的数据库操作
 */
const { DataTypes } = require('sequelize');
const sequelize = require('../config/sequelize');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    comment: '用户ID'
  },
  
  phone: {
    type: DataTypes.STRING(11),
    allowNull: false,
    unique: true,
    comment: '手机号',
    validate: {
      is: /^1[3-9]\d{9}$/
    }
  },
  
  nickname: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: '用户昵称',
    validate: {
      len: [1, 50]
    }
  },
  
  avatar: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: '头像URL'
  },
  
  current_role: {
    type: DataTypes.ENUM('user', 'electrician'),
    defaultValue: 'user',
    comment: '当前角色'
  },
  
  can_be_electrician: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: '是否可以成为电工'
  },
  
  status: {
    type: DataTypes.ENUM('active', 'banned'),
    defaultValue: 'active',
    comment: '账号状态'
  },
  
  last_login_at: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '最后登录时间'
  }
  
}, {
  tableName: 'users',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    { fields: ['phone'] },
    { fields: ['status'] },
    { fields: ['current_role'] }
  ]
});

module.exports = User;