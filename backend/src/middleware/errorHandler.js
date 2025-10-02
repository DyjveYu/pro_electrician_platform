/**
 * 全局错误处理中间件
 */
function errorHandler(err, req, res, next) {
  console.error('错误:', err);
  
  // 处理Multer错误
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      success: false,
      message: '文件大小超过限制'
    });
  }
  
  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    return res.status(400).json({
      success: false,
      message: '意外的文件字段'
    });
  }
  
  // 处理验证错误
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: err.message,
      errors: err.errors
    });
  }
  
  // 处理数据库错误
  if (err.code === 'ER_DUP_ENTRY') {
    return res.status(409).json({
      success: false,
      message: '数据已存在'
    });
  }
  
  // 默认错误响应
  res.status(500).json({
    success: false,
    message: '服务器内部错误',
    error: process.env.NODE_ENV === 'production' ? undefined : err.message
  });
}

module.exports = {
  errorHandler
};