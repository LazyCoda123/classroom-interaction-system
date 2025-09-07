// backend/routes/categories.js
const express = require('express');
const { query } = require('../config/database');

const router = express.Router();

// 获取所有分类
router.get('/', async (req, res) => {
  try {
    console.log('📋 获取分类列表请求');
    
    const categories = await query(`
      SELECT 
        id,
        name,
        description,
        keywords,
        created_at
      FROM categories 
      ORDER BY id
    `);

    console.log('✅ 分类查询成功，数量:', categories.length);

    res.json({
      success: true,
      data: categories
    });

  } catch (error) {
    console.error('💥 获取分类列表错误:', error);
    res.status(500).json({
      success: false,
      message: '获取分类列表失败'
    });
  }
});

// 获取单个分类详情
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log('📋 获取分类详情请求, ID:', id);
    
    const categories = await query(
      'SELECT * FROM categories WHERE id = ?',
      [id]
    );

    if (categories.length === 0) {
      return res.status(404).json({
        success: false,
        message: '分类不存在'
      });
    }

    console.log('✅ 分类详情查询成功');

    res.json({
      success: true,
      data: categories[0]
    });

  } catch (error) {
    console.error('💥 获取分类详情错误:', error);
    res.status(500).json({
      success: false,
      message: '获取分类详情失败'
    });
  }
});

// 获取分类统计信息
router.get('/stats/summary', async (req, res) => {
  try {
    console.log('📊 获取分类统计请求');
    
    const stats = await query(`
      SELECT 
        c.id,
        c.name,
        COUNT(q.id) as question_count
      FROM categories c
      LEFT JOIN questions q ON c.id = q.category_id
      GROUP BY c.id, c.name
      ORDER BY c.id
    `);

    console.log('✅ 分类统计查询成功');

    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('💥 获取分类统计错误:', error);
    res.status(500).json({
      success: false,
      message: '获取分类统计失败'
    });
  }
});

module.exports = router;