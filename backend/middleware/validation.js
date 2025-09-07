// backend/middleware/validation.js
const config = require('../config/config');

// 通用验证函数
const validators = {
  // 验证是否为空
  required: (value, fieldName) => {
    if (value === undefined || value === null || value === '') {
      return `${fieldName}不能为空`;
    }
    return null;
  },

  // 验证字符串长度
  length: (value, min, max, fieldName) => {
    if (typeof value !== 'string') {
      return `${fieldName}必须是字符串`;
    }
    if (value.length < min) {
      return `${fieldName}长度不能少于${min}个字符`;
    }
    if (value.length > max) {
      return `${fieldName}长度不能超过${max}个字符`;
    }
    return null;
  },

  // 验证学号格式
  studentId: (value) => {
    if (!/^\d{7}$/.test(value)) {
      return '学号必须是7位数字';
    }
    return null;
  },

  // 验证数字
  number: (value, fieldName) => {
    if (isNaN(value) || !Number.isInteger(Number(value))) {
      return `${fieldName}必须是有效数字`;
    }
    return null;
  },

  // 验证枚举值
  enum: (value, allowedValues, fieldName) => {
    if (!allowedValues.includes(value)) {
      return `${fieldName}必须是以下值之一: ${allowedValues.join(', ')}`;
    }
    return null;
  }
};

// 验证登录请求
function validateLogin(req, res, next) {
  const { studentId, password } = req.body;
  const errors = [];

  // 验证学号
  const studentIdError = validators.required(studentId, '学号') || 
                        validators.length(studentId, 1, 20, '学号');
  if (studentIdError) errors.push(studentIdError);

  // 验证密码
  const passwordError = validators.required(password, '密码') || 
                       validators.length(password, 1, 50, '密码');
  if (passwordError) errors.push(passwordError);

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: '请求参数验证失败',
      errors
    });
  }

  next();
}

// 验证提问请求
function validateQuestion(req, res, next) {
  const { content } = req.body;
  const errors = [];

  // 验证问题内容
  const contentError = validators.required(content, '问题内容') || 
                      validators.length(content, 10, config.limits.questionLength, '问题内容');
  if (contentError) errors.push(contentError);

  // 验证内容格式（不能只包含空白字符）
  if (content && content.trim().length === 0) {
    errors.push('问题内容不能只包含空白字符');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: '请求参数验证失败',
      errors
    });
  }

  next();
}

// 验证分类请求
function validateClassification(req, res, next) {
  const questionId = req.params.questionId;
  const errors = [];

  // 验证问题ID
  const idError = validators.required(questionId, '问题ID') || 
                 validators.number(questionId, '问题ID');
  if (idError) errors.push(idError);

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: '请求参数验证失败',
      errors
    });
  }

  next();
}

// 验证手动分类请求
function validateManualClassification(req, res, next) {
  const questionId = req.params.questionId;
  const { categoryId } = req.body;
  const errors = [];

  // 验证问题ID
  const questionIdError = validators.required(questionId, '问题ID') || 
                         validators.number(questionId, '问题ID');
  if (questionIdError) errors.push(questionIdError);

  // 验证分类ID
  const categoryIdError = validators.required(categoryId, '分类ID') || 
                         validators.number(categoryId, '分类ID');
  if (categoryIdError) errors.push(categoryIdError);

  // 验证分类ID范围（1-6）
  if (categoryId && (categoryId < 1 || categoryId > 6)) {
    errors.push('分类ID必须在1-6之间');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: '请求参数验证失败',
      errors
    });
  }

  next();
}

// 验证查询参数
function validateQuery(req, res, next) {
  const { status, page, limit } = req.query;
  const errors = [];

  // 验证状态参数
  if (status && !config.business.questionStatuses.includes(status)) {
    errors.push(`状态参数必须是以下值之一: ${config.business.questionStatuses.join(', ')}`);
  }

  // 验证分页参数
  if (page && (isNaN(page) || parseInt(page) < 1)) {
    errors.push('页码必须是大于0的整数');
  }

  if (limit && (isNaN(limit) || parseInt(limit) < 1 || parseInt(limit) > 100)) {
    errors.push('每页数量必须是1-100之间的整数');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: '查询参数验证失败',
      errors
    });
  }

  next();
}

// 通用ID验证
function validateId(paramName = 'id') {
  return (req, res, next) => {
    const id = req.params[paramName];
    const errors = [];

    const idError = validators.required(id, 'ID') || validators.number(id, 'ID');
    if (idError) errors.push(idError);

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'ID参数验证失败',
        errors
      });
    }

    next();
  };
}

// 请求体大小验证
function validateRequestSize(req, res, next) {
  const contentLength = req.get('content-length');
  const maxSize = 1024 * 1024; // 1MB

  if (contentLength && parseInt(contentLength) > maxSize) {
    return res.status(413).json({
      success: false,
      message: '请求体过大，最大支持1MB'
    });
  }

  next();
}

// 通用错误响应格式化
function formatValidationError(errors) {
  return {
    success: false,
    message: '请求参数验证失败',
    errors: Array.isArray(errors) ? errors : [errors],
    timestamp: new Date().toISOString()
  };
}

// 自定义验证器创建函数
function createValidator(rules) {
  return (req, res, next) => {
    const errors = [];

    for (const [field, fieldRules] of Object.entries(rules)) {
      const value = req.body[field];

      for (const rule of fieldRules) {
        const error = rule(value, field);
        if (error) {
          errors.push(error);
          break; // 遇到第一个错误就停止验证该字段
        }
      }
    }

    if (errors.length > 0) {
      return res.status(400).json(formatValidationError(errors));
    }

    next();
  };
}

module.exports = {
  validators,
  validateLogin,
  validateQuestion,
  validateClassification,
  validateManualClassification,
  validateQuery,
  validateId,
  validateRequestSize,
  formatValidationError,
  createValidator
};