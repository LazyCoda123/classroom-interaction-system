// backend/routes/questions.js - 修复LIMIT参数类型版本

const express = require('express');
const { authenticateToken, requireStudent, requireTeacher } = require('../middleware/auth');
const { validateQuestion, validateQuery, validateId } = require('../middleware/validation');
const QuestionService = require('../services/questionService');
const Question = require('../models/Question');
const User = require('../models/User');
const { query } = require('../config/database');

// 引入AI分类服务
const { classifyQuestion } = require('../services/aiClassification');

const router = express.Router();

// 学生提交问题
router.post('/', authenticateToken, requireStudent, validateQuestion, async (req, res) => {
  try {
    const { content } = req.body;
    const userId = req.user.id;

    console.log('📝 学生提交问题:', { userId, content: content.substring(0, 50) + '...' });

    // 使用QuestionService创建问题
    const result = await QuestionService.createQuestion(userId, content);

    console.log('✅ 问题提交成功:', result.questionId);

    // 对新创建的问题进行AI分类（异步处理，不阻塞响应）
    if (result.success && result.questionId) {
      setImmediate(async () => {
        try {
          console.log(`🤖 开始对新问题 ${result.questionId} 进行AI分类...`);
          
          // 只对这个新创建的问题进行分类
          const categoryId = await classifyQuestion(content);
          
          // 更新这个问题的分类结果
          const updateResult = await QuestionService.updateQuestionCategory(result.questionId, categoryId);
          
          if (updateResult.success) {
            console.log(`✅ 问题 ${result.questionId} AI分类完成: ${updateResult.categoryName} (分类${categoryId})`);
          } else {
            console.error(`❌ 问题 ${result.questionId} 分类更新失败:`, updateResult.message);
          }
          
        } catch (classifyError) {
          console.error(`❌ 问题 ${result.questionId} AI分类失败:`, classifyError);
          
          // 分类失败时，将这个问题标记为"其他类问题"
          try {
            await QuestionService.updateQuestionCategory(result.questionId, 6);
            console.log(`⚠️ 问题 ${result.questionId} 已标记为"其他类问题"`);
          } catch (fallbackError) {
            console.error(`❌ 问题 ${result.questionId} 备用分类也失败:`, fallbackError);
          }
        }
      });
    }

    res.status(201).json({
      success: true,
      message: result.message + ' (AI正在智能分析中...)',
      data: {
        questionId: result.questionId,
        question: result.question
      }
    });

  } catch (error) {
    console.error('❌ 提交问题错误:', error);
    
    if (error.message.includes('只能提交一个问题')) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: '提交问题失败，请稍后重试'
    });
  }
});

// 获取当前学生的问题
router.get('/mine', authenticateToken, requireStudent, async (req, res) => {
  try {
    const userId = req.user.id;
    console.log('📋 获取学生问题:', { userId, studentId: req.user.studentId });

    // 使用QuestionService获取学生问题
    const result = await QuestionService.getStudentQuestion(userId);

    console.log('✅ 获取问题结果:', { 
      hasQuestion: !!result.question,
      questionId: result.question?.id 
    });

    res.json({
      success: true,
      data: result.question || null,
      message: result.question ? '获取问题成功' : '暂无问题'
    });

  } catch (error) {
    console.error('❌ 获取学生问题错误:', error);
    res.status(500).json({
      success: false,
      message: '获取问题失败'
    });
  }
});

// 学生删除自己的问题
router.delete('/mine', authenticateToken, requireStudent, async (req, res) => {
  try {
    const userId = req.user.id;
    console.log('🗑️ 学生删除问题:', { userId, studentId: req.user.studentId });

    // 先获取学生的问题
    const questionResult = await QuestionService.getStudentQuestion(userId);
    if (!questionResult.question) {
      return res.status(404).json({
        success: false,
        message: '没有找到要删除的问题'
      });
    }

    // 删除问题
    const result = await QuestionService.deleteQuestion(questionResult.question.id);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.message || '删除失败'
      });
    }

    console.log('✅ 学生问题删除成功');

    res.json({
      success: true,
      message: '问题删除成功，你现在可以重新提交问题了'
    });

  } catch (error) {
    console.error('❌ 删除问题错误:', error);
    res.status(500).json({
      success: false,
      message: '删除问题失败，请稍后重试'
    });
  }
});

