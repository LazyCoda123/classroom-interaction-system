// database/db-tool.js - 统一配置版本
const path = require('path');

// 统一使用 backend 的配置和依赖
const backendPath = path.resolve(__dirname, '../backend');
const config = require(path.join(backendPath, 'config/config.js'));

// 从 backend 加载依赖
let mysql, bcrypt;
try {
    mysql = require(path.join(backendPath, 'node_modules/mysql2/promise'));
    bcrypt = require(path.join(backendPath, 'node_modules/bcrypt'));
    console.log('✅ 依赖加载成功');
} catch (error) {
    console.error('❌ 依赖加载失败:', error.message);
    console.error('请确保在 backend 目录下已安装所有依赖：');
    console.error('  cd backend && npm install mysql2 bcrypt');
    process.exit(1);
}

// 使用统一的数据库配置
const dbConfig = config.database;

console.log('🔧 使用数据库配置:');
console.log(`  主机: ${dbConfig.host}`);
console.log(`  用户: ${dbConfig.user}`);
console.log(`  数据库: ${dbConfig.database}`);
console.log(`  密码: ${dbConfig.password ? '***已设置***' : '❌未设置❌'}`);

// 验证配置
if (!dbConfig.password) {
    console.error('🚨 警告: 数据库密码未设置！');
    console.error('请检查 backend/config/config.js 中的 database.password 配置');
    console.error('或设置环境变量 DB_PASSWORD');
}

class DatabaseTool {
    constructor() {
        this.connection = null;
    }

    async connect(withoutDatabase = false) {
        if (this.connection) {
            return this.connection;
        }
        try {
            const connectionConfig = {
                host: dbConfig.host,
                user: dbConfig.user,
                password: dbConfig.password,
                charset: 'utf8mb4',
                multipleStatements: true
            };
            
            // 如果不指定数据库，则不包含database参数（用于创建数据库）
            if (!withoutDatabase) {
                connectionConfig.database = dbConfig.database;
            }
            
            console.log('🔌 正在连接数据库...', {
                host: connectionConfig.host,
                user: connectionConfig.user,
                database: connectionConfig.database || '(无指定数据库)'
            });
            
            this.connection = await mysql.createConnection(connectionConfig);
            return this.connection;
        } catch (error) {
            console.error('❌ 数据库连接失败:', error.message);
            console.error('请检查:');
            console.error('1. MySQL服务是否启动');
            console.error('2. 用户名密码是否正确');
            console.error('3. 主机地址是否正确');
            throw error;
        }
    }

    async disconnect() {
        if (this.connection) {
            await this.connection.end();
            this.connection = null;
        }
    }

