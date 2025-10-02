const jwt = require('jsonwebtoken');

/**
 * 验证JWT令牌的中间件
 */
const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: '未提供授权令牌' });
  }
  
  const token = authHeader.split(' ')[1];
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ message: '无效或过期的令牌' });
  }
};

/**
 * 检查用户是否具有电工角色的中间件
 */
const isElectrician = (req, res, next) => {
  if (!req.user || req.user.role !== 'electrician') {
    return res.status(403).json({ message: '需要电工权限' });
  }
  next();
};

/**
 * 检查用户是否具有管理员角色的中间件
 */
const isAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ message: '需要管理员权限' });
  }
  next();
};

module.exports = {
  verifyToken,
  isElectrician,
  isAdmin
};