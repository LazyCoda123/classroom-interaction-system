// backend/models/User.js - 调试版本
const { query } = require('../config/database');
const bcrypt = require('bcryptjs');
const config = require('../config/config');

/**
 * 用户数据模型
 */
class User {
  constructor(data = {}) {
    this.id = data.id;
    this.student_id = data.student_id;
    this.name = data.name;
    this.password = data.password;
    this.role = data.role || 'student';
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
  }

  /**
   * 根据学号查找用户
   * @param {string} studentId - 学号
   * @returns {User|null} - 用户实例或null
   */
  static async findByStudentId(studentId) {
    try {
      console.log('🔍 User.findByStudentId 开始查询:', studentId);
      
      const users = await query(
        'SELECT * FROM users WHERE student_id = ?',
        [studentId]
      );

      console.log('📊 数据库查询结果:', {
        查询SQL: 'SELECT * FROM users WHERE student_id = ?',
        参数: [studentId],
        结果数量: users ? users.length : 0,
        结果详情: users
      });

      if (users && users.length > 0) {
        const user = new User(users[0]);
        console.log('✅ 找到用户，创建User实例:', {
          id: user.id,
          student_id: user.student_id,
          name: user.name,
          role: user.role,
          password: user.password ? '***已加密***' : '无密码'
        });
        return user;
      } else {
        console.log('❌ 未找到用户');
        return null;
      }
    } catch (error) {
      console.error('💥 根据学号查找用户错误:', error);
      console.error('错误堆栈:', error.stack);
      throw error;
    }
  }

  /**
   * 根据ID查找用户
   * @param {number} id - 用户ID
   * @returns {User|null} - 用户实例或null
   */
  static async findById(id) {
    try {
      console.log('🔍 User.findById 开始查询:', id);
      
      const users = await query(
        'SELECT * FROM users WHERE id = ?',
        [id]
      );

      console.log('📊 findById查询结果:', users ? users.length : 0);

      return users && users.length > 0 ? new User(users[0]) : null;
    } catch (error) {
      console.error('💥 根据ID查找用户错误:', error);
      throw error;
    }
  }

  /**
   * 验证密码
   * @param {string} plainPassword - 明文密码
   * @returns {boolean} - 验证结果
   */
  async verifyPassword(plainPassword) {
    try {
      console.log('🔐 开始密码验证:');
      console.log('输入密码:', plainPassword);
      console.log('数据库密码hash:', this.password);
      
      if (!this.password) {
        console.log('❌ 数据库中没有密码hash');
        return false;
      }

      if (!plainPassword) {
        console.log('❌ 输入密码为空');
        return false;
      }

      const result = await bcrypt.compare(plainPassword, this.password);
      console.log('🔐 密码验证结果:', result);
      
      return result;
    } catch (error) {
      console.error('💥 密码验证错误:', error);
      return false;
    }
  }

  /**
   * 加密密码
   * @param {string} plainPassword - 明文密码
   * @returns {string} - 加密后的密码
   */
  static async hashPassword(plainPassword) {
    try {
      const rounds = config?.bcrypt?.rounds || 10;
      console.log('🔐 加密密码，rounds:', rounds);
      return await bcrypt.hash(plainPassword, rounds);
    } catch (error) {
      console.error('💥 密码加密错误:', error);
      throw error;
    }
  }

  /**
   * 创建新用户
   * @param {Object} userData - 用户数据
   * @returns {User} - 新用户实例
   */
  static async create(userData) {
    try {
      const { student_id, name, password, role = 'student' } = userData;

      // 检查学号是否已存在
      const existingUser = await User.findByStudentId(student_id);
      if (existingUser) {
        throw new Error('学号已存在');
      }

      // 加密密码
      const hashedPassword = await User.hashPassword(password);

      // 插入新用户
      const result = await query(
        'INSERT INTO users (student_id, name, password, role, created_at) VALUES (?, ?, ?, ?, NOW())',
        [student_id, name, hashedPassword, role]
      );

      // 返回新用户
      return await User.findById(result.insertId);
    } catch (error) {
      console.error('💥 创建用户错误:', error);
      throw error;
    }
  }

  /**
   * 获取所有学生
   * @returns {Array} - 学生列表
   */
  static async getAllStudents() {
    try {
      const students = await query(
        'SELECT id, student_id, name, created_at FROM users WHERE role = ? ORDER BY student_id',
        ['student']
      );

      return students ? students.map(student => new User(student)) : [];
    } catch (error) {
      console.error('💥 获取学生列表错误:', error);
      throw error;
    }
  }

