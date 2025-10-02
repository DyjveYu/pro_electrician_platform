/**
 * 全局错误处理中间件
 */
const errorHandler = (err, req, res, next) => {
  console.error(`错误: ${err.message}`);
  console.error(err.stack);

  // 默认错误状态码和消息
  let statusCode = 500;
  let message = '服务器内部错误';

  // 根据错误类型自定义响应
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = err.message;
  } else if (err.name === 'UnauthorizedError') {
    statusCode = 401;
    message = '未授权访问';
  } else if (err.name === 'ForbiddenError') {
    statusCode = 403;
    message = '禁止访问';
  } else if (err.name === 'NotFoundError') {
    statusCode = 404;
    message = '资源未找到';
  }

  // 开发环境下返回详细错误信息
  const errorResponse = {
    success: false,
    message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  };

  res.status(statusCode).json(errorResponse);
};

module.exports = { errorHandler };