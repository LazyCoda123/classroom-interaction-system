// backend/services/questionService.js - 修复LIMIT参数类型版本
const { query } = require('../config/database');

/**
 * 问题业务逻辑服务类 - 修复版本
 */
class QuestionService {

  /**
   * 🔥 修复：获取所有问题列表（教师端）
   * @param {Object} options - 查询选项
   * @returns {Object} - 问题列表和统计信息
   */
  static async getAllQuestions(options = {}) {
    try {
      console.log('🔍 QuestionService.getAllQuestions 开始:', options);
      
      const { 
        status,           
        categoryId,       
        search,           
        page = 1, 
        limit = 20
      } = options;

      // 🔥 修复：确保分页参数是整数类型
      const pageNum = parseInt(page) || 1;
      const limitNum = parseInt(limit) || 20;
      const offset = (pageNum - 1) * limitNum;

      // 构建查询条件
      let whereConditions = [];
      let queryParams = [];
      
      // 状态筛选
      if (status && ['pending', 'classified'].includes(status)) {
        whereConditions.push('q.status = ?');
        queryParams.push(status);
      }
      
      // 分类筛选
      if (categoryId && !isNaN(parseInt(categoryId))) {
        whereConditions.push('q.category_id = ?');
        queryParams.push(parseInt(categoryId));
      }
      
      // 搜索筛选
      if (search && search.trim()) {
        whereConditions.push('(q.content LIKE ? OR u.name LIKE ? OR u.student_id LIKE ?)');
        const searchTerm = `%${search.trim()}%`;
        queryParams.push(searchTerm, searchTerm, searchTerm);
      }
      
      // 构建WHERE子句
      const whereClause = whereConditions.length > 0 
        ? 'WHERE ' + whereConditions.join(' AND ')
        : '';
      
      // 🔥 修复：使用字符串拼接而不是参数化查询来处理LIMIT和OFFSET
      const sql = `
        SELECT 
          q.id,
          q.content,
          q.status,
          q.created_at,
          q.updated_at,
          u.student_id,
          u.name as student_name,
          c.id as category_id,
          c.name as category_name
        FROM questions q
        INNER JOIN users u ON q.student_id = u.id
        LEFT JOIN categories c ON q.category_id = c.id
        ${whereClause}
        ORDER BY q.created_at DESC
        LIMIT ${limitNum} OFFSET ${offset}
      `;
      
      console.log('🔍 执行SQL:', sql);
      console.log('📝 参数:', queryParams);
      
      // 执行查询
      const questions = await query(sql, queryParams);
      
      console.log('✅ 查询成功，返回', questions.length, '条记录');

      // 获取筛选后的总数
      const countSql = `
        SELECT COUNT(*) as total
        FROM questions q
        LEFT JOIN users u ON q.student_id = u.id
        ${whereClause}
      `;
      
      const countResult = await query(countSql, queryParams);
      const total = countResult[0].total;
      
      // 获取基础统计
      const stats = await this.getBasicStats();
      
      return {
        success: true,
        questions: questions,
        pagination: {
          current: pageNum,
          pageSize: limitNum,
          total: total,
          pages: Math.ceil(total / limitNum)
        },
        stats
      };

    } catch (error) {
      console.error('❌ QuestionService.getAllQuestions 错误:', error);
      throw error;
    }
  }

  /**
   * 🔥 修复：获取基础统计信息
   */
  static async getBasicStats() {
    try {
      console.log('📊 获取基础统计信息');
      
      // 基础统计查询
      const statsResult = await query(`
        SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
          SUM(CASE WHEN status = 'classified' THEN 1 ELSE 0 END) as classified
        FROM questions
      `);
      
      // 分类统计查询
      const categoryStatsResult = await query(`
        SELECT 
          COUNT(DISTINCT c.id) as total_categories,
          COUNT(DISTINCT CASE WHEN q.id IS NOT NULL THEN c.id END) as used_categories,
          COUNT(q.id) as total_classified_questions
        FROM categories c
        LEFT JOIN questions q ON c.id = q.category_id AND q.status = 'classified'
      `);
      
      const stats = statsResult[0] || { total: 0, pending: 0, classified: 0 };
      const categoryStats = categoryStatsResult[0] || { total_categories: 0, used_categories: 0, total_classified_questions: 0 };
      
      console.log('📊 统计结果:', { stats, categoryStats });
      
      return {
        basic: stats,
        categories: categoryStats,
        daily: []
      };
      
    } catch (error) {
      console.error('❌ 获取统计信息错误:', error);
      return {
        basic: { total: 0, pending: 0, classified: 0 },
        categories: { total_categories: 0, used_categories: 0, total_classified_questions: 0 },
        daily: []
      };
    }
  }

