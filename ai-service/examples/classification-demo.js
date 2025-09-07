// demo/classification-demo.js
// 增强版分类器演示文件

const { enhancedClassifier } = require('../classifier');
const { validateRules } = require('../models/keywordRules');

console.log('🎯 ===== 增强版AI分类器演示 =====\n');

/**
 * 单个问题分类演示
 */
function singleClassificationDemo() {
  console.log('📝 单个问题分类演示:\n');
  
  const testQuestions = [
    '向心加速度的定义式是什么？',
    '牛顿第二定律在斜面问题中怎么应用？',
    '动能定理和动量定理有什么区别？',
    '这个实验需要什么器材？',
    '有没有学好物理的技巧？',
    '今天天气很好呀'
  ];

  testQuestions.forEach((question, index) => {
    console.log(`问题 ${index + 1}: "${question}"`);
    
    const result = enhancedClassifier.classify(question);
    
    console.log(`✅ 分类结果:`);
    console.log(`   类别: ${result.categoryName} (ID: ${result.categoryId})`);
    console.log(`   置信度: ${(result.confidence * 100).toFixed(1)}%`);
    console.log(`   得分: ${result.score.toFixed(2)}`);
    
    if (result.scoreBreakdown) {
      console.log(`   得分详情:`);
      Object.entries(result.scoreBreakdown).forEach(([key, value]) => {
        if (Math.abs(value) > 0.01) {
          console.log(`     ${key}: ${value > 0 ? '+' : ''}${value.toFixed(2)}`);
        }
      });
    }
    
    console.log('');
  });
}

/**
 * 批量分类演示
 */
function batchClassificationDemo() {
  console.log('\n📊 批量分类演示:\n');
  
  const batchQuestions = [
    { id: 1, content: '什么是电场强度？' },
    { id: 2, content: '如何计算电阻的功率？' },
    { id: 3, content: '串联和并联有什么区别？' },
    { id: 4, content: '实验步骤是什么？' },
    { id: 5, content: '解题有什么技巧？' },
    { id: 6, content: '老师好！' },
    { id: 7, content: '牛顿定律是怎么推导的？' },
    { id: 8, content: '怎么用欧姆定律算电流？' },
    { id: 9, content: '力和重力有什么关系？' },
    { id: 10, content: '做实验时要注意什么？' }
  ];

  const batchResult = enhancedClassifier.classifyBatch(batchQuestions);
  
  console.log(`📈 批量分类统计:`);
  console.log(`   总问题数: ${batchResult.total}`);
  console.log(`   成功分类: ${batchResult.successful}`);
  console.log(`   成功率: ${batchResult.stats.successRate.toFixed(1)}%`);
  console.log(`   平均置信度: ${(batchResult.stats.averageConfidence * 100).toFixed(1)}%`);
  console.log(`   处理时间: ${batchResult.processingTime}ms`);
  
  console.log(`\n📋 分类分布:`);
  Object.entries(batchResult.stats.distribution).forEach(([category, count]) => {
    console.log(`   ${category}: ${count}个`);
  });
  
  console.log(`\n📝 详细结果:`);
  batchResult.results.forEach(result => {
    console.log(`   ${result.index}. "${result.questionContent.substring(0, 30)}..." → ${result.categoryName} (${(result.confidence * 100).toFixed(1)}%)`);
  });
}

/**
 * 性能测试演示
 */
