// backend/middleware/auth.js
const jwt = require('jsonwebtoken');
const config = require('../config/config');
const User = require('../models/User');

// 生成JWT token
function generateToken(payload) {
  return jwt.sign(payload, config.jwt.secret, { 
    expiresIn: config.jwt.expiresIn,
    issuer: config.jwt.issuer,
    audience: config.jwt.audience
  });
}

// 验证JWT token中间件
async function authenticateToken(req, res, next) {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        success: false,
        message: '访问令牌缺失'
      });
    }

    // 验证token
    const decoded = jwt.verify(token, config.jwt.secret, {
      issuer: config.jwt.issuer,
      audience: config.jwt.audience
    });
    
    // 查询用户信息
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: '用户不存在'
      });
    }

    // 将用户信息添加到请求对象
    req.user = user.getSafeInfo();
    next();

  } catch (error) {
    console.error('Token验证错误:', error.message);
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: '访问令牌已过期'
      });
    }
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(403).json({
        success: false,
        message: '无效的访问令牌'
      });
    }

    if (error.name === 'NotBeforeError') {
      return res.status(403).json({
        success: false,
        message: '访问令牌尚未生效'
      });
    }
    
    return res.status(403).json({
      success: false,
      message: '令牌验证失败'
    });
  }
}

// 验证教师权限中间件
function requireTeacher(req, res, next) {
  if (req.user.role !== 'teacher') {
    return res.status(403).json({
      success: false,
      message: '需要教师权限'
    });
  }
  next();
}

// 验证学生权限中间件
function requireStudent(req, res, next) {
  if (req.user.role !== 'student') {
    return res.status(403).json({
      success: false,
      message: '需要学生权限'
    });
  }
  next();
}

// 验证管理员权限中间件（扩展功能）
function requireAdmin(req, res, next) {
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: '需要管理员权限'
    });
  }
  next();
}

// 验证角色权限的通用中间件
function requireRole(roles) {
  return (req, res, next) => {
    if (!Array.isArray(roles)) {
      roles = [roles];
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `需要以下角色之一: ${roles.join(', ')}`
      });
    }

    next();
  };
}

// 可选的身份验证中间件（不强制要求登录）
async function optionalAuth(req, res, next) {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const decoded = jwt.verify(token, config.jwt.secret);
      const user = await User.findById(decoded.userId);
      if (user) {
        req.user = user.getSafeInfo();
      }
    }

    next();
  } catch (error) {
    // 忽略验证错误，继续处理请求
    next();
  }
}

// 刷新token中间件
function refreshToken(req, res, next) {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: '访问令牌缺失'
      });
    }

    // 解码token（忽略过期）
    const decoded = jwt.decode(token);
    if (!decoded) {
      return res.status(403).json({
        success: false,
        message: '无效的访问令牌'
      });
    }

    // 检查token是否即将过期（提前15分钟刷新）
    const now = Math.floor(Date.now() / 1000);
    const timeUntilExpiry = decoded.exp - now;
    const fifteenMinutes = 15 * 60;

    if (timeUntilExpiry < fifteenMinutes) {
      // 生成新的token
      const newToken = generateToken({
        userId: decoded.userId,
        studentId: decoded.studentId,
        role: decoded.role
      });

      res.setHeader('X-New-Token', newToken);
    }

    next();
  } catch (error) {
    console.error('刷新token错误:', error);
    next();
  }
}

// 验证token但不抛出错误（用于获取用户信息）
function verifyTokenSilent(token) {
  try {
    return jwt.verify(token, config.jwt.secret, {
      issuer: config.jwt.issuer,
      audience: config.jwt.audience
    });
  } catch (error) {
    return null;
  }
}

module.exports = {
  generateToken,
  authenticateToken,
  requireTeacher,
  requireStudent,
  requireAdmin,
  requireRole,
  optionalAuth,
  refreshToken,
  verifyTokenSilent
};