  /**
   * 🔥 修复：创建新问题
   */
  static async createQuestion(userId, content) {
    try {
      console.log('📝 创建问题:', { userId, contentLength: content.length });
      
      // 简单验证
      if (!content || content.trim().length === 0) {
        throw new Error('问题内容不能为空');
      }
      
      if (content.length > 1000) {
        throw new Error('问题内容不能超过1000字符');
      }
      
      // 🔥 修复：使用正确的字段名
      const existingQuestions = await query(
        'SELECT id FROM questions WHERE student_id = ?',
        [userId]
      );

      if (existingQuestions.length > 0) {
        throw new Error('每位学生只能提交一个问题');
      }

      // 🔥 修复：插入新问题时使用正确的字段名
      const result = await query(
        'INSERT INTO questions (student_id, content, status, created_at) VALUES (?, ?, ?, NOW())',
        [userId, content.trim(), 'pending']
      );

      // 获取创建的问题详情
      const questionResult = await query(`
        SELECT 
          q.id,
          q.content,
          q.status,
          q.created_at,
          u.student_id,
          u.name as student_name
        FROM questions q
        INNER JOIN users u ON q.student_id = u.id
        WHERE q.id = ?
      `, [result.insertId]);

      console.log('✅ 问题创建成功:', result.insertId);

      return {
        success: true,
        questionId: result.insertId,
        question: questionResult[0] || null,
        message: '问题提交成功'
      };

    } catch (error) {
      console.error('❌ 创建问题错误:', error);
      throw error;
    }
  }

  /**
   * 🔥 修复：获取学生的问题
   */
  static async getStudentQuestion(userId) {
    try {
      console.log('🔍 获取学生问题:', userId);
      
      // 🔥 修复：使用正确的字段名
      const questions = await query(`
        SELECT 
          q.id,
          q.content,
          q.status,
          q.created_at,
          q.updated_at,
          c.id as category_id,
          c.name as category_name
        FROM questions q
        LEFT JOIN categories c ON q.category_id = c.id
        WHERE q.student_id = ?
        ORDER BY q.created_at DESC
        LIMIT 1
      `, [userId]);

      console.log('✅ 学生问题查询完成');

      return {
        success: true,
        question: questions[0] || null
      };

    } catch (error) {
      console.error('❌ 获取学生问题错误:', error);
      throw error;
    }
  }

  /**
   * 获取问题统计信息（简化版）
   */
  static async getQuestionStats() {
    try {
      return await this.getBasicStats();
    } catch (error) {
      console.error('❌ 获取问题统计错误:', error);
      throw error;
    }
  }

  /**
   * 🔥 修复：获取单个问题详情
   */
  static async getQuestionById(questionId) {
    try {
      console.log('🔍 获取问题详情:', questionId);
      
      // 🔥 修复：使用正确的字段名
      const questions = await query(`
        SELECT 
          q.id,
          q.content,
          q.status,
          q.created_at,
          q.updated_at,
          u.id as user_id,
          u.student_id,
          u.name as student_name,
          c.id as category_id,
          c.name as category_name
        FROM questions q
        INNER JOIN users u ON q.student_id = u.id
        LEFT JOIN categories c ON q.category_id = c.id
        WHERE q.id = ?
      `, [questionId]);

      if (questions.length === 0) {
        return {
          success: false,
          message: '问题不存在'
        };
      }

      console.log('✅ 问题详情查询成功');

      return {
        success: true,
        question: questions[0]
      };

    } catch (error) {
      console.error('❌ 获取问题详情错误:', error);
      throw error;
    }
  }

  /**
   * 删除问题
   */
  static async deleteQuestion(questionId) {
    try {
      console.log('🗑️ 删除问题:', questionId);
      
      const result = await query(
        'DELETE FROM questions WHERE id = ?',
        [questionId]
      );

      if (result.affectedRows === 0) {
        throw new Error('问题不存在');
      }

      console.log('✅ 问题删除成功');

      return {
        success: true,
        message: '问题删除成功'
      };

    } catch (error) {
      console.error('❌ 删除问题错误:', error);
      throw error;
    }
  }

