/**
 * 参数验证中间件
 */

const Joi = require('joi');

/**
 * 验证请求参数
 * @param {Object} schema - Joi验证模式
 * @returns {Function} Express中间件函数
 */
const validate = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false, // 返回所有错误
      stripUnknown: true, // 移除未定义字段
      convert: true      // 自动类型转换
    });

    if (error) {
      const messages = error.details.map(d => d.message).join('; ');
      return res.error(messages, 422);
    }

    // 将验证后的值赋值给req.body
    req.body = value;
    next();
  };
};

// 常用验证模式
const schemas = {
  // 发送验证码
  sendCode: Joi.object({
    phone: Joi.string().pattern(/^1[3-9]\d{9}$/).required().messages({
      'string.pattern.base': '手机号格式不正确'
    }),
    type: Joi.string().valid('login', 'register', 'reset_password').default('login')
  }),

  // 用户登录
  login: Joi.object({
    phone: Joi.string().pattern(/^1[3-9]\d{9}$/).required().messages({
      'string.pattern.base': '手机号格式不正确'
    }),
    code: Joi.string().length(6).pattern(/^\d{6}$/).required().messages({
      'string.length': '验证码必须是6位数字',
      'string.pattern.base': '验证码必须是6位数字'
    })
  }),

  // 更新用户信息
  updateProfile: Joi.object({
    nickname: Joi.string().min(1).max(50).optional(),
    avatar: Joi.string().uri().optional().allow('')
  }).min(1),

  // 切换角色
  switchRole: Joi.object({
    role: Joi.string().valid('user', 'electrician').required()
  }),

  // 创建工单
  createOrder: {
    body: Joi.object({
      service_type_id: Joi.number().integer().positive().required(),
      title: Joi.string().min(1).max(100).required(),
      description: Joi.string().max(1000).optional().allow(''),
      images: Joi.array().items(Joi.string().uri()).max(10).optional(),
      contact_name: Joi.string().min(1).max(50).required(),
      contact_phone: Joi.string().pattern(/^1[3-9]\d{9}$/).required(),
      address: Joi.string().min(1).max(200).required(),
      latitude: Joi.number().min(-90).max(90).required(),
      longitude: Joi.number().min(-180).max(180).required(),
      expected_time: Joi.date().iso().greater('now').optional(),
      budget_min: Joi.number().positive().optional(),
      budget_max: Joi.number().positive().optional()
    })
  },

  // 获取工单列表
  getOrderList: {
    query: Joi.object({
      page: Joi.number().integer().min(1).optional(),
      limit: Joi.number().integer().min(1).max(100).optional(),
      status: Joi.string().valid('pending', 'accepted', 'confirmed', 'in_progress', 'completed', 'cancelled').optional(),
      service_type_id: Joi.number().integer().positive().optional(),
      search: Joi.string().max(100).optional(),
      latitude: Joi.number().min(-90).max(90).optional(),
      longitude: Joi.number().min(-180).max(180).optional(),
      distance: Joi.number().positive().max(50000).optional(),
      my_orders: Joi.string().valid('true', 'false').optional()
    })
  },

  // 获取工单详情
  getOrderDetail: {
    params: Joi.object({
      id: Joi.number().integer().positive().required()
    })
  },

  // 电工抢单
  takeOrder: {
    params: Joi.object({
      id: Joi.number().integer().positive().required()
    }),
    body: Joi.object({
      quoted_price: Joi.number().positive().required()
    })
  },

  // 确认工单
  confirmOrder: {
    params: Joi.object({
      id: Joi.number().integer().positive().required()
    })
  },

  // 开始服务
  startService: {
    params: Joi.object({
      id: Joi.number().integer().positive().required()
    })
  },

  // 完成服务
  completeService: {
    params: Joi.object({
      id: Joi.number().integer().positive().required()
    }),
    body: Joi.object({
      completion_notes: Joi.string().max(500).optional().allow(''),
      completion_images: Joi.array().items(Joi.string().uri()).max(10).optional()
    })
  },

  // 取消工单
  cancelOrder: {
    params: Joi.object({
      id: Joi.number().integer().positive().required()
    }),
    body: Joi.object({
      reason: Joi.string().max(200).optional().allow('')
    })
  },

  // 更新工单状态
  updateOrderStatus: {
    params: Joi.object({
      id: Joi.number().integer().positive().required()
    }),
    body: Joi.object({
      status: Joi.string().valid('pending', 'accepted', 'confirmed', 'in_progress', 'completed', 'cancelled').required(),
      notes: Joi.string().max(500).optional().allow('')
    })
  },

  // 创建支付
  createPayment: {
    body: Joi.object({
      order_id: Joi.number().integer().positive().required(),
      payment_method: Joi.string().valid('wechat', 'test').default('wechat'),
      openid: Joi.string().when('payment_method', {
        is: 'wechat',
        then: Joi.required(),
        otherwise: Joi.optional()
      })
    })
  },

  // 测试支付确认
  confirmTestPayment: {
    body: Joi.object({
      payment_no: Joi.string().required()
    })
  },

  // 查询支付
  queryPayment: {
    params: Joi.object({
      payment_no: Joi.string().required()
    })
  },

  // 获取支付列表
  getPaymentList: {
    query: Joi.object({
      page: Joi.number().integer().min(1).optional(),
      limit: Joi.number().integer().min(1).max(100).optional(),
      status: Joi.string().valid('pending', 'paid', 'failed', 'timeout').optional(),
      payment_method: Joi.string().valid('wechat', 'test').optional(),
      search: Joi.string().max(100).optional()
    })
  },

  // 申请退款
  requestRefund: {
    params: Joi.object({
      payment_no: Joi.string().required()
    }),
    body: Joi.object({
      reason: Joi.string().max(200).optional().allow('')
    })
  },

  // 处理退款
  processRefund: {
    params: Joi.object({
      payment_no: Joi.string().required()
    }),
    body: Joi.object({
      action: Joi.string().valid('approve', 'reject').required(),
      admin_notes: Joi.string().max(500).optional().allow('')
    })
  },

  // 获取服务类型详情
  getServiceTypeDetail: {
    params: Joi.object({
      id: Joi.number().integer().positive().required()
    })
  },

  // 获取系统配置
  getSystemConfig: {
    query: Joi.object({
      keys: Joi.string().optional()
    })
  },

  // 获取附近电工
  getNearbyElectricians: {
    query: Joi.object({
      latitude: Joi.number().min(-90).max(90).required(),
      longitude: Joi.number().min(-180).max(180).required(),
      distance: Joi.number().positive().max(50000).optional()
    })
  },

  // 搜索
  search: {
    query: Joi.object({
      keyword: Joi.string().min(2).max(50).required(),
      type: Joi.string().valid('all', 'orders', 'electricians', 'service_types').optional()
    })
  },

  // 手机号验证
  phone: Joi.string().pattern(/^1[3-9]\d{9}$/).required().messages({
    'string.pattern.base': '手机号格式不正确',
    'any.required': '手机号不能为空'
  }),

  // 验证码验证
  code: Joi.string().length(6).pattern(/^\d{6}$/).required().messages({
    'string.length': '验证码必须是6位数字',
    'string.pattern.base': '验证码格式不正确',
    'any.required': '验证码不能为空'
  }),

  // 分页参数
  pagination: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10)
  }),

  // ID参数
  id: Joi.number().integer().positive().required().messages({
    'number.base': 'ID必须是数字',
    'number.positive': 'ID必须是正数',
    'any.required': 'ID不能为空'
  }),

  // 经纬度
  coordinate: {
    longitude: Joi.number().min(-180).max(180).required().messages({
      'number.min': '经度范围为-180到180',
      'number.max': '经度范围为-180到180',
      'any.required': '经度不能为空'
    }),
    latitude: Joi.number().min(-90).max(90).required().messages({
      'number.min': '纬度范围为-90到90',
      'number.max': '纬度范围为-90到90',
      'any.required': '纬度不能为空'
    })
  },

  // 金额
  amount: Joi.number().positive().precision(2).required().messages({
    'number.positive': '金额必须大于0',
    'any.required': '金额不能为空'
  }),

  // 评分
  rating: Joi.number().integer().min(1).max(5).required().messages({
    'number.min': '评分范围为1-5',
    'number.max': '评分范围为1-5',
    'any.required': '评分不能为空'
  })
};

module.exports = {
  validate,
  schemas
};