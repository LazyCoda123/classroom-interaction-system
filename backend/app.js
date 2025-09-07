// backend/app.js - 修复版本
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const config = require('./config/config');
const { testConnection } = require('./config/database');

// 导入路由
const authRoutes = require('./routes/auth');
const questionRoutes = require('./routes/questions');
const classificationRoutes = require('./routes/classification');
const categoriesRoutes = require('./routes/categories'); // 🔥 添加这行

const app = express();
const PORT = config.app.port;

// 验证配置
try {
  config.validateConfig();
  console.log('✅ 配置验证通过');
} catch (error) {
  console.error('❌ 配置验证失败:', error.message);
  process.exit(1);
}

// 中间件配置
app.use(helmet()); // 安全头部
app.use(cors(config.cors));
app.use(express.json({ limit: config.limits.jsonSize }));
app.use(express.urlencoded({ extended: true }));

// 请求日志中间件
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`${timestamp} - ${req.method} ${req.path}`);
  next();
});

// 路由配置
app.use('/api/auth', authRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/classification', classificationRoutes);
app.use('/api/categories', categoriesRoutes); // 🔥 添加这行

// 根路径
app.get('/', (req, res) => {
  res.json({
    message: `🎓 ${config.app.name}API服务器`,
    version: config.app.version,
    environment: config.app.env,
    endpoints: {
      auth: '/api/auth',
      questions: '/api/questions', 
      classification: '/api/classification',
      categories: '/api/categories' // 🔥 添加这行
    },
    features: {
      userRoles: config.business.userRoles,
      questionStatuses: config.business.questionStatuses,
      categories: config.business.categories.length
    }
  });
});

// 健康检查端点
app.get('/health', async (req, res) => {
  try {
    const dbConnected = await testConnection();
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: dbConnected ? 'connected' : 'disconnected',
      version: config.app.version
    });
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

// 404处理
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `路径 ${req.originalUrl} 未找到`,
    availableEndpoints: [
      '/api/auth',
      '/api/questions',
      '/api/classification',
      '/api/categories' // 🔥 添加这行
    ]
  });
});

// 全局错误处理
app.use((error, req, res, next) => {
  console.error('全局错误:', error);
  
  // 数据库错误
  if (error.code === 'ER_DUP_ENTRY') {
    return res.status(409).json({
      success: false,
      message: '数据已存在',
      error: config.app.env === 'development' ? error.message : undefined
    });
  }

  // JWT错误
  if (error.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: '无效的访问令牌'
    });
  }

  // 验证错误
  if (error.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: '请求参数验证失败',
      errors: error.errors
    });
  }

  // 默认服务器错误
  res.status(error.status || 500).json({
    success: false,
    message: error.message || '服务器内部错误',
    error: config.app.env === 'development' ? error.stack : undefined
  });
});

// 启动服务器
async function startServer() {
  try {
    // 测试数据库连接
    const dbConnected = await testConnection();
    if (!dbConnected) {
      console.error('❌ 数据库连接失败，服务器启动终止');
      process.exit(1);
    }

    app.listen(PORT, () => {
      console.log(`
🚀 ${config.app.name}后端服务器启动成功！
📍 服务地址: http://localhost:${PORT}
📊 数据库: MySQL连接正常
🔧 环境: ${config.app.env}
📈 健康检查: http://localhost:${PORT}/health

📖 API文档:
  - 用户认证: http://localhost:${PORT}/api/auth
  - 问题管理: http://localhost:${PORT}/api/questions  
  - AI分类: http://localhost:${PORT}/api/classification
  - 分类管理: http://localhost:${PORT}/api/categories

🎯 功能特性:
  - 用户角色: ${config.business.userRoles.join(', ')}
  - 问题分类: ${config.business.categories.length}个类型
  - 智能分类: 关键词匹配算法
      `);
    });

  } catch (error) {
    console.error('❌ 服务器启动失败:', error);
    process.exit(1);
  }
}

// 优雅关闭
process.on('SIGINT', () => {
  console.log('\n🛑 正在关闭服务器...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 收到终止信号，正在关闭服务器...');
  process.exit(0);
});

startServer();

module.exports = app;