  /**
   * 更新问题分类
   */
  static async updateQuestionCategory(questionId, categoryId) {
    try {
      console.log('🏷️ 更新问题分类:', { questionId, categoryId });
      
      // 验证问题是否存在
      const questionExists = await query(
        'SELECT id FROM questions WHERE id = ?',
        [questionId]
      );

      if (questionExists.length === 0) {
        throw new Error('问题不存在');
      }

      // 验证分类是否存在
      const categoryExists = await query(
        'SELECT id, name FROM categories WHERE id = ?',
        [categoryId]
      );

      if (categoryExists.length === 0) {
        throw new Error('指定的分类不存在');
      }

      // 更新问题分类
      await query(
        'UPDATE questions SET category_id = ?, status = ?, updated_at = NOW() WHERE id = ?',
        [categoryId, 'classified', questionId]
      );

      console.log('✅ 问题分类更新成功');

      return {
        success: true,
        questionId: parseInt(questionId),
        categoryId: parseInt(categoryId),
        categoryName: categoryExists[0].name,
        message: '问题分类更新成功'
      };

    } catch (error) {
      console.error('❌ 更新问题分类错误:', error);
      throw error;
    }
  }

  /**
   * 🔥 修复：获取待分类问题列表
   */
  static async getPendingQuestions() {
    try {
      console.log('📋 获取待分类问题');
      
      // 🔥 修复：使用正确的字段名
      const questions = await query(`
        SELECT 
          q.id,
          q.content,
          u.student_id,
          u.name as student_name
        FROM questions q
        INNER JOIN users u ON q.student_id = u.id
        WHERE q.status = 'pending'
        ORDER BY q.created_at ASC
      `);

      console.log('✅ 待分类问题查询成功:', questions.length, '条');

      return questions;

    } catch (error) {
      console.error('❌ 获取待分类问题错误:', error);
      throw error;
    }
  }

  /**
   * 批量更新问题状态
   */
  static async batchUpdateStatus(questionIds, status) {
    try {
      console.log('📝 批量更新问题状态:', { count: questionIds.length, status });
      
      if (!questionIds.length) {
        return { success: true, updated: 0 };
      }

      const placeholders = questionIds.map(() => '?').join(',');
      const result = await query(
        `UPDATE questions SET status = ?, updated_at = NOW() WHERE id IN (${placeholders})`,
        [status, ...questionIds]
      );

      console.log('✅ 批量更新成功:', result.affectedRows, '条');

      return {
        success: true,
        updated: result.affectedRows,
        message: `成功更新${result.affectedRows}个问题的状态`
      };

    } catch (error) {
      console.error('❌ 批量更新问题状态错误:', error);
      throw error;
    }
  }

  /**
   * 🔥 新增：更新问题内容
   */
  static async updateQuestion(questionId, updateData) {
    try {
      console.log('✏️ 更新问题:', { questionId, updateData });
      
      const { content, status, category_id } = updateData;
      const updates = [];
      const params = [];

      if (content !== undefined) {
        updates.push('content = ?');
        params.push(content.trim());
      }

      if (status !== undefined) {
        updates.push('status = ?');
        params.push(status);
      }

      if (category_id !== undefined) {
        updates.push('category_id = ?');
        params.push(category_id);
      }

      if (updates.length === 0) {
        return {
          success: false,
          message: '没有要更新的字段'
        };
      }

      updates.push('updated_at = NOW()');
      params.push(questionId);

      const result = await query(
        `UPDATE questions SET ${updates.join(', ')} WHERE id = ?`,
        params
      );

      if (result.affectedRows === 0) {
        return {
          success: false,
          message: '问题不存在'
        };
      }

      // 获取更新后的问题详情
      const updatedQuestion = await this.getQuestionById(questionId);

      console.log('✅ 问题更新成功');

      return {
        success: true,
        message: '问题更新成功',
        data: updatedQuestion.question
      };

    } catch (error) {
      console.error('❌ 更新问题错误:', error);
      throw error;
    }
  }
}

module.exports = QuestionService;