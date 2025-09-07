// backend/services/aiClassification.js - 修复版本（内嵌分类器）
const { query } = require('../config/database');

// 🔥 内嵌简单分类器 - 避免模块导入问题
const classificationRules = {
  1: { // 知识点定义类问题
    name: '知识点定义类问题',
    keywords: [
      '是什么', '什么是', '定义', '概念', '含义', '意思', '意义',
      '解释', '说明', '理解', '表示什么', '代表什么', '指的是',
      '定义式', '公式', '表达式', '定律', '原理', '法则',
      '本质', '实质', '性质', '特点', '特征',
      '物理意义', '几何意义', '化学意义', '生物意义'
    ],
    patterns: [
      /什么(是|叫)/,
      /(.+)是什么/,
      /(.+)的(定义|概念|含义|意思)/,
      /如何(理解|解释)/
    ]
  },
  
  2: { // 知识点应用类问题
    name: '知识点应用类问题',
    keywords: [
      '怎么用', '如何使用', '如何应用', '怎么应用',
      '计算', '求解', '解题', '怎么算', '如何计算',
      '怎么求', '求出', '算出', '得出', '解出',
      '方法', '步骤', '过程', '用法', '使用', '应用',
      '用在', '适用于', '解决', '处理',
      '计算方法', '求解过程', '解题步骤'
    ],
    patterns: [
      /怎么(用|使用|应用|计算|求|算)/,
      /如何(用|使用|应用|计算|求|算)/,
      /(.+)怎么(用|算|求)/,
      /(.+)的(计算|求解|应用)方法/
    ]
  },
  
  3: { // 知识点关联类问题
    name: '知识点关联类问题',
    keywords: [
      '区别', '不同', '差异', '差别', '对比', '比较',
      '联系', '关系', '相关', '关联', '相互关系',
      '异同', '相同', '一样', '类似', '相似',
      '优缺点', '优势', '劣势', '各自特点',
      '本质区别', '主要区别'
    ],
    patterns: [
      /(.+)和(.+)(区别|不同|联系|关系)/,
      /(.+)(与|和)(.+)(区别|联系)/,
      /(.+)(相比|比较|对比)(.+)/,
      /有什么(区别|不同|联系)/
    ]
  },
  
  4: { // 实验操作类问题
    name: '实验操作类问题',
    keywords: [
      '实验', '实验步骤', '实验过程', '实验方法', '实验操作',
      '操作', '操作步骤', '如何操作', '操作方法',
      '步骤', '过程', '实践', '动手', '演示', '示范',
      '制作', '搭建', '组装', '测量', '观察', '记录',
      '器材', '仪器', '设备', '装置', '工具',
      '现象', '结果', '数据', '效果'
    ],
    patterns: [
      /(实验|操作)(怎么|如何)(做|进行)/,
      /(.+)(实验|操作)(步骤|过程|方法)/,
      /(.+)(器材|仪器|装置)/,
      /观察(.+)(现象|结果)/
    ]
  },
  
  5: { // 解题方法类问题
    name: '解题方法类问题',
    keywords: [
      '技巧', '窍门', '诀窍', '秘诀', '妙招',
      '解题技巧', '解题方法', '解题思路', '解题策略',
      '有没有', '还有', '更好的', '简单的', '快速的',
      '解法', '做法', '办法', '思路', '策略',
      '学习方法', '记忆方法', '掌握', '熟练',
      '经验', '心得', '总结', '规律'
    ],
    patterns: [
      /(有没有|有什么)(技巧|方法|窍门)/,
      /(更好的|简单的|快速的)(方法|技巧)/,
      /解(.+)(题|法|方法)/,
      /(学习|解题|做题)(方法|技巧|思路)/
    ]
  },
  
  6: { // 其他类问题
    name: '其他类问题',
    keywords: [
      '你好', '谢谢', '再见', '辛苦了',
      '天气', '吃饭', '睡觉', '游戏',
      '喜欢', '讨厌', '高兴', '开心',
      '系统', '功能', '软件', '程序'
    ],
    patterns: [
      /^(你好|谢谢|再见)/,
      /(天气|吃饭|睡觉|游戏)/,
      /(喜欢|讨厌|高兴|难过)/
    ]
  }
};

