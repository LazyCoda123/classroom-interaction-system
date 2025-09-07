-- 课堂互动系统数据库设计
-- 创建数据库
CREATE DATABASE IF NOT EXISTS classroom_system CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE classroom_system;

-- 用户表（学生和教师）
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    student_id VARCHAR(20) UNIQUE NOT NULL COMMENT '学号',
    name VARCHAR(50) NOT NULL COMMENT '姓名',
    password VARCHAR(255) NOT NULL COMMENT '密码（加密后）',
    role ENUM('student', 'teacher') DEFAULT 'student' COMMENT '角色',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 问题分类表
CREATE TABLE categories (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL COMMENT '分类名称',
    description TEXT COMMENT '分类描述',
    keywords TEXT COMMENT '关键词（JSON格式）',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 问题表
CREATE TABLE questions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL COMMENT '提问学生ID',
    content TEXT NOT NULL COMMENT '问题内容',
    category_id INT NULL COMMENT '分类ID',
    status ENUM('pending', 'classified') DEFAULT 'pending' COMMENT '状态：待分类、已分类',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
);

-- 插入问题分类数据
INSERT INTO categories (name, description, keywords) VALUES
('知识点定义类问题', '关于概念、定义、含义的问题', '["是什么", "定义", "概念", "含义", "意思", "怎么理解", "解释"]'),
('知识点应用类问题', '关于具体应用、计算、使用方法的问题', '["怎么用", "如何应用", "计算", "解题", "使用", "应用", "方法"]'),
('知识点关联类问题', '关于对比、区别、联系的问题', '["区别", "联系", "对比", "关系", "异同", "比较", "相同", "不同"]'),
('实验操作类问题', '关于实验、操作、步骤的问题', '["实验", "操作", "步骤", "过程", "实践", "动手", "演示"]'),
('解题方法类问题', '关于解题技巧、思路、方法的问题', '["技巧", "思路", "方法", "窍门", "快速", "简便", "解法"]'),
('其他类问题', '无法归类的其他问题', '["其他", "不确定", "杂项"]');

-- 插入测试教师账号
INSERT INTO users (student_id, name, password, role) VALUES
('teacher001', '李老师', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'teacher');

-- 插入30个测试学生账号
INSERT INTO users (student_id, name, password, role) VALUES
('2024001', '张小明', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'student'),
('2024002', '李小红', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'student'),
('2024003', '王小强', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'student'),
('2024004', '陈小花', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'student'),
('2024005', '刘小军', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'student'),
('2024006', '赵小美', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'student'),
('2024007', '孙小亮', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'student'),
('2024008', '周小静', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'student'),
('2024009', '吴小刚', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'student'),
('2024010', '郑小雅', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'student'),
('2024011', '冯小龙', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'student'),
('2024012', '陈小蕾', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'student'),
('2024013', '林小波', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'student'),
('2024014', '高小琳', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'student'),
('2024015', '何小东', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'student'),
('2024016', '梁小月', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'student'),
('2024017', '宋小辉', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'student'),
('2024018', '田小芳', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'student'),
('2024019', '谭小峰', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'student'),
('2024020', '许小慧', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'student'),
('2024021', '邓小鹏', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'student'),
('2024022', '余小燕', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'student'),
('2024023', '叶小浩', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'student'),
('2024024', '潘小娟', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'student'),
('2024025', '方小凯', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'student'),
('2024026', '石小丽', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'student'),
('2024027', '罗小斌', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'student'),
('2024028', '金小玲', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'student'),
('2024029', '黄小勇', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'student'),
('2024030', '曾小敏', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'student');

-- 插入一些测试问题
INSERT INTO questions (user_id, content) VALUES
(2, '向心加速度的定义式是怎么推导出来的？'),
(3, '牛顿第二定律怎么用在斜面滑块问题上？'),
(4, '动能定理和机械能守恒定律有什么区别？'),
(5, '这个实验的操作步骤是什么？'),
(6, '有没有解这类题的技巧？');

-- 创建索引提高查询性能
CREATE INDEX idx_questions_user_id ON questions(user_id);
CREATE INDEX idx_questions_category_id ON questions(category_id);
CREATE INDEX idx_questions_status ON questions(status);
CREATE INDEX idx_users_student_id ON users(student_id);

-- 显示表结构确认
SELECT 'Tables created successfully' as message;
SHOW TABLES;

-- 更新用户密码
UPDATE users SET password = '$2a$10$V13aLM7/wkM8oQuyj8/hl.Te9BJxEqoTo9Cr4IRDJ7RSvc84Pj/tm' WHERE student_id = 'teacher001';
UPDATE users
SET password = '$2a$10$bvQ17qxXGhkNfjxresX5aeGw8WZkmdn2V4bnr.aajT7qCDtYezwcK'
WHERE role = 'student';


-- 增加更多测试问题
INSERT INTO questions (user_id, content) VALUES
(7, '加速度与速度的关系是什么？'),
(8, '简单机械的力学原理如何解释？'),
(9, '如何求解质点的运动轨迹？'),
(10, '在不同气压下气体的状态方程如何变化？'),
(11, '如何计算物体的重力势能和动能？'),
(12, '什么是电场强度，它如何影响带电物体？'),
(13, '电流在电路中的流动原理是什么？'),
(14, '什么是安培定律以及它的应用？'),
(15, '如何使用拉普拉斯变换解微分方程？'),
(16, '波的干涉与衍射现象如何解释？'),
(17, '光的传播速度与介质密度的关系是什么？'),
(18, '什么是热力学第二定律？它的应用是什么？'),
(19, '熵的物理意义是什么？'),
(20, '如何理解物体的弹性势能？'),
(21, '为什么质量守恒定律适用于化学反应？'),
(22, '什么是理想气体的状态方程？'),
(23, '如何解释麦克斯韦分布定律？'),
(24, '光的折射定律如何推导？'),
(25, '什么是热传导和热辐射的区别？');