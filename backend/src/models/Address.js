const db = require('../config/database');

class Address {
  /**
   * 根据用户ID获取地址列表
   * @param {number} userId - 用户ID
   * @param {number} page - 页码
   * @param {number} limit - 每页数量
   * @returns {Promise<Array>} 地址列表
   */
  static async getByUserId(userId, page = 1, limit = 20) {
    const offset = (page - 1) * limit;
    const sql = `
      SELECT id, user_id, contact_name, contact_phone, province, city, district, 
             detail_address, longitude, latitude, is_default, created_at, updated_at
      FROM user_addresses 
      WHERE user_id = ? 
      ORDER BY is_default DESC, created_at DESC
      LIMIT ? OFFSET ?
    `;
    const rows = await db.query(sql, [userId, limit, offset]);
    return rows;
  }

  /**
   * 获取用户地址总数
   * @param {number} userId - 用户ID
   * @returns {Promise<number>} 地址总数
   */
  static async getCountByUserId(userId) {
    const sql = 'SELECT COUNT(*) as count FROM user_addresses WHERE user_id = ?';
    const rows = await db.query(sql, [userId]);
    return rows[0].count;
  }

  /**
   * 根据ID获取地址详情
   * @param {number} id - 地址ID
   * @returns {Promise<Object|null>} 地址信息
   */
  static async getById(id) {
    const sql = `
      SELECT id, user_id, contact_name, contact_phone, province, city, district, 
             detail_address, longitude, latitude, is_default, created_at, updated_at
      FROM user_addresses 
      WHERE id = ?
    `;
    const rows = await db.query(sql, [id]);
    return rows[0] || null;
  }

  /**
   * 创建新地址
   * @param {Object} addressData - 地址数据
   * @returns {Promise<number>} 新创建的地址ID
   */
  static async create(addressData) {
    console.log('Address.create received data:', JSON.stringify(addressData, null, 2));
    
    const {
      user_id,
      contact_name,
      contact_phone,
      province,
      city,
      district,
      detail_address,
      longitude,
      latitude,
      is_default
    } = addressData;

    console.log('Extracted parameters:', {
      user_id, contact_name, contact_phone, province, city, district,
      detail_address, longitude, latitude, is_default
    });

    const sql = `
      INSERT INTO user_addresses (
        user_id, contact_name, contact_phone, province, city, district,
        detail_address, longitude, latitude, is_default
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const result = await db.query(sql, [
      user_id, contact_name, contact_phone, province, city, district,
      detail_address, longitude, latitude, is_default
    ]);

    return {
      id: result.insertId,
      ...addressData
    };
  }

  /**
   * 更新地址信息
   * @param {number} id - 地址ID
   * @param {Object} updateData - 更新数据
   * @returns {Promise<boolean>} 是否更新成功
   */
  static async update(id, updateData) {
    const {
      contact_name, contact_phone, province, city, district,
      detail_address, longitude, latitude, is_default
    } = updateData;

    const sql = `
      UPDATE user_addresses SET 
        contact_name = ?, contact_phone = ?, province = ?, city = ?, district = ?,
        detail_address = ?, longitude = ?, latitude = ?, is_default = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;
    
    const result = await db.query(sql, [
      contact_name, contact_phone, province, city, district,
      detail_address, longitude, latitude, is_default,
      id
    ]);

    return result.affectedRows > 0;
  }

  /**
   * 删除地址
   * @param {number} id - 地址ID
   * @returns {Promise<boolean>} 是否删除成功
   */
  static async delete(id) {
    const sql = 'DELETE FROM user_addresses WHERE id = ?';
    const result = await db.query(sql, [id]);
    return result.affectedRows > 0;
  }

  /**
   * 设置默认地址
   * @param {number} id - 地址ID
   * @param {number} userId - 用户ID
   * @returns {Promise<Object|null>} 设置后的地址信息
   */
  static async setDefault(id, userId) {
    // 先取消其他默认地址
    await this.clearDefaultByUserId(userId);
    
    // 设置当前地址为默认
    const sql = `
      UPDATE user_addresses SET 
        is_default = TRUE, 
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND user_id = ?
    `;
    
    const result = await db.query(sql, [id, userId]);
    
    if (result.affectedRows === 0) {
      return null;
    }

    return await this.getById(id);
  }

  /**
   * 获取默认地址
   * @param {number} userId - 用户ID
   * @returns {Promise<Object|null>} 默认地址信息
   */
  static async getDefaultByUserId(userId) {
    const sql = `
      SELECT id, user_id, contact_name, contact_phone, province, city, district, 
             detail_address, longitude, latitude, is_default, created_at, updated_at
      FROM user_addresses 
      WHERE user_id = ? AND is_default = TRUE
    `;
    const rows = await db.query(sql, [userId]);
    return rows[0] || null;
  }

