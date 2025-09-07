// database/init.js - 数据库初始化脚本（修复版）
const path = require('path');

// 动态添加backend的node_modules到模块搜索路径
const backendPath = path.resolve(__dirname, '../backend');
const backendNodeModules = path.join(backendPath, 'node_modules');
require('module').globalPaths.push(backendNodeModules);

const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const fs = require('fs').promises;

// 配置信息
const config = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '123456',
  database: process.env.DB_NAME || 'classroom_system',
  charset: 'utf8mb4'
};

/**
 * 创建数据库
 */
async function createDatabase() {
  console.log('📦 创建数据库...');
  
  const connection = await mysql.createConnection({
    host: config.host,
    user: config.user,
    password: config.password
  });
  
  await connection.execute(`CREATE DATABASE IF NOT EXISTS ${config.database} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
  console.log(`✅ 数据库 ${config.database} 创建成功`);
  
  await connection.end();
}

/**
 * 创建表结构
 */
async function createTables() {
  console.log('📋 创建表结构...');
  
  const connection = await mysql.createConnection(config);
  
  // 创建用户表
  await connection.execute(`
    CREATE TABLE IF NOT EXISTS users (
      id INT PRIMARY KEY AUTO_INCREMENT,
      student_id VARCHAR(20) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      name VARCHAR(100) NOT NULL,
      role ENUM('student', 'teacher') NOT NULL DEFAULT 'student',
      class VARCHAR(50),
      email VARCHAR(100),
      phone VARCHAR(20),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_student_id (student_id),
      INDEX idx_role (role)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  
  // 创建分类表
  await connection.execute(`
    CREATE TABLE IF NOT EXISTS categories (
      id INT PRIMARY KEY AUTO_INCREMENT,
      name VARCHAR(100) NOT NULL,
      description TEXT,
      color VARCHAR(7) DEFAULT '#007bff',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  
  // 创建问题表
  await connection.execute(`
    CREATE TABLE IF NOT EXISTS questions (
      id INT PRIMARY KEY AUTO_INCREMENT,
      student_id VARCHAR(20) NOT NULL,
      content TEXT NOT NULL,
      category_id INT,
      ai_category VARCHAR(100),
      confidence_score DECIMAL(5,2),
      status ENUM('pending', 'answered', 'ignored') DEFAULT 'pending',
      priority ENUM('low', 'medium', 'high') DEFAULT 'medium',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (student_id) REFERENCES users(student_id) ON DELETE CASCADE,
      FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
      INDEX idx_student_id (student_id),
      INDEX idx_status (status),
      INDEX idx_created_at (created_at),
      INDEX idx_category (category_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  
  // 创建回答表
  await connection.execute(`
    CREATE TABLE IF NOT EXISTS answers (
      id INT PRIMARY KEY AUTO_INCREMENT,
      question_id INT NOT NULL,
      teacher_id VARCHAR(20) NOT NULL,
      content TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE,
      FOREIGN KEY (teacher_id) REFERENCES users(student_id) ON DELETE CASCADE,
      INDEX idx_question_id (question_id),
      INDEX idx_teacher_id (teacher_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  
  console.log('✅ 表结构创建完成');
  await connection.end();
}

/**
 * 插入默认数据
 */
async function insertDefaultData() {
  console.log('🌱 插入默认数据...');
  
  const connection = await mysql.createConnection(config);
  
  // 生成正确的密码哈希
  const passwordHash = await bcrypt.hash('secret', 10);
  console.log(`🔑 生成密码哈希: ${passwordHash}`);
  
  // 插入默认教师账号
  try {
    await connection.execute(`
      INSERT INTO users (student_id, name, password, role, email) 
      VALUES ('teacher001', '张老师', ?, 'teacher', 'teacher@example.com')
      ON DUPLICATE KEY UPDATE password = VALUES(password)
    `, [passwordHash]);
    console.log('✅ 教师账号创建成功: teacher001');
  } catch (error) {
    console.log('⚠️  教师账号可能已存在');
  }
  
  // 插入默认学生账号 (30个)
  const students = [];
  for (let i = 1; i <= 30; i++) {
    const studentId = `2024${i.toString().padStart(3, '0')}`;
    const name = `学生${i.toString().padStart(2, '0')}`;
    students.push([studentId, name, passwordHash, 'student', `student${i}@example.com`]);
  }
  
  try {
    const insertQuery = `
      INSERT INTO users (student_id, name, password, role, email) 
      VALUES ? 
      ON DUPLICATE KEY UPDATE password = VALUES(password)
    `;
    await connection.execute(insertQuery, [students]);
    console.log('✅ 学生账号创建成功: 2024001-2024030');
  } catch (error) {
    console.log('⚠️  学生账号可能已存在');
  }
  
  // 插入默认分类
  const categories = [
    ['课程内容', '关于课程内容的问题', '#007bff'],
    ['作业练习', '关于作业和练习的问题', '#28a745'],
    ['考试测验', '关于考试和测验的问题', '#dc3545'],
    ['技术问题', '关于技术和工具的问题', '#ffc107'],
    ['其他问题', '其他类型的问题', '#6c757d']
  ];
  
  try {
    const categoryQuery = `
      INSERT INTO categories (name, description, color) 
      VALUES ? 
      ON DUPLICATE KEY UPDATE description = VALUES(description)
    `;
    await connection.execute(categoryQuery, [categories]);
    console.log('✅ 默认分类创建成功');
  } catch (error) {
    console.log('⚠️  默认分类可能已存在');
  }
  
  await connection.end();
}

/**
 * 验证初始化结果
 */
async function verifyInitialization() {
  console.log('🔍 验证初始化结果...');
  
  const connection = await mysql.createConnection(config);
  
  // 检查表数量
  const [tables] = await connection.execute("SHOW TABLES");
  console.log(`📋 创建表数量: ${tables.length}`);
  
  // 检查用户数量
  const [userCount] = await connection.execute("SELECT COUNT(*) as count FROM users");
  console.log(`👥 用户总数: ${userCount[0].count}`);
  
  // 检查分类数量
  const [categoryCount] = await connection.execute("SELECT COUNT(*) as count FROM categories");
  console.log(`📁 分类总数: ${categoryCount[0].count}`);
  
  // 测试密码验证
  const [testUser] = await connection.execute("SELECT password FROM users WHERE student_id = 'teacher001'");
  if (testUser.length > 0) {
    const isValid = await bcrypt.compare('secret', testUser[0].password);
    console.log(`🔐 密码验证测试: ${isValid ? '✅ 通过' : '❌ 失败'}`);
  }
  
  await connection.end();
}

/**
 * 主初始化函数
 */
async function initDatabase() {
  console.log('🚀 开始初始化数据库');
  console.log('='.repeat(40));
  
  try {
    await createDatabase();
    await createTables();
    await insertDefaultData();
    await verifyInitialization();
    
    console.log('='.repeat(40));
    console.log('🎉 数据库初始化完成！');
    console.log('');
    console.log('📋 默认账号信息:');
    console.log('  教师账号: teacher001 / secret');
    console.log('  学生账号: 2024001-2024030 / secret');
    console.log('');
    console.log('💡 现在可以启动应用程序进行测试了！');
    
  } catch (error) {
    console.error('❌ 初始化失败:', error.message);
    console.error('请检查数据库配置和连接');
  }
}

module.exports = {
  initDatabase,
  createDatabase,
  createTables,
  insertDefaultData,
  verifyInitialization
};

// 如果直接执行该文件
if (require.main === module) {
  initDatabase().catch(console.error);
}