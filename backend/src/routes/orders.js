/**
 * 工单管理路由
 * 处理工单的创建、查询、状态更新等操作的路由配置
 */

const express = require('express');
const router = express.Router();
const OrderController = require('../controllers/orderController');
const validate = require('../middleware/validation');
const { authenticateToken, requireRole } = require('../middleware/auth');
const rateLimiter = require('../middleware/rateLimiter');
const orderSchemas = require('../schemas/orderSchemas');

/**
 * @path /api/orders
 * @desc 创建工单
 * @access 用户
 */
router.post(
  '/',
  authenticateToken,
  requireRole(['user']),
  rateLimiter({ windowMs: 60000, max: 5 }), // 每分钟最多5次
  validate(orderSchemas.createOrder),
  OrderController.createOrder
);

/**
 * @path /api/orders
 * @desc 获取工单列表
 * @access 用户、电工
 */
router.get(
  '/',
  authenticateToken,
  requireRole(['user', 'electrician', 'admin']),
  validate(orderSchemas.getOrdersList, 'query'),
  OrderController.getOrderList
);

/**
 * @path /api/orders/:id
 * @desc 获取工单详情
 * @access 用户、电工
 */
router.get(
  '/:id',
  authenticateToken,
  requireRole(['user', 'electrician', 'admin']),
  validate(orderSchemas.getOrderDetail, 'params'),
  OrderController.getOrderDetail
);

/**
 * @path /api/orders/:id/take
 * @desc 电工抢单
 * @access 电工
 */
router.post(
  '/:id/take',
  authenticateToken,
  requireRole(['electrician']),
  rateLimiter({ windowMs: 60000, max: 10 }), // 每分钟最多10次
  validate(orderSchemas.takeOrder),
  OrderController.takeOrder
);

/**
 * @path /api/orders/:id/complete
 * @desc 完成工单
 * @access 电工
 */
router.post(
  '/:id/complete',
  authenticateToken,
  requireRole(['electrician']),
  validate(orderSchemas.completeOrder),
  OrderController.completeOrder
);

/**
 * @path /api/orders/:id/cancel
 * @desc 取消工单
 * @access 用户、电工
 */
router.post(
  '/:id/cancel',
  authenticateToken,
  requireRole(['user', 'electrician', 'admin']),
  validate(orderSchemas.cancelOrder),
  OrderController.cancelOrder
);

module.exports = router;