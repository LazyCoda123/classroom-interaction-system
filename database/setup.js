// database/setup.js - 快速部署脚本
const { testConnection, checkStatus } = require('./db-tool');
const { initDatabase } = require('./init');

console.log('🚀 课堂互动系统 - 数据库快速部署');
console.log('='.repeat(50));

/**
 * 检查环境
 */
async function checkEnvironment() {
  console.log('🔍 检查环境配置...');
  
  const config = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '123456',
    database: process.env.DB_NAME || 'classroom_system'
  };
  
  console.log('📋 当前配置:');
  console.log(`  数据库主机: ${config.host}`);
  console.log(`  数据库用户: ${config.user}`);
  console.log(`  数据库名称: ${config.database}`);
  console.log(`  密码: ${'*'.repeat(config.password.length)}`);
  console.log('');
  
  return config;
}

/**
 * 主部署流程
 */
async function deploy() {
  try {
    // 1. 检查环境
    await checkEnvironment();
    
    // 2. 测试数据库连接
    console.log('🔌 测试数据库连接...');
    const isConnected = await testConnection();
    
    if (!isConnected) {
      console.log('❌ 数据库连接失败，请检查配置后重试');
      process.exit(1);
    }
    
    // 3. 初始化数据库
    console.log('🏗️  初始化数据库...');
    await initDatabase();
    
    // 4. 验证部署结果
    console.log('✅ 验证部署结果...');
    await checkStatus();
    
    // 5. 显示完成信息
    console.log('\n' + '='.repeat(50));
    console.log('🎉 数据库部署完成！');
    console.log('');
    console.log('📋 系统信息:');
    console.log('  - 数据库已创建并初始化');
    console.log('  - 所有表结构已创建');
    console.log('  - 测试数据已插入');
    console.log('  - 密码哈希已修复');
    console.log('');
    console.log('🔑 默认登录信息:');
    console.log('  教师账号: teacher001 / secret');
    console.log('  学生账号: 2024001-2024030 / secret');
    console.log('');
    console.log('🚀 你现在可以启动应用了:');
    console.log('  npm start  # 启动生产服务器');
    console.log('  npm run dev  # 启动开发服务器');
    console.log('');
    console.log('📚 更多命令请查看: database/README.md');
    console.log('='.repeat(50));
    
  } catch (error) {
    console.error('❌ 部署失败:', error.message);
    console.log('');
    console.log('🔧 故障排除建议:');
    console.log('1. 检查MySQL服务是否启动');
    console.log('2. 验证数据库连接配置');
    console.log('3. 确认用户权限是否足够');
    console.log('4. 查看详细错误信息');
    console.log('');
    console.log('💡 也可以尝试手动命令:');
    console.log('  npm run db:test     # 测试连接');
    console.log('  npm run db:status   # 查看状态');
    console.log('  npm run db:init     # 重新初始化');
    
    process.exit(1);
  }
}

// 运行部署
if (require.main === module) {
  deploy();
}

module.exports = { deploy };