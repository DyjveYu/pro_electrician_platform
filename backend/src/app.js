const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const compression = require('compression');
const path = require('path');
const { errorHandler } = require('./middleware/errorHandler');

// 导入路由
const electricianRoutes = require('./routes/electricianRoutes');

// 初始化Express应用
const app = express();

// 基础中间件
app.use(helmet()); // 安全HTTP头
app.use(compression()); // 压缩响应
app.use(morgan('dev')); // 日志
app.use(cors()); // 跨域支持
app.use(express.json()); // JSON解析
app.use(express.urlencoded({ extended: true })); // URL编码解析

// 静态文件服务
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// API路由
app.use('/api/v1/electricians', electricianRoutes);

// 健康检查端点
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: '服务运行正常' });
});

// API文档路由
app.get('/api-docs', (req, res) => {
  res.status(200).json({
    message: 'API文档',
    version: '1.0.0',
    endpoints: [
      { path: '/api/v1/electricians', methods: ['GET', 'POST'], description: '电工相关操作' },
      { path: '/api/v1/electricians/:id', methods: ['GET', 'PUT', 'DELETE'], description: '特定电工操作' },
      { path: '/api/v1/electricians/certification', methods: ['POST'], description: '电工认证申请' }
    ]
  });
});

// 404处理
app.use((req, res, next) => {
  res.status(404).json({ message: '请求的资源不存在' });
});

// 错误处理中间件
app.use(errorHandler);

module.exports = app;