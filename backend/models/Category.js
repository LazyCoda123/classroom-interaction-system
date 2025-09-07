// backend/models/Category.js
const { query } = require('../config/database');
const config = require('../config/config');

/**
 * 分类数据模型
 */
class Category {
  constructor(data = {}) {
    this.id = data.id;
    this.name = data.name;
    this.description = data.description;
    this.keywords = data.keywords;
    this.created_at = data.created_at;
    
    // 统计信息
    this.question_count = data.question_count || 0;
    this.percentage = data.percentage || 0;
  }

  /**
   * 根据ID查找分类
   * @param {number} id - 分类ID
   * @returns {Category|null} - 分类实例或null
   */
  static async findById(id) {
    try {
      const categories = await query(
        'SELECT * FROM categories WHERE id = ?',
        [id]
      );

      return categories.length > 0 ? new Category(categories[0]) : null;
    } catch (error) {
      console.error('根据ID查找分类错误:', error);
      throw error;
    }
  }

  /**
   * 根据名称查找分类
   * @param {string} name - 分类名称
   * @returns {Category|null} - 分类实例或null
   */
  static async findByName(name) {
    try {
      const categories = await query(
        'SELECT * FROM categories WHERE name = ?',
        [name]
      );

      return categories.length > 0 ? new Category(categories[0]) : null;
    } catch (error) {
      console.error('根据名称查找分类错误:', error);
      throw error;
    }
  }

  /**
   * 获取所有分类
   * @param {boolean} withStats - 是否包含统计信息
   * @returns {Array} - 分类列表
   */
  static async findAll(withStats = false) {
    try {
      let sql;
      
      if (withStats) {
        sql = `
          SELECT 
            c.*,
            COUNT(q.id) as question_count,
            ROUND(
              COUNT(q.id) * 100.0 / NULLIF(
                (SELECT COUNT(*) FROM questions WHERE status = 'classified'), 0
              ), 2
            ) as percentage
          FROM categories c
          LEFT JOIN questions q ON c.id = q.category_id AND q.status = 'classified'
          GROUP BY c.id, c.name, c.description, c.keywords, c.created_at
          ORDER BY question_count DESC, c.id
        `;
      } else {
        sql = 'SELECT * FROM categories ORDER BY id';
      }

      const categories = await query(sql);
      return categories.map(cat => new Category(cat));
    } catch (error) {
      console.error('获取分类列表错误:', error);
      throw error;
    }
  }

  /**
   * 创建新分类
   * @param {Object} categoryData - 分类数据
   * @returns {Category} - 新分类实例
   */
  static async create(categoryData) {
    try {
      const { name, description, keywords } = categoryData;

      // 验证分类数据
      const validationErrors = Category.validateCategoryData(categoryData);
      if (validationErrors.length > 0) {
        throw new Error(validationErrors.join(', '));
      }

      // 检查分类名称是否已存在
      const existingCategory = await Category.findByName(name);
      if (existingCategory) {
        throw new Error('分类名称已存在');
      }

      // 处理关键词
      const keywordsJson = Array.isArray(keywords) ? JSON.stringify(keywords) : keywords;

      // 插入新分类
      const result = await query(
        'INSERT INTO categories (name, description, keywords, created_at) VALUES (?, ?, ?, NOW())',
        [name, description || '', keywordsJson || '[]']
      );

      // 返回新分类
      return await Category.findById(result.insertId);
    } catch (error) {
      console.error('创建分类错误:', error);
      throw error;
    }
  }