    async init() {
        console.log('🚀 开始初始化数据库...');
        console.log(`数据库名称: ${dbConfig.database}`);
        
        // 首先连接到MySQL（不指定数据库）
        const conn = await this.connect(true);
        
        try {
            // 创建数据库（如果不存在）- 使用query而不是execute
            console.log('📁 创建数据库...');
            await conn.query(`CREATE DATABASE IF NOT EXISTS ${dbConfig.database} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
            await conn.query(`USE ${dbConfig.database}`);
            
            console.log('✅ 数据库创建/选择成功');

            // 创建用户表 - 注意：使用 student_id 而不是 username
            console.log('👥 创建用户表...');
            const createUsersTable = `
                CREATE TABLE IF NOT EXISTS users (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    student_id VARCHAR(50) UNIQUE NOT NULL COMMENT '学号/教师编号',
                    password VARCHAR(255) NOT NULL COMMENT '密码',
                    name VARCHAR(100) NOT NULL COMMENT '姓名',
                    role ENUM('teacher', 'student') NOT NULL COMMENT '角色',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户表'
            `;
            
            // 创建分类表
            console.log('📁 创建分类表...');
            const createCategoriesTable = `
                CREATE TABLE IF NOT EXISTS categories (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    name VARCHAR(100) NOT NULL COMMENT '分类名称',
                    description TEXT COMMENT '分类描述',
                    keywords TEXT COMMENT '关键词（JSON格式）',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='问题分类表'
            `;
            
            // 创建问题表
            console.log('❓ 创建问题表...');
            const createQuestionsTable = `
                CREATE TABLE IF NOT EXISTS questions (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    student_id INT NOT NULL COMMENT '学生ID',
                    content TEXT NOT NULL COMMENT '问题内容',
                    category_id INT COMMENT '分类ID',
                    confidence_score DECIMAL(3,2) DEFAULT 0.00 COMMENT '分类置信度',
                    status ENUM('pending', 'classified', 'answered', 'ignored') DEFAULT 'pending' COMMENT '问题状态',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
                    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='问题表'
            `;

            await conn.execute(createUsersTable);
            await conn.execute(createCategoriesTable);
            await conn.execute(createQuestionsTable);
            
            console.log('✅ 数据表创建成功');

            // 插入默认分类（与backend配置保持一致）
            console.log('📋 创建默认分类...');
            const categories = [
                ['知识点定义类问题', '关于概念、定义、含义的问题', '["是什么", "定义", "概念", "含义", "意思", "怎么理解", "解释"]'],
                ['知识点应用类问题', '关于具体应用、计算、使用方法的问题', '["怎么用", "如何应用", "计算", "解题", "使用", "应用", "方法"]'],
                ['知识点关联类问题', '关于对比、区别、联系的问题', '["区别", "联系", "对比", "关系", "异同", "比较", "相同", "不同"]'],
                ['实验操作类问题', '关于实验、操作、步骤的问题', '["实验", "操作", "步骤", "过程", "实践", "动手", "演示"]'],
                ['解题方法类问题', '关于解题技巧、思路、方法的问题', '["技巧", "思路", "方法", "窍门", "快速", "简便", "解法"]'],
                ['其他类问题', '无法归类的其他问题', '["其他", "不确定", "杂项"]']
            ];

            for (const [name, description, keywords] of categories) {
                await conn.execute(
                    'INSERT IGNORE INTO categories (name, description, keywords) VALUES (?, ?, ?)',
                    [name, description, keywords]
                );
            }
            
            console.log('✅ 默认分类创建成功');

            // 创建教师账号
            console.log('👨‍🏫 创建教师账号...');
            const teachers = [
                { student_id: 'teacher001', name: '张老师' },
                { student_id: 'teacher002', name: '李老师' },
                { student_id: 'teacher003', name: '王老师' }
            ];

            const hashedPassword = await bcrypt.hash('secret', config.bcrypt.rounds);
            console.log('🔐 密码哈希生成成功');
            
            for (const teacher of teachers) {
                await conn.execute(
                    'INSERT IGNORE INTO users (student_id, password, name, role) VALUES (?, ?, ?, ?)',
                    [teacher.student_id, hashedPassword, teacher.name, 'teacher']
                );
            }
            
            console.log('✅ 默认教师账号创建成功');

            // 创建学生账号
            console.log('👨‍🎓 创建学生账号...');
            for (let i = 1; i <= 50; i++) {
                const student_id = `2024${i.toString().padStart(3, '0')}`;
                const name = `学生${i}`;
                await conn.execute(
                    'INSERT IGNORE INTO users (student_id, password, name, role) VALUES (?, ?, ?, ?)',
                    [student_id, hashedPassword, name, 'student']
                );
                
                // 每10个显示进度
                if (i % 10 === 0) {
                    console.log(`   已创建 ${i}/50 个学生账号`);
                }
            }
            
            console.log('✅ 学生账号创建成功');

            // 创建测试问题
            console.log('❓ 创建测试问题...');
            const testQuestions = [
                // 知识点定义类问题 (category_id: 1)
                { student_id: 2, content: '什么是面向对象编程？它有哪些基本特征？', category_id: 1, confidence_score: 0.95 },
                { student_id: 3, content: '请解释一下什么是数据结构？', category_id: 1, confidence_score: 0.92 },
                { student_id: 4, content: '算法的定义是什么？', category_id: 1, confidence_score: 0.88 },
                { student_id: 5, content: '什么是递归？递归的本质是什么？', category_id: 1, confidence_score: 0.90 },
                
                // 知识点应用类问题 (category_id: 2)
                { student_id: 6, content: '如何使用冒泡排序算法对数组进行排序？', category_id: 2, confidence_score: 0.87 },
                { student_id: 7, content: '怎么用递归实现斐波那契数列？', category_id: 2, confidence_score: 0.89 },
                { student_id: 8, content: '如何在Java中创建一个简单的类？', category_id: 2, confidence_score: 0.91 },
                { student_id: 9, content: '怎样使用链表实现栈？', category_id: 2, confidence_score: 0.85 },
                { student_id: 10, content: '如何计算二叉树的高度？', category_id: 2, confidence_score: 0.83 },
                
                // 知识点关联类问题 (category_id: 3)
                { student_id: 11, content: '数组和链表有什么区别？各自的优缺点是什么？', category_id: 3, confidence_score: 0.94 },
                { student_id: 12, content: '栈和队列的区别是什么？', category_id: 3, confidence_score: 0.96 },
                { student_id: 13, content: '深度优先搜索和广度优先搜索有什么不同？', category_id: 3, confidence_score: 0.88 },
                { student_id: 14, content: '继承和组合的区别在哪里？', category_id: 3, confidence_score: 0.86 },
                { student_id: 15, content: '排序算法中时间复杂度和空间复杂度的关系？', category_id: 3, confidence_score: 0.82 },
                
                // 实验操作类问题 (category_id: 4)
                { student_id: 16, content: '实验中如何调试程序找出逻辑错误？', category_id: 4, confidence_score: 0.79 },
                { student_id: 17, content: '编程实验时如何测试代码的正确性？', category_id: 4, confidence_score: 0.81 },
                { student_id: 18, content: '实验报告应该包含哪些内容？', category_id: 4, confidence_score: 0.77 },
                { student_id: 19, content: '如何进行单元测试？具体步骤是什么？', category_id: 4, confidence_score: 0.84 },
                
                // 解题方法类问题 (category_id: 5)
                { student_id: 20, content: '解决算法问题有什么通用的思路和技巧？', category_id: 5, confidence_score: 0.78 },
                { student_id: 21, content: '如何提高编程效率？有什么好的方法？', category_id: 5, confidence_score: 0.76 },
                { student_id: 22, content: '动态规划问题的解题思路是什么？', category_id: 5, confidence_score: 0.87 },
                { student_id: 23, content: '如何快速理解复杂的算法？', category_id: 5, confidence_score: 0.74 },
                
                // 其他类问题 (category_id: 6)
                { student_id: 24, content: '老师，今天的作业什么时候交？', category_id: 6, confidence_score: 0.72 },
                { student_id: 25, content: '课程考试的重点是什么？', category_id: 6, confidence_score: 0.70 },
                { student_id: 26, content: '推荐一些学习编程的书籍可以吗？', category_id: 6, confidence_score: 0.68 }
            ];

            for (const question of testQuestions) {
                await conn.execute(
                    'INSERT IGNORE INTO questions (student_id, content, category_id, confidence_score, status) VALUES (?, ?, ?, ?, ?)',
                    [question.student_id, question.content, question.category_id, question.confidence_score, 'pending']
                );
            }
            
            console.log(`✅ 测试问题创建成功 (${testQuestions.length}个)`);
            
            console.log('🎉 数据库初始化完成！');
            console.log('📋 默认账号信息：');
            console.log('   教师: teacher001, teacher002, teacher003');
            console.log('   学生: 2024001-2024050');
            console.log('   密码: secret');
            console.log('📊 初始化数据：');
            console.log('   分类: 6个');
            console.log('   用户: 53个 (3教师 + 50学生)');
            console.log(`   问题: ${testQuestions.length}个`);

        } catch (error) {
            console.error('❌ 初始化失败:', error.message);
            console.error('详细错误:', error);
            throw error;
        } finally {
            await this.disconnect();
        }
    }

    async reset() {
        console.log('🔄 重置数据库...');
        // 连接到MySQL服务器（不指定数据库）
        const conn = await this.connect(true);
        
        try {
            // 使用 query 而不是 execute 来删除数据库
            await conn.query(`DROP DATABASE IF EXISTS ${dbConfig.database}`);
            console.log('✅ 数据库重置完成');
        } catch (error) {
            console.error('❌ 重置失败:', error.message);
            throw error;
        } finally {
            await this.disconnect();
        }
    }

    async status() {
        console.log('📊 检查数据库状态...');
        const conn = await this.connect();
        
        try {
            // 使用 query 而不是 execute 来切换数据库
            await conn.query(`USE ${dbConfig.database}`);
            
            const [users] = await conn.execute('SELECT COUNT(*) as count FROM users');
            const [questions] = await conn.execute('SELECT COUNT(*) as count FROM questions');
            const [categories] = await conn.execute('SELECT COUNT(*) as count FROM categories');
            
            console.log('✅ 数据库连接正常');
            console.log(`👥 用户数量: ${users[0].count}`);
            console.log(`❓ 问题数量: ${questions[0].count}`);
            console.log(`📁 分类数量: ${categories[0].count}`);
            
            // 显示一些示例用户
            const [sampleUsers] = await conn.execute('SELECT student_id, name, role FROM users LIMIT 5');
            console.log('👤 示例用户:');
            sampleUsers.forEach(user => {
                console.log(`   ${user.student_id} - ${user.name} (${user.role})`);
            });
            
        } catch (error) {
            console.error('❌ 状态检查失败:', error.message);
            if (error.code === 'ER_BAD_DB_ERROR') {
                console.error('💡 数据库不存在，请先运行: npm run setup');
            }
            throw error;
        } finally {
            await this.disconnect();
        }
    }

    async test() {
        console.log('🧪 测试数据库连接...');
        
        try {
            const conn = await this.connect();
            await conn.execute('SELECT 1');
            console.log('✅ 数据库连接测试成功');
        } catch (error) {
            console.error('❌ 连接测试失败:', error.message);
        } finally {
            await this.disconnect();
        }
    }

    async fixPasswords() {
        console.log('🔐 修复用户密码...');
        const conn = await this.connect();
        
        try {
            const hashedPassword = await bcrypt.hash('secret', config.bcrypt.rounds);
            await conn.execute('UPDATE users SET password = ?', [hashedPassword]);
            console.log('✅ 所有用户密码已重置为: secret');
        } catch (error) {
            console.error('❌ 密码修复失败:', error.message);
            throw error;
        } finally {
            await this.disconnect();
        }
    }

    async seed() {
        console.log('🌱 添加测试数据...');
        const conn = await this.connect();
        
        try {
            // 添加一些测试问题
            const testQuestions = [
                { student_id: 2, content: '什么是面向对象编程？', category_id: 1 },
                { student_id: 3, content: '如何使用循环结构？', category_id: 2 },
                { student_id: 4, content: '数组和链表有什么区别？', category_id: 3 }
            ];

            for (const question of testQuestions) {
                await conn.execute(
                    'INSERT IGNORE INTO questions (student_id, content, category_id, status) VALUES (?, ?, ?, ?)',
                    [question.student_id, question.content, question.category_id, 'pending']
                );
            }
            
            console.log('✅ 测试数据添加完成');
        } catch (error) {
            console.error('❌ 添加测试数据失败:', error.message);
            throw error;
        } finally {
            await this.disconnect();
        }
    }

    async clear() {
        console.log('🧹 清空数据...');
        const conn = await this.connect();
        
        try {
            await conn.execute('DELETE FROM questions');
            await conn.execute('DELETE FROM users WHERE role = "student"');
            console.log('✅ 数据清空完成');
        } catch (error) {
            console.error('❌ 清空失败:', error.message);
            throw error;
        } finally {
            await this.disconnect();
        }
    }
}

// 命令行工具
async function main() {
    const command = process.argv[2];
    const tool = new DatabaseTool();
    
    console.log('🗄️  课堂互动系统 - 数据库管理工具');
    console.log('=========================================');
    
    try {
        switch (command) {
            case 'init':
                await tool.init();
                break;
            case 'reset':
                await tool.reset();
                break;
            case 'status':
                await tool.status();
                break;
            case 'test':
                await tool.test();
                break;
            case 'seed':
                await tool.seed();
                break;
            case 'clear':
                await tool.clear();
                break;
            case 'fix-passwords':
                await tool.fixPasswords();
                break;
            default:
                console.log('可用命令:');
                console.log('  init          - 初始化数据库');
                console.log('  reset         - 重置数据库');
                console.log('  status        - 查看状态');
                console.log('  test          - 测试连接');
                console.log('  seed          - 添加测试数据');
                console.log('  clear         - 清空数据');
                console.log('  fix-passwords - 修复密码');
        }
    } catch (error) {
        console.error('💥 执行失败:', error.message);
        process.exit(1);
    }
}

if (require.main === module) {
    main();
}

module.exports = DatabaseTool;