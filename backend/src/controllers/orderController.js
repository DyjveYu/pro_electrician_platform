/**
 * 工单管理控制器
 * 处理工单的创建、查询、状态更新等操作
 */

const { Order, User, ServiceType, OrderStatusLog, Message, sequelize } = require('../models');
const { Op } = require('sequelize');
const AppError = require('../utils/AppError');

/**
 * 生成唯一订单号
 * 格式：WO + 时间戳 + 4位随机数
 * @returns {string} 订单号
 */
const generateOrderNo = () => {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `WO${timestamp}${random}`;
};

class OrderController {
  /**
   * 创建工单
   * @route POST /api/orders
   * @access 用户角色
   * @param {Object} req - 请求对象
   * @param {Object} res - 响应对象
   * @param {Function} next - 下一个中间件
   */
  static createOrder(req, res, next) {
    // 重写为标准异步实现，使用 async/await
    (async () => {
      try {
        if (!req.user) {
          return res.error('未认证用户', 401);
        }
        if (req.user.current_role !== 'user') {
          return res.error('只有用户角色可以创建工单', 403);
        }

        const {
          service_type_id,
          title,
          description,
          images = [],
          contact_name,
          contact_phone,
          service_address,
          latitude,
          longitude,
          expected_time,
          budget_min,
          budget_max
        } = req.body;

        const serviceType = await ServiceType.findByPk(service_type_id);
        if (!serviceType) {
          return res.error('服务类型不存在', 400);
        }

        const order_no = generateOrderNo();
        const order = await sequelize.transaction(async (t) => {
          const created = await Order.create({
            order_no,
            user_id: req.user.id,
            service_type_id,
            title,
            description,
            images,
            contact_name,
            contact_phone,
            service_address: service_address,
            latitude,
            longitude,
            estimated_amount: budget_max || budget_min || 0,
            status: 'pending'
          }, { transaction: t });

          await OrderStatusLog.create({
            order_id: created.id,
            to_status: 'pending',
            operator_id: req.user.id,
            operator_type: 'user',
            remark: '工单创建成功'
          }, { transaction: t });

          await Message.create({
            user_id: req.user.id,
            title: '工单创建成功',
            content: `您的工单 ${created.order_no} 已创建成功，等待电工接单。`,
            type: 'order',
            related_id: created.id,
            to_status: 'unread'
          }, { transaction: t });

          return created;
        });

        return res.success({
          message: '工单创建成功',
          id: order.id,
          order_no: order.order_no
        });
      } catch (error) {
        next(error);
      }
    })();
  }

