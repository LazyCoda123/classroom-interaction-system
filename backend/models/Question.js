// backend/models/Question.js - 修复字段名版本
const { query } = require('../config/database');
const config = require('../config/config');

/**
 * 问题数据模型
 */
class Question {
  constructor(data = {}) {
    this.id = data.id;
    this.student_id = data.student_id; // 🔥 修复：改为student_id（存储users表的id）
    this.content = data.content;
    this.category_id = data.category_id;
    this.status = data.status || 'pending';
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
    
    // 关联数据
    this.user_student_id = data.user_student_id; // 🔥 新增：用户的学号
    this.student_name = data.student_name;
    this.category_name = data.category_name;
  }

  /**
   * 根据ID查找问题
   * @param {number} id - 问题ID
   * @returns {Question|null} - 问题实例或null
   */
  static async findById(id) {
    try {
      const questions = await query(`
        SELECT 
          q.*,
          u.student_id as user_student_id,
          u.name as student_name,
          c.name as category_name
        FROM questions q
        INNER JOIN users u ON q.student_id = u.id
        LEFT JOIN categories c ON q.category_id = c.id
        WHERE q.id = ?
      `, [id]);

      return questions.length > 0 ? new Question(questions[0]) : null;
    } catch (error) {
      console.error('根据ID查找问题错误:', error);
      throw error;
    }
  }

  /**
   * 根据用户ID查找问题
   * @param {number} userId - 用户ID
   * @returns {Question|null} - 问题实例或null
   */
  static async findByUserId(userId) {
    try {
      const questions = await query(`
        SELECT 
          q.*,
          u.student_id as user_student_id,
          u.name as student_name,
          c.name as category_name
        FROM questions q
        INNER JOIN users u ON q.student_id = u.id
        LEFT JOIN categories c ON q.category_id = c.id
        WHERE q.student_id = ?
        ORDER BY q.created_at DESC
        LIMIT 1
      `, [userId]);

      return questions.length > 0 ? new Question(questions[0]) : null;
    } catch (error) {
      console.error('根据用户ID查找问题错误:', error);
      throw error;
    }
  }

  /**
   * 创建新问题
   * @param {Object} questionData - 问题数据
   * @returns {Question} - 新问题实例
   */
  static async create(questionData) {
    try {
      const { student_id, content } = questionData; // 🔥 修复：改为student_id

      // 验证问题数据
      const validationErrors = Question.validateQuestionData(questionData);
      if (validationErrors.length > 0) {
        throw new Error(validationErrors.join(', '));
      }

      // 检查用户是否已经提交过问题
      const existingQuestion = await Question.findByUserId(student_id);
      if (existingQuestion) {
        throw new Error('每位学生只能提交一个问题');
      }

      // 插入新问题
      const result = await query(
        'INSERT INTO questions (student_id, content, status, created_at) VALUES (?, ?, ?, NOW())',
        [student_id, content.trim(), 'pending']
      );

      // 返回新问题
      return await Question.findById(result.insertId);
    } catch (error) {
      console.error('创建问题错误:', error);
      throw error;
    }
  }

