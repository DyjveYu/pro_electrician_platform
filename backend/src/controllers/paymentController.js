/**
 * 支付控制器
 * 处理支付创建、查询、回调等功能
 */

const Payment = require('../models/Payment');
const Order = require('../models/Order');
const ServiceType = require('../models/ServiceType');
const OrderStatusLog = require('../models/OrderStatusLog');
const Message = require('../models/Message');
const WechatPayService = require('../utils/wechatPayService');

class PaymentController {
  /**
   * 创建支付订单
   */
  static async createPayment(req, res, next) {
    try {
      const userId = req.user.id;
      const {
        order_id,
        payment_method = 'wechat',
        openid,
        type = 'prepay'
      } = req.body;

      // 验证工单
      const order = await Order.findByPk(order_id);
      if (!order) {
        return res.error('工单不存在', 404);
      }

      // 验证工单归属
      if (order.user_id !== userId) {
        return res.error('无权限支付此工单', 403);
      }

      // 分类型校验与金额确定
      let amount = 0;
      let description = '';
      if (type === 'prepay') {
        if (order.status !== 'pending_payment') {
          return res.error('当前工单不处于待支付预付款状态', 400);
        }
        // 读取服务类型预付款金额
        const serviceType = await ServiceType.findByPk(order.service_type_id);
        if (!serviceType || !serviceType.prepay_amount || Number(serviceType.prepay_amount) <= 0) {
          return res.error('预付款金额未配置或无效', 400);
        }
        amount = Number(serviceType.prepay_amount);
        description = `工单预付款-${serviceType.name || order.title}`;
      } else if (type === 'repair') {
        // 仅允许在待支付维修费状态下创建维修费支付
        if (order.status !== 'pending_repair_payment') {
          return res.error('当前工单不处于待支付维修费状态', 400);
        }
        if (!order.final_amount || Number(order.final_amount) <= 0) {
          return res.error('工单最终金额异常', 400);
        }
        amount = Number(order.final_amount);
        description = `工单支付-${order.title}`;
      } else {
        return res.error('无效的支付类型', 400);
      }

      // 检查是否已有待支付的订单
      const existingPayment = await Payment.findOne({
        where: {
          order_id: order_id,
          status: 'pending',
          type
        }
      });
      if (existingPayment) {
        return res.error('已有待支付的订单，请先完成支付', 400);
      }

      // 生成商户订单号
      const now = new Date();
      const out_trade_no = `PAY${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`;
      
      // 创建支付记录
      const paymentData = {
        order_id,
        user_id: userId,
        amount: amount,
        payment_method,
        out_trade_no,
        type
      };

      const payment = await Payment.create(paymentData);

      // 根据支付方式处理
      let paymentResult;
      if (payment_method === 'wechat') {
        const wechatPay = new WechatPayService();
        // 30分钟超时关闭
        const expireDate = new Date(Date.now() + 30 * 60 * 1000);
        const formatExpire = (d) => {
          const pad = (n) => String(n).padStart(2, '0');
          return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
        };
        paymentResult = await wechatPay.createUnifiedOrder({
          payment_no: payment.out_trade_no,
          amount: payment.amount,
          description,
          openid: openid,
          time_expire: type === 'prepay' ? formatExpire(expireDate) : undefined
        });
      } else if (payment_method === 'test') {
        // 测试支付
        paymentResult = {
          success: true,
          test: true,
          payment_no: payment.out_trade_no
        };
      } else {
        return res.error('不支持的支付方式', 400);
      }

      if (paymentResult.success) {
        res.success({
          payment_id: payment.id,
          payment_no: payment.out_trade_no,
          amount: payment.amount,
          ...paymentResult
        });
      } else {
        // 支付创建失败，更新状态
        await Payment.update({
          status: 'failed',
          failed_reason: '支付创建失败'
        }, {
          where: { id: payment.id }
        });
        res.error('支付创建失败', 500);
      }
    } catch (error) {
      next(error);
    }
  }