function performanceDemo() {
  console.log('\n⚡ 性能测试演示:\n');
  
  const startTime = Date.now();
  
  // 生成测试数据
  const testData = [
    '电场强度是什么？',
    '怎么计算功率？',
    '有什么区别？',
    '实验怎么做？',
    '有什么技巧？'
  ];
  
  // 重复测试以测量性能
  const repeatCount = 100;
  console.log(`🔄 重复分类 ${repeatCount} 次进行性能测试...`);
  
  for (let i = 0; i < repeatCount; i++) {
    const question = testData[i % testData.length];
    enhancedClassifier.classify(question);
  }
  
  const endTime = Date.now();
  const totalTime = endTime - startTime;
  
  console.log(`⏱️  性能统计:`);
  console.log(`   总耗时: ${totalTime}ms`);
  console.log(`   平均耗时: ${(totalTime / repeatCount).toFixed(2)}ms/次`);
  console.log(`   处理速度: ${(repeatCount / totalTime * 1000).toFixed(0)} 次/秒`);
  
  // 获取详细性能统计
  const perfStats = enhancedClassifier.getPerformanceStats();
  console.log(`\n💾 内存使用:`);
  console.log(`   缓存大小: ${perfStats.cacheSize}`);
  console.log(`   N-gram缓存: ${perfStats.ngramCacheSize}`);
  console.log(`   规则数量: ${perfStats.rulesCount}`);
  console.log(`   关键词总数: ${perfStats.totalKeywords}`);
  
  if (perfStats.memoryUsage) {
    const mb = (bytes) => (bytes / 1024 / 1024).toFixed(1);
    console.log(`   内存使用: ${mb(perfStats.memoryUsage.heapUsed)}MB / ${mb(perfStats.memoryUsage.heapTotal)}MB`);
  }
}

/**
 * 特征提取演示
 */
function featureExtractionDemo() {
  console.log('\n🔍 特征提取演示:\n');
  
  const complexQuestion = '牛顿第二定律在处理斜面上滑块运动问题时的具体应用方法是什么？能否详细解释计算步骤？';
  
  console.log(`复杂问题: "${complexQuestion}"`);
  console.log();
  
  const result = enhancedClassifier.classify(complexQuestion);
  
  console.log(`🧠 提取的特征:`);
  const features = result.features;
  
  console.log(`   文本长度: ${features.length}字符`);
  console.log(`   分词数量: ${features.tokenCount}个`);
  console.log(`   疑问词: [${features.questionWords.join(', ')}] (得分: ${features.questionWordScore.toFixed(2)})`);
  console.log(`   学科术语: [${features.subjectTerms.join(', ')}] (得分: ${features.subjectScore.toFixed(2)})`);
  console.log(`   句式类型: ${features.sentenceType}`);
  console.log(`   句子复杂度: ${features.sentenceComplexity.toFixed(2)}`);
  console.log(`   概念密度: ${features.conceptDensity.toFixed(2)}`);
  console.log(`   上下文相关性: ${features.contextRelevance.toFixed(2)}`);
  console.log(`   包含公式: ${features.hasFormula ? '是' : '否'}`);
  
  if (result.semanticPatterns && result.semanticPatterns.length > 0) {
    console.log(`\n🎨 识别的语义模式:`);
    result.semanticPatterns.forEach(pattern => {
      console.log(`   类型: ${pattern.type}, 置信度: ${(pattern.confidence * 100).toFixed(1)}%, 规则: ${pattern.ruleId}`);
    });
  }
}

/**
 * 规则验证演示
 */
function ruleValidationDemo() {
  console.log('\n✅ 规则验证演示:\n');
  
  const validation = validateRules();
  
  console.log(`🔍 规则验证结果:`);
  console.log(`   验证状态: ${validation.valid ? '✅ 通过' : '❌ 失败'}`);
  console.log(`   分类数量: ${validation.stats.totalCategories}`);
  console.log(`   关键词总数: ${validation.stats.totalKeywords}`);
  console.log(`   学科关键词: ${validation.stats.totalSubjectKeywords || 0}`);
  
  if (validation.errors && validation.errors.length > 0) {
    console.log(`\n❌ 发现错误:`);
    validation.errors.forEach(error => {
      console.log(`   - ${error}`);
    });
  }
  
  if (validation.warnings && validation.warnings.length > 0) {
    console.log(`\n⚠️  警告信息:`);
    validation.warnings.forEach(warning => {
      console.log(`   - ${warning}`);
    });
  }
}

/**
 * 准确性测试演示
 */