  /**
   * 获取工单列表
   * @route GET /api/orders
   * @access 所有已登录用户
   * @param {Object} req - 请求对象
   * @param {Object} res - 响应对象
   * @param {Function} next - 下一个中间件
   */
  static async getOrderList(req, res, next) {
    try {
      const userId = req.user.id;
      const userRole = req.user.current_role;
      const {
        page = 1,
        limit = 20,
        status,
        service_type_id,
        search,
        latitude,
        longitude,
        distance = 1000,
        my_orders = false
      } = req.query;

      // 构建查询条件
      const where = {};
      const pageNumber = parseInt(page);
      const pageSize = parseInt(limit);
      
      // 根据用户角色设置查询条件
      if (my_orders === 'true' || my_orders === true) {
        if (userRole === 'user') {
          where.user_id = userId;
        } else if (userRole === 'electrician') {
          where.electrician_id = userId;
        }
      } else if (userRole === 'electrician') {
        // 电工默认只能看到待接单的工单
        where.status = 'pending';
        where.electrician_id = null;
      }

      // 按状态筛选
      if (status) {
        where.status = status;
      }

      // 按服务类型筛选
      if (service_type_id) {
        where.service_type_id = parseInt(service_type_id);
      }

      // 按关键词搜索
      if (search) {
        where[sequelize.Op.or] = [
          { title: { [sequelize.Op.like]: `%${search}%` } },
          { description: { [sequelize.Op.like]: `%${search}%` } },
          { order_no: { [sequelize.Op.like]: `%${search}%` } }
        ];
      }

      // 按地理位置筛选（如果提供了坐标）
      let geoFilter = {};
      if (latitude && longitude && distance) {
        // 这里可以根据实际需求实现地理位置筛选
        // 简化处理，实际应使用地理空间查询
      }

      // 执行分页查询
      const { count, rows } = await Order.findAndCountAll({
        where: { ...where, ...geoFilter },
        include: [
          { model: User, as: 'user', attributes: ['id', 'nickname', 'avatar'] },
          { model: User, as: 'electrician', attributes: ['id', 'nickname', 'avatar'] },
          { model: ServiceType, as: 'serviceType' }
        ],
        order: [['created_at', 'DESC']],
        limit: pageSize,
        offset: (pageNumber - 1) * pageSize
      });

      // 处理图片字段
      const orders = rows.map(order => {
        const plainOrder = order.get({ plain: true });
        try {
          // 如果 images 字段存在且不为空，则进行 JSON 解析
          plainOrder.images = plainOrder.images ? JSON.parse(plainOrder.images) : [];
        } catch (error) {
          // 解析失败时设置为空数组并记录日志
          console.error(`Order ${plainOrder.id} has invalid images JSON: ${plainOrder.images}`);
          plainOrder.images = [];
        }
        return plainOrder;
      });

      // 返回分页结果
      res.success({
        total: count,
        page: pageNumber,
        limit: pageSize,
        pages: Math.ceil(count / pageSize),
        list: orders
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 获取工单详情
   * @route GET /api/orders/:id
   * @access 所有已登录用户
   * @param {Object} req - 请求对象
   * @param {Object} res - 响应对象
   * @param {Function} next - 下一个中间件
   */
  static async getOrderDetail(req, res, next) {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const userRole = req.user.current_role;
      
      // 查询工单详情（包含关联数据）
      const order = await Order.findByPk(id, {
        include: [
          { model: User, as: 'user', attributes: ['id', 'nickname', 'avatar', 'phone'] },
          { model: User, as: 'electrician', attributes: ['id', 'nickname', 'avatar', 'phone'] },
          { model: ServiceType, as: 'serviceType' },
          { model: OrderStatusLog, as: 'statusLogs', include: [
            { model: User, as: 'operator', attributes: ['id', 'username'] }
          ]}
        ]
      });

      // 检查工单是否存在
      if (!order) {
        throw new AppError('工单不存在', 404);
      }

      // 权限检查
      if (userRole === 'user' && order.user_id !== userId) {
        throw new AppError('无权查看此工单', 403);
      }
      
      if (userRole === 'electrician' && 
          order.electrician_id !== userId && 
          order.status !== 'pending') {
        throw new AppError('无权查看此工单', 403);
      }

      // 处理图片字段
      const orderData = order.get({ plain: true });
      orderData.images = orderData.images ? JSON.parse(orderData.images) : [];
      if (orderData.repair_images) {
        orderData.repair_images = JSON.parse(orderData.repair_images);
      }

      res.success({ order: orderData });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 电工抢单
   * @route POST /api/orders/:id/take
   * @access 电工角色
   * @param {Object} req - 请求对象
   * @param {Object} res - 响应对象
   * @param {Function} next - 下一个中间件
   */
  static async takeOrder(req, res, next) {
    try {
      const { id } = req.params;
      const { quoted_price } = req.body;
      const electricianId = req.user.id;
      const now = new Date();

      // 验证电工角色
      if (req.user.current_role !== 'electrician') {
        throw new AppError('只有电工可以抢单', 403);
      }

      // 验证电工认证状态
      const electrician = await User.findByPk(electricianId);
      if (!electrician || electrician.status !== 'active') {
        throw new AppError('您的账号未激活，无法接单', 403);
      }

      // 查询工单
      const order = await Order.findByPk(id);
      if (!order) {
        throw new AppError('工单不存在', 404);
      }

      // 验证工单状态
      if (order.status !== 'pending') {
        throw new AppError(`工单当前状态为 ${order.status}，无法接单`, 400);
      }

      // 使用事务更新工单状态
      await sequelize.transaction(async (t) => {
        // 准备更新数据
        const updateData = {
          electrician_id: electricianId,
          status: 'accepted',
          accepted_at: now
        };
        
        // 如果提供了报价，则添加到更新数据中
        if (quoted_price !== undefined) {
          updateData.quoted_price = parseFloat(quoted_price);
        }
        
        // 更新工单
        await order.update(updateData, { transaction: t });

        // 创建状态日志
        await OrderStatusLog.create({
          order_id: order.id,
          to_status: 'accepted',
          operator_id: electricianId,
          operator_type: 'electrician',
          remark: `电工接单，报价: ¥${quoted_price}`,
          created_at: now
        }, { transaction: t });

        // 创建消息通知用户
        await Message.create({
          user_id: order.user_id,
          title: '工单已被接单',
          content: `您的工单 ${order.order_no} 已被电工接单，报价: ¥${quoted_price}`,
          type: 'order',
          reference_id: order.id,
          is_read: false,
          created_at: now
        }, { transaction: t });
      });

      res.success({
        message: '抢单成功，等待用户确认'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 完成工单
   * @route POST /api/orders/:id/complete
   * @access 电工角色
   * @param {Object} req - 请求对象
   * @param {Object} res - 响应对象
   * @param {Function} next - 下一个中间件
   */
  static async completeOrder(req, res, next) {
    try {
      const { id } = req.params;
      const { repair_content, final_amount, repair_images = [] } = req.body;
      const electricianId = req.user.id;
      const now = new Date();

      // 验证电工角色
      if (req.user.current_role !== 'electrician') {
        throw new AppError('只有电工可以完成工单', 403);
      }

      // 查询工单
      const order = await Order.findByPk(id);
      if (!order) {
        throw new AppError('工单不存在', 404);
      }

      // 验证是否是工单的电工
      if (order.electrician_id !== electricianId) {
        throw new AppError('无权操作此工单', 403);
      }

      // 验证工单状态
      const validStatuses = ['accepted', 'confirmed', 'in_progress'];
      if (!validStatuses.includes(order.status)) {
        throw new AppError(`工单当前状态为 ${order.status}，无法完成`, 400);
      }

      // 使用事务更新工单状态
      await sequelize.transaction(async (t) => {
        // 更新工单
        await order.update({
          status: 'completed',
          completed_at: now,
          repair_content,
          final_amount: parseFloat(final_amount),
          repair_images: JSON.stringify(repair_images)
        }, { transaction: t });

        // 创建状态日志
        await OrderStatusLog.create({
          order_id: order.id,
          status: 'completed',
          operator_id: electricianId,
          operator_role: 'electrician',
          remark: `电工完成服务，最终金额: ¥${final_amount}`,
          created_at: now
        }, { transaction: t });

        // 创建消息通知用户
        await Message.create({
          user_id: order.user_id,
          title: '工单已完成',
          content: `您的工单 ${order.order_no} 已由电工完成服务，请确认并支付`,
          type: 'order',
          reference_id: order.id,
          is_read: false,
          created_at: now
        }, { transaction: t });
      });

      res.success({
        message: '工单已完成，等待用户确认'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 取消工单
   * @route POST /api/orders/:id/cancel
   * @access 用户、电工角色
   * @param {Object} req - 请求对象
   * @param {Object} res - 响应对象
   * @param {Function} next - 下一个中间件
   */
  static async cancelOrder(req, res, next) {
    try {
      const { id } = req.params;
      const { cancel_reason } = req.body;
      const userId = req.user.id;
      const now = new Date();

      // 验证用户角色
      if (req.user.current_role !== 'user') {
        throw new AppError('只有用户可以取消工单', 403);
      }

      // 查询工单
      const order = await Order.findByPk(id);
      if (!order) {
        throw new AppError('工单不存在', 404);
      }

      // 验证是否是工单的用户
      if (order.user_id !== userId) {
        throw new AppError('无权操作此工单', 403);
      }

      // 验证工单状态
      const validStatuses = ['pending', 'accepted'];
      if (!validStatuses.includes(order.status)) {
        throw new AppError(`工单当前状态为 ${order.status}，无法取消`, 400);
      }

      // 使用事务更新工单状态
      await sequelize.transaction(async (t) => {
        // 更新工单
        await order.update({
          status: 'cancelled',
          cancelled_at: now,
          cancel_reason
        }, { transaction: t });

        // 创建状态日志
        await OrderStatusLog.create({
          order_id: order.id,
          status: 'cancelled',
          operator_id: userId,
          operator_role: 'user',
          remark: `用户取消工单，原因: ${cancel_reason}`,
          created_at: now
        }, { transaction: t });

        // 如果已有电工接单，则通知电工
        if (order.electrician_id) {
          await Message.create({
            user_id: order.electrician_id,
            title: '工单已取消',
            content: `工单 ${order.order_no} 已被用户取消，原因: ${cancel_reason}`,
            type: 'order',

            created_at: now
          }, { transaction: t });
        }
      });

      res.success({
        message: '工单已取消'
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * 用户确认工单
   * @route PUT /api/orders/:id/confirm
   * @access 用户角色
   * @param {Object} req - 请求对象
   * @param {Object} res - 响应对象
   * @param {Function} next - 下一个中间件
   */
  static async confirmOrder(req, res, next) {
    (async () => {
      try {
        const { id } = req.params;
        const { confirmed } = req.body;
        
        // 确保用户已登录且为用户角色
        if (!req.user) {
          return res.error('未认证用户', 401);
        }
        if (req.user.current_role !== 'user') {
          return res.error('只有用户角色可以确认工单', 403);
        }
        
        // 查找工单
        const order = await Order.findByPk(id);
        if (!order) {
          return res.error('工单不存在', 404);
        }
        
        // 验证工单所有权
        if (order.user_id !== req.user.id) {
          return res.error('无权操作此工单', 403);
        }
        
        // 验证工单状态
        if (order.status !== 'accepted') {
          return res.error('只有已接单状态的工单可以确认', 400);
        }
        
        // 开始事务
        const transaction = await sequelize.transaction();
        
        try {
          // 更新工单状态为进行中
          await order.update({
            status: 'in_progress',
            confirmed_at: new Date()
          }, { transaction });
          
          // 记录状态变更日志
          await OrderStatusLog.create({
            order_id: order.id,
            from_status: 'accepted',
            to_status: 'in_progress',
            operator_id: req.user.id,
            operator_type: 'user',
            operator_role: 'user',
            remark: '用户确认工单，开始服务'
          }, { transaction });
          
          // 提交事务
          await transaction.commit();
          
          return res.success({
            message: '工单确认成功',
            order_id: order.id
          });
        } catch (error) {
          // 回滚事务
          await transaction.rollback();
          throw error;
        }
      } catch (error) {
        next(error);
      }
    })();
  }

  /**
   * 电工修改订单内容和金额
   * @route PUT /api/orders/:id/update
   * @access 电工角色
   * @param {Object} req - 请求对象
   * @param {Object} res - 响应对象
   * @param {Function} next - 下一个中间件
   */
  static async updateOrderByElectrician(req, res, next) {
    try {
      const { id } = req.params;
      const { title, description, amount, remark } = req.body;
      
      // 确保用户已登录且为电工角色
      if (!req.user) {
        return res.error('未认证用户', 401);
      }
      if (req.user.current_role !== 'electrician') {
        return res.error('只有电工角色可以修改订单', 403);
      }
      
      // 查找工单
      const order = await Order.findByPk(id);
      if (!order) {
        return res.error('工单不存在', 404);
      }
      
      // 验证电工是否为该工单的负责人
      if (order.electrician_id !== req.user.id) {
        return res.error('您不是该工单的负责电工', 403);
      }
      
      // 验证工单状态
      if (order.status !== 'in_progress') {
        return res.error('只有进行中状态的工单可以修改', 400);
      }
      
      // 开始事务
      const transaction = await sequelize.transaction();
      
      try {
        // 更新工单信息
        const updateData = {};
        if (title) updateData.title = title;
        if (description) updateData.description = description;
        if (amount !== undefined) updateData.amount = amount;
        
        // 标记为需要用户确认
        updateData.needs_confirmation = true;
        updateData.last_modified_at = new Date();
        
        await order.update(updateData, { transaction });
        
        // 记录修改日志
        await OrderStatusLog.create({
          order_id: order.id,
          from_status: 'in_progress',
          to_status: 'in_progress',
          operator_id: req.user.id,
          operator_type: 'electrician',
          operator_role: 'electrician',
          remark: remark || '电工修改了订单内容和金额'
        }, { transaction });
        
        // 提交事务
        await transaction.commit();
        
        return res.success({
          message: '订单修改成功，等待用户确认',
          order_id: order.id
        });
      } catch (error) {
        // 回滚事务
        await transaction.rollback();
        throw error;
      }
    } catch (error) {
      next(error);
    }
  }

  /**
   * 用户确认订单内容和金额
   * @route POST /api/orders/:id/confirm-update
   * @access 用户角色
   * @param {Object} req - 请求对象
   * @param {Object} res - 响应对象
   * @param {Function} next - 下一个中间件
   */
  static async confirmOrderUpdate(req, res, next) {
    try {
      const { id } = req.params;
      
      // 确保用户已登录且为用户角色
      if (!req.user) {
        return res.error('未认证用户', 401);
      }
      if (req.user.current_role !== 'user') {
        return res.error('只有用户角色可以确认订单修改', 403);
      }
      
      // 查找工单
      const order = await Order.findByPk(id);
      if (!order) {
        return res.error('工单不存在', 404);
      }
      
      // 验证工单所有权
      if (order.user_id !== req.user.id) {
        return res.error('无权操作此工单', 403);
      }
      
      // 验证工单状态
      if (order.status !== 'in_progress') {
        return res.error('只有进行中状态的工单可以确认修改', 400);
      }
      
      // 验证是否需要确认
      if (!order.needs_confirmation) {
        return res.error('当前订单没有待确认的修改', 400);
      }
      
      // 开始事务
      const transaction = await sequelize.transaction();
      
      try {
        // 更新工单状态
        await order.update({
          needs_confirmation: false,
          confirmed_at: new Date()
        }, { transaction });
        
        // 记录状态变更日志
        await OrderStatusLog.create({
          order_id: order.id,
          from_status: 'in_progress',
          to_status: 'in_progress',
          operator_id: req.user.id,
          operator_type: 'user',
          operator_role: 'user',
          remark: '用户确认了订单修改'
        }, { transaction });
        
        // 提交事务
        await transaction.commit();
        
        return res.success({
          message: '订单修改确认成功',
          order_id: order.id
        });
      } catch (error) {
        // 回滚事务
        await transaction.rollback();
        throw error;
      }
    } catch (error) {
      next(error);
    }
  }

  /**
   * 发起取消订单
   * @route POST /api/orders/:id/initiate-cancel
   * @access 用户、电工角色
   * @param {Object} req - 请求对象
   * @param {Object} res - 响应对象
   * @param {Function} next - 下一个中间件
   */
  static async initiateCancelOrder(req, res, next) {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      
      // 确保用户已登录
      if (!req.user) {
        return res.error('未认证用户', 401);
      }
      
      // 验证用户角色
      if (!['user', 'electrician'].includes(req.user.current_role)) {
        return res.error('无权操作', 403);
      }
      
      // 查找工单
      const order = await Order.findByPk(id);
      if (!order) {
        return res.error('工单不存在', 404);
      }
      
      // 验证操作权限
      if (req.user.current_role === 'user' && order.user_id !== req.user.id) {
        return res.error('无权操作此工单', 403);
      }
      
      if (req.user.current_role === 'electrician' && order.electrician_id !== req.user.id) {
        return res.error('无权操作此工单', 403);
      }
      
      // 验证工单状态
      if (order.status !== 'in_progress') {
        return res.error('只有进行中状态的工单可以发起取消', 400);
      }
      
      // 检查是否已经有取消请求
      if (order.cancel_initiated) {
        return res.error('该工单已有取消请求，等待对方确认', 400);
      }
      
      // 开始事务
      const transaction = await sequelize.transaction();
      
      try {
        // 更新工单状态
        await order.update({
          cancel_initiated: true,
          cancel_initiator: req.user.current_role,
          cancel_reason: reason,
          cancel_initiated_at: new Date()
        }, { transaction });
        
        // 记录状态变更日志
        await OrderStatusLog.create({
          order_id: order.id,
          from_status: 'in_progress',
          to_status: 'in_progress',
          operator_id: req.user.id,
          operator_type: req.user.current_role,
          operator_role: req.user.current_role,
          remark: `${req.user.current_role === 'user' ? '用户' : '电工'}发起取消订单请求：${reason}`
        }, { transaction });
        
        // 提交事务
        await transaction.commit();
        
        return res.success({
          message: '取消订单请求已发起，等待对方确认',
          order_id: order.id
        });
      } catch (error) {
        // 回滚事务
        await transaction.rollback();
        throw error;
      }
    } catch (error) {
      next(error);
    }
  }

  /**
   * 确认取消订单
   * @route POST /api/orders/:id/confirm-cancel
   * @access 用户、电工角色
   * @param {Object} req - 请求对象
   * @param {Object} res - 响应对象
   * @param {Function} next - 下一个中间件
   */
  static async confirmCancelOrder(req, res, next) {
    try {
      const { id } = req.params;
      
      // 确保用户已登录
      if (!req.user) {
        return res.error('未认证用户', 401);
      }
      
      // 验证用户角色
      if (!['user', 'electrician'].includes(req.user.current_role)) {
        return res.error('无权操作', 403);
      }
      
      // 查找工单
      const order = await Order.findByPk(id);
      if (!order) {
        return res.error('工单不存在', 404);
      }
      
      // 验证操作权限
      if (req.user.current_role === 'user' && order.user_id !== req.user.id) {
        return res.error('无权操作此工单', 403);
      }
      
      if (req.user.current_role === 'electrician' && order.electrician_id !== req.user.id) {
        return res.error('无权操作此工单', 403);
      }
      
      // 验证工单状态
      if (order.status !== 'in_progress') {
        return res.error('只有进行中状态的工单可以确认取消', 400);
      }
      
      // 检查是否有取消请求
      if (!order.cancel_initiated) {
        return res.error('该工单没有待确认的取消请求', 400);
      }
      
      // 验证确认方不是发起方
      if (order.cancel_initiator === req.user.current_role) {
        return res.error('您是取消请求的发起方，无需再次确认', 400);
      }
      
      // 开始事务
      const transaction = await sequelize.transaction();
      
      try {
        // 更新工单状态为已取消
        await order.update({
          status: 'cancelled',
          cancel_confirmed: true,
          cancel_confirmed_at: new Date(),
          cancel_confirmer: req.user.current_role
        }, { transaction });
        
        // 记录状态变更日志
        await OrderStatusLog.create({
          order_id: order.id,
          from_status: 'in_progress',
          to_status: 'cancelled',
          operator_id: req.user.id,
          operator_type: req.user.current_role,
          operator_role: req.user.current_role,
          remark: `${req.user.current_role === 'user' ? '用户' : '电工'}确认取消订单`
        }, { transaction });
        
        // 提交事务
        await transaction.commit();
        
        return res.success({
          message: '订单已成功取消',
          order_id: order.id
        });
      } catch (error) {
        // 回滚事务
        await transaction.rollback();
        throw error;
      }
    } catch (error) {
      next(error);
    }
  }
}

module.exports = OrderController;