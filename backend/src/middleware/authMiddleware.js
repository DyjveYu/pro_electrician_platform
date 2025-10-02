const jwt = require('jsonwebtoken');
const pool = require('../config/database');
const { JWT_SECRET } = require('../config/auth');

/**
 * 验证用户身份中间件
 */
async function authenticate(req, res, next) {
  try {
    // 从请求头获取token
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: '未提供认证令牌' });
    }
    
    const token = authHeader.split(' ')[1];
    
    // 验证token
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // 检查用户是否存在
    const [users] = await pool.query('SELECT * FROM users WHERE id = ?', [decoded.id]);
    
    if (users.length === 0) {
      return res.status(401).json({ message: '用户不存在' });
    }
    
    // 将用户信息添加到请求对象
    req.user = users[0];
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: '认证令牌已过期' });
    }
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: '无效的认证令牌' });
    }
    console.error('认证中间件错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
}

/**
 * 验证管理员身份中间件
 */
async function authenticateAdmin(req, res, next) {
  try {
    // 先验证用户身份
    authenticate(req, res, async () => {
      // 检查用户是否是管理员
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: '没有管理员权限' });
      }
      next();
    });
  } catch (error) {
    console.error('管理员认证中间件错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
}

module.exports = {
  authenticate,
  authenticateAdmin
};