  /**
   * 获取所有问题
   * @param {Object} options - 查询选项
   * @returns {Object} - 问题列表和分页信息
   */
  static async findAll(options = {}) {
    try {
      const { 
        status, 
        category_id,
        student_id, // 🔥 修复：改为student_id
        page = 1, 
        limit = 50,
        sort = 'created_at',
        order = 'DESC'
      } = options;

      // 构建查询条件
      const conditions = [];
      const params = [];

      if (status) {
        conditions.push('q.status = ?');
        params.push(status);
      }

      if (category_id) {
        conditions.push('q.category_id = ?');
        params.push(category_id);
      }

      if (student_id) {
        conditions.push('q.student_id = ?');
        params.push(student_id);
      }

      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

      // 计算分页
      const offset = (page - 1) * limit;
      
      // 查询问题列表
      const questions = await query(`
        SELECT 
          q.*,
          u.student_id as user_student_id,
          u.name as student_name,
          c.name as category_name
        FROM questions q
        INNER JOIN users u ON q.student_id = u.id
        LEFT JOIN categories c ON q.category_id = c.id
        ${whereClause}
        ORDER BY q.${sort} ${order}
        LIMIT ? OFFSET ?
      `, [...params, parseInt(limit), offset]);

      // 查询总数
      const totalResult = await query(`
        SELECT COUNT(*) as total
        FROM questions q
        ${whereClause}
      `, params);

      const total = totalResult[0].total;

      return {
        questions: questions.map(q => new Question(q)),
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      console.error('获取问题列表错误:', error);
      throw error;
    }
  }

  /**
   * 获取待分类问题
   * @returns {Array} - 待分类问题列表
   */
  static async findPending() {
    try {
      const questions = await query(`
        SELECT 
          q.*,
          u.student_id as user_student_id,
          u.name as student_name
        FROM questions q
        INNER JOIN users u ON q.student_id = u.id
        WHERE q.status = 'pending'
        ORDER BY q.created_at ASC
      `);

      return questions.map(q => new Question(q));
    } catch (error) {
      console.error('获取待分类问题错误:', error);
      throw error;
    }
  }

  /**
   * 更新问题
   * @param {Object} updateData - 更新数据
   * @returns {boolean} - 更新结果
   */
  async update(updateData) {
    try {
      const { content, category_id, status } = updateData;
      const updates = [];
      const params = [];

      if (content !== undefined) {
        updates.push('content = ?');
        params.push(content.trim());
        this.content = content.trim();
      }

      if (category_id !== undefined) {
        updates.push('category_id = ?');
        params.push(category_id);
        this.category_id = category_id;
      }

      if (status !== undefined) {
        updates.push('status = ?');
        params.push(status);
        this.status = status;
      }

      if (updates.length === 0) {
        return true; // 没有需要更新的字段
      }

      updates.push('updated_at = NOW()');
      params.push(this.id);

      await query(
        `UPDATE questions SET ${updates.join(', ')} WHERE id = ?`,
        params
      );

      return true;
    } catch (error) {
      console.error('更新问题错误:', error);
      throw error;
    }
  }

  /**
   * 设置问题分类
   * @param {number} categoryId - 分类ID
   * @returns {boolean} - 设置结果
   */
  async setCategory(categoryId) {
    try {
      await query(
        'UPDATE questions SET category_id = ?, status = ?, updated_at = NOW() WHERE id = ?',
        [categoryId, 'classified', this.id]
      );

      this.category_id = categoryId;
      this.status = 'classified';
      return true;
    } catch (error) {
      console.error('设置问题分类错误:', error);
      throw error;
    }
  }

  /**
   * 删除问题
   * @returns {boolean} - 删除结果
   */
  async delete() {
    try {
      const result = await query(
        'DELETE FROM questions WHERE id = ?',
        [this.id]
      );

      return result.affectedRows > 0;
    } catch (error) {
      console.error('删除问题错误:', error);
      throw error;
    }
  }

  /**
   * 获取问题统计信息
   * @returns {Object} - 统计数据
   */
  static async getStats() {
    try {
      // 基本统计
      const basicStats = await query(`
        SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
          SUM(CASE WHEN status = 'classified' THEN 1 ELSE 0 END) as classified
        FROM questions
      `);

      // 按分类统计
      const categoryStats = await query(`
        SELECT 
          c.id,
          c.name,
          COUNT(q.id) as question_count
        FROM categories c
        LEFT JOIN questions q ON c.id = q.category_id AND q.status = 'classified'
        GROUP BY c.id, c.name
        ORDER BY question_count DESC
      `);

      // 按状态统计
      const statusStats = await query(`
        SELECT 
          status,
          COUNT(*) as count
        FROM questions
        GROUP BY status
      `);

      return {
        basic: basicStats[0] || { total: 0, pending: 0, classified: 0 },
        categories: categoryStats,
        status: statusStats
      };
    } catch (error) {
      console.error('获取问题统计错误:', error);
      throw error;
    }
  }

  /**
   * 批量分类问题
   * @param {Array} questionIds - 问题ID数组
   * @param {number} categoryId - 分类ID
   * @returns {number} - 更新的问题数量
   */
  static async batchClassify(questionIds, categoryId) {
    try {
      if (!questionIds.length) {
        return 0;
      }

      const placeholders = questionIds.map(() => '?').join(',');
      const result = await query(
        `UPDATE questions SET category_id = ?, status = ?, updated_at = NOW() WHERE id IN (${placeholders})`,
        [categoryId, 'classified', ...questionIds]
      );

      return result.affectedRows;
    } catch (error) {
      console.error('批量分类问题错误:', error);
      throw error;
    }
  }

  /**
   * 验证问题数据
   * @param {Object} questionData - 问题数据
   * @returns {Array} - 验证错误列表
   */
  static validateQuestionData(questionData) {
    const errors = [];
    const { student_id, content } = questionData; // 🔥 修复：改为student_id

    // 验证用户ID
    if (!student_id || typeof student_id !== 'number') {
      errors.push('用户ID不能为空');
    }

    // 验证问题内容
    if (!content || typeof content !== 'string') {
      errors.push('问题内容不能为空');
    } else {
      const trimmedContent = content.trim();
      if (trimmedContent.length === 0) {
        errors.push('问题内容不能只包含空白字符');
      } else if (trimmedContent.length < 10) {
        errors.push('问题内容不能少于10个字符');
      } else if (trimmedContent.length > config.limits.questionLength) {
        errors.push(`问题内容不能超过${config.limits.questionLength}个字符`);
      }
    }

    return errors;
  }

  /**
   * 检查问题是否已分类
   * @returns {boolean} - 是否已分类
   */
  isClassified() {
    return this.status === 'classified' && this.category_id;
  }

  /**
   * 检查问题是否待分类
   * @returns {boolean} - 是否待分类
   */
  isPending() {
    return this.status === 'pending';
  }

  /**
   * 获取问题的安全信息（用于前端显示）
   * @returns {Object} - 安全的问题信息
   */
  getSafeInfo() {
    return {
      id: this.id,
      content: this.content,
      status: this.status,
      category_id: this.category_id,
      category_name: this.category_name,
      student_id: this.user_student_id, // 🔥 修复：返回学号
      student_name: this.student_name,
      created_at: this.created_at,
      updated_at: this.updated_at
    };
  }
}

module.exports = Question;