  /**
   * 更新分类
   * @param {Object} updateData - 更新数据
   * @returns {boolean} - 更新结果
   */
  async update(updateData) {
    try {
      const { name, description, keywords } = updateData;
      const updates = [];
      const params = [];

      if (name !== undefined) {
        // 检查新名称是否与其他分类冲突
        const existingCategory = await Category.findByName(name);
        if (existingCategory && existingCategory.id !== this.id) {
          throw new Error('分类名称已存在');
        }
        updates.push('name = ?');
        params.push(name);
        this.name = name;
      }

      if (description !== undefined) {
        updates.push('description = ?');
        params.push(description);
        this.description = description;
      }

      if (keywords !== undefined) {
        const keywordsJson = Array.isArray(keywords) ? JSON.stringify(keywords) : keywords;
        updates.push('keywords = ?');
        params.push(keywordsJson);
        this.keywords = keywordsJson;
      }

      if (updates.length === 0) {
        return true; // 没有需要更新的字段
      }

      params.push(this.id);

      await query(
        `UPDATE categories SET ${updates.join(', ')} WHERE id = ?`,
        params
      );

      return true;
    } catch (error) {
      console.error('更新分类错误:', error);
      throw error;
    }
  }

  /**
   * 删除分类
   * @returns {boolean} - 删除结果
   */
  async delete() {
    try {
      // 检查是否有问题使用此分类
      const questionsUsingCategory = await query(
        'SELECT COUNT(*) as count FROM questions WHERE category_id = ?',
        [this.id]
      );

      if (questionsUsingCategory[0].count > 0) {
        throw new Error('无法删除：该分类下还有问题');
      }

      const result = await query(
        'DELETE FROM categories WHERE id = ?',
        [this.id]
      );

      return result.affectedRows > 0;
    } catch (error) {
      console.error('删除分类错误:', error);
      throw error;
    }
  }

  /**
   * 获取分类统计信息
   * @returns {Object} - 统计数据
   */
  static async getStats() {
    try {
      // 分类使用统计
      const categoryStats = await query(`
        SELECT 
          c.id,
          c.name,
          COUNT(q.id) as question_count,
          ROUND(
            COUNT(q.id) * 100.0 / NULLIF(
              (SELECT COUNT(*) FROM questions WHERE status = 'classified'), 0
            ), 2
          ) as percentage
        FROM categories c
        LEFT JOIN questions q ON c.id = q.category_id AND q.status = 'classified'
        GROUP BY c.id, c.name
        ORDER BY question_count DESC
      `);

      // 总体统计
      const overallStats = await query(`
        SELECT 
          COUNT(DISTINCT c.id) as total_categories,
          COUNT(DISTINCT CASE WHEN q.id IS NOT NULL THEN c.id END) as used_categories,
          COUNT(q.id) as total_classified_questions
        FROM categories c
        LEFT JOIN questions q ON c.id = q.category_id AND q.status = 'classified'
      `);

      return {
        categories: categoryStats.map(stat => new Category(stat)),
        overall: overallStats[0] || {}
      };
    } catch (error) {
      console.error('获取分类统计错误:', error);
      throw error;
    }
  }

  /**
   * 获取分类的关键词列表
   * @returns {Array} - 关键词数组
   */
  getKeywords() {
    try {
      if (!this.keywords) return [];
      
      if (typeof this.keywords === 'string') {
        return JSON.parse(this.keywords);
      }
      
      return Array.isArray(this.keywords) ? this.keywords : [];
    } catch (error) {
      console.error('解析关键词错误:', error);
      return [];
    }
  }

  /**
   * 设置分类的关键词
   * @param {Array} keywords - 关键词数组
   * @returns {boolean} - 设置结果
   */
  async setKeywords(keywords) {
    try {
      if (!Array.isArray(keywords)) {
        throw new Error('关键词必须是数组');
      }

      const keywordsJson = JSON.stringify(keywords);
      await query(
        'UPDATE categories SET keywords = ? WHERE id = ?',
        [keywordsJson, this.id]
      );

      this.keywords = keywordsJson;
      return true;
    } catch (error) {
      console.error('设置关键词错误:', error);
      throw error;
    }
  }

  /**
   * 获取该分类下的问题
   * @param {Object} options - 查询选项
   * @returns {Array} - 问题列表
   */
  async getQuestions(options = {}) {
    try {
      const { limit = 50, offset = 0, status = 'classified' } = options;

      const questions = await query(`
        SELECT 
          q.*,
          u.student_id,
          u.name as student_name
        FROM questions q
        INNER JOIN users u ON q.user_id = u.id
        WHERE q.category_id = ? AND q.status = ?
        ORDER BY q.created_at DESC
        LIMIT ? OFFSET ?
      `, [this.id, status, limit, offset]);

      return questions;
    } catch (error) {
      console.error('获取分类问题错误:', error);
      throw error;
    }
  }

