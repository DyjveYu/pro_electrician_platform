/**
 * 管理后台控制器
 * 处理管理员相关的业务逻辑
 */

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { query } = require('../../config/database');

class AdminController {
  // 管理员登录
  static async login(req, res) {
    try {
      const { username, password } = req.body;
      console.log('登录请求:', { username, password });

      // 查询管理员
      const admins = await query(
        'SELECT * FROM admins WHERE username = ? AND status = "active"',
        [username]
      );
      console.log('查询到的管理员:', admins.length);

      if (admins.length === 0) {
        console.log('管理员不存在');
        return res.error('用户名或密码错误', 401);
      }

      const admin = admins[0];
      console.log('管理员信息:', { id: admin.id, username: admin.username, passwordHash: admin.password });

      // 验证密码
      const isValidPassword = await bcrypt.compare(password, admin.password);
      console.log('密码验证结果:', isValidPassword);
      if (!isValidPassword) {
        console.log('密码验证失败');
        return res.error('用户名或密码错误', 401);
      }

      // 生成JWT token
      const token = jwt.sign(
        { 
          id: admin.id, 
          username: admin.username,
          type: 'admin'
        },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      // 更新最后登录时间
      await query(
        'UPDATE admins SET last_login_at = NOW() WHERE id = ?',
        [admin.id]
      );

      res.success({
        token,
        admin: {
          id: admin.id,
          username: admin.username,
          real_name: admin.real_name,
          email: admin.email
        }
      }, '登录成功');
    } catch (error) {
      console.error('管理员登录错误:', error);
      res.error('登录失败');
    }
  }

  // 获取管理员信息
  static async getAdminInfo(req, res) {
    try {
      const adminId = req.user.id;
      
      const admins = await query(
        'SELECT id, username, real_name, email, created_at FROM admins WHERE id = ?',
        [adminId]
      );

      if (admins.length === 0) {
        return res.error('管理员不存在', 404);
      }

      res.success(admins[0]);
    } catch (error) {
      console.error('获取管理员信息错误:', error);
      res.error('获取信息失败');
    }
  }

  // 管理员登出
  static async logout(req, res) {
    try {
      // 这里可以实现token黑名单机制
      res.success(null, '登出成功');
    } catch (error) {
      console.error('管理员登出错误:', error);
      res.error('登出失败');
    }
  }

  // 获取用户列表
  static async getUsers(req, res) {
    try {
      const { page = 1, limit = 20, search = '', status = '' } = req.query;
      const offset = (page - 1) * limit;
      
      console.log('开始获取用户列表，参数:', { page, limit, search, status });

      // 简化查询，先测试基础功能
      let whereClause = 'WHERE 1=1';
      const params = [];

      if (search) {
        whereClause += ' AND (phone LIKE ? OR nickname LIKE ?)';
        params.push(`%${search}%`, `%${search}%`);
      }

      if (status) {
        whereClause += ' AND status = ?';
        params.push(status);
      }

      console.log('执行用户查询...');
      // 获取用户列表 - 简化字段
      const users = await query(
        `SELECT id, phone, nickname, current_role, status, created_at 
         FROM users ${whereClause} 
         ORDER BY id DESC 
         LIMIT ${parseInt(offset)}, ${parseInt(limit)}`,
        params
      );
      
      console.log('用户查询完成，结果数量:', users.length);

      // 简化总数查询
      console.log('执行计数查询...');
      const countResult = await query(
        `SELECT COUNT(*) as total FROM users ${whereClause}`,
        params
      );
      
      console.log('计数查询完成，总数:', countResult[0].total);

      res.success({
        users,
        total: countResult[0].total,
        page: parseInt(page),
        limit: parseInt(limit)
      });
    } catch (error) {
      console.error('获取用户列表错误:', error);
      res.error('获取用户列表失败');
    }
  }

  // 获取用户详情
  static async getUserDetail(req, res) {
    try {
      const { id } = req.params;

      const users = await query(
        'SELECT * FROM users WHERE id = ?',
        [id]
      );

      if (users.length === 0) {
        return res.error('用户不存在', 404);
      }

      res.success(users[0]);
    } catch (error) {
      console.error('获取用户详情错误:', error);
      res.error('获取用户详情失败');
    }
  }

  // 封禁/解封用户
  static async toggleUserStatus(req, res) {
    try {
      const { id } = req.params;
      const { status, reason = '' } = req.body;

      await query(
        'UPDATE users SET status = ?, ban_reason = ?, updated_at = NOW() WHERE id = ?',
        [status, reason, id]
      );

      res.success(null, `用户${status === 'banned' ? '封禁' : '解封'}成功`);
    } catch (error) {
      console.error('更新用户状态错误:', error);
      res.error('操作失败');
    }
  }

  // 获取电工列表
  static async getElectricians(req, res) {
    try {
      const { page = 1, limit = 20, search = '', status = '', certification_status = '' } = req.query;
      const offset = (page - 1) * limit;

      // 优化查询：先从users表获取电工用户
      let userWhereClause = 'WHERE current_role = "electrician"';
      const userParams = [];

      if (search && search.trim() !== '') {
        userWhereClause += ' AND (phone LIKE ? OR nickname LIKE ?)';
        userParams.push(`%${search}%`, `%${search}%`);
      }

      if (status && status.trim() !== '') {
        userWhereClause += ' AND status = ?';
        userParams.push(status);
      }

      // 获取电工用户基础信息
      const users = await query(
        `SELECT id, phone, nickname, avatar, status, created_at
         FROM users ${userWhereClause} 
         ORDER BY created_at DESC 
         LIMIT ${parseInt(offset)}, ${parseInt(limit)}`,
        userParams
      );

      if (users.length === 0) {
        return res.success({
          electricians: [],
          total: 0,
          page: parseInt(page),
          limit: parseInt(limit)
        });
      }

      // 获取电工详细信息
      const userIds = users.map(u => u.id);
      let electricianWhereClause = `WHERE user_id IN (${userIds.map(() => '?').join(',')})`;
      const electricianParams = [...userIds];

      if (certification_status && certification_status.trim() !== '') {
        electricianWhereClause += ' AND certification_status = ?';
        electricianParams.push(certification_status);
      }

      const electricianDetails = await query(
        `SELECT user_id, real_name, id_card, certification_status, work_years, service_area,
                certification_images, reject_reason
         FROM electricians ${electricianWhereClause}`,
        electricianParams
      );

      // 合并数据
      const electricianMap = new Map();
      electricianDetails.forEach(e => {
        electricianMap.set(e.user_id, e);
      });

      const electricians = users.map(user => {
        const electricianInfo = electricianMap.get(user.id) || {};
        return {
          ...user,
          ...electricianInfo
        };
      });

      // 获取总数
      const countResult = await query(
        `SELECT COUNT(*) as total FROM users ${userWhereClause}`,
        userParams
      );

      res.success({
        electricians,
        total: countResult[0].total,
        page: parseInt(page),
        limit: parseInt(limit)
      });
    } catch (error) {
      console.error('获取电工列表错误:', error);
      res.error('获取电工列表失败');
    }
  }

  // 获取电工详情
  static async getElectricianDetail(req, res) {
    try {
      const { id } = req.params;

      const electricians = await query(
        `SELECT u.*, e.* 
         FROM users u 
         LEFT JOIN electricians e ON u.id = e.user_id 
         WHERE u.id = ?`,
        [id]
      );

      if (electricians.length === 0) {
        return res.error('电工不存在', 404);
      }

      res.success(electricians[0]);
    } catch (error) {
      console.error('获取电工详情错误:', error);
      res.error('获取电工详情失败');
    }
  }

  // 审核电工认证
  static async reviewElectrician(req, res) {
    try {
      const { id } = req.params;
      const { status, reason = '' } = req.body;

      await query(
        'UPDATE electricians SET certification_status = ?, reject_reason = ?, reviewed_at = NOW() WHERE user_id = ?',
        [status, reason, id]
      );

      res.success(null, '审核完成');
    } catch (error) {
      console.error('审核电工错误:', error);
      res.error('审核失败');
    }
  }

  // 获取工单列表
  static async getOrders(req, res) {
    try {
      const { page = 1, limit = 20, search = '', status = '', service_type = '' } = req.query;
      const offset = (page - 1) * limit;

      // 优化查询：先获取工单基础信息
      let whereClause = 'WHERE 1=1';
      const params = [];

      if (search && search.trim() !== '') {
        whereClause += ' AND order_no LIKE ?';
        params.push(`%${search}%`);
      }

      if (status && status.trim() !== '') {
        whereClause += ' AND status = ?';
        params.push(status);
      }

      if (service_type && service_type.trim() !== '') {
        whereClause += ' AND service_type_id = ?';
        params.push(service_type);
      }

      // 获取工单基础信息
      const orders = await query(
        `SELECT id, order_no, user_id, electrician_id, service_type_id, status, 
                final_amount, created_at, updated_at
         FROM orders ${whereClause} 
         ORDER BY created_at DESC 
         LIMIT ${parseInt(offset)}, ${parseInt(limit)}`,
        params
      );

      if (orders.length === 0) {
        return res.success({
          orders: [],
          total: 0,
          page: parseInt(page),
          limit: parseInt(limit)
        });
      }

      // 获取关联数据
      const userIds = [...new Set(orders.map(o => o.user_id).filter(Boolean))];
      const electricianIds = [...new Set(orders.map(o => o.electrician_id).filter(Boolean))];
      const serviceTypeIds = [...new Set(orders.map(o => o.service_type_id).filter(Boolean))];

      // 并行查询关联数据
      const [users, electricians, serviceTypes] = await Promise.all([
        userIds.length > 0 ? query(
          `SELECT id, nickname FROM users WHERE id IN (${userIds.map(() => '?').join(',')})`,
          userIds
        ) : [],
        electricianIds.length > 0 ? query(
          `SELECT id, nickname FROM users WHERE id IN (${electricianIds.map(() => '?').join(',')})`,
          electricianIds
        ) : [],
        serviceTypeIds.length > 0 ? query(
          `SELECT id, name FROM service_types WHERE id IN (${serviceTypeIds.map(() => '?').join(',')})`,
          serviceTypeIds
        ) : []
      ]);

      // 创建映射
      const userMap = new Map(users.map(u => [u.id, u.nickname]));
      const electricianMap = new Map(electricians.map(e => [e.id, e.nickname]));
      const serviceTypeMap = new Map(serviceTypes.map(st => [st.id, st.name]));

      // 合并数据
      const enrichedOrders = orders.map(order => ({
        ...order,
        user_nickname: userMap.get(order.user_id) || '',
        electrician_nickname: electricianMap.get(order.electrician_id) || '',
        service_type_name: serviceTypeMap.get(order.service_type_id) || ''
      }));

      // 获取总数
      const countResult = await query(
        `SELECT COUNT(*) as total FROM orders ${whereClause}`,
        params
      );

      res.success({
        orders: enrichedOrders,
        total: countResult[0].total,
        page: parseInt(page),
        limit: parseInt(limit)
      });
    } catch (error) {
      console.error('获取工单列表错误:', error);
      res.error('获取工单列表失败');
    }
  }

  // 获取工单详情
  static async getOrderDetail(req, res) {
    try {
      const { id } = req.params;

      const orders = await query(
        `SELECT o.*, u.nickname as user_nickname, u.phone as user_phone,
                e.nickname as electrician_nickname, e.phone as electrician_phone,
                st.name as service_type_name
         FROM orders o 
         LEFT JOIN users u ON o.user_id = u.id 
         LEFT JOIN users e ON o.electrician_id = e.id 
         LEFT JOIN service_types st ON o.service_type_id = st.id 
         WHERE o.id = ?`,
        [id]
      );

      if (orders.length === 0) {
        return res.error('工单不存在', 404);
      }

      res.success(orders[0]);
    } catch (error) {
      console.error('获取工单详情错误:', error);
      res.error('获取工单详情失败');
    }
  }

  // 更新工单状态
  static async updateOrderStatus(req, res) {
    try {
      const { id } = req.params;
      const { status, reason = '' } = req.body;

      await query(
        'UPDATE orders SET status = ?, admin_note = ?, updated_at = NOW() WHERE id = ?',
        [status, reason, id]
      );

      res.success(null, '工单状态更新成功');
    } catch (error) {
      console.error('更新工单状态错误:', error);
      res.error('更新失败');
    }
  }

  // 获取统计数据
  static async getStatistics(req, res) {
    try {
      // 用户统计
      const userStats = await query(
        `SELECT 
           COUNT(*) as total_users,
           COUNT(CASE WHEN status = 'active' THEN 1 END) as active_users,
           COUNT(CASE WHEN current_role = 'electrician' THEN 1 END) as electricians
         FROM users`
      );

      // 工单统计
      const orderStats = await query(
        `SELECT 
           COUNT(*) as total_orders,
           COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_orders,
           COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_orders,
           COUNT(CASE WHEN DATE(created_at) = CURDATE() THEN 1 END) as today_orders
         FROM orders`
      );

      // 收入统计
      const revenueStats = await query(
        `SELECT 
           COALESCE(SUM(final_amount), 0) as total_revenue,
           COALESCE(SUM(CASE WHEN DATE(created_at) = CURDATE() THEN final_amount ELSE 0 END), 0) as today_revenue,
           COALESCE(SUM(CASE WHEN YEARWEEK(created_at) = YEARWEEK(NOW()) THEN final_amount ELSE 0 END), 0) as week_revenue
         FROM orders WHERE status = 'completed'`
      );

      res.success({
        users: userStats[0],
        orders: orderStats[0],
        revenue: revenueStats[0]
      });
    } catch (error) {
      console.error('获取统计数据错误:', error);
      res.error('获取统计数据失败');
    }
  }

  // 获取系统通知列表
  static async getMessages(req, res) {
    try {
      const { page = 1, limit = 20, type = '', status = '' } = req.query;
      const offset = (page - 1) * limit;

      let whereClause = 'WHERE 1=1';
      const params = [];

      if (type && type.trim() !== '') {
        whereClause += ' AND type = ?';
        params.push(type);
      }

      if (status && status.trim() !== '') {
        whereClause += ' AND status = ?';
        params.push(status);
      }

      // 获取系统通知列表
      const messages = await query(
        `SELECT * FROM system_messages ${whereClause} 
         ORDER BY created_at DESC 
         LIMIT ${parseInt(offset)}, ${parseInt(limit)}`,
        params
      );

      const countResult = await query(
        `SELECT COUNT(*) as total FROM system_messages ${whereClause}`,
        params
      );

      res.success({
        messages,
        total: countResult[0].total,
        page: parseInt(page),
        limit: parseInt(limit)
      });
    } catch (error) {
      console.error('获取系统通知错误:', error);
      res.error('获取系统通知失败');
    }
  }

  // 发布系统通知
  static async createMessage(req, res) {
    try {
      const { title, content, target_users, type, priority, scheduled_at } = req.body;
      const adminId = req.user.id;

      // 处理scheduled_at空值，将空字符串转换为NULL
      const processedScheduledAt = scheduled_at && scheduled_at.trim() !== '' ? scheduled_at : null;

      const result = await query(
        `INSERT INTO system_messages 
         (title, content, target_users, type, priority, scheduled_at, created_by, published_at) 
         VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
        [title, content, target_users, type, priority, processedScheduledAt, adminId]
      );

      res.success({ id: result.insertId }, '通知发布成功');
    } catch (error) {
      console.error('发布系统通知错误:', error);
      res.error('发布失败');
    }
  }

  // 获取通知详情
  static async getMessageDetail(req, res) {
    try {
      const { id } = req.params;

      const messages = await query(
        'SELECT * FROM system_messages WHERE id = ?',
        [id]
      );

      if (messages.length === 0) {
        return res.error('通知不存在', 404);
      }

      res.success(messages[0]);
    } catch (error) {
      console.error('获取通知详情错误:', error);
      res.error('获取通知详情失败');
    }
  }

  // 更新通知
  static async updateMessage(req, res) {
    try {
      const { id } = req.params;
      const { title, content, target_users, type, priority, status } = req.body;

      await query(
        `UPDATE system_messages 
         SET title = ?, content = ?, target_users = ?, type = ?, priority = ?, status = ?, updated_at = NOW() 
         WHERE id = ?`,
        [title, content, target_users, type, priority, status, id]
      );

      res.success(null, '通知更新成功');
    } catch (error) {
      console.error('更新通知错误:', error);
      res.error('更新失败');
    }
  }

  // 删除通知
  static async deleteMessage(req, res) {
    try {
      const { id } = req.params;

      await query('DELETE FROM system_messages WHERE id = ?', [id]);

      res.success(null, '通知删除成功');
    } catch (error) {
      console.error('删除通知错误:', error);
      res.error('删除失败');
    }
  }
}

module.exports = AdminController;