  /**
   * 测试支付确认
   */
  static async confirmTestPayment(req, res, next) {
    try {
      const { payment_no } = req.body;
      const userId = req.user.id;

      // 查找支付记录
      const payment = await Payment.findOne({
        where: {
          out_trade_no: payment_no
        }
      });
      if (!payment) {
        return res.error('支付记录不存在', 404);
      }

      // 验证用户权限
      if (payment.user_id !== userId) {
        return res.error('无权限操作此支付', 403);
      }

      // 验证支付方式
      if (payment.payment_method !== 'test') {
        return res.error('非测试支付，无法手动确认', 400);
      }

      // 验证支付状态
      if (payment.status !== 'pending') {
        return res.error('支付状态异常', 400);
      }

      // 模拟支付成功
      const transactionData = {
        transaction_id: `test_${Date.now()}`,
        time_end: new Date().toISOString(),
        test: true
      };

      // 更新支付状态为成功
      await Payment.update({
        status: 'success',
        transaction_id: transactionData.transaction_id,
        paid_at: new Date()
      }, {
        where: { out_trade_no: payment_no }
      });
      
      // 根据支付类型更新订单状态
      const order = await Order.findByPk(payment.order_id);
      if (order) {
        if (payment.type === 'prepay') {
          await Order.update({
            status: 'pending',
            prepaid_at: new Date()
          }, { where: { id: payment.order_id } });

          // 状态日志与消息
          await OrderStatusLog.create({
            order_id: payment.order_id,
            to_status: 'pending',
            operator_id: userId,
            operator_type: 'user',
            remark: '预付款支付成功，进入待接单'
          });
          await Message.create({
            user_id: order.user_id,
            title: '预付款支付成功',
            content: `您的工单 ${order.order_no} 预付款已支付成功，现已进入待接单。`,
            type: 'order',
            related_id: order.id,
            to_status: 'unread'
          });
        } else {
          // 维修费支付成功：不改变订单主状态，保持在 pending_repair_payment
          await OrderStatusLog.create({
            order_id: payment.order_id,
            to_status: 'pending_repair_payment',
            operator_id: userId,
            operator_type: 'user',
            remark: '维修费支付成功'
          });
          await Message.create({
            user_id: order.user_id,
            title: '维修费支付成功',
            content: `您的工单 ${order.order_no} 维修费已支付成功，请等待电工开始维修。`,
            type: 'order',
            related_id: order.id,
            to_status: 'unread'
          });
        }
      }

      res.success({
        message: '测试支付确认成功'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 微信支付回调
   */
  static async wechatNotify(req, res, next) {
    try {
      const xmlData = req.body;
      const wechatPay = new WechatPayService();
      
      const verifyResult = wechatPay.verifyNotify(xmlData);
      
      if (verifyResult.success) {
        // 查找支付记录
        const payment = await Payment.findOne({
          where: { out_trade_no: verifyResult.payment_no }
        });
        
        if (payment) {
          // 更新支付状态为成功
          await Payment.update({
            status: 'success',
            transaction_id: verifyResult.transaction_id,
            paid_at: new Date(verifyResult.time_end)
          }, {
            where: { out_trade_no: verifyResult.payment_no }
          });
          
          // 按支付类型更新订单状态
          const order = await Order.findByPk(payment.order_id);
          if (order) {
            if (payment.type === 'prepay') {
              await Order.update({
                status: 'pending',
                prepaid_at: new Date(verifyResult.time_end)
              }, { where: { id: payment.order_id } });
              await OrderStatusLog.create({
                order_id: payment.order_id,
                to_status: 'pending',
                operator_id: order.user_id,
                operator_type: 'user',
                remark: '预付款支付成功，进入待接单'
              });
              await Message.create({
                user_id: order.user_id,
                title: '预付款支付成功',
                content: `您的工单 ${order.order_no} 预付款已支付成功，现已进入待接单。`,
                type: 'order',
                related_id: order.id,
                to_status: 'unread'
              });
            } else {
              // 维修费支付成功：不改变订单主状态，保持在 pending_repair_payment
              await OrderStatusLog.create({
                order_id: payment.order_id,
                to_status: 'pending_repair_payment',
                operator_id: order.user_id,
                operator_type: 'user',
                remark: '维修费支付成功'
              });
              await Message.create({
                user_id: order.user_id,
                title: '维修费支付成功',
                content: `您的工单 ${order.order_no} 维修费已支付成功，请等待电工开始维修。`,
                type: 'order',
                related_id: order.id,
                to_status: 'unread'
              });
            }
          }
        }
        
        // 返回成功响应
        res.set('Content-Type', 'application/xml');
        res.send(wechatPay.generateSuccessResponse());
      } else {
        console.error('微信支付回调验证失败:', verifyResult.error);
        res.set('Content-Type', 'application/xml');
        res.send(wechatPay.generateFailResponse());
      }
    } catch (error) {
      console.error('微信支付回调处理失败:', error);
      const wechatPay = new WechatPayService();
      res.set('Content-Type', 'application/xml');
      res.send(wechatPay.generateFailResponse());
    }
  }

  /**
   * 查询支付状态
   */
  static async queryPayment(req, res, next) {
    try {
      const { payment_no } = req.params;
      const userId = req.user.id;

      const payment = await Payment.findOne({
        where: { out_trade_no: payment_no }
      });
      if (!payment) {
        return res.error('支付记录不存在', 404);
      }

      // 验证用户权限
      if (payment.user_id !== userId) {
        return res.error('无权限查看此支付', 403);
      }

      // 如果是pending状态，尝试查询最新状态
      if (payment.status === 'pending' && payment.payment_method === 'wechat') {
        try {
          const wechatPay = new WechatPayService();
          const queryResult = await wechatPay.queryOrder(payment_no);
          
          if (queryResult.success && queryResult.trade_state === 'SUCCESS') {
            // 支付成功，更新状态
            await Payment.update({
              status: 'success',
              transaction_id: queryResult.transaction_id,
              paid_at: new Date()
            }, {
              where: { out_trade_no: payment_no }
            });
            
            // 根据支付类型更新订单支付状态
            const order = await Order.findByPk(payment.order_id);
            if (order) {
              if (payment.type === 'prepay') {
                await Order.update({
                  status: 'pending',
                  prepaid_at: new Date()
                }, { where: { id: payment.order_id } });
                await OrderStatusLog.create({
                  order_id: payment.order_id,
                  to_status: 'pending',
                  operator_id: order.user_id,
                  operator_type: 'user',
                  remark: '预付款支付成功，进入待接单'
                });
                await Message.create({
                  user_id: order.user_id,
                  title: '预付款支付成功',
                  content: `您的工单 ${order.order_no} 预付款已支付成功，现已进入待接单。`,
                  type: 'order',
                  related_id: order.id,
                  to_status: 'unread'
                });
              } else {
                // 维修费支付成功：不改变订单主状态，保持在 pending_repair_payment
                await OrderStatusLog.create({
                  order_id: payment.order_id,
                  to_status: 'pending_repair_payment',
                  operator_id: order.user_id,
                  operator_type: 'user',
                  remark: '维修费支付成功'
                });
                await Message.create({
                  user_id: order.user_id,
                  title: '维修费支付成功',
                  content: `您的工单 ${order.order_no} 维修费已支付成功，请等待电工开始维修。`,
                  type: 'order',
                  related_id: order.id,
                  to_status: 'unread'
                });
              }
            }
            
            // 重新查询更新后的支付记录
            const updatedPayment = await Payment.findOne({
              where: { out_trade_no: payment_no }
            });
            return res.success({ payment: updatedPayment });
          }
        } catch (error) {
          console.error('查询微信支付状态失败:', error);
        }
      }

      res.success({ payment });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 获取支付列表
   */
  static async getPaymentList(req, res, next) {
    try {
      const userId = req.user.id;
      const {
        page = 1,
        limit = 20,
        status,
        payment_method,
        search
      } = req.query;

      const options = {
        page: parseInt(page),
        limit: parseInt(limit),
        user_id: userId,
        status,
        payment_method,
        search
      };

      const result = await Payment.getList(options);
      res.success(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * 获取支付统计
   */
  static async getPaymentStats(req, res, next) {
    try {
      const userId = req.user.id;
      const { date_range } = req.query;

      const options = {
        user_id: userId
      };

      if (date_range) {
        try {
          const range = JSON.parse(date_range);
          options.date_range = range;
        } catch (e) {
          // 忽略无效的日期范围
        }
      }

      const stats = await Payment.getStats(options);
      res.success({ stats });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 申请退款
   */
  static async requestRefund(req, res, next) {
    try {
      const { payment_no } = req.params;
      const { reason = '用户申请退款' } = req.body;
      const userId = req.user.id;

      const payment = await Payment.findByPaymentNo(payment_no);
      if (!payment) {
        return res.error('支付记录不存在', 404);
      }

      // 验证用户权限
      if (payment.user_id !== userId) {
        return res.error('无权限操作此支付', 403);
      }

      // 验证支付状态
      if (payment.status !== 'success') {
        return res.error('只有已支付成功的订单才能申请退款', 400);
      }

      // 检查是否已申请退款
      if (payment.refund_status === 'processing' || payment.refund_status === 'success') {
        return res.error('已申请退款，请勿重复操作', 400);
      }

      // 更新退款状态
      await Payment.updateStatus(payment.id, payment.status, {
        refund_status: 'processing',
        refund_reason: reason,
        refund_requested_at: new Date()
      });

      // 这里可以添加自动退款逻辑或者通知管理员处理
      
      res.success({
        message: '退款申请已提交，请等待处理'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 处理退款（管理员用）
   */
  static async processRefund(req, res, next) {
    try {
      const { payment_no } = req.params;
      const { action, admin_notes = '' } = req.body; // action: 'approve' | 'reject'

      const payment = await Payment.findByPaymentNo(payment_no);
      if (!payment) {
        return res.error('支付记录不存在', 404);
      }

      if (payment.refund_status !== 'processing') {
        return res.error('退款状态异常', 400);
      }

      if (action === 'approve') {
        // 执行退款
        if (payment.payment_method === 'wechat') {
          const wechatPay = new WechatPayService();
          const refundResult = await wechatPay.refund({
            payment_no: payment.out_trade_no,
            refund_no: `RF${payment.out_trade_no}`,
            total_fee: payment.amount,
            refund_fee: payment.amount
          });

          if (refundResult.success) {
            await Payment.updateStatus(payment.id, payment.status, {
              refund_status: 'success',
              refund_id: refundResult.refund_id,
              refund_completed_at: new Date(),
              admin_notes
            });
          } else {
            throw new Error('退款执行失败');
          }
        } else {
          // 测试支付直接标记为退款成功
          await Payment.updateStatus(payment.id, payment.status, {
            refund_status: 'success',
            refund_id: `test_refund_${Date.now()}`,
            refund_completed_at: new Date(),
            admin_notes
          });
        }

        res.success({ message: '退款处理成功' });
      } else if (action === 'reject') {
        await Payment.updateStatus(payment.id, payment.status, {
          refund_status: 'rejected',
          admin_notes
        });
        res.success({ message: '退款申请已拒绝' });
      } else {
        res.error('无效的操作类型', 400);
      }
    } catch (error) {
      next(error);
    }
  }
}

module.exports = PaymentController;