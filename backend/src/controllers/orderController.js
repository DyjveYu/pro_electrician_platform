/**
 * 工单控制器
 * 处理工单创建、查询、抢单、状态管理等功能
 */

const WorkOrder = require('../models/WorkOrder');
const User = require('../models/User');

class OrderController {
  /**
   * 创建工单
   */
  static async createOrder(req, res, next) {
    try {
      const userId = req.user.id;
      const {
        service_type_id,
        title,
        description,
        images = [],
        contact_name,
        contact_phone,
        address,
        latitude,
        longitude,
        expected_time,
        budget_min,
        budget_max
      } = req.body;

      // 验证用户角色
      if (req.user.current_role !== 'user') {
        return res.error('只有用户角色可以创建工单', 403);
      }

      // 验证必填字段
      if (!service_type_id || !title || !contact_name || !contact_phone || !address) {
        return res.error('请填写完整的工单信息', 400);
      }

      // 验证坐标
      if (!latitude || !longitude) {
        return res.error('请提供准确的地址坐标', 400);
      }

      // 验证预算范围
      if (budget_min && budget_max && budget_min > budget_max) {
        return res.error('最低预算不能大于最高预算', 400);
      }

      const orderData = {
        user_id: userId,
        service_type_id,
        title,
        description,
        images: JSON.stringify(images),
        contact_name,
        contact_phone,
        address,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        expected_time,
        budget_min: budget_min ? parseFloat(budget_min) : null,
        budget_max: budget_max ? parseFloat(budget_max) : null
      };

      const order = await WorkOrder.create(orderData);

      res.success({
        message: '工单创建成功',
        order
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 获取工单列表
   */
  static async getOrderList(req, res, next) {
    try {
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

      const options = {
        page: parseInt(page),
        limit: parseInt(limit),
        status,
        service_type_id: service_type_id ? parseInt(service_type_id) : undefined,
        search,
        latitude: latitude ? parseFloat(latitude) : undefined,
        longitude: longitude ? parseFloat(longitude) : undefined,
        distance: parseInt(distance)
      };

      // 如果是查看我的工单
      if (my_orders === 'true') {
        if (req.user.current_role === 'user') {
          options.user_id = req.user.id;
        } else if (req.user.current_role === 'electrician') {
          options.electrician_id = req.user.id;
        }
      } else {
        // 电工查看可接单的工单（pending状态）
        if (req.user.current_role === 'electrician') {
          options.status = 'pending';
        }
      }

      const result = await WorkOrder.getList(options);

      // 处理图片字段
      result.list = result.list.map(order => ({
        ...order,
        images: order.images ? JSON.parse(order.images) : []
      }));

      res.success(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * 获取工单详情
   */
  static async getOrderDetail(req, res, next) {
    try {
      const { id } = req.params;
      
      const order = await WorkOrder.findById(id);
      if (!order) {
        return res.error('工单不存在', 404);
      }

      // 权限检查：用户只能查看自己的工单，电工只能查看自己接的工单或pending状态的工单
      const userId = req.user.id;
      const userRole = req.user.current_role;
      
      if (userRole === 'user' && order.user_id !== userId) {
        return res.error('无权限查看此工单', 403);
      }
      
      if (userRole === 'electrician' && 
          order.electrician_id !== userId && 
          order.status !== 'pending') {
        return res.error('无权限查看此工单', 403);
      }

      // 处理图片字段
      order.images = order.images ? JSON.parse(order.images) : [];

      res.success({ order });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 电工抢单
   */
  static async takeOrder(req, res, next) {
    try {
      const { id } = req.params;
      const { quoted_price } = req.body;
      const electricianId = req.user.id;

      // 验证电工角色
      if (req.user.current_role !== 'electrician') {
        return res.error('只有电工可以抢单', 403);
      }

      // 验证电工认证状态
      const canWork = await User.canSwitchToElectrician(electricianId);
      if (!canWork) {
        return res.error('您还未通过电工认证，无法接单', 403);
      }

      // 验证报价
      if (!quoted_price || quoted_price <= 0) {
        return res.error('请输入有效的报价', 400);
      }

      await WorkOrder.takeOrder(id, electricianId, parseFloat(quoted_price));

      res.success({
        message: '抢单成功，等待用户确认'
      });
    } catch (error) {
      if (error.message.includes('工单') || error.message.includes('状态') || error.message.includes('接取')) {
        return res.error(error.message, 400);
      }
      next(error);
    }
  }

  /**
   * 用户确认工单
   */
  static async confirmOrder(req, res, next) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      // 验证用户角色
      if (req.user.current_role !== 'user') {
        return res.error('只有用户可以确认工单', 403);
      }

      await WorkOrder.confirmOrder(id, userId);

      res.success({
        message: '工单确认成功，电工可以开始服务'
      });
    } catch (error) {
      if (error.message.includes('工单') || error.message.includes('权限') || error.message.includes('状态')) {
        return res.error(error.message, 400);
      }
      next(error);
    }
  }

  /**
   * 开始服务
   */
  static async startService(req, res, next) {
    try {
      const { id } = req.params;
      const electricianId = req.user.id;

      // 验证电工角色
      if (req.user.current_role !== 'electrician') {
        return res.error('只有电工可以开始服务', 403);
      }

      await WorkOrder.startService(id, electricianId);

      res.success({
        message: '服务已开始'
      });
    } catch (error) {
      if (error.message.includes('工单') || error.message.includes('权限') || error.message.includes('状态')) {
        return res.error(error.message, 400);
      }
      next(error);
    }
  }

  /**
   * 完成服务
   */
  static async completeService(req, res, next) {
    try {
      const { id } = req.params;
      const { completion_notes, completion_images = [] } = req.body;
      const electricianId = req.user.id;

      // 验证电工角色
      if (req.user.current_role !== 'electrician') {
        return res.error('只有电工可以完成服务', 403);
      }

      const completionData = {
        completion_notes,
        completion_images: JSON.stringify(completion_images)
      };

      await WorkOrder.completeService(id, electricianId, completionData);

      res.success({
        message: '服务已完成，等待用户确认'
      });
    } catch (error) {
      if (error.message.includes('工单') || error.message.includes('权限') || error.message.includes('状态')) {
        return res.error(error.message, 400);
      }
      next(error);
    }
  }

  /**
   * 取消工单
   */
  static async cancelOrder(req, res, next) {
    try {
      const { id } = req.params;
      const { reason = '' } = req.body;
      const userId = req.user.id;

      // 验证用户角色
      if (req.user.current_role !== 'user') {
        return res.error('只有用户可以取消工单', 403);
      }

      await WorkOrder.cancelOrder(id, userId, reason);

      res.success({
        message: '工单已取消'
      });
    } catch (error) {
      if (error.message.includes('工单') || error.message.includes('权限') || error.message.includes('状态')) {
        return res.error(error.message, 400);
      }
      next(error);
    }
  }

  /**
   * 获取工单统计
   */
  static async getOrderStats(req, res, next) {
    try {
      const userId = req.user.id;
      const userRole = req.user.current_role;
      const { date_range } = req.query;

      const options = {};
      
      if (userRole === 'user') {
        options.user_id = userId;
      } else if (userRole === 'electrician') {
        options.electrician_id = userId;
      }

      if (date_range) {
        try {
          const range = JSON.parse(date_range);
          options.date_range = range;
        } catch (e) {
          // 忽略无效的日期范围
        }
      }

      const stats = await WorkOrder.getStats(options);

      res.success({ stats });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 更新工单状态（管理员用）
   */
  static async updateOrderStatus(req, res, next) {
    try {
      const { id } = req.params;
      const { status, notes } = req.body;

      // 验证状态值
      const validStatuses = ['pending', 'accepted', 'confirmed', 'in_progress', 'completed', 'cancelled'];
      if (!validStatuses.includes(status)) {
        return res.error('无效的状态值', 400);
      }

      const updateData = {};
      if (notes) {
        updateData.admin_notes = notes;
      }

      const success = await WorkOrder.updateStatus(id, status, updateData);
      
      if (success) {
        res.success({
          message: '工单状态更新成功'
        });
      } else {
        res.error('工单不存在或更新失败', 404);
      }
    } catch (error) {
      next(error);
    }
  }
}

module.exports = OrderController;