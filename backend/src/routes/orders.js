/**
 * 工单路由
 * 定义工单创建、查询、抢单、状态管理等API端点
 */

const express = require('express');
const router = express.Router();
const OrderController = require('../controllers/orderController');
const validate = require('../middleware/validation');
const schemas = validate.schemas;
const { authenticateToken, requireRole } = require('../middleware/auth');
const rateLimiter = require('../middleware/rateLimiter');

// 创建工单 - 限流：每分钟最多5次
router.post('/',
  rateLimiter('create_order', 5, 60),
  authenticateToken,
  requireRole('user'),
  validate(schemas.createOrder),
  OrderController.createOrder
);

// 获取工单列表
router.get('/',
  authenticateToken,
  validate(schemas.getOrderList, 'query'),
  OrderController.getOrderList
);

// 获取工单详情
router.get('/:id',
  authenticateToken,
  validate(schemas.getOrderDetail, 'params'),
  OrderController.getOrderDetail
);

// 电工抢单 - 限流：每分钟最多10次
router.post('/:id/take',
  rateLimiter('take_order', 10, 60),
  authenticateToken,
  requireRole('electrician'),
  validate(schemas.takeOrder, 'body'),
  OrderController.takeOrder
);

// 用户确认工单
router.post('/:id/confirm',
  authenticateToken,
  requireRole('user'),
  validate(schemas.confirmOrder, 'params'),
  OrderController.confirmOrder
);

// 开始服务
router.post('/:id/start',
  authenticateToken,
  requireRole('electrician'),
  validate(schemas.startService, 'params'),
  OrderController.startService
);

// 完成服务
router.post('/:id/complete',
  authenticateToken,
  requireRole('electrician'),
  validate(schemas.completeService, 'body'),
  OrderController.completeService
);

// 取消工单
router.post('/:id/cancel',
  authenticateToken,
  requireRole('user'),
  validate(schemas.cancelOrder, 'body'),
  OrderController.cancelOrder
);

// 获取工单统计
router.get('/stats/summary',
  authenticateToken,
  OrderController.getOrderStats
);

// 更新工单状态（管理员用）
router.put('/:id/status',
  authenticateToken,
  // requireRole('admin'), // 暂时注释，后续添加管理员认证
  validate(schemas.updateOrderStatus, 'body'),
  OrderController.updateOrderStatus
);

module.exports = router;