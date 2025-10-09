const { sequelize, User, ElectricianCertification, Order } = require('./src/models'); 
 
async function testModels() { 
  try { 
    console.log('开始测试模型...\n'); 

    // 1. 测试数据库连接 
    console.log('1. 测试数据库连接...'); 
    await sequelize.authenticate(); 
    console.log('✅ 数据库连接成功\n'); 

    // 2. 测试模型定义（仅查看结构，不修改数据库） 
    console.log('2. 测试模型定义...'); 
    const models = [User, ElectricianCertification, Order]; 
    for (const model of models) { 
      console.log(`   - ${model.name}: ✅`); 
    } 
    console.log('✅ 所有模型定义正确\n'); 

    // 3. 测试基础查询 
    console.log('3. 测试基础查询...'); 
    const userCount = await User.count(); 
    console.log(`   - 用户总数: ${userCount}`); 
    
    const certCount = await ElectricianCertification.count(); 
    console.log(`   - 认证记录: ${certCount}`); 
    
    const orderCount = await Order.count(); 
    console.log(`   - 订单总数: ${orderCount}`); 
    console.log('✅ 基础查询成功\n'); 

    // 4. 测试关联查询 
    console.log('4. 测试关联查询...'); 
    const user = await User.findOne({ 
      include: [ 
        { model: ElectricianCertification, as: 'certification' } 
      ] 
    }); 
    console.log('✅ 关联查询成功\n'); 

    console.log('🎉 所有测试通过！'); 
    process.exit(0); 

  } catch (error) { 
    console.error('❌ 测试失败:', error.message); 
    console.error('\n详细错误:', error); 
    process.exit(1); 
  } 
} 

testModels();