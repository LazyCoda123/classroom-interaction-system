// backend/config/config.js
const config = {
    // 应用配置
    app: {
      name: '课堂互动系统',
      version: '1.0.0',
      port: process.env.PORT || 3000,
      env: process.env.NODE_ENV || 'development'
    },
  
    // 数据库配置
    database: {
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '123456',
      database: process.env.DB_NAME || 'classroom_system',
      charset: 'utf8mb4',
      timezone: '+08:00',
      connectionLimit: 10
    },
  
    // JWT配置
    jwt: {
      secret: process.env.JWT_SECRET || 'classroom_system_secret_key_2024',
      expiresIn: process.env.JWT_EXPIRES_IN || '24h',
      issuer: 'classroom-system',
      audience: 'classroom-users'
    },
  
    // 密码加密配置
    bcrypt: {
      rounds: 10
    },
  
    // 跨域配置
    cors: {
      origin: [
        'http://localhost:8080', // 学生端
        'http://localhost:8081'  // 教师端
      ],
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization']
    },
  
    // 请求限制配置
    limits: {
      jsonSize: '10mb',
      questionLength: 1000,
      questionPerStudent: 1
    },
  
    // AI分类配置
    ai: {
      classificationConfidence: 0.6,
      defaultCategory: 6, // 其他类问题
      maxKeywords: 20
    },
  
    // 日志配置
    logging: {
      level: process.env.LOG_LEVEL || 'info',
      format: 'combined',
      dateFormat: 'YYYY-MM-DD HH:mm:ss'
    },
  
    // 业务规则配置
    business: {
      maxStudents: 30,
      minStudents: 20,
      questionStatuses: ['pending', 'classified'],
      userRoles: ['student', 'teacher'],
      categories: [
        '知识点定义类问题',
        '知识点应用类问题', 
        '知识点关联类问题',
        '实验操作类问题',
        '解题方法类问题',
        '其他类问题'
      ]
    },
  
    // 响应格式配置
    response: {
      success: {
        code: 200,
        message: '操作成功'
      },
      error: {
        validation: { code: 400, message: '请求参数错误' },
        unauthorized: { code: 401, message: '未授权访问' },
        forbidden: { code: 403, message: '权限不足' },
        notFound: { code: 404, message: '资源不存在' },
        conflict: { code: 409, message: '资源冲突' },
        server: { code: 500, message: '服务器内部错误' }
      }
    }
  };
  
  // 根据环境调整配置
  if (config.app.env === 'production') {
    config.logging.level = 'error';
    config.cors.origin = process.env.FRONTEND_URLS ? process.env.FRONTEND_URLS.split(',') : config.cors.origin;
  }
  
  // 配置验证
  function validateConfig() {
    const required = [
      'database.host',
      'database.user', 
      'database.password',
      'database.database',
      'jwt.secret'
    ];
  
    for (const path of required) {
      const value = path.split('.').reduce((obj, key) => obj && obj[key], config);
      if (!value) {
        throw new Error(`缺少必要配置: ${path}`);
      }
    }
  
    console.log('✅ 配置验证通过');
    return true;
  }
  
  // 获取配置值的辅助函数
  function get(path, defaultValue = null) {
    const value = path.split('.').reduce((obj, key) => obj && obj[key], config);
    return value !== undefined ? value : defaultValue;
  }
  
  // 设置配置值的辅助函数
  function set(path, value) {
    const keys = path.split('.');
    const lastKey = keys.pop();
    const target = keys.reduce((obj, key) => {
      if (!obj[key]) obj[key] = {};
      return obj[key];
    }, config);
    target[lastKey] = value;
  }
  
  module.exports = {
    ...config,
    validateConfig,
    get,
    set
  };