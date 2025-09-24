/**
 * 限流中间件
 * 防止API被恶意调用
 */

const rateLimit = {};
const WINDOW_SIZE = 60 * 1000; // 1分钟
const MAX_REQUESTS = 100; // 每分钟最多100次请求
const LOGIN_MAX_REQUESTS = 5; // 登录接口每分钟最多5次
const SMS_MAX_REQUESTS = 1; // 发送验证码每分钟最多1次

module.exports = () => {
  return (req, res, next) => {
    const ip = req.ip || req.socket?.remoteAddress || req.headers['x-forwarded-for'] || 'unknown';
    const now = Date.now();
    const key = `${ip}:${req.path}`;
    
    // 清理过期记录
    if (rateLimit[key] && now - rateLimit[key].resetTime > WINDOW_SIZE) {
      delete rateLimit[key];
    }

    // 初始化或获取当前记录
    if (!rateLimit[key]) {
      rateLimit[key] = {
        count: 0,
        resetTime: now
      };
    }

    // 增加请求计数
    rateLimit[key].count++;

    // 根据不同接口设置不同限制
    let maxRequests = MAX_REQUESTS;
    if (req.path.includes('/auth/login')) {
      maxRequests = LOGIN_MAX_REQUESTS;
    } else if (req.path.includes('/auth/send-code')) {
      maxRequests = SMS_MAX_REQUESTS;
    }

    // 检查是否超出限制
    if (rateLimit[key].count > maxRequests) {
      return res.error('请求过于频繁，请稍后再试', 429);
    }

    // 设置响应头
    res.set({
      'X-RateLimit-Limit': maxRequests,
      'X-RateLimit-Remaining': Math.max(0, maxRequests - rateLimit[key].count),
      'X-RateLimit-Reset': new Date(rateLimit[key].resetTime + WINDOW_SIZE).toISOString()
    });

    next();
  };
};