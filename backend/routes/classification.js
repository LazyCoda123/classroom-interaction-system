// backend/routes/classification.js
const express = require('express');
const { authenticateToken, requireTeacher } = require('../middleware/auth');
const { validateClassification, validateManualClassification } = require('../middleware/validation');
const { classifyQuestion, classifyAllQuestions } = require('../services/aiClassification');
const Category = require('../models/Category');
const Question = require('../models/Question');
const QuestionService = require('../services/questionService');

const router = express.Router();

// 获取所有分类类型
router.get('/categories', authenticateToken, async (req, res) => {
  try {
    const categories = await Category.findAll(true); // 包含统计信息

    res.json({
      success: true,
      data: {
        categories: categories.map(cat => cat.getSafeInfo())
      }
    });

  } catch (error) {
    console.error('获取分类列表错误:', error);
    res.status(500).json({
      success: false,
      message: '获取分类列表失败'
    });
  }
});

// 对单个问题进行分类
router.post('/classify/:questionId', authenticateToken, requireTeacher, validateClassification, async (req, res) => {
  try {
    const questionId = req.params.questionId;

    // 获取问题信息
    const question = await Question.findById(questionId);
    if (!question) {
      return res.status(404).json({
        success: false,
        message: '问题不存在'
      });
    }

    // 调用AI分类服务
    const categoryId = await classifyQuestion(question.content);

    // 更新问题分类
    const result = await QuestionService.updateQuestionCategory(questionId, categoryId);

    if (!result.success) {
      throw new Error(result.message);
    }

    res.json({
      success: true,
      message: '问题分类成功',
      data: {
        questionId: parseInt(questionId),
        categoryId: result.categoryId,
        categoryName: result.categoryName
      }
    });

  } catch (error) {
    console.error('问题分类错误:', error);
    res.status(500).json({
      success: false,
      message: '问题分类失败，请稍后重试'
    });
  }
});

// 对所有未分类问题进行批量分类
router.post('/classify-all', authenticateToken, requireTeacher, async (req, res) => {
  try {
    // 获取所有待分类的问题
    const pendingQuestions = await QuestionService.getPendingQuestions();

    if (pendingQuestions.length === 0) {
      return res.json({
        success: true,
        message: '没有待分类的问题',
        data: {
          classified: 0,
          total: 0
        }
      });
    }

    console.log(`🚀 开始批量分类 ${pendingQuestions.length} 个问题`);

    // 批量分类
    const results = await classifyAllQuestions(pendingQuestions);

    // 统计分类结果
    const categoryStats = {};
    let successCount = 0;

    for (const result of results) {
      if (result.success) {
        successCount++;
        const categoryName = result.categoryName;
        categoryStats[categoryName] = (categoryStats[categoryName] || 0) + 1;
      }
    }

    res.json({
      success: true,
      message: `成功分类 ${successCount} 个问题`,
      data: {
        classified: successCount,
        total: pendingQuestions.length,
        results,
        stats: categoryStats
      }
    });

  } catch (error) {
    console.error('批量分类错误:', error);
    res.status(500).json({
      success: false,
      message: '批量分类失败，请稍后重试'
    });
  }
});

// 获取分类统计信息
router.get('/stats', authenticateToken, requireTeacher, async (req, res) => {
  try {
    // 使用Category模型获取统计信息
    const stats = await Category.getStats();

    // 获取总体问题统计
    const questionStats = await QuestionService.getQuestionStats();

    res.json({
      success: true,
      data: {
        categoryStats: stats.categories.map(cat => cat.getSafeInfo()),
        overallStats: {
          ...stats.overall,
          ...questionStats.basic
        }
      }
    });

  } catch (error) {
    console.error('获取分类统计错误:', error);
    res.status(500).json({
      success: false,
      message: '获取分类统计失败'
    });
  }
});

// 手动修改问题分类
router.put('/classify/:questionId', authenticateToken, requireTeacher, validateManualClassification, async (req, res) => {
  try {
    const questionId = req.params.questionId;
    const { categoryId } = req.body;

    // 验证分类是否存在
    const category = await Category.findById(categoryId);
    if (!category) {
      return res.status(400).json({
        success: false,
        message: '指定的分类不存在'
      });
    }

    // 更新问题分类
    const result = await QuestionService.updateQuestionCategory(questionId, categoryId);

    if (!result.success) {
      return res.status(404).json({
        success: false,
        message: result.message || '问题不存在'
      });
    }

    res.json({
      success: true,
      message: '问题分类更新成功',
      data: {
        questionId: parseInt(questionId),
        categoryId: parseInt(categoryId),
        categoryName: category.name
      }
    });

  } catch (error) {
    console.error('更新问题分类错误:', error);
    res.status(500).json({
      success: false,
      message: '更新问题分类失败'
    });
  }
});

// 获取特定分类下的问题列表
router.get('/categories/:categoryId/questions', authenticateToken, requireTeacher, async (req, res) => {
  try {
    const categoryId = req.params.categoryId;
    const { page = 1, limit = 20 } = req.query;

    // 验证分类是否存在
    const category = await Category.findById(categoryId);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: '分类不存在'
      });
    }

    // 获取该分类下的问题
    const questions = await category.getQuestions({
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit)
    });

    res.json({
      success: true,
      data: {
        category: category.getSafeInfo(),
        questions,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit)
        }
      }
    });

  } catch (error) {
    console.error('获取分类问题列表错误:', error);
    res.status(500).json({
      success: false,
      message: '获取分类问题列表失败'
    });
  }
});

// 重置问题分类（将已分类问题重置为待分类）
router.post('/reset', authenticateToken, requireTeacher, async (req, res) => {
  try {
    const { questionIds } = req.body;

    if (!Array.isArray(questionIds) || questionIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: '问题ID列表不能为空'
      });
    }

    // 批量重置为待分类状态
    const result = await QuestionService.batchUpdateStatus(questionIds, 'pending');

    // 同时清除分类ID
    const Question = require('../models/Question');
    const placeholders = questionIds.map(() => '?').join(',');
    await require('../config/database').query(
      `UPDATE questions SET category_id = NULL WHERE id IN (${placeholders})`,
      questionIds
    );

    res.json({
      success: true,
      message: `成功重置 ${result.updated} 个问题为待分类状态`,
      data: {
        reset: result.updated
      }
    });

  } catch (error) {
    console.error('重置问题分类错误:', error);
    res.status(500).json({
      success: false,
      message: '重置问题分类失败'
    });
  }
});

module.exports = router;