  /**
   * 获取所有教师
   * @returns {Array} - 教师列表
   */
  static async getAllTeachers() {
    try {
      const teachers = await query(
        'SELECT id, student_id, name, created_at FROM users WHERE role = ? ORDER BY student_id',
        ['teacher']
      );

      return teachers ? teachers.map(teacher => new User(teacher)) : [];
    } catch (error) {
      console.error('💥 获取教师列表错误:', error);
      throw error;
    }
  }

  /**
   * 更新用户信息
   * @param {Object} updateData - 更新数据
   * @returns {boolean} - 更新结果
   */
  async update(updateData) {
    try {
      const { name, password } = updateData;
      const updates = [];
      const params = [];

      if (name) {
        updates.push('name = ?');
        params.push(name);
        this.name = name;
      }

      if (password) {
        const hashedPassword = await User.hashPassword(password);
        updates.push('password = ?');
        params.push(hashedPassword);
        this.password = hashedPassword;
      }

      if (updates.length === 0) {
        return true; // 没有需要更新的字段
      }

      updates.push('updated_at = NOW()');
      params.push(this.id);

      await query(
        `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
        params
      );

      return true;
    } catch (error) {
      console.error('💥 更新用户错误:', error);
      throw error;
    }
  }

  /**
   * 删除用户
   * @returns {boolean} - 删除结果
   */
  async delete() {
    try {
      const result = await query(
        'DELETE FROM users WHERE id = ?',
        [this.id]
      );

      return result && result.affectedRows > 0;
    } catch (error) {
      console.error('💥 删除用户错误:', error);
      throw error;
    }
  }

  /**
   * 获取用户统计信息
   * @returns {Object} - 统计数据
   */
  static async getStats() {
    try {
      const stats = await query(`
        SELECT 
          role,
          COUNT(*) as count
        FROM users
        GROUP BY role
      `);

      const result = {
        total: 0,
        students: 0,
        teachers: 0
      };

      if (stats && stats.length > 0) {
        stats.forEach(stat => {
          result.total += stat.count;
          if (stat.role === 'student') {
            result.students = stat.count;
          } else if (stat.role === 'teacher') {
            result.teachers = stat.count;
          }
        });
      }

      return result;
    } catch (error) {
      console.error('💥 获取用户统计错误:', error);
      throw error;
    }
  }

  /**
   * 检查用户是否为学生
   * @returns {boolean} - 是否为学生
   */
  isStudent() {
    return this.role === 'student';
  }

  /**
   * 检查用户是否为教师
   * @returns {boolean} - 是否为教师
   */
  isTeacher() {
    return this.role === 'teacher';
  }

  /**
   * 获取安全的用户信息（不包含密码）
   * @returns {Object} - 安全的用户信息
   */
  getSafeInfo() {
    return {
      id: this.id,
      studentId: this.student_id,  // 注意：这里改为驼峰命名，与前端保持一致
      name: this.name,
      role: this.role,
      created_at: this.created_at,
      updated_at: this.updated_at
    };
  }

  /**
   * 验证用户数据
   * @param {Object} userData - 用户数据
   * @returns {Array} - 验证错误列表
   */
  static validateUserData(userData) {
    const errors = [];
    const { student_id, name, password, role } = userData;

    // 验证学号
    if (!student_id || typeof student_id !== 'string') {
      errors.push('学号不能为空');
    } else if (student_id.length < 3 || student_id.length > 20) {
      errors.push('学号长度必须在3-20字符之间');
    }

    // 验证姓名
    if (!name || typeof name !== 'string') {
      errors.push('姓名不能为空');
    } else if (name.length < 2 || name.length > 50) {
      errors.push('姓名长度必须在2-50字符之间');
    }

    // 验证密码
    if (!password || typeof password !== 'string') {
      errors.push('密码不能为空');
    } else if (password.length < 6) {
      errors.push('密码长度不能少于6字符');
    }

    // 验证角色
    const validRoles = ['student', 'teacher'];
    if (role && !validRoles.includes(role)) {
      errors.push(`角色必须是以下值之一: ${validRoles.join(', ')}`);
    }

    return errors;
  }
}

module.exports = User;