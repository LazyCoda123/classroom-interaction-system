// database/seeds/index.js - 种子数据管理（修复版）
const path = require('path');

// 动态添加backend的node_modules到模块搜索路径
const backendPath = path.resolve(__dirname, '../../backend');
const backendNodeModules = path.join(backendPath, 'node_modules');
require('module').globalPaths.push(backendNodeModules);

const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');

/**
 * 默认密码配置
 */
const DEFAULT_PASSWORD = 'secret';
const BCRYPT_ROUNDS = 10;

// 配置信息
const config = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '123456',
  database: process.env.DB_NAME || 'classroom_system',
  charset: 'utf8mb4'
};

/**
 * 生成密码哈希
 */
async function hashPassword(password = DEFAULT_PASSWORD) {
  return await bcrypt.hash(password, BCRYPT_ROUNDS);
}

/**
 * 用户种子数据
 */
async function seedUsers() {
  console.log('👥 插入用户种子数据...');
  
  const connection = await mysql.createConnection(config);
  const passwordHash = await hashPassword();
  
  try {
    // 插入教师账号
    const teachers = [
      ['teacher001', '张老师', passwordHash, 'teacher', 'teacher001@example.com', '数学', '13800000001'],
      ['teacher002', '李老师', passwordHash, 'teacher', 'teacher002@example.com', '英语', '13800000002'],
      ['teacher003', '王老师', passwordHash, 'teacher', 'teacher003@example.com', '物理', '13800000003']
    ];
    
    for (const teacher of teachers) {
      try {
        await connection.execute(`
          INSERT INTO users (student_id, name, password, role, email, class, phone) 
          VALUES (?, ?, ?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE 
            password = VALUES(password),
            name = VALUES(name),
            email = VALUES(email),
            class = VALUES(class),
            phone = VALUES(phone)
        `, teacher);
      } catch (error) {
        console.log(`⚠️  教师 ${teacher[0]} 可能已存在`);
      }
    }
    
    console.log(`✅ 教师账号: ${teachers.length} 个`);
    
    // 插入学生账号
    const students = [];
    const classes = ['高一(1)班', '高一(2)班', '高一(3)班', '高二(1)班', '高二(2)班'];
    
    for (let i = 1; i <= 50; i++) {
      const studentId = `2024${i.toString().padStart(3, '0')}`;
      const name = `学生${i.toString().padStart(2, '0')}`;
      const className = classes[Math.floor((i - 1) / 10)];
      const email = `student${i}@example.com`;
      const phone = `138${i.toString().padStart(8, '0')}`;
      
      students.push([studentId, name, passwordHash, 'student', email, className, phone]);
    }
    
    // 批量插入学生
    const batchSize = 10;
    for (let i = 0; i < students.length; i += batchSize) {
      const batch = students.slice(i, i + batchSize);
      
      try {
        const placeholders = batch.map(() => '(?, ?, ?, ?, ?, ?, ?)').join(', ');
        const values = batch.flat();
        
        await connection.execute(`
          INSERT INTO users (student_id, name, password, role, email, class, phone) 
          VALUES ${placeholders}
          ON DUPLICATE KEY UPDATE 
            password = VALUES(password),
            name = VALUES(name),
            email = VALUES(email),
            class = VALUES(class),
            phone = VALUES(phone)
        `, values);
      } catch (error) {
        console.log(`⚠️  批次 ${Math.floor(i/batchSize) + 1} 插入时出现问题`);
      }
    }
    
    console.log(`✅ 学生账号: ${students.length} 个`);
    
  } catch (error) {
    console.error('❌ 用户种子数据插入失败:', error.message);
  } finally {
    await connection.end();
  }
}

/**
 * 分类种子数据
 */
