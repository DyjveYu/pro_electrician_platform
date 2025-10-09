const sequelize = require('./src/config/sequelize'); 
 
async function testConnection() { 
  try { 
    await sequelize.authenticate(); 
    console.log('✅ 数据库连接成功'); 
    process.exit(0); 
  } catch (error) { 
    console.error('❌ 数据库连接失败:', error); 
    process.exit(1); 
  } 
} 
 
testConnection();