  /**
   * 清除用户的所有默认地址
   * @param {number} userId - 用户ID
   * @returns {Promise<void>}
   */
  static async clearDefaultByUserId(userId) {
    const sql = `
      UPDATE user_addresses SET 
        is_default = FALSE, 
        updated_at = CURRENT_TIMESTAMP
      WHERE user_id = ? AND is_default = TRUE
    `;
    await db.query(sql, [userId]);
  }

  /**
   * 创建regions表（如果不存在）
   * @returns {Promise<void>}
   */
  static async createRegionsTable() {
    const createTableSql = `
      CREATE TABLE IF NOT EXISTS regions (
        id INT PRIMARY KEY AUTO_INCREMENT COMMENT '地区ID',
        code VARCHAR(20) NOT NULL COMMENT '地区编码',
        name VARCHAR(50) NOT NULL COMMENT '地区名称',
        parent_code VARCHAR(20) DEFAULT NULL COMMENT '父级地区编码',
        level TINYINT NOT NULL COMMENT '级别：1省份，2城市，3区县',
        sort_order INT DEFAULT 0 COMMENT '排序',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
        INDEX idx_code (code),
        INDEX idx_parent_code (parent_code),
        INDEX idx_level (level)
      ) COMMENT='地区表'
    `;
    
    await db.query(createTableSql);
  }

  /**
   * 初始化地区数据
   * @returns {Promise<void>}
   */
  static async initRegionsData() {
    // 检查是否已有数据
    const existingRows = await db.query('SELECT COUNT(*) as count FROM regions');
    console.log('Existing rows result:', existingRows);
    
    if (existingRows && existingRows.length > 0 && existingRows[0] && existingRows[0].count > 0) {
      console.log('Regions data already exists, count:', existingRows[0].count);
      return; // 已有数据，不重复插入
    }
    
    console.log('Initializing regions data...');

    // 插入省份数据
    const provinces = [
      ['110000', '北京市', null, 1, 1],
      ['120000', '天津市', null, 1, 2],
      ['310000', '上海市', null, 1, 3],
      ['500000', '重庆市', null, 1, 4],
      ['440000', '广东省', null, 1, 5],
      ['320000', '江苏省', null, 1, 6],
      ['330000', '浙江省', null, 1, 7],
      ['370000', '山东省', null, 1, 8],
      ['410000', '河南省', null, 1, 9],
      ['420000', '湖北省', null, 1, 10]
    ];

    const provinceSql = 'INSERT INTO regions (code, name, parent_code, level, sort_order) VALUES (?,?,?,?,?)';
    for (const province of provinces) {
      await db.query(provinceSql, province);
    }

    // 插入部分城市数据
    const cities = [
      ['110100', '北京市', '110000', 2, 1],
      ['120100', '天津市', '120000', 2, 1],
      ['310100', '上海市', '310000', 2, 1],
      ['500100', '重庆市', '500000', 2, 1],
      ['440100', '广州市', '440000', 2, 1],
      ['440300', '深圳市', '440000', 2, 2],
      ['440600', '佛山市', '440000', 2, 3],
      ['441900', '东莞市', '440000', 2, 4],
      ['320100', '南京市', '320000', 2, 1],
      ['320200', '无锡市', '320000', 2, 2]
    ];

    const citySql = 'INSERT INTO regions (code, name, parent_code, level, sort_order) VALUES (?,?,?,?,?)';
    for (const city of cities) {
      await db.query(citySql, city);
    }

    // 插入部分区县数据
    const districts = [
      ['440104', '越秀区', '440100', 3, 1],
      ['440105', '海珠区', '440100', 3, 2],
      ['440106', '天河区', '440100', 3, 3],
      ['440111', '白云区', '440100', 3, 4],
      ['440303', '罗湖区', '440300', 3, 1],
      ['440304', '福田区', '440300', 3, 2],
      ['440305', '南山区', '440300', 3, 3],
      ['440306', '宝安区', '440300', 3, 4]
    ];

    const districtSql = 'INSERT INTO regions (code, name, parent_code, level, sort_order) VALUES (?,?,?,?,?)';
    for (const district of districts) {
      await db.query(districtSql, district);
    }
  }

  /**
   * 获取地区数据
   * @param {string|null} parentCode - 父级地区编码
   * @param {number} level - 级别：1省份，2城市，3区县
   * @returns {Promise<Array>} 地区列表
   */
  static async getRegions(parentCode = null, level = 1) {
    let sql = `
      SELECT id, code, name, parent_code, level, sort_order
      FROM regions 
      WHERE level = ?
    `;
    const params = [level];

    if (parentCode) {
      sql += ' AND parent_code = ?';
      params.push(parentCode);
    } else if (level > 1) {
      // 如果是查询城市或区县，但没有提供父级编码，返回空数组
      return [];
    }

    sql += ' ORDER BY sort_order ASC, code ASC';
    
    const rows = await db.query(sql, params);
    return rows;
  }
}

module.exports = Address;