  /**
   * 验证分类数据
   * @param {Object} categoryData - 分类数据
   * @returns {Array} - 验证错误列表
   */
  static validateCategoryData(categoryData) {
    const errors = [];
    const { name, description, keywords } = categoryData;

    // 验证分类名称
    if (!name || typeof name !== 'string') {
      errors.push('分类名称不能为空');
    } else if (name.length < 2 || name.length > 100) {
      errors.push('分类名称长度必须在2-100字符之间');
    }

    // 验证描述（可选）
    if (description && typeof description !== 'string') {
      errors.push('分类描述必须是字符串');
    } else if (description && description.length > 500) {
      errors.push('分类描述不能超过500字符');
    }

    // 验证关键词（可选）
    if (keywords) {
      let keywordArray;
      try {
        keywordArray = Array.isArray(keywords) ? keywords : JSON.parse(keywords);
      } catch (e) {
        errors.push('关键词格式错误');
        return errors;
      }

      if (!Array.isArray(keywordArray)) {
        errors.push('关键词必须是数组');
      } else if (keywordArray.length > config.ai.maxKeywords) {
        errors.push(`关键词数量不能超过${config.ai.maxKeywords}个`);
      }
    }

    return errors;
  }

  /**
   * 检查分类是否为默认分类
   * @returns {boolean} - 是否为默认分类
   */
  isDefault() {
    return this.id === config.ai.defaultCategory;
  }

  /**
   * 获取分类的安全信息（用于前端显示）
   * @returns {Object} - 安全的分类信息
   */
  getSafeInfo() {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      keywords: this.getKeywords(),
      question_count: this.question_count,
      percentage: this.percentage,
      created_at: this.created_at
    };
  }

  /**
   * 初始化默认分类（用于系统初始化）
   * @returns {Array} - 创建的分类列表
   */
  static async initializeDefaultCategories() {
    try {
      const defaultCategories = [
        {
          name: '知识点定义类问题',
          description: '关于概念、定义、含义的问题',
          keywords: ['是什么', '定义', '概念', '含义', '意思', '怎么理解', '解释', '什么是', '如何定义', '定义式']
        },
        {
          name: '知识点应用类问题',
          description: '关于具体应用、计算、使用方法的问题',
          keywords: ['怎么用', '如何应用', '计算', '解题', '使用', '应用', '方法', '怎么算', '如何计算', '用在']
        },
        {
          name: '知识点关联类问题',
          description: '关于对比、区别、联系的问题',
          keywords: ['区别', '联系', '对比', '关系', '异同', '比较', '相同', '不同', '差异', '有什么区别']
        },
        {
          name: '实验操作类问题',
          description: '关于实验、操作、步骤的问题',
          keywords: ['实验', '操作', '步骤', '过程', '实践', '动手', '演示', '实验步骤', '如何操作', '操作方法']
        },
        {
          name: '解题方法类问题',
          description: '关于解题技巧、思路、方法的问题',
          keywords: ['技巧', '思路', '方法', '窍门', '快速', '简便', '解法', '有没有', '解题技巧', '解题方法']
        },
        {
          name: '其他类问题',
          description: '无法归类的其他问题',
          keywords: ['其他', '不确定', '杂项']
        }
      ];

      const createdCategories = [];

      for (const categoryData of defaultCategories) {
        // 检查分类是否已存在
        const existing = await Category.findByName(categoryData.name);
        if (!existing) {
          const category = await Category.create(categoryData);
          createdCategories.push(category);
          console.log(`✅ 创建默认分类: ${categoryData.name}`);
        }
      }

      return createdCategories;
    } catch (error) {
      console.error('初始化默认分类错误:', error);
      throw error;
    }
  }
}

module.exports = Category;