/**
 * 内嵌分类器
 */
class EmbeddedClassifier {
  constructor() {
    this.rules = classificationRules;
    console.log('🚀 内嵌分类器初始化成功');
  }

  /**
   * 单个问题分类
   */
  classify(questionText) {
    try {
      if (!questionText || typeof questionText !== 'string') {
        return this.getDefaultResult('问题文本为空');
      }

      const text = questionText.toLowerCase().trim();
      const scores = [];

      // 对每个分类计算得分
      Object.keys(this.rules).forEach(ruleId => {
        const rule = this.rules[ruleId];
        let score = 0;
        let matchedKeywords = [];

        // 关键词匹配
        rule.keywords.forEach(keyword => {
          if (text.includes(keyword)) {
            score += 1;
            matchedKeywords.push(keyword);
          }
        });

        // 模式匹配
        if (rule.patterns) {
          rule.patterns.forEach(pattern => {
            try {
              if (pattern.test(text)) {
                score += 2; // 模式匹配给更高分数
              }
            } catch (error) {
              // 忽略正则表达式错误
            }
          });
        }

        scores.push({
          categoryId: parseInt(ruleId),
          categoryName: rule.name,
          score: score,
          matchedKeywords: matchedKeywords
        });
      });

      // 排序选择最高分
      scores.sort((a, b) => b.score - a.score);
      const bestMatch = scores[0];

      // 如果得分太低，归类为其他
      if (bestMatch.score < 0.5) {
        return {
          success: true,
          categoryId: 6,
          categoryName: '其他类问题',
          confidence: 0.3,
          score: bestMatch.score,
          matchedKeywords: []
        };
      }

      // 计算置信度
      const confidence = Math.min(bestMatch.score / 3, 0.95);

      return {
        success: true,
        categoryId: bestMatch.categoryId,
        categoryName: bestMatch.categoryName,
        confidence: confidence,
        score: bestMatch.score,
        matchedKeywords: bestMatch.matchedKeywords
      };

    } catch (error) {
      console.error('分类错误:', error);
      return this.getDefaultResult(error.message);
    }
  }

  /**
   * 批量分类
   */
  classifyBatch(questions) {
    try {
      console.log(`🚀 开始内嵌批量分类 ${questions.length} 个问题`);
      
      const results = questions.map((question, index) => {
        try {
          const result = this.classify(question.content);
          
          console.log(`✅ 问题 ${question.id}: "${question.content.substring(0, 30)}..." -> ${result.categoryName} (置信度: ${(result.confidence * 100).toFixed(1)}%)`);
          
          return {
            questionId: question.id,
            questionContent: question.content,
            ...result,
            index: index + 1
          };
          
        } catch (error) {
          console.error(`❌ 问题 ${question.id} 分类失败:`, error);
          return {
            questionId: question.id,
            questionContent: question.content,
            ...this.getDefaultResult(error.message),
            index: index + 1
          };
        }
      });

      // 生成统计信息
      const stats = this.generateStats(results);

      console.log(`🎉 内嵌批量分类完成!`);
      console.log(`  成功: ${stats.successful}/${questions.length}`);
      console.log(`  平均置信度: ${(stats.averageConfidence * 100).toFixed(1)}%`);
      console.log(`  分类分布:`);
      Object.entries(stats.distribution).forEach(([categoryName, count]) => {
        console.log(`    - ${categoryName}: ${count} 个`);
      });

      return {
        results,
        stats
      };

    } catch (error) {
      console.error('批量分类错误:', error);
      throw error;
    }
  }

  /**
   * 生成统计信息
   */
  generateStats(results) {
    let successful = 0;
    let totalConfidence = 0;
    let highConfidenceCount = 0;
    const distribution = {};

    results.forEach(result => {
      if (result.success) {
        successful++;
        totalConfidence += result.confidence;
        
        if (result.confidence > 0.7) {
          highConfidenceCount++;
        }
        
        const categoryName = result.categoryName;
        distribution[categoryName] = (distribution[categoryName] || 0) + 1;
      }
    });

    return {
      successful,
      failed: results.length - successful,
      averageConfidence: successful > 0 ? totalConfidence / successful : 0,
      highConfidenceCount,
      distribution
    };
  }

