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

/**
 * 根据ID获取地址
 * @param {number|Object} id - 地址ID或地址对象
 * @returns {Promise<Address|null>} - 返回地址对象或null
 */
Address.getById = async function(id) {
  // 如果传入的是地址对象，直接返回
  if (typeof id === 'object' && id !== null) {
    return id;
  }
  // 否则通过ID查询
  return await this.findByPk(id);
};

/**
 * 根据用户ID获取地址列表
 * @param {number} userId - 用户ID
 * @param {number} page - 页码，默认为1
 * @param {number} limit - 每页数量，默认为10
 * @returns {Promise<Address[]>} - 返回地址列表
 */
Address.getByUserId = async function(userId, page = 1, limit = 10) {
  const offset = (page - 1) * limit;
  return await this.findAll({
    where: { user_id: userId },
    order: [
      ['is_default', 'DESC'],
      ['createdAt', 'DESC']
    ],
    limit,
    offset
  });
};

/**
 * 获取用户地址总数
 * @param {number} userId - 用户ID
 * @returns {Promise<number>} - 返回地址总数
 */
Address.getCountByUserId = async function(userId) {
  return await this.count({
    where: { user_id: userId }
  });
};

module.exports = Address;