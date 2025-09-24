const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
require('dotenv').config();

// 导入中间件
const errorHandler = require('./middleware/errorHandler');
const responseFormatter = require('./middleware/responseFormatter');
const rateLimiter = require('./middleware/rateLimiter');

// 路由导入
const authRoutes = require('./routes/auth');
const orderRoutes = require('./routes/orders');
const paymentRoutes = require('./routes/payments');
// const reviewRoutes = require('./routes/reviews');
// const addressRoutes = require('./routes/addresses');
// const messageRoutes = require('./routes/messages');
const adminRoutes = require('./routes/admin');
// const uploadRoutes = require('./routes/upload');
const systemRoutes = require('./routes/system');

const app = express();
const PORT = process.env.PORT || 3000;

// 基础中间件
app.use(helmet()); // 安全头
app.use(cors()); // 跨域
app.use(morgan('combined')); // 日志
app.use(express.json({ limit: '10mb' })); // JSON解析
app.use(express.urlencoded({ extended: true, limit: '10mb' })); // URL编码解析

// 静态文件服务
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// 响应格式化中间件
app.use(responseFormatter);

// 限流中间件
app.use(rateLimiter());

// API路由
// app.use('/api/auth', authRoutes);
// app.use('/api/orders', orderRoutes);
// app.use('/api/payments', paymentRoutes);
// app.use('/api/v1/reviews', reviewRoutes);
// app.use('/api/v1/addresses', addressRoutes);
// app.use('/api/v1/messages', messageRoutes);
app.use('/api/admin', adminRoutes);
// app.use('/api/v1/upload', uploadRoutes);
// app.use('/api/system', systemRoutes);

// 健康检查
app.get('/health', (req, res) => {
  res.success({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// 404处理
app.use('*', (req, res) => {
  res.error('接口不存在', 404);
});

// 错误处理中间件
app.use(errorHandler);

// 启动服务器
app.listen(PORT, () => {
  console.log(`🚀 服务器启动成功，端口: ${PORT}`);
  console.log(`📖 API文档: http://localhost:${PORT}/api/v1`);
  console.log(`🏥 健康检查: http://localhost:${PORT}/health`);
});

module.exports = app;
