/**
 * 支付模型
 * 处理支付相关的数据库操作
 */

const db = require('../../config/database');

class Payment {
  /**
   * 创建支付记录
   */
  static async create(paymentData) {
    const {
      order_id,
      user_id,
      amount,
      payment_method = 'wechat',
      payment_type = 'order'
    } = paymentData;

    // 生成支付单号
    const payment_no = this.generatePaymentNo();

    const [result] = await db.query(
      `INSERT INTO payments (
        payment_no, order_id, user_id, amount, payment_method, payment_type,
        status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, 'pending', NOW(), NOW())`,
      [payment_no, order_id, user_id, amount, payment_method, payment_type]
    );

    return {
      id: result.insertId,
      payment_no,
      ...paymentData,
      status: 'pending'
    };
  }

  /**
   * 根据ID查找支付记录
   */
  static async findById(id) {
    const [rows] = await db.query(
      `SELECT p.*, wo.order_no, wo.title as order_title,
              u.nickname as user_nickname, u.phone as user_phone
       FROM payments p
       LEFT JOIN work_orders wo ON p.order_id = wo.id
       LEFT JOIN users u ON p.user_id = u.id
       WHERE p.id = ?`,
      [id]
    );
    return rows[0] || null;
  }

  /**
   * 根据支付单号查找支付记录
   */
  static async findByPaymentNo(paymentNo) {
    const [rows] = await db.query(
      `SELECT p.*, wo.order_no, wo.title as order_title,
              u.nickname as user_nickname, u.phone as user_phone
       FROM payments p
       LEFT JOIN work_orders wo ON p.order_id = wo.id
       LEFT JOIN users u ON p.user_id = u.id
       WHERE p.payment_no = ?`,
      [paymentNo]
    );
    return rows[0] || null;
  }

  /**
   * 根据第三方交易号查找支付记录
   */
  static async findByTransactionId(transactionId) {
    const [rows] = await db.query(
      'SELECT * FROM payments WHERE transaction_id = ?',
      [transactionId]
    );
    return rows[0] || null;
  }

  /**
   * 根据工单ID查找支付记录
   */
  static async findByOrderId(orderId) {
    const [rows] = await db.query(
      `SELECT p.*, wo.order_no, wo.title as order_title,
              u.nickname as user_nickname, u.phone as user_phone
       FROM payments p
       LEFT JOIN work_orders wo ON p.order_id = wo.id
       LEFT JOIN users u ON p.user_id = u.id
       WHERE p.order_id = ?
       ORDER BY p.created_at DESC
       LIMIT 1`,
      [orderId]
    );
    return rows[0] || null;
  }

  /**
   * 更新支付状态
   */
  static async updateStatus(id, status, updateData = {}) {
    const fields = ['status = ?', 'updated_at = NOW()'];
    const values = [status];

    // 添加其他更新字段
    Object.keys(updateData).forEach(key => {
      if (updateData[key] !== undefined) {
        fields.push(`${key} = ?`);
        values.push(updateData[key]);
      }
    });

    values.push(id);

    const [result] = await db.query(
      `UPDATE payments SET ${fields.join(', ')} WHERE id = ?`,
      values
    );

    return result.affectedRows > 0;
  }

