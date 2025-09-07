// backend/routes/auth.js - 调试版本
const express = require('express');
const { generateToken, authenticateToken } = require('../middleware/auth');
const { validateLogin } = require('../middleware/validation');
const User = require('../models/User');

const router = express.Router();

// 用户登录
router.post('/login', async (req, res) => {
  try {
    console.log('\n🚀 ===== 登录请求开始 =====');
    console.log('📝 请求体:', req.body);
    console.log('📝 请求头:', req.headers);
    
    const { studentId, password } = req.body;

    // 验证输入
    if (!studentId || !password) {
      console.log('❌ 参数验证失败: 学号或密码为空');
      return res.status(400).json({
        success: false,
        message: '学号和密码不能为空'
      });
    }

    console.log('✅ 参数验证通过');
    console.log('🔍 开始查找用户...');

    // 查找用户
    const user = await User.findByStudentId(studentId);
    
    if (!user) {
      console.log('❌ 用户不存在:', studentId);
      return res.status(401).json({
        success: false,
        message: '学号或密码错误'
      });
    }

    console.log('✅ 用户查找成功');
    console.log('👤 用户信息:', {
      id: user.id,
      student_id: user.student_id,
      name: user.name,
      role: user.role,
      hasPassword: !!user.password
    });

    console.log('🔐 开始验证密码...');
    
    // 验证密码
    const isPasswordValid = await user.verifyPassword(password);
    
    if (!isPasswordValid) {
      console.log('❌ 密码验证失败');
      return res.status(401).json({
        success: false,
        message: '学号或密码错误'
      });
    }

    console.log('✅ 密码验证成功');
    console.log('🎫 开始生成Token...');

    // 生成JWT token
    const tokenPayload = { 
      userId: user.id, 
      studentId: user.student_id,
      role: user.role 
    };
    
    console.log('Token payload:', tokenPayload);
    
    const token = generateToken(tokenPayload);
    
    console.log('✅ Token生成成功');

    // 获取安全的用户信息
    const safeUserInfo = user.getSafeInfo();
    console.log('👤 安全用户信息:', safeUserInfo);

    const response = {
      success: true,
      message: '登录成功',
      data: {
        token,
        user: safeUserInfo
      }
    };

    console.log('✅ 准备返回响应:', {
      success: response.success,
      message: response.message,
      hasToken: !!response.data.token,
      user: response.data.user
    });

    console.log('🎉 ===== 登录请求成功结束 =====\n');
    
    res.json(response);

  } catch (error) {
    console.error('\n💥 ===== 登录请求错误 =====');
    console.error('错误类型:', error.constructor.name);
    console.error('错误消息:', error.message);
    console.error('错误堆栈:', error.stack);
    console.error('请求体:', req.body);
    console.error('===== 错误结束 =====\n');
    
    res.status(500).json({
      success: false,
      message: '登录失败，请稍后重试',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// 获取当前用户信息
router.get('/me', authenticateToken, (req, res) => {
  console.log('📋 获取用户信息请求');
  console.log('用户信息:', req.user);
  
  res.json({
    success: true,
    data: {
      user: req.user
    }
  });
});

// 获取所有学生列表（供教师端使用）
router.get('/students', authenticateToken, async (req, res) => {
  try {
    console.log('📋 获取学生列表请求');
    console.log('请求用户:', req.user);
    
    const students = await User.getAllStudents();
    console.log('学生列表数量:', students.length);

    res.json({
      success: true,
      data: {
        students: students.map(student => student.getSafeInfo())
      }
    });

  } catch (error) {
    console.error('💥 获取学生列表错误:', error);
    res.status(500).json({
      success: false,
      message: '获取学生列表失败'
    });
  }
});

// 用户登出（前端处理，后端可记录日志）
router.post('/logout', authenticateToken, (req, res) => {
  console.log(`📤 用户登出: ${req.user.name} (${req.user.studentId})`);
  res.json({
    success: true,
    message: '登出成功'
  });
});

// 获取用户统计信息（教师权限）
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    console.log('📊 获取用户统计请求');
    console.log('请求用户:', req.user);
    
    // 检查教师权限
    if (req.user.role !== 'teacher') {
      console.log('❌ 权限不足: 需要教师权限');
      return res.status(403).json({
        success: false,
        message: '需要教师权限'
      });
    }

    const stats = await User.getStats();
    console.log('用户统计结果:', stats);

    res.json({
      success: true,
      data: {
        stats
      }
    });

  } catch (error) {
    console.error('💥 获取用户统计错误:', error);
    res.status(500).json({
      success: false,
      message: '获取用户统计失败'
    });
  }
});

// 测试数据库连接的调试接口
router.get('/debug/db-check', async (req, res) => {
  try {
    console.log('🔍 数据库检查请求');
    
    const { checkDatabase } = require('../config/database');
    const checkResult = await checkDatabase();
    
    console.log('数据库检查结果:', checkResult);
    
    res.json({
      success: true,
      data: checkResult
    });
  } catch (error) {
    console.error('💥 数据库检查错误:', error);
    res.status(500).json({
      success: false,
      message: '数据库检查失败',
      error: error.message
    });
  }
});

// 测试用户查询的调试接口
router.get('/debug/user/:studentId', async (req, res) => {
  try {
    const { studentId } = req.params;
    console.log('🔍 用户查询测试:', studentId);
    
    const user = await User.findByStudentId(studentId);
    
    res.json({
      success: true,
      data: {
        found: !!user,
        user: user ? user.getSafeInfo() : null
      }
    });
  } catch (error) {
    console.error('💥 用户查询测试错误:', error);
    res.status(500).json({
      success: false,
      message: '用户查询测试失败',
      error: error.message
    });
  }
});

module.exports = router;