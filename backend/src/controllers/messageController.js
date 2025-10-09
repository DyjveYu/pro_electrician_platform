const { query } = require('../config/database');

class MessageController {
  /**
   * 获取用户消息列表
   */
  static async getMessages(req, res) {
    try {
      const { page = 1, limit = 20, type = '' } = req.query;
      const userId = req.user.id;
      const offset = (page - 1) * limit;

      let whereClause = 'WHERE (target_users = "all" OR FIND_IN_SET(?, target_users)) AND status = "published"';
      const params = [userId];

      if (type && type.trim() !== '') {
        if (type === 'order') {
          // 订单通知使用urgent类型
          whereClause += ' AND type = ?';
          params.push('urgent');
        } else if (type === 'system') {
          // 系统通知包含system、maintenance、activity类型
          whereClause += ' AND type IN (?, ?, ?)';
          params.push('system', 'maintenance', 'activity');
        }
      }

      // 获取消息列表
      const messages = await query(
        `SELECT sm.*, 
                CASE WHEN umr.user_id IS NOT NULL THEN 1 ELSE 0 END as is_read
         FROM system_messages sm
         LEFT JOIN user_message_reads umr ON sm.id = umr.message_id AND umr.user_id = ?
         ${whereClause}
         ORDER BY sm.created_at DESC
         LIMIT ? OFFSET ?`,
        [userId, ...params, parseInt(limit), parseInt(offset)]
      );

      // 获取总数
      const countResult = await query(
        `SELECT COUNT(*) as total
         FROM system_messages sm
         ${whereClause}`,
        params
      );

      const total = countResult[0].total;
      const totalPages = Math.ceil(total / limit);

      res.success({
        messages,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages,
          hasMore: page < totalPages
        }
      });
    } catch (error) {
      console.error('获取消息列表错误:', error);
      res.error('获取消息列表失败');
    }
  }

  /**
   * 获取消息详情
   */
  static async getMessageDetail(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const messages = await query(
        `SELECT sm.*, 
                CASE WHEN umr.user_id IS NOT NULL THEN 1 ELSE 0 END as is_read
         FROM system_messages sm
         LEFT JOIN user_message_reads umr ON sm.id = umr.message_id AND umr.user_id = ?
         WHERE sm.id = ? AND (sm.target_users = "all" OR FIND_IN_SET(?, sm.target_users)) AND sm.status = "published"`,
        [userId, id, userId]
      );

      if (messages.length === 0) {
        return res.error('消息不存在', 404);
      }

      res.success(messages[0]);
    } catch (error) {
      console.error('获取消息详情错误:', error);
      res.error('获取消息详情失败');
    }
  }

  /**
   * 标记消息为已读
   */
  static async markAsRead(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      // 检查消息是否存在
      const messages = await query(
        'SELECT id FROM system_messages WHERE id = ? AND (target_users = "all" OR FIND_IN_SET(?, target_users)) AND status = "published"',
        [id, userId]
      );

      if (messages.length === 0) {
        return res.error('消息不存在', 404);
      }

      // 插入或更新已读记录
      await query(
        'INSERT INTO user_message_reads (user_id, message_id, read_at) VALUES (?, ?, NOW()) ON DUPLICATE KEY UPDATE read_at = NOW()',
        [userId, id]
      );

      res.success({ message: '标记已读成功' });
    } catch (error) {
      console.error('标记已读错误:', error);
      res.error('标记已读失败');
    }
  }

  /**
   * 获取未读消息数量
   */
  static async getUnreadCount(req, res) {
    try {
      const userId = req.user.id;

      // 获取订单通知未读数量（使用urgent类型）
      const orderUnreadResult = await query(
        `SELECT COUNT(*) as count
         FROM system_messages sm
         LEFT JOIN user_message_reads umr ON sm.id = umr.message_id AND umr.user_id = ?
         WHERE (sm.target_users = "all" OR FIND_IN_SET(?, sm.target_users)) 
               AND sm.status = "published" 
               AND sm.type = "urgent"
               AND umr.user_id IS NULL`,
        [userId, userId]
      );

      // 获取系统通知未读数量（包含system、maintenance、activity类型）
      const systemUnreadResult = await query(
        `SELECT COUNT(*) as count
         FROM system_messages sm
         LEFT JOIN user_message_reads umr ON sm.id = umr.message_id AND umr.user_id = ?
         WHERE (sm.target_users = "all" OR FIND_IN_SET(?, sm.target_users)) 
               AND sm.status = "published" 
               AND sm.type IN ("system", "maintenance", "activity")
               AND umr.user_id IS NULL`,
        [userId, userId]
      );

      const orderUnread = orderUnreadResult[0].count;
      const systemUnread = systemUnreadResult[0].count;
      const totalUnread = orderUnread + systemUnread;

      res.success({
        order: orderUnread,
        system: systemUnread,
        total: totalUnread
      });
    } catch (error) {
      console.error('获取未读消息数量错误:', error);
      res.error('获取未读消息数量失败');
    }
  }
}

module.exports = MessageController;