  /**
   * 支付成功处理
   */
  static async handlePaymentSuccess(paymentNo, transactionData) {
    const connection = await db.getConnection();
    
    try {
      await connection.beginTransaction();

      // 查找支付记录
      const [paymentRows] = await connection.query(
        'SELECT * FROM payments WHERE payment_no = ? FOR UPDATE',
        [paymentNo]
      );

      if (!paymentRows[0]) {
        throw new Error('支付记录不存在');
      }

      const payment = paymentRows[0];
      if (payment.status === 'paid') {
        // 已经处理过，直接返回
        await connection.commit();
        return true;
      }

      if (payment.status !== 'pending') {
        throw new Error('支付状态异常');
      }

      // 更新支付记录
      await connection.query(
        `UPDATE payments SET 
         status = 'paid', transaction_id = ?, paid_at = NOW(), 
         transaction_data = ?, updated_at = NOW() 
         WHERE id = ?`,
        [transactionData.transaction_id, JSON.stringify(transactionData), payment.id]
      );

      // 如果是工单支付，更新工单状态和金额
      if (payment.order_id && payment.payment_type === 'order') {
        await connection.query(
          `UPDATE work_orders SET 
           total_amount = ?, platform_amount = ?, electrician_amount = ?,
           payment_status = 'paid', updated_at = NOW() 
           WHERE id = ?`,
          [
            payment.amount,
            payment.amount * 0.1, // 平台抽成10%
            payment.amount * 0.9,  // 电工收入90%
            payment.order_id
          ]
        );
      }

      await connection.commit();
      return true;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * 支付失败处理
   */
  static async handlePaymentFailed(paymentNo, reason = '') {
    const [result] = await db.query(
      `UPDATE payments SET 
       status = 'failed', failed_reason = ?, updated_at = NOW() 
       WHERE payment_no = ? AND status = 'pending'`,
      [reason, paymentNo]
    );

    return result.affectedRows > 0;
  }

  /**
   * 获取支付列表
   */
  static async getList(options = {}) {
    const {
      page = 1,
      limit = 20,
      user_id,
      status,
      payment_method,
      payment_type,
      search,
      date_range
    } = options;

    const offset = (page - 1) * limit;
    let whereConditions = [];
    let params = [];

    // 用户ID过滤
    if (user_id) {
      whereConditions.push('p.user_id = ?');
      params.push(user_id);
    }

    // 状态过滤
    if (status) {
      whereConditions.push('p.status = ?');
      params.push(status);
    }

    // 支付方式过滤
    if (payment_method) {
      whereConditions.push('p.payment_method = ?');
      params.push(payment_method);
    }

    // 支付类型过滤
    if (payment_type) {
      whereConditions.push('p.payment_type = ?');
      params.push(payment_type);
    }

    // 搜索过滤
    if (search) {
      whereConditions.push('(p.payment_no LIKE ? OR wo.order_no LIKE ? OR wo.title LIKE ?)');
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    // 日期范围过滤
    if (date_range && date_range.start && date_range.end) {
      whereConditions.push('p.created_at BETWEEN ? AND ?');
      params.push(date_range.start, date_range.end);
    }

    const whereClause = whereConditions.length > 0 
      ? `WHERE ${whereConditions.join(' AND ')}` 
      : '';

    // 获取总数
    const [countResult] = await db.query(
      `SELECT COUNT(*) as total 
       FROM payments p 
       LEFT JOIN work_orders wo ON p.order_id = wo.id 
       ${whereClause}`,
      params
    );
    const total = countResult[0].total;

    // 获取列表
    const [rows] = await db.query(
      `SELECT p.*, wo.order_no, wo.title as order_title,
              u.nickname as user_nickname, u.phone as user_phone
       FROM payments p
       LEFT JOIN work_orders wo ON p.order_id = wo.id
       LEFT JOIN users u ON p.user_id = u.id
       ${whereClause}
       ORDER BY p.created_at DESC
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

  /**
   * 获取支付统计
   */
  static async getStats(options = {}) {
    const { user_id, date_range } = options;
    
    let whereConditions = [];
    let params = [];

    if (user_id) {
      whereConditions.push('user_id = ?');
      params.push(user_id);
    }

    if (date_range && date_range.start && date_range.end) {
      whereConditions.push('created_at BETWEEN ? AND ?');
      params.push(date_range.start, date_range.end);
    }

    const whereClause = whereConditions.length > 0 
      ? `WHERE ${whereConditions.join(' AND ')}` 
      : '';

    const [rows] = await db.query(
      `SELECT 
        COUNT(*) as total_payments,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_payments,
        COUNT(CASE WHEN status = 'paid' THEN 1 END) as paid_payments,
        COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_payments,
        COALESCE(SUM(CASE WHEN status = 'paid' THEN amount END), 0) as total_amount,
        COALESCE(AVG(CASE WHEN status = 'paid' THEN amount END), 0) as avg_amount
       FROM payments ${whereClause}`,
      params
    );

    return rows[0];
  }

  /**
   * 生成支付单号
   */
  static generatePaymentNo() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const timestamp = now.getTime().toString().slice(-6);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    
    return `PAY${year}${month}${day}${timestamp}${random}`;
  }

  /**
   * 检查支付是否超时
   */
  static async checkTimeoutPayments() {
    // 查找超过30分钟未支付的订单
    const [rows] = await db.query(
      `SELECT * FROM payments 
       WHERE status = 'pending' 
       AND created_at < DATE_SUB(NOW(), INTERVAL 30 MINUTE)`,
      []
    );

    // 批量更新为超时状态
    if (rows.length > 0) {
      const ids = rows.map(row => row.id);
      await db.query(
        `UPDATE payments SET status = 'timeout', updated_at = NOW() 
         WHERE id IN (${ids.map(() => '?').join(',')})`,
        ids
      );
    }

    return rows.length;
  }
}

module.exports = Payment;