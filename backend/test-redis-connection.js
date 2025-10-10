/**
 * Redis连接测试脚本
 */

const redis = require('redis');
require('dotenv').config();

async function testRedisConnection() {
  console.log('开始测试Redis连接...');
  console.log('Redis配置:');
  console.log(`- 主机: ${process.env.REDIS_HOST}`);
  console.log(`- 端口: ${process.env.REDIS_PORT}`);
  console.log(`- 密码: ${process.env.REDIS_PASSWORD ? '已设置' : '未设置'}`);

  // 创建Redis客户端
  const client = redis.createClient({
    socket: {
      host: process.env.REDIS_HOST,
      port: process.env.REDIS_PORT
    },
    password: process.env.REDIS_PASSWORD || undefined
  });

  // 错误处理
  client.on('error', (err) => {
    console.error('❌ Redis连接错误:', err);
  });

  client.on('connect', () => {
    console.log('🔗 Redis连接中...');
  });

  client.on('ready', () => {
    console.log('✅ Redis连接成功');
  });

  try {
    // 连接Redis
    await client.connect();
    
    // 测试设置和获取值
    console.log('测试Redis操作...');
    await client.set('test_key', 'test_value');
    const value = await client.get('test_key');
    console.log(`测试结果: ${value === 'test_value' ? '成功' : '失败'}`);
    
    // 关闭连接
    await client.quit();
    console.log('Redis连接已关闭');
  } catch (error) {
    console.error('Redis测试失败:', error);
  }
}

// 执行测试
testRedisConnection();