async function seedCategories() {
  console.log('📁 插入分类种子数据...');
  
  const connection = await mysql.createConnection(config);
  
  const categories = [
    ['课程内容', '关于课程学习内容的问题', '#007bff'],
    ['作业练习', '关于作业和练习题的问题', '#28a745'],
    ['考试测验', '关于考试和测验的问题', '#dc3545'],
    ['技术问题', '关于学习平台和工具的问题', '#ffc107'],
    ['学习方法', '关于学习方法和技巧的问题', '#17a2b8'],
    ['课程安排', '关于课程时间和安排的问题', '#6f42c1'],
    ['其他问题', '其他类型的问题', '#6c757d']
  ];
  
  try {
    for (const category of categories) {
      try {
        await connection.execute(`
          INSERT INTO categories (name, description, color) 
          VALUES (?, ?, ?)
          ON DUPLICATE KEY UPDATE 
            description = VALUES(description),
            color = VALUES(color)
        `, category);
      } catch (error) {
        console.log(`⚠️  分类 ${category[0]} 可能已存在`);
      }
    }
    
    console.log(`✅ 分类数据: ${categories.length} 个`);
    
  } catch (error) {
    console.error('❌ 分类种子数据插入失败:', error.message);
  } finally {
    await connection.end();
  }
}

/**
 * 问题种子数据
 */
async function seedQuestions() {
  console.log('❓ 插入问题种子数据...');
  
  const connection = await mysql.createConnection(config);
  
  const sampleQuestions = [
    ['2024001', '这道数学题我不会做，能帮忙解答一下吗？', 1, '课程内容', 0.95],
    ['2024002', '今天的作业什么时候交？', 2, '作业练习', 0.88],
    ['2024003', '下周的考试范围是什么？', 3, '考试测验', 0.92],
    ['2024004', '登录系统时一直显示密码错误', 4, '技术问题', 0.85],
    ['2024005', '如何更好地记忆英语单词？', 5, '学习方法', 0.78],
    ['2024006', '明天的课程会调整时间吗？', 6, '课程安排', 0.90],
    ['2024007', '课件在哪里可以下载？', 1, '课程内容', 0.82],
    ['2024008', '这个公式怎么推导出来的？', 1, '课程内容', 0.93],
    ['2024009', '作业提交系统打不开', 4, '技术问题', 0.87],
    ['2024010', '期中考试什么时候开始？', 3, '考试测验', 0.94]
  ];
  
  try {
    for (const question of sampleQuestions) {
      try {
        await connection.execute(`
          INSERT INTO questions (student_id, content, category_id, ai_category, confidence_score) 
          VALUES (?, ?, ?, ?, ?)
        `, question);
      } catch (error) {
        console.log(`⚠️  问题插入失败: ${error.message}`);
      }
    }
    
    console.log(`✅ 问题数据: ${sampleQuestions.length} 个`);
    
  } catch (error) {
    console.error('❌ 问题种子数据插入失败:', error.message);
  } finally {
    await connection.end();
  }
}

/**
 * 运行所有种子数据
 */
async function runSeeds() {
  console.log('🌱 开始插入种子数据');
  console.log('='.repeat(40));
  
  try {
    await seedUsers();
    await seedCategories();
    await seedQuestions();
    
    console.log('='.repeat(40));
    console.log('🎉 种子数据插入完成！');
    console.log('');
    console.log('📋 账号信息:');
    console.log('  教师: teacher001, teacher002, teacher003');
    console.log('  学生: 2024001-2024050');
    console.log('  密码: secret (所有账号)');
    
  } catch (error) {
    console.error('❌ 种子数据插入失败:', error.message);
  }
}

/**
 * 清空种子数据
 */
async function clearSeeds() {
  console.log('🗑️  清空种子数据...');
  
  const connection = await mysql.createConnection(config);
  
  try {
    // 按照外键约束的顺序删除
    await connection.execute('DELETE FROM answers');
    await connection.execute('DELETE FROM questions');
    await connection.execute('DELETE FROM users');
    await connection.execute('DELETE FROM categories');
    
    // 重置自增ID
    await connection.execute('ALTER TABLE answers AUTO_INCREMENT = 1');
    await connection.execute('ALTER TABLE questions AUTO_INCREMENT = 1');
    await connection.execute('ALTER TABLE users AUTO_INCREMENT = 1');
    await connection.execute('ALTER TABLE categories AUTO_INCREMENT = 1');
    
    console.log('✅ 种子数据已清空');
    
  } catch (error) {
    console.error('❌ 清空种子数据失败:', error.message);
  } finally {
    await connection.end();
  }
}

module.exports = {
  runSeeds,
  clearSeeds,
  seedUsers,
  seedCategories,
  seedQuestions,
  hashPassword
};

// 如果直接执行该文件
if (require.main === module) {
  const command = process.argv[2];
  
  if (command === 'clear') {
    clearSeeds().catch(console.error);
  } else {
    runSeeds().catch(console.error);
  }
}