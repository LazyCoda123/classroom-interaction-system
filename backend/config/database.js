// backend/config/database.js - 修复SQL语法版本
const mysql = require('mysql2/promise');
const config = require('./config');

// 创建连接池
const pool = mysql.createPool({
  host: config.database.host,
  port: config.database.port,
  user: config.database.user,
  password: config.database.password,
  database: config.database.database,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  acquireTimeout: 60000,
  timeout: 60000,
  reconnect: true,
  charset: 'utf8mb4'
});

/**
 * 执行SQL查询
 * @param {string} sql - SQL语句
 * @param {Array} params - 参数数组
 * @returns {Promise<Array>} - 查询结果
 */
async function query(sql, params = []) {
  let connection;
  try {
    console.log('🔍 数据库查询开始:');
    console.log('SQL:', sql);
    console.log('参数:', params);
    
    // 从连接池获取连接
    connection = await pool.getConnection();
    console.log('✅ 数据库连接获取成功');
    
    // 执行查询
    const [rows, fields] = await connection.execute(sql, params);
    
    console.log('✅ 查询执行成功:');
    console.log('结果数量:', Array.isArray(rows) ? rows.length : '非数组结果');
    
    return rows;
  } catch (error) {
    console.error('💥 数据库查询错误:');
    console.error('SQL:', sql);
    console.error('参数:', params);
    console.error('错误信息:', error.message);
    console.error('错误代码:', error.code);
    throw error;
  } finally {
    // 释放连接回连接池
    if (connection) {
      connection.release();
      console.log('🔄 数据库连接已释放');
    }
  }
}

/**
 * 测试数据库连接
 * @returns {Promise<boolean>} - 连接测试结果
 */
async function testConnection() {
  try {
    console.log('🔍 测试数据库连接...');
    const result = await query('SELECT 1 as test');
    console.log('✅ 数据库连接测试成功:', result);
    return true;
  } catch (error) {
    console.error('❌ 数据库连接测试失败:', error.message);
    return false;
  }
}

/**
 * 检查数据库和表是否存在
 * @returns {Promise<Object>} - 检查结果
 */
async function checkDatabase() {
  try {
    console.log('🔍 检查数据库结构...');
    
    // 修复：检查当前数据库
    const currentDatabase = await query('SELECT DATABASE() as current_db');
    console.log('当前数据库:', currentDatabase);
    
    // 修复：检查用户表是否存在
    const tables = await query("SHOW TABLES LIKE 'users'");
    console.log('用户表检查结果:', tables);
    
    if (tables.length === 0) {
      throw new Error('用户表 users 不存在');
    }
    
    // 检查用户表结构
    const columns = await query('DESCRIBE users');
    console.log('用户表结构:', columns);
    
    // 检查是否有测试用户
    const userCount = await query('SELECT COUNT(*) as count FROM users');
    console.log('用户数量:', userCount);
    
    // 检查特定测试用户
    const testUser = await query('SELECT * FROM users WHERE student_id = ?', ['2024002']);
    console.log('测试用户2024002:', testUser);
    
    // 检查分类表
    const categoryTables = await query("SHOW TABLES LIKE 'categories'");
    console.log('分类表检查结果:', categoryTables);
    
    let categoryCount = 0;
    if (categoryTables.length > 0) {
      const categoryCountResult = await query('SELECT COUNT(*) as count FROM categories');
      categoryCount = categoryCountResult[0]?.count || 0;
      console.log('分类数量:', categoryCount);
    }
    
    return {
      databaseExists: currentDatabase.length > 0,
      usersTableExists: tables.length > 0,
      categoriesTableExists: categoryTables.length > 0,
      userCount: userCount[0]?.count || 0,
      categoryCount: categoryCount,
      testUserExists: testUser.length > 0,
      testUser: testUser[0] || null
    };
  } catch (error) {
    console.error('💥 数据库检查错误:', error);
    throw error;
  }
}

/**
 * 初始化分类数据（如果不存在）
 * @returns {Promise<boolean>}
 */
async function initializeCategories() {
  try {
    console.log('🔍 初始化分类数据...');
    
    // 检查分类表是否存在
    const tables = await query("SHOW TABLES LIKE 'categories'");
    
    if (tables.length === 0) {
      console.log('创建分类表...');
      await query(`
        CREATE TABLE categories (
          id INT PRIMARY KEY AUTO_INCREMENT,
          name VARCHAR(100) NOT NULL COMMENT '分类名称',
          description TEXT COMMENT '分类描述',
          keywords TEXT COMMENT '关键词（JSON格式）',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
    }
    
    // 检查是否有分类数据
    const categoryCount = await query('SELECT COUNT(*) as count FROM categories');
    
    if (categoryCount[0].count === 0) {
      console.log('插入默认分类数据...');
      await query(`
        INSERT INTO categories (name, description, keywords) VALUES
        ('知识点定义类问题', '关于概念、定义、含义的问题', '["是什么", "定义", "概念", "含义", "意思", "怎么理解", "解释"]'),
        ('知识点应用类问题', '关于具体应用、计算、使用方法的问题', '["怎么用", "如何应用", "计算", "解题", "使用", "应用", "方法"]'),
        ('知识点关联类问题', '关于对比、区别、联系的问题', '["区别", "联系", "对比", "关系", "异同", "比较", "相同", "不同"]'),
        ('实验操作类问题', '关于实验、操作、步骤的问题', '["实验", "操作", "步骤", "过程", "实践", "动手", "演示"]'),
        ('解题方法类问题', '关于解题技巧、思路、方法的问题', '["技巧", "思路", "方法", "窍门", "快速", "简便", "解法"]'),
        ('其他类问题', '无法归类的其他问题', '["其他", "不确定", "杂项"]')
      `);
      console.log('✅ 分类数据初始化完成');
    }
    
    return true;
  } catch (error) {
    console.error('💥 初始化分类数据错误:', error);
    throw error;
  }
}

/**
 * 关闭数据库连接池
 * @returns {Promise<void>}
 */
async function closePool() {
  try {
    await pool.end();
    console.log('✅ 数据库连接池已关闭');
  } catch (error) {
    console.error('❌ 关闭数据库连接池失败:', error);
  }
}

// 导出函数和连接池
module.exports = {
  query,
  testConnection,
  checkDatabase,
  initializeCategories,
  closePool,
  pool
};

// 应用启动时测试连接
if (require.main === module) {
  // 如果直接运行此文件，执行数据库检查
  (async () => {
    try {
      await testConnection();
      const checkResult = await checkDatabase();
      console.log('数据库检查完成:', checkResult);
      await initializeCategories();
    } catch (error) {
      console.error('数据库检查失败:', error);
    } finally {
      await closePool();
    }
  })();
}