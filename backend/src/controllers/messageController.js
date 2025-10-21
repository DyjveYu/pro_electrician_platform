const { SystemMessage, UserMessageRead, User, Sequelize } = require('../models');
const { Op } = Sequelize;
const AppError = require('../utils/AppError');

class MessageController {
  /**
   * 获取用户消息列表
   * @param {Object} req - 请求对象
   * @param {Object} res - 响应对象
   * @param {Function} next - 下一个中间件函数
   */
  static async getMessages(req, res, next) {
    try {
      const { page = 1, limit = 20, type = '' } = req.query;
      const userId = req.user.id;
      
      // 确保转换为数字类型
      const numPage = parseInt(page);
      const numLimit = parseInt(limit);
      const numOffset = (numPage - 1) * numLimit;
      
      // 构建查询条件
      const whereConditions = {
        status: 'published',
        [Op.or]: [
          { target_users: 'all' },
          { target_users: 'users' },
          { target_users: 'electricians' }
        ]
      };

      // 根据消息类型筛选
      if (type && type.trim() !== '') {
        if (type === 'order') {
          // 订单通知使用urgent类型
          whereConditions.type = 'urgent';
        } else if (type === 'system') {
          // 系统通知包含system、maintenance、activity类型
          whereConditions.type = {
            [Op.in]: ['system', 'maintenance', 'activity']
          };
        }
      }

      // 使用Sequelize执行查询
      const { count, rows } = await SystemMessage.findAndCountAll({
        where: whereConditions,
        include: [{
          model: User,
          as: 'readUsers',
          attributes: [],
          through: {
            attributes: []
          },
          where: {
            id: userId
          },
          required: false
        }],
        order: [['created_at', 'DESC']],
        limit: numLimit,
        offset: numOffset,
        subQuery: false
      });

      // 处理消息列表，添加is_read属性
      const messages = await Promise.all(rows.map(async (message) => {
        const messageObj = message.toJSON();
        
        // 查询该消息是否已读
        const readRecord = await UserMessageRead.findOne({
          where: {
            user_id: userId,
            message_id: message.id
          },
          attributes: ['id']
        });
        
        return {
          ...messageObj,
          is_read: readRecord ? 1 : 0
        };
      }));

      const totalPages = Math.ceil(count / numLimit);

      res.success({
        messages,
        pagination: {
          page: numPage,
          limit: numLimit,
          total: count,
          totalPages,
          hasMore: numPage < totalPages
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 获取消息详情
   * @param {Object} req - 请求对象
   * @param {Object} res - 响应对象
   * @param {Function} next - 下一个中间件函数
   */
  static async getMessageDetail(req, res, next) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      // 使用Sequelize查询
      const messageData = await SystemMessage.findOne({
        where: {
          id,
          status: 'published',
          [Op.or]: [
            { target_users: 'all' },
            { target_users: 'users' },
            { target_users: 'electricians' }
          ]
        },
        include: [{
          model: User,
          as: 'readUsers',
          attributes: [],
          through: {
            attributes: []
          },
          where: {
            id: userId
          },
          required: false
        }]
      });

      if (!messageData) {
        throw new AppError('消息不存在', 404);
      }

      // 查询该消息是否已读
      const readRecord = await UserMessageRead.findOne({
        where: {
          user_id: userId,
          message_id: id
        },
        attributes: ['id']
      });

      // 构建返回数据
      const message = {
        ...messageData.toJSON(),
        is_read: readRecord ? 1 : 0
      };

      res.success(message);
    } catch (error) {
      next(error);
    }
  }

  /**
   * 标记消息为已读
   * @param {Object} req - 请求对象
   * @param {Object} res - 响应对象
   * @param {Function} next - 下一个中间件函数
   */
  static async markAsRead(req, res, next) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      // 检查消息是否存在
      const message = await SystemMessage.findOne({
        where: {
          id,
          status: 'published',
          [Op.or]: [
            { target_users: 'all' },
            { target_users: 'users' },
            { target_users: 'electricians' }
          ]
        }
      });

      if (!message) {
        throw new AppError('消息不存在', 404);
      }

      // 检查是否已标记为已读
      const [readRecord, created] = await UserMessageRead.findOrCreate({
        where: {
          user_id: userId,
          message_id: id
        },
        defaults: {
          read_at: new Date()
        }
      });

      res.success({ message: '消息已标记为已读' });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 获取未读消息数量
   * @param {Object} req - 请求对象
   * @param {Object} res - 响应对象
   * @param {Function} next - 下一个中间件函数
   */
  static async getUnreadCount(req, res, next) {
    try {
      const userId = req.user.id;

      // 获取用户已读消息ID列表
      const readMessageIds = await UserMessageRead.findAll({
        where: { user_id: userId },
        attributes: ['message_id'],
        raw: true
      }).then(reads => reads.map(read => read.message_id));

      // 查询订单通知未读数量
      const orderUnreadCount = await SystemMessage.count({
        where: {
          status: 'published',
          type: 'urgent',
          [Op.or]: [
            { target_users: 'all' },
            { target_users: 'users' },
            { target_users: 'electricians' }
          ],
          ...(readMessageIds.length > 0 ? {
            id: {
              [Op.notIn]: readMessageIds
            }
          } : {})
        }
      });

      // 查询系统通知未读数量
      const systemUnreadCount = await SystemMessage.count({
        where: {
          status: 'published',
          type: {
            [Op.in]: ['system', 'maintenance', 'activity']
          },
          [Op.or]: [
            { target_users: 'all' },
            { target_users: 'users' },
            { target_users: 'electricians' }
          ],
          ...(readMessageIds.length > 0 ? {
            id: {
              [Op.notIn]: readMessageIds
            }
          } : {})
        }
      });

      res.success({
         orderUnreadCount,
         systemUnreadCount,
         totalUnreadCount: orderUnreadCount + systemUnreadCount
        });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = MessageController;