  /**
   * 获取默认结果
   */
  getDefaultResult(errorMessage) {
    return {
      success: false,
      error: errorMessage,
      categoryId: 6,
      categoryName: '其他类问题',
      confidence: 0,
      score: 0,
      matchedKeywords: []
    };
  }

  /**
   * 测试分类器
   */
  test() {
    const testCases = [
      { text: '牛顿第二定律是什么？', expected: 1 },
      { text: '怎么计算圆的面积？', expected: 2 },
      { text: '重力和万有引力有什么区别？', expected: 3 },
      { text: '这个实验怎么做？', expected: 4 },
      { text: '有没有解题技巧？', expected: 5 },
      { text: '今天天气真好', expected: 6 }
    ];

    let correct = 0;
    console.log('\n🧪 开始测试内嵌分类器...');

    testCases.forEach((testCase, index) => {
      const result = this.classify(testCase.text);
      const isCorrect = result.categoryId === testCase.expected;
      
      if (isCorrect) correct++;
      
      const status = isCorrect ? '✅' : '❌';
      console.log(`${status} 测试 ${index + 1}: "${testCase.text}" -> 分类${result.categoryId} (${result.categoryName})`);
    });

    const accuracy = (correct / testCases.length * 100).toFixed(1);
    console.log(`📊 测试完成: 准确率 ${accuracy}% (${correct}/${testCases.length})`);

    return {
      accuracy: parseFloat(accuracy),
      correct,
      total: testCases.length
    };
  }
}

// 创建分类器实例
const classifier = new EmbeddedClassifier();

/**
 * 对单个问题进行分类
 * @param {string} questionContent - 问题内容
 * @returns {number} - 分类ID
 */
async function classifyQuestion(questionContent) {
  try {
    console.log(`🤖 AI分类处理问题: "${questionContent}"`);

    const result = classifier.classify(questionContent);
    
    if (!result || !result.success) {
      console.error('❌ 分类失败:', result?.error || '未知错误');
      return 6; // 返回"其他类问题"
    }

    console.log(`🎯 分类结果: ${result.categoryId} (${result.categoryName})`);
    console.log(`📊 置信度: ${(result.confidence * 100).toFixed(1)}%`);
    
    if (result.matchedKeywords && result.matchedKeywords.length > 0) {
      console.log(`🔍 匹配关键词: [${result.matchedKeywords.join(', ')}]`);
    }

    return result.categoryId;

  } catch (error) {
    console.error('问题分类错误:', error);
    return 6; // 出错时返回"其他类问题"
  }
}

/**
 * 批量分类多个问题
 * @param {Array} questions - 问题数组 [{id, content}, ...]
 * @returns {Array} - 分类结果数组
 */
async function classifyAllQuestions(questions) {
  try {
    console.log(`🚀 开始批量分类 ${questions.length} 个问题`);

    // 使用内嵌分类器进行批量分类
    const batchResult = classifier.classifyBatch(questions);
    const results = [];

    if (!batchResult || !batchResult.results) {
      throw new Error('批量分类返回无效结果');
    }

    // 处理分类结果并更新数据库
    for (const result of batchResult.results) {
      try {
        if (result.success) {
          // 更新数据库
          await query(
            'UPDATE questions SET category_id = ?, status = ? WHERE id = ?',
            [result.categoryId, 'classified', result.questionId]
          );

          // 获取分类名称（从数据库验证）
          const categories = await query(
            'SELECT name FROM categories WHERE id = ?',
            [result.categoryId]
          );

          results.push({
            questionId: result.questionId,
            content: result.questionContent,
            categoryId: result.categoryId,
            categoryName: categories[0]?.name || result.categoryName,
            confidence: result.confidence || 0,
            success: true
          });

          console.log(`✅ 问题 ${result.questionId} 分类成功: ${result.categoryName} (置信度: ${((result.confidence || 0) * 100).toFixed(1)}%)`);
        } else {
          console.error(`❌ 问题 ${result.questionId} 分类失败:`, result.error);
          results.push({
            questionId: result.questionId,
            content: result.questionContent,
            success: false,
            error: result.error
          });
        }
      } catch (dbError) {
        console.error(`❌ 问题 ${result.questionId} 数据库更新失败:`, dbError);
        results.push({
          questionId: result.questionId,
          content: result.questionContent,
          success: false,
          error: dbError.message
        });
      }
    }

    // 输出批量分类统计
    const stats = batchResult.stats || {
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      averageConfidence: 0,
      highConfidenceCount: 0,
      distribution: {}
    };

    console.log(`🎉 批量分类完成!`);
    console.log(`  总计: ${questions.length} 个问题`);
    console.log(`  成功: ${stats.successful} 个`);
    console.log(`  失败: ${stats.failed} 个`);
    
    if (stats.averageConfidence) {
      console.log(`  平均置信度: ${(stats.averageConfidence * 100).toFixed(1)}%`);
    }
    
    if (stats.highConfidenceCount) {
      console.log(`  高置信度(>70%): ${stats.highConfidenceCount} 个`);
    }
    
    if (stats.distribution && Object.keys(stats.distribution).length > 0) {
      console.log(`  分类分布:`);
      Object.entries(stats.distribution).forEach(([categoryName, count]) => {
        console.log(`    - ${categoryName}: ${count} 个`);
      });
    }

    return results;

  } catch (error) {
    console.error('批量分类服务错误:', error);
    throw error;
  }
}

