/**
 * 服务类型模型
 * 处理服务类型相关的数据库操作
 */

const db = require('../../config/database');

class ServiceType {
  /**
   * 获取所有服务类型
   */
  static async getAll() {
    const [rows] = await db.query(
      'SELECT * FROM service_types WHERE status = "active" ORDER BY sort_order ASC, id ASC'
    );
    return rows;
  }

  /**
   * 根据ID获取服务类型
   */
  static async findById(id) {
    const [rows] = await db.query(
      'SELECT * FROM service_types WHERE id = ?',
      [id]
    );
    return rows[0] || null;
  }

  /**
   * 创建服务类型
   */
  static async create(data) {
    const { name, description, sort_order = 0 } = data;
    
    const [result] = await db.query(
      'INSERT INTO service_types (name, description, sort_order, created_at, updated_at) VALUES (?, ?, ?, NOW(), NOW())',
      [name, description, sort_order]
    );

    return {
      id: result.insertId,
      name,
      description,
      sort_order,
      status: 'active'
    };
  }

  /**
   * 更新服务类型
   */
  static async update(id, data) {
    const fields = [];
    const values = [];

    Object.keys(data).forEach(key => {
      if (data[key] !== undefined) {
        fields.push(`${key} = ?`);
        values.push(data[key]);
      }
    });

    if (fields.length === 0) {
      throw new Error('没有要更新的字段');
    }

    fields.push('updated_at = NOW()');
    values.push(id);

    const [result] = await db.query(
      `UPDATE service_types SET ${fields.join(', ')} WHERE id = ?`,
      values
    );

    return result.affectedRows > 0;
  }

  /**
   * 删除服务类型（软删除）
   */
  static async delete(id) {
    const [result] = await db.query(
      'UPDATE service_types SET status = "inactive", updated_at = NOW() WHERE id = ?',
      [id]
    );
    return result.affectedRows > 0;
  }

  /**
   * 获取服务类型统计
   */
  static async getStats() {
    const [rows] = await db.query(
      `SELECT 
        st.id,
        st.name,
        COUNT(wo.id) as order_count,
        COUNT(CASE WHEN wo.status = 'completed' THEN 1 END) as completed_count,
        COALESCE(AVG(CASE WHEN wo.status = 'completed' THEN wo.quoted_price END), 0) as avg_price
       FROM service_types st
       LEFT JOIN work_orders wo ON st.id = wo.service_type_id
       WHERE st.status = 'active'
       GROUP BY st.id, st.name
       ORDER BY st.sort_order ASC, st.id ASC`
    );
    return rows;
  }
}

module.exports = ServiceType;