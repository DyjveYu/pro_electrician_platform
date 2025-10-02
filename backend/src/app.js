const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs');
const { errorHandler } = require('./middleware/errorHandler');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const orderRoutes = require('./routes/orderRoutes');
const messageRoutes = require('./routes/messageRoutes');
const addressRoutes = require('./routes/addressRoutes');
const electricianRoutes = require('./routes/electricianRoutes');
const adminRoutes = require('./routes/adminRoutes');
const serviceTypeRoutes = require('./routes/serviceTypeRoutes');
const regionRoutes = require('./routes/regionRoutes');

const app = express();

// 创建上传目录
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// 中间件
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// 路由
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/addresses', addressRoutes);
app.use('/api/electrician', electricianRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/service-types', serviceTypeRoutes);
app.use('/api/regions', regionRoutes);

// 错误处理
app.use(errorHandler);

// 404处理
app.use((req, res) => {
  res.status(404).json({ message: '请求的资源不存在' });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`服务器运行在端口 ${PORT}`);
});

module.exports = app;