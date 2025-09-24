/**
 * 用户模型
 * 处理用户相关的数据库操作
 */

const db = require('../../config/database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

class User {
  /**
   * 根据手机号查找用户
   */
  static async findByPhone(phone) {
    const [rows] = await db.query(
      'SELECT * FROM users WHERE phone = ?',
      [phone]
    );
    return rows[0] || null;
  }

  /**
   * 根据ID查找用户
   */
  static async findById(id) {
    const [rows] = await db.query(
      'SELECT * FROM users WHERE id = ?',
      [id]
    );
    return rows[0] || null;
  }

  /**
   * 创建新用户
   */
  static async create(userData) {
    const {
      phone,
      nickname = `用户${phone.slice(-4)}`,
      avatar = '',
      current_role = 'user'
    } = userData;

    const [result] = await db.query(
      `INSERT INTO users (phone, nickname, avatar, current_role, created_at, updated_at) 
       VALUES (?, ?, ?, ?, NOW(), NOW())`,
      [phone, nickname, avatar, current_role]
    );

    return {
      id: result.insertId,
      phone,
      nickname,
      avatar,
      current_role
    };
  }

  /**
   * 更新用户信息
   */
  static async update(id, updateData) {
    const fields = [];
    const values = [];

    // 动态构建更新字段
    Object.keys(updateData).forEach(key => {
      if (updateData[key] !== undefined) {
        fields.push(`${key} = ?`);
        values.push(updateData[key]);
      }
    });

    if (fields.length === 0) {
      throw new Error('没有要更新的字段');
    }

    fields.push('updated_at = NOW()');
    values.push(id);

    const [result] = await db.query(
      `UPDATE users SET ${fields.join(', ')} WHERE id = ?`,
      values
    );

    return result.affectedRows > 0;
  }

  /**
   * 切换用户角色
   */
  static async switchRole(id, newRole) {
    // 验证角色是否有效
    const validRoles = ['user', 'electrician'];
    if (!validRoles.includes(newRole)) {
      throw new Error('无效的角色类型');
    }

    const [result] = await db.query(
      'UPDATE users SET current_role = ?, updated_at = NOW() WHERE id = ?',
      [newRole, id]
    );

    return result.affectedRows > 0;
  }

  /**
   * 获取用户的电工认证信息
   */
  static async getElectricianCertification(userId) {
    const [rows] = await db.query(
      `SELECT * FROM electrician_certifications 
       WHERE user_id = ? 
       ORDER BY created_at DESC 
       LIMIT 1`,
      [userId]
    );
    return rows[0] || null;
  }

  /**
   * 检查用户是否可以切换到电工角色
   */
  static async canSwitchToElectrician(userId) {
    const certification = await this.getElectricianCertification(userId);
    return certification && certification.status === 'approved';
  }

  /**
   * 生成JWT token
   */
  static generateToken(user) {
    const payload = {
      id: user.id,
      phone: user.phone,
      current_role: user.current_role
    };

    return jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d'
    });
  }

  /**
   * 验证JWT token
   */
  static verifyToken(token) {
    try {
      return jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      throw new Error('无效的token');
    }
  }

  /**
   * 获取用户统计信息
   */
  static async getUserStats(userId, role = 'user') {
    if (role === 'user') {
      // 用户统计：订单数量、总消费等
      const [orderStats] = await db.query(
        `SELECT 
           COUNT(*) as total_orders,
           COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_orders,
           COALESCE(SUM(CASE WHEN status = 'completed' THEN total_amount ELSE 0 END), 0) as total_spent
         FROM work_orders 
         WHERE user_id = ?`,
        [userId]
      );
      return orderStats[0];
    } else {
      // 电工统计：接单数量、总收入等
      const [orderStats] = await db.query(
        `SELECT 
           COUNT(*) as total_orders,
           COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_orders,
           COALESCE(SUM(CASE WHEN status = 'completed' THEN electrician_amount ELSE 0 END), 0) as total_earned
         FROM work_orders 
         WHERE electrician_id = ?`,
        [userId]
      );
      return orderStats[0];
    }
  }

  /**
   * 更新用户最后登录时间
   */
  static async updateLastLogin(id) {
    await db.query(
      'UPDATE users SET last_login_at = NOW() WHERE id = ?',
      [id]
    );
  }

  /**
   * 获取用户列表（管理后台用）
   */
  static async getList(options = {}) {
    const {
      page = 1,
      limit = 20,
      search = '',
      role = '',
      status = ''
    } = options;

    const offset = (page - 1) * limit;
    let whereConditions = [];
    let params = [];

    // 搜索条件
    if (search) {
      whereConditions.push('(phone LIKE ? OR nickname LIKE ?)');
      params.push(`%${search}%`, `%${search}%`);
    }

    if (role) {
      whereConditions.push('current_role = ?');
      params.push(role);
    }

    if (status) {
      whereConditions.push('status = ?');
      params.push(status);
    }

    const whereClause = whereConditions.length > 0 
      ? `WHERE ${whereConditions.join(' AND ')}` 
      : '';

    // 获取总数
    const [countResult] = await db.query(
      `SELECT COUNT(*) as total FROM users ${whereClause}`,
      params
    );
    const total = countResult[0].total;

    // 获取列表
    const [rows] = await db.query(
      `SELECT id, phone, nickname, avatar, current_role, status, 
              created_at, updated_at, last_login_at
       FROM users 
       ${whereClause}
       ORDER BY created_at DESC 
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    return {
      list: rows,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }
}

module.exports = User;