// database/migrations/001_create_tables.js - 创建基础表结构（修复版）
const path = require('path');

// 动态添加backend的node_modules到模块搜索路径
const backendPath = path.resolve(__dirname, '../../backend');
const backendNodeModules = path.join(backendPath, 'node_modules');
require('module').globalPaths.push(backendNodeModules);

const mysql = require('mysql2/promise');

// 配置信息
const config = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '123456',
  database: process.env.DB_NAME || 'classroom_system',
  charset: 'utf8mb4'
};

/**
 * 创建用户表
 */
const createUsersTable = `
  CREATE TABLE IF NOT EXISTS users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    student_id VARCHAR(20) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    role ENUM('student', 'teacher') NOT NULL DEFAULT 'student',
    class VARCHAR(50),
    email VARCHAR(100),
    phone VARCHAR(20),
    avatar VARCHAR(255),
    status ENUM('active', 'inactive') DEFAULT 'active',
    last_login TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_student_id (student_id),
    INDEX idx_role (role),
    INDEX idx_status (status)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户表'
`;

/**
 * 创建分类表
 */
const createCategoriesTable = `
  CREATE TABLE IF NOT EXISTS categories (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    color VARCHAR(7) DEFAULT '#007bff',
    sort_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_sort_order (sort_order),
    INDEX idx_is_active (is_active)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='问题分类表'
`;

/**
 * 创建问题表
 */
const createQuestionsTable = `
  CREATE TABLE IF NOT EXISTS questions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    student_id VARCHAR(20) NOT NULL,
    content TEXT NOT NULL,
    category_id INT,
    ai_category VARCHAR(100),
    confidence_score DECIMAL(5,2),
    status ENUM('pending', 'answered', 'ignored', 'closed') DEFAULT 'pending',
    priority ENUM('low', 'medium', 'high') DEFAULT 'medium',
    tags JSON,
    attachments JSON,
    view_count INT DEFAULT 0,
    like_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES users(student_id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
    INDEX idx_student_id (student_id),
    INDEX idx_status (status),
    INDEX idx_priority (priority),
    INDEX idx_created_at (created_at),
    INDEX idx_category (category_id),
    INDEX idx_ai_category (ai_category),
    FULLTEXT idx_content (content)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='问题表'
`;

/**
 * 创建回答表
 */
const createAnswersTable = `
  CREATE TABLE IF NOT EXISTS answers (
    id INT PRIMARY KEY AUTO_INCREMENT,
    question_id INT NOT NULL,
    teacher_id VARCHAR(20) NOT NULL,
    content TEXT NOT NULL,
    attachments JSON,
    is_best BOOLEAN DEFAULT FALSE,
    like_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE,
    FOREIGN KEY (teacher_id) REFERENCES users(student_id) ON DELETE CASCADE,
    INDEX idx_question_id (question_id),
    INDEX idx_teacher_id (teacher_id),
    INDEX idx_is_best (is_best),
    INDEX idx_created_at (created_at)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='回答表'
`;

/**
 * 创建互动记录表
 */
const createInteractionsTable = `
  CREATE TABLE IF NOT EXISTS interactions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id VARCHAR(20) NOT NULL,
    target_type ENUM('question', 'answer') NOT NULL,
    target_id INT NOT NULL,
    action ENUM('like', 'dislike', 'view', 'share') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(student_id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_target (target_type, target_id),
    INDEX idx_action (action),
    INDEX idx_created_at (created_at),
    UNIQUE KEY unique_user_target_action (user_id, target_type, target_id, action)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='互动记录表'
`;

/**
 * 创建通知表
 */
const createNotificationsTable = `
  CREATE TABLE IF NOT EXISTS notifications (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id VARCHAR(20) NOT NULL,
    title VARCHAR(255) NOT NULL,
    content TEXT,
    type ENUM('system', 'question', 'answer', 'like') DEFAULT 'system',
    is_read BOOLEAN DEFAULT FALSE,
    related_type ENUM('question', 'answer') NULL,
    related_id INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    read_at TIMESTAMP NULL,
    FOREIGN KEY (user_id) REFERENCES users(student_id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_is_read (is_read),
    INDEX idx_type (type),
    INDEX idx_created_at (created_at)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='通知表'
`;

/**
 * 执行向上迁移
 */
async function up() {
  console.log('📋 开始创建数据表...');
  
  const connection = await mysql.createConnection(config);
  
  try {
    // 创建用户表
    await connection.execute(createUsersTable);
    console.log('✅ 用户表创建成功');
    
    // 创建分类表
    await connection.execute(createCategoriesTable);
    console.log('✅ 分类表创建成功');
    
    // 创建问题表
    await connection.execute(createQuestionsTable);
    console.log('✅ 问题表创建成功');
    
    // 创建回答表
    await connection.execute(createAnswersTable);
    console.log('✅ 回答表创建成功');
    
    // 创建互动记录表
    await connection.execute(createInteractionsTable);
    console.log('✅ 互动记录表创建成功');
    
    // 创建通知表
    await connection.execute(createNotificationsTable);
    console.log('✅ 通知表创建成功');
    
    console.log('🎉 所有数据表创建完成');
    
  } catch (error) {
    console.error('❌ 创建表失败:', error.message);
    throw error;
  } finally {
    await connection.end();
  }
}

/**
 * 执行向下迁移
 */
async function down() {
  console.log('🗑️  开始删除数据表...');
  
  const connection = await mysql.createConnection(config);
  
  try {
    // 按照外键依赖的相反顺序删除表
    await connection.execute('DROP TABLE IF EXISTS notifications');
    console.log('✅ 通知表删除成功');
    
    await connection.execute('DROP TABLE IF EXISTS interactions');
    console.log('✅ 互动记录表删除成功');
    
    await connection.execute('DROP TABLE IF EXISTS answers');
    console.log('✅ 回答表删除成功');
    
    await connection.execute('DROP TABLE IF EXISTS questions');
    console.log('✅ 问题表删除成功');
    
    await connection.execute('DROP TABLE IF EXISTS categories');
    console.log('✅ 分类表删除成功');
    
    await connection.execute('DROP TABLE IF EXISTS users');
    console.log('✅ 用户表删除成功');
    
    console.log('🎉 所有数据表删除完成');
    
  } catch (error) {
    console.error('❌ 删除表失败:', error.message);
    throw error;
  } finally {
    await connection.end();
  }
}

module.exports = {
  up,
  down
};

// 如果直接执行该文件
if (require.main === module) {
  const command = process.argv[2];
  
  if (command === 'down') {
    down().catch(console.error);
  } else {
    up().catch(console.error);
  }
}