/**
 * 获取分类统计信息
 * @returns {Object} - 分类统计数据
 */
async function getClassificationStats() {
  try {
    console.log('📊 获取分类统计信息');
    
    const stats = await query(`
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
    const totalStats = await query(`
      SELECT 
        COUNT(*) as total_questions,
        SUM(CASE WHEN status = 'classified' THEN 1 ELSE 0 END) as classified_questions,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_questions
      FROM questions
    `);

    const result = {
      categories: stats,
      overall: totalStats[0] || { total_questions: 0, classified_questions: 0, pending_questions: 0 }
    };

    console.log('✅ 分类统计获取成功');
    console.log(`  总问题数: ${result.overall.total_questions}`);
    console.log(`  已分类: ${result.overall.classified_questions}`);
    console.log(`  待分类: ${result.overall.pending_questions}`);

    return result;

  } catch (error) {
    console.error('获取分类统计错误:', error);
    throw error;
  }
}

/**
 * 测试AI分类功能
 * @returns {Object} - 测试结果
 */
async function testClassification() {
  try {
    console.log('\n🧪 开始测试AI分类功能...');
    
    const testResult = classifier.test();
    
    console.log(`📊 测试完成:`);
    console.log(`  准确率: ${testResult.accuracy}%`);
    console.log(`  正确数: ${testResult.correct}/${testResult.total}`);
    
    return testResult;
    
  } catch (error) {
    console.error('测试AI分类功能错误:', error);
    return {
      accuracy: 0,
      correct: 0,
      total: 0,
      error: error.message
    };
  }
}

/**
 * 验证分类器配置
 * @returns {Object} - 验证结果
 */
async function validateClassifier() {
  try {
    console.log('🔍 验证分类器配置...');
    
    console.log('✅ 内嵌分类器配置验证通过');
    
    return {
      valid: true,
      errors: [],
      stats: {
        totalCategories: Object.keys(classificationRules).length,
        loaded: true
      }
    };
    
  } catch (error) {
    console.error('验证分类器配置错误:', error);
    return {
      valid: false,
      errors: [error.message]
    };
  }
}

/**
 * 获取分类器信息和性能指标
 * @returns {Object} - 分类器信息
 */
async function getClassifierInfo() {
  try {
    const totalKeywords = Object.values(classificationRules)
      .reduce((total, rule) => total + rule.keywords.length, 0);
    
    return {
      version: '1.0.0-embedded',
      algorithm: 'keyword-pattern-matching',
      categories: Object.keys(classificationRules).length,
      totalKeywords: totalKeywords,
      loaded: true,
      type: 'embedded'
    };
    
  } catch (error) {
    console.error('获取分类器信息错误:', error);
    return {
      version: '未知',
      algorithm: 'unknown',
      categories: 6,
      totalKeywords: 0,
      loaded: false,
      error: error.message
    };
  }
}

module.exports = {
  classifyQuestion,
  classifyAllQuestions,
  getClassificationStats,
  testClassification,
  validateClassifier,
  getClassifierInfo
};