function accuracyTestDemo() {
  console.log('\n🎯 准确性测试演示:\n');
  
  console.log('正在运行内置测试套件...');
  const testResult = enhancedClassifier.test();
  
  console.log(`\n📊 测试结果总结:`);
  console.log(`   总体准确率: ${testResult.accuracy.toFixed(1)}%`);
  console.log(`   正确数/总数: ${testResult.correct}/${testResult.total}`);
  console.log(`   平均置信度: ${testResult.averageConfidence.toFixed(1)}%`);
  
  console.log(`\n📈 按难度分析:`);
  Object.entries(testResult.difficultyStats).forEach(([difficulty, stats]) => {
    const rate = stats.total > 0 ? (stats.correct / stats.total * 100).toFixed(1) : '0.0';
    console.log(`   ${difficulty}: ${rate}% (${stats.correct}/${stats.total})`);
  });
  
  // 显示错误案例
  const errorCases = testResult.results.filter(r => !r.correct);
  if (errorCases.length > 0) {
    console.log(`\n❌ 错误案例分析:`);
    errorCases.forEach(error => {
      console.log(`   "${error.question.substring(0, 40)}..."`);
      console.log(`   预期: ${error.expected}, 实际: ${error.actual} (${error.categoryName})`);
    });
  }
}

/**
 * 缓存效果演示
 */
function cacheEffectivenessDemo() {
  console.log('\n💾 缓存效果演示:\n');
  
  const testQuestion = '什么是电场强度？';
  
  // 第一次分类（无缓存）
  console.log('🔄 第一次分类（无缓存）...');
  enhancedClassifier.clearCache();
  const start1 = Date.now();
  const result1 = enhancedClassifier.classify(testQuestion);
  const time1 = Date.now() - start1;
  
  console.log(`   耗时: ${time1}ms`);
  console.log(`   结果: ${result1.categoryName} (${(result1.confidence * 100).toFixed(1)}%)`);
  
  // 第二次分类（使用缓存）
  console.log('\n⚡ 第二次分类（使用缓存）...');
  const start2 = Date.now();
  const result2 = enhancedClassifier.classify(testQuestion);
  const time2 = Date.now() - start2;
  
  console.log(`   耗时: ${time2}ms`);
  console.log(`   来自缓存: ${result2.fromCache ? '是' : '否'}`);
  console.log(`   加速比: ${time1 > 0 ? (time1 / Math.max(time2, 0.1)).toFixed(1) : 'N/A'}x`);
  
  console.log(`\n📈 缓存统计:`);
  const cacheStats = enhancedClassifier.getPerformanceStats();
  console.log(`   缓存条目: ${cacheStats.cacheSize}`);
  console.log(`   N-gram缓存: ${cacheStats.ngramCacheSize}`);
}

/**
 * 主演示函数
 */
function runFullDemo() {
  try {
    // 1. 单个分类演示
    singleClassificationDemo();
    
    // 2. 批量分类演示
    batchClassificationDemo();
    
    // 3. 性能测试演示
    performanceDemo();
    
    // 4. 特征提取演示
    featureExtractionDemo();
    
    // 5. 规则验证演示
    ruleValidationDemo();
    
    // 6. 准确性测试演示
    accuracyTestDemo();
    
    // 7. 缓存效果演示
    cacheEffectivenessDemo();
    
    console.log('\n🎉 演示完成！');
    console.log('\n💡 使用建议:');
    console.log('   - 对于教育场景，建议置信度阈值设为 0.6+');
    console.log('   - 定期清理缓存以避免内存占用过大');
    console.log('   - 可根据实际使用情况调整关键词权重');
    console.log('   - 建议定期更新关键词库以提高准确率');
    
  } catch (error) {
    console.error('❌ 演示过程中出错:', error);
  }
}

// 如果直接运行此文件，则执行完整演示
if (require.main === module) {
  runFullDemo();
}

module.exports = {
  singleClassificationDemo,
  batchClassificationDemo,
  performanceDemo,
  featureExtractionDemo,
  ruleValidationDemo,
  accuracyTestDemo,
  cacheEffectivenessDemo,
  runFullDemo
};