// 兼容性路由：同时支持 /my（保持向后兼容）
router.get('/my', authenticateToken, requireStudent, async (req, res) => {
  try {
    const userId = req.user.id;
    console.log('📋 获取学生问题(兼容路由):', { userId, studentId: req.user.studentId });

    // 使用QuestionService获取学生问题
    const result = await QuestionService.getStudentQuestion(userId);

    res.json({
      success: true,
      data: {
        question: result.question || null
      }
    });

  } catch (error) {
    console.error('❌ 获取学生问题错误:', error);
    res.status(500).json({
      success: false,
      message: '获取问题失败'
    });
  }
});

// 学生可访问的公开统计数据 - 🔥 修复版本
router.get('/stats/public', async (req, res) => {
    try {
      console.log('📊 获取公开统计数据');
  
      // 获取总问题数
      const totalQuestionsResult = await query('SELECT COUNT(*) as count FROM questions');
      const totalQuestions = totalQuestionsResult[0].count;
  
      // 获取已分类问题数
      const classifiedQuestionsResult = await query(
        'SELECT COUNT(*) as count FROM questions WHERE status = ?', 
        ['classified']
      );
      const classifiedQuestions = classifiedQuestionsResult[0].count;
  
      // 获取学生总数
      const totalUsersResult = await query(
        'SELECT COUNT(*) as count FROM users WHERE role = ?', 
        ['student']
      );
      const totalUsers = totalUsersResult[0].count;
  
      // 计算待分类问题数
      const pendingQuestions = totalQuestions - classifiedQuestions;
  
      const stats = {
        totalQuestions,
        classifiedQuestions,
        pendingQuestions,
        activeUsers: totalUsers
      };
  
      console.log('📊 公开统计数据:', stats);
  
      res.json({
        success: true,
        data: stats
      });
  
    } catch (error) {
      console.error('❌ 获取公开统计数据错误:', error);
      res.status(500).json({
        success: false,
        message: '获取统计数据失败',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  });

// 获取问题统计信息（教师权限）- 🔥 修复版本
router.get('/stats/overview', authenticateToken, requireTeacher, async (req, res) => {
    try {
      console.log('📊 获取详细统计数据（教师权限）');
  
      // 获取总问题数
      const totalQuestionsResult = await query('SELECT COUNT(*) as count FROM questions');
      const totalQuestions = totalQuestionsResult[0].count;
  
      // 获取已分类问题数
      const classifiedQuestionsResult = await query(
        'SELECT COUNT(*) as count FROM questions WHERE status = ?', 
        ['classified']
      );
      const classifiedQuestions = classifiedQuestionsResult[0].count;
  
      // 🔥 修复：获取活跃学生数（有提问的学生）
      const activeUsersResult = await query(`
        SELECT COUNT(DISTINCT student_id) as count 
        FROM questions 
        WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
      `);
      const activeUsers = activeUsersResult[0].count;
  
      // 获取各分类的问题数量
      const categoryStatsResult = await query(`
        SELECT 
          c.name as categoryName, 
          COUNT(q.id) as questionCount 
        FROM categories c 
        LEFT JOIN questions q ON c.id = q.category_id 
        GROUP BY c.id, c.name 
        ORDER BY questionCount DESC
      `);
  
      // 计算分类率
      const classificationRate = totalQuestions > 0 
        ? (classifiedQuestions / totalQuestions * 100).toFixed(1) 
        : 0;
  
      const stats = {
        total: totalQuestions,
        classified: classifiedQuestions,
        pending: totalQuestions - classifiedQuestions,
        activeUsers: activeUsers,
        classificationRate: parseFloat(classificationRate),
        categoryBreakdown: categoryStatsResult
      };
  
      console.log('📊 详细统计数据:', stats);
  
      res.json({
        success: true,
        data: { stats }
      });
  
    } catch (error) {
      console.error('❌ 获取问题统计错误:', error);
      res.status(500).json({
        success: false,
        message: '获取问题统计失败',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  });

// 获取实时活动数据 - 🔥 修复版本
router.get('/stats/activity', async (req, res) => {
    try {
      console.log('📊 获取实时活动数据');
  
      // 今日新增问题
      const todayQuestionsResult = await query(`
        SELECT COUNT(*) as count 
        FROM questions 
        WHERE DATE(created_at) = CURDATE()
      `);
      const todayQuestions = todayQuestionsResult[0].count;
  
      // 本周新增问题
      const weekQuestionsResult = await query(`
        SELECT COUNT(*) as count 
        FROM questions 
        WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
      `);
      const weekQuestions = weekQuestionsResult[0].count;
  
      // 🔥 修复：最近活跃学生
      const recentActiveUsersResult = await query(`
        SELECT COUNT(DISTINCT student_id) as count 
        FROM questions 
        WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
      `);
      const recentActiveUsers = recentActiveUsersResult[0].count;
  
      // 平均每日问题数（近7天）
      const avgDailyQuestions = weekQuestions > 0 ? (weekQuestions / 7).toFixed(1) : 0;
  
      const activityStats = {
        todayQuestions,
        weekQuestions,
        recentActiveUsers,
        avgDailyQuestions: parseFloat(avgDailyQuestions)
      };
  
      console.log('📊 实时活动数据:', activityStats);
  
      res.json({
        success: true,
        data: activityStats
      });
  
    } catch (error) {
      console.error('❌ 获取活动数据错误:', error);
      res.status(500).json({
        success: false,
        message: '获取活动数据失败',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  });

// 🔥 修复：教师获取所有问题列表
router.get('/', authenticateToken, requireTeacher, validateQuery, async (req, res) => {
    try {
      const { 
        status,           
        categoryId,       
        search,           
        page = 1, 
        limit = 20,       
        pageSize          
      } = req.query;

      // 优先使用pageSize，如果没有则使用limit
      const actualLimit = pageSize || limit;
  
      console.log('👩‍🏫 教师获取问题列表:', { status, categoryId, search, page, limit: actualLimit });

      try {
        // 使用QuestionService获取问题列表
        const result = await QuestionService.getAllQuestions({
          status,
          categoryId: categoryId ? parseInt(categoryId) : undefined,
          search,
          page: parseInt(page) || 1,
          limit: parseInt(actualLimit) || 20
        });

        res.json({
          success: true,
          data: {
            questions: result.questions.map(q => 
              typeof q.getSafeInfo === 'function' ? q.getSafeInfo() : q
            ),
            pagination: result.pagination,
            stats: result.stats
          }
        });

      } catch (serviceError) {
        console.warn('⚠️ QuestionService失败，使用原生SQL备用方案:', serviceError.message);
        
        // 🔥 备用方案：使用原生SQL，修复字段名和LIMIT参数
        let whereConditions = [];
        let queryParams = [];
        
        // 🔥 修复：确保分页参数是整数类型
        const pageNum = parseInt(page) || 1;
        const limitNum = parseInt(actualLimit) || 20;
        const offset = (pageNum - 1) * limitNum;
        
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
        
        // 🔥 修复：获取筛选后的总数
        const countSql = `
          SELECT COUNT(*) as total
          FROM questions q
          LEFT JOIN users u ON q.student_id = u.id
          ${whereClause}
        `;
        
        const countResult = await query(countSql, queryParams);
        const total = countResult[0].total;
        
        // 🔥 修复：获取筛选后的问题列表，使用字符串拼接而不是参数化查询处理LIMIT
        const questionsSql = `
          SELECT 
            q.id,
            q.content,
            q.status,
            q.category_id,
            q.created_at,
            q.updated_at,
            q.student_id as user_id,
            u.name as student_name,
            u.student_id,
            c.name as category_name
          FROM questions q
          LEFT JOIN users u ON q.student_id = u.id
          LEFT JOIN categories c ON q.category_id = c.id
          ${whereClause}
          ORDER BY q.created_at DESC
          LIMIT ${limitNum} OFFSET ${offset}
        `;
        
        const questions = await query(questionsSql, queryParams);
        
        // 🔥 修复：计算统计信息
        const statsSql = `
          SELECT 
            COUNT(*) as total,
            SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
            SUM(CASE WHEN status = 'classified' THEN 1 ELSE 0 END) as classified
          FROM questions q
          LEFT JOIN users u ON q.student_id = u.id
          ${whereClause}
        `;
        
        const statsResult = await query(statsSql, queryParams);
        const stats = statsResult[0];
        
        console.log('✅ 原生SQL筛选结果:', {
          total: questions.length,
          filteredTotal: total,
          stats
        });
    
        res.json({
          success: true,
          data: {
            questions,
            pagination: {
              current: pageNum,
              pageSize: limitNum,
              total: total,
              pages: Math.ceil(total / limitNum)
            },
            stats: {
              basic: stats,
              filtered: {
                total: total,
                displayed: questions.length
              }
            },
            filters: {
              status,
              categoryId,
              search
            }
          }
        });
      }
  
    } catch (error) {
      console.error('❌ 获取问题列表错误:', error);
      res.status(500).json({
        success: false,
        message: '获取问题列表失败',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  });

// 教师获取单个问题详情
router.get('/:id', authenticateToken, requireTeacher, validateId(), async (req, res) => {
  try {
    const questionId = req.params.id;

    console.log('👩‍🏫 教师获取问题详情:', questionId);

    // 使用QuestionService获取问题详情
    const result = await QuestionService.getQuestionById(questionId);

    if (!result.success) {
      return res.status(404).json({
        success: false,
        message: result.message || '问题不存在'
      });
    }

    res.json({
      success: true,
      data: {
        question: result.question
      }
    });

  } catch (error) {
    console.error('❌ 获取问题详情错误:', error);
    res.status(500).json({
      success: false,
      message: '获取问题详情失败'
    });
  }
});

// 删除问题（教师权限）
router.delete('/:id', authenticateToken, requireTeacher, validateId(), async (req, res) => {
  try {
    const questionId = req.params.id;

    console.log('👩‍🏫 教师删除问题:', questionId);

    // 使用QuestionService删除问题
    const result = await QuestionService.deleteQuestion(questionId);

    if (!result.success) {
      return res.status(404).json({
        success: false,
        message: result.message || '问题不存在'
      });
    }

    res.json({
      success: true,
      message: result.message
    });

  } catch (error) {
    console.error('❌ 删除问题错误:', error);
    res.status(500).json({
      success: false,
      message: '删除问题失败'
    });
  }
});

// 批量更新问题状态（教师权限）
router.patch('/batch/status', authenticateToken, requireTeacher, async (req, res) => {
  try {
    const { questionIds, status } = req.body;

    console.log('📝 批量更新问题状态:', { count: questionIds?.length, status });

    if (!Array.isArray(questionIds) || questionIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: '问题ID列表不能为空'
      });
    }

    if (!['pending', 'classified'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: '无效的状态值'
      });
    }

    // 使用QuestionService批量更新状态
    const result = await QuestionService.batchUpdateStatus(questionIds, status);

    res.json({
      success: true,
      message: result.message,
      data: {
        updated: result.updated
      }
    });

  } catch (error) {
    console.error('❌ 批量更新问题状态错误:', error);
    res.status(500).json({
      success: false,
      message: '批量更新失败'
    });
  }
});

// 手动触发单个问题AI分类（教师权限）
router.post('/:id/classify', authenticateToken, requireTeacher, async (req, res) => {
  try {
    const questionId = req.params.id;
    console.log(`🤖 教师手动触发问题 ${questionId} AI分类`);

    // 获取问题信息
    const questionResult = await QuestionService.getQuestionById(questionId);
    if (!questionResult.success) {
      return res.status(404).json({
        success: false,
        message: '问题不存在'
      });
    }

    const question = questionResult.question;

    // 调用AI分类
    const categoryId = await classifyQuestion(question.content);
    
    // 更新分类结果
    const updateResult = await QuestionService.updateQuestionCategory(questionId, categoryId);
    
    if (!updateResult.success) {
      throw new Error(updateResult.message);
    }

    console.log(`✅ 问题 ${questionId} 手动分类完成: ${updateResult.categoryName}`);

    res.json({
      success: true,
      message: '问题分类成功',
      data: {
        questionId: parseInt(questionId),
        categoryId: updateResult.categoryId,
        categoryName: updateResult.categoryName
      }
    });

  } catch (error) {
    console.error('❌ 手动分类错误:', error);
    res.status(500).json({
      success: false,
      message: '问题分类失败'
    });
  }
});

// 更新问题内容（教师权限）
router.put('/:id', authenticateToken, requireTeacher, async (req, res) => {
  try {
    const questionId = req.params.id;
    const { content, status, category_id } = req.body;

    console.log('✏️ 教师更新问题:', { questionId, hasContent: !!content, status, category_id });

    // 验证问题是否存在
    const questionResult = await QuestionService.getQuestionById(questionId);
    if (!questionResult.success) {
      return res.status(404).json({
        success: false,
        message: '问题不存在'
      });
    }

    // 构建更新数据
    const updateData = {};
    if (content !== undefined) updateData.content = content;
    if (status !== undefined) updateData.status = status;
    if (category_id !== undefined) updateData.category_id = category_id;

    // 如果没有要更新的字段
    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        message: '没有提供要更新的字段'
      });
    }

    // 执行更新
    const result = await QuestionService.updateQuestion(questionId, updateData);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.message || '更新失败'
      });
    }

    res.json({
      success: true,
      message: '问题更新成功',
      data: result.data
    });

  } catch (error) {
    console.error('❌ 更新问题错误:', error);
    res.status(500).json({
      success: false,
      message: '更新问题失败'
    });
  }
});

// 教师获取分类统计信息
router.get('/categories/stats', authenticateToken, requireTeacher, async (req, res) => {
  try {
    console.log('📊 获取分类统计信息');

    const categoryStats = await query(`
      SELECT 
        c.id,
        c.name,
        c.description,
        COUNT(q.id) as question_count,
        ROUND(
          COUNT(q.id) * 100.0 / NULLIF(
            (SELECT COUNT(*) FROM questions WHERE status = 'classified'), 
            0
          ), 
          2
        ) as percentage
      FROM categories c
      LEFT JOIN questions q ON c.id = q.category_id AND q.status = 'classified'
      GROUP BY c.id, c.name, c.description
      ORDER BY question_count DESC, c.id
    `);

    // 获取总体统计
    const overallStats = await query(`
      SELECT 
        COUNT(*) as total_questions,
        SUM(CASE WHEN status = 'classified' THEN 1 ELSE 0 END) as classified_questions,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_questions
      FROM questions
    `);

    res.json({
      success: true,
      data: {
        categories: categoryStats,
        overall: overallStats[0] || { 
          total_questions: 0, 
          classified_questions: 0, 
          pending_questions: 0 
        }
      }
    });

  } catch (error) {
    console.error('❌ 获取分类统计错误:', error);
    res.status(500).json({
      success: false,
      message: '获取分类统计失败'
    });
  }
});

module.exports = router;