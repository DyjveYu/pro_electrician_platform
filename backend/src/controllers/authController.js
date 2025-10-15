/**
 * 用户认证控制器
 * 处理用户登录、注册、角色切换等功能
 */

//const User = require('../models/User'); 老的导入方式
const { User, ElectricianCertification, Order } = require('../models');
const AppError = require('../utils/AppError');
const SmsService = require('../utils/smsService');
const { redisOperations } = require('../config/redis');

class AuthController {
  /**
   * 发送验证码
   */
  static async sendCode(req, res, next) {
    try {
      const { phone, type = 'login' } = req.body;

      // 验证手机号格式
      if (!SmsService.validatePhone(phone)) {
        throw new AppError('手机号格式不正确', 400);
      }

      // 验证类型
      const validTypes = ['login', 'register', 'reset_password'];
      if (!validTypes.includes(type)) {
        throw new AppError('验证码类型不正确', 400);
      }

      const result = await SmsService.sendVerificationCode(phone, type);
      
      if (result.success) {
        const response = {
          message: result.message
        };
        
        // 测试环境返回验证码
        if (process.env.NODE_ENV !== 'production' && result.code) {
          response.code = result.code;
        }
        
        res.success(response);
      } else {
        res.error(result.message, 400);
      }
    } catch (error) {
      next(error);
    }
  }

  /**
   * 用户登录/注册
   */
  static async login(req, res, next) {
    try {
      const { phone, code } = req.body;

      // 验证手机号格式
      if (!SmsService.validatePhone(phone)) {
        throw new AppError('手机号格式不正确', 400);
      }

      // 验证验证码
      const codeResult = await SmsService.verifyCode(phone, code, 'login');
      if (!codeResult.success) {
        throw new AppError(codeResult.message, 400);
      }

      // 查找或创建用户
      let user = await User.findByPhone(phone);
      
      if (!user) {
        // 新用户注册
        user = await User.createUser({ phone });
      }

      // 检查用户状态
      if (user.status === 'banned') {
        throw new AppError('账号已被禁用，请联系客服', 403);
      }

      // 更新最后登录时间
      await User.updateLastLogin(user.id);

      // 生成token
      const token = User.generateToken(user);

      // 获取用户统计信息
      const stats = await User.getUserStats(user.id, user.current_role);

      // 获取电工认证信息（如果是电工角色）
      let certification = null;
      if (user.current_role === 'electrician') {
        certification = await User.getElectricianCertification(user.id);
      }

      res.success({
        token,
        user: {
          id: user.id,
          phone: user.phone,
          nickname: user.nickname,
          avatar: user.avatar,
          current_role: user.current_role,
          status: user.status,
          created_at: user.created_at
        },
        stats,
        certification
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 获取用户信息
   */
  static async getUserInfo(req, res, next) {
    try {
      const userId = req.user.id;
      
      const user = await User.findById(userId);
      if (!user) {
        return res.error('用户不存在', 404);
      }

      // 获取用户统计信息
      const stats = await User.getUserStats(userId, user.current_role);

      // 获取电工认证信息（如果是电工角色）
      let certification = null;
      if (user.current_role === 'electrician') {
        certification = await User.getElectricianCertification(userId);
      }

      res.success({
        user: {
          id: user.id,
          phone: user.phone,
          nickname: user.nickname,
          avatar: user.avatar,
          current_role: user.current_role,
          status: user.status,
          created_at: user.created_at,
          updated_at: user.updated_at,
          last_login_at: user.last_login_at
        },
        stats,
        certification
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 更新用户信息
   */
  static async updateProfile(req, res, next) {
    try {
      const userId = req.user.id;
      const { nickname, avatar } = req.body;

      const updateData = {};
      if (nickname !== undefined) updateData.nickname = nickname;
      if (avatar !== undefined) updateData.avatar = avatar;

      if (Object.keys(updateData).length === 0) {
        return res.error('没有要更新的信息', 400);
      }

      const result = await User.update(userId, updateData);
      
      if (result.success) {
        res.success({ message: result.message || '用户信息更新成功' });
      } else {
        res.error(result.message || '用户信息更新失败', 500);
      }
    } catch (error) {
      next(error);
    }
  }

  /**
   * 切换用户角色
   */
  static async switchRole(req, res, next) {
    try {
      const userId = req.user.id;
      const { role } = req.body;

      // 验证角色
      const validRoles = ['user', 'electrician'];
      if (!validRoles.includes(role)) {
        return res.error('无效的角色类型', 400);
      }

      // 如果切换到电工角色，需要检查认证状态
      if (role === 'electrician') {
        const canSwitch = await User.canSwitchToElectrician(userId);
        if (!canSwitch) {
          return res.error('您还未通过电工认证，无法切换到电工角色', 403);
        }
      }

      const success = await User.switchRole(userId, role);
      
      if (success) {
        // 生成新的token（包含新角色信息）
        const user = await User.findById(userId);
        const token = User.generateToken(user);

        // 获取新角色的统计信息
        const stats = await User.getUserStats(userId, role);

        res.success({
          message: '角色切换成功',
          token,
          current_role: role,
          stats
        });
      } else {
        res.error('角色切换失败', 500);
      }
    } catch (error) {
      next(error);
    }
  }

  /**
   * 刷新token
   */
  static async refreshToken(req, res, next) {
    try {
      const userId = req.user.id;
      
      const user = await User.findById(userId);
      if (!user) {
        return res.error('用户不存在', 404);
      }

      if (user.status === 'banned') {
        return res.error('账号已被禁用', 403);
      }

      // 生成新token
      const token = User.generateToken(user);

      res.success({
        token,
        expires_in: process.env.JWT_EXPIRES_IN || '7d'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 用户登出
   */
  static async logout(req, res, next) {
    try {
      // 可以在这里实现token黑名单机制
      // 将当前token加入黑名单，防止继续使用
      
      const token = req.headers.authorization?.replace('Bearer ', '');
      if (token) {
        // 将token加入Redis黑名单
        const decoded = User.verifyToken(token);
        const expireTime = decoded.exp - Math.floor(Date.now() / 1000);
        if (expireTime > 0) {
          // 使用封装的 Redis 方法
          await redisOperations.set(`blacklist:${token}`, '1', expireTime);
        }
      }

      res.success({ message: '登出成功' });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 验证token是否有效
   */
  static async verifyToken(req, res, next) {
    try {
      const userId = req.user.id;
      
      const user = await User.findById(userId);
      if (!user) {
        return res.error('用户不存在', 404);
      }

      if (user.status === 'banned') {
        return res.error('账号已被禁用', 403);
      }

      res.success({
        valid: true,
        user: {
          id: user.id,
          phone: user.phone,
          nickname: user.nickname,
          current_role: user.current_role,
          status: user.status
        }
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = AuthController;