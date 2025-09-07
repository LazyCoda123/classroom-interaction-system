// ai-service/enhanced-classifier.js
// 增强版智能问题分类器 - 专为中文教育场景优化

const { 
    keywordRules, 
    subjectKeywords, 
    negativeWords, 
    questionWords,
    educationKeywords,
    getAllRules,
    getRuleById,
    smartKeywordMatch
  } = require('./models/enhanced-keyword-rules');
  
  /**
   * 增强版问题分类器类
   */
  class EnhancedQuestionClassifier {
    constructor() {
      this.rules = getAllRules();
      this.debug = process.env.NODE_ENV === 'development';
      
      // 缓存系统
      this.cache = new Map();
      this.ngramCache = new Map();
      this.semanticCache = new Map();
      
      // 初始化中文分词词典
      this.chineseDict = this.initChineseDict();
      
      // 初始化同义词词典 - 大幅扩展
      this.synonymDict = this.initEnhancedSynonymDict();
      
      // 停用词 - 中文优化
      this.stopWords = new Set([
        '的', '了', '在', '是', '我', '你', '他', '她', '它', '们',
        '这', '那', '一个', '一些', '有', '没有', '也', '都', '很',
        '就', '要', '会', '能', '可以', '应该', '可能', '比较',
        '非常', '特别', '更加', '最', '再', '又', '还', '已经'
      ]);
      
      // 权重配置
      this.weights = {
        keywordMatch: 1.0,      // 关键词匹配
        semanticPattern: 1.2,   // 语义模式
        subjectTerm: 0.8,       // 学科术语
        questionWord: 0.6,      // 疑问词
        sentenceStructure: 0.7, // 句式结构
        contextRelevance: 0.9,  // 上下文相关性
        excludePenalty: -1.5    // 排除模式惩罚
      };
      
      console.log('🚀 增强版中文教育问题分类器已初始化');
      console.log(`📊 规则数量: ${Object.keys(this.rules).length}`);
      console.log(`📝 关键词总数: ${this.getTotalKeywordCount()}`);
    }
  
    /**
     * 初始化中文词典
     */
    initChineseDict() {
      return {
        // 教育领域专用词汇
        education: ['学习', '教学', '课程', '知识', '理解', '掌握', '应用'],
        // 物理专用词汇
        physics: ['力学', '电学', '光学', '热学', '原子', '分子', '能量'],
        // 数学专用词汇
        mathematics: ['代数', '几何', '函数', '方程', '定理', '证明', '计算'],
        // 化学专用词汇  
        chemistry: ['元素', '化合物', '反应', '分子', '原子', '溶液', '酸碱'],
        // 生物专用词汇
        biology: ['细胞', '遗传', '进化', '生态', '器官', '组织', '基因']
      };
    }
  
    /**
     * 初始化增强同义词词典
     */
    initEnhancedSynonymDict() {
      return {
        // 定义相关同义词
        '定义': ['含义', '意思', '概念', '定义式', '表达式', '释义', '解释'],
        '是什么': ['什么是', '指什么', '表示什么', '代表什么', '意味着什么'],
        '理解': ['明白', '懂得', '领会', '掌握', '认识', '了解', '知道'],
        
        // 计算相关同义词
        '计算': ['求解', '算出', '得出', '求出', '解出', '推算', '运算'],
        '怎么算': ['如何计算', '怎样求解', '如何求', '计算方法', '求解过程'],
        '方法': ['技巧', '窍门', '策略', '途径', '办法', '思路', '方式'],
        
        // 区别相关同义词
        '区别': ['差异', '不同', '差别', '对比', '比较', '差距', '分歧'],
        '联系': ['关系', '关联', '相关', '相互关系', '内在联系', '关连'],
        '相同': ['一样', '类似', '相似', '近似', '雷同', '相等'],
        
        // 实验相关同义词
        '实验': ['试验', '测试', '检验', '验证', '探究', '研究', '观察'],
        '步骤': ['过程', '流程', '程序', '操作', '方法', '阶段', '环节'],
        '现象': ['表现', '特征', '特点', '情况', '状态', '反应'],
        
        // 方法技巧同义词
        '技巧': ['方法', '窍门', '诀窍', '秘诀', '妙招', '绝招', '招数'],
        '简单': ['容易', '方便', '简便', '省事', '轻松', '快捷'],
        '快速': ['迅速', '快捷', '高效', '敏捷', '急速', '飞快']
      };
    }
  
    /**
     * 获取关键词总数
     */
    getTotalKeywordCount() {
      return Object.values(this.rules)
        .reduce((total, rule) => total + rule.keywords.length, 0);
    }
  
    /**
     * 增强版中文文本预处理
     * @param {string} text - 原始问题文本
     * @returns {Object} 增强的处理结果
     */
    preprocessText(text) {
      if (!text || typeof text !== 'string') {
        return this.getEmptyPreprocessResult(text);
      }
  
      // 文本清理和标准化
      const cleaned = this.cleanAndNormalizeText(text);
      
      // 中文分词优化
      const tokens = this.chineseTokenize(cleaned);
      
      // 多维度特征提取
      const features = this.extractEnhancedFeatures(text, cleaned, tokens);
      
      // 语义模式识别
      const semanticPatterns = this.identifySemanticPatterns(cleaned);
      
      // 句式结构分析
      const syntacticFeatures = this.analyzeSyntacticStructure(cleaned);
  
      return {
        original: text,
        cleaned,
        tokens,
        features,
        semanticPatterns,
        syntacticFeatures,
        processingTime: Date.now() - (this.startTime || Date.now())
      };
    }
  
    /**
     * 文本清理和标准化
     */
    cleanAndNormalizeText(text) {
      let cleaned = text.toLowerCase().trim();
      
      // 保留重要标点，移除干扰符号
      cleaned = cleaned.replace(/[，。！？；：""''（）【】\[\]{}()]/g, ' ');
      cleaned = cleaned.replace(/[\.!?;:"']/g, ' ');
      
      // 标准化空格
      cleaned = cleaned.replace(/\s+/g, ' ').trim();
      
      // 全角转半角
      cleaned = cleaned.replace(/[\uFF01-\uFF5E]/g, (match) => {
        return String.fromCharCode(match.charCodeAt(0) - 0xFEE0);
      });
      
      return cleaned;
    }
  
    /**
     * 中文分词优化
     */
    chineseTokenize(text) {
      // 简单的中文分词实现（可以集成更专业的分词库）
      const tokens = [];
      
      // 按空格分割
      const spaceTokens = text.split(/\s+/).filter(token => token.length > 0);
      
      spaceTokens.forEach(token => {
        // 检查是否为停用词
        if (!this.stopWords.has(token)) {
          tokens.push(token);
          
          // 提取子串（对中文很重要）
          if (token.length > 2) {
            for (let i = 0; i < token.length - 1; i++) {
              const bigram = token.substring(i, i + 2);
              if (!this.stopWords.has(bigram)) {
                tokens.push(bigram);
              }
            }
          }
        }
      });
      
      return [...new Set(tokens)]; // 去重
    }
  
    /**
     * 提取增强特征
     */
    extractEnhancedFeatures(originalText, cleanedText, tokens) {
      return {
        // 基础特征
        length: originalText.length,
        tokenCount: tokens.length,
        hasQuestionMark: originalText.includes('？') || originalText.includes('?'),
        
        // 疑问词特征
        questionWords: this.extractQuestionWords(cleanedText),
        questionWordScore: this.calculateQuestionWordScore(cleanedText),
        
        // 否定词特征
        negativeWords: this.extractNegativeWords(cleanedText),
        negativeScore: this.calculateNegativeScore(cleanedText),
        
        // 学科术语特征
        subjectTerms: this.extractSubjectTerms(cleanedText),
        subjectScore: this.calculateSubjectScore(cleanedText),
        
        // 教育关键词特征
        educationTerms: this.extractEducationTerms(cleanedText),
        
        // 句式特征
        sentenceType: this.analyzeSentenceType(cleanedText),
        sentenceComplexity: this.calculateSentenceComplexity(originalText),
        
        // 语义密度
        conceptDensity: this.calculateConceptDensity(tokens),
        
        // N-gram特征（优化）
        bigrams: this.extractOptimizedNgrams(tokens, 2),
        trigrams: this.extractOptimizedNgrams(tokens, 3),
        
        // 数学公式特征
        hasFormula: this.detectFormula(originalText),
        formulaComplexity: this.calculateFormulaComplexity(originalText),
        
        // 上下文相关性
        contextRelevance: this.calculateContextRelevance(cleanedText)
      };
    }
  
    /**
     * 计算疑问词得分
     */
    calculateQuestionWordScore(text) {
      let score = 0;
      questionWords.forEach(word => {
        if (text.includes(word)) {
          // 根据疑问词的重要性给不同权重
          const weight = this.getQuestionWordWeight(word);
          score += weight;
        }
      });
      return Math.min(score, 2.0); // 限制最大值
    }
  
    /**
     * 获取疑问词权重
     */
    getQuestionWordWeight(word) {
      const weights = {
        '什么': 1.0, '怎么': 1.0, '如何': 1.0, '为什么': 0.8,
        '哪个': 0.6, '多少': 0.6, '几': 0.4, '难道': 0.3
      };
      return weights[word] || 0.5;
    }
  
    /**
     * 计算否定词得分
     */
    calculateNegativeScore(text) {
      let score = 0;
      negativeWords.forEach(word => {
        if (text.includes(word)) {
          score += 0.5;
        }
      });
      return score;
    }
  
    /**
     * 提取学科术语
     */
    extractSubjectTerms(text) {
      const terms = [];
      Object.values(subjectKeywords).forEach(subject => {
        Object.values(subject).forEach(termList => {
          termList.forEach(term => {
            if (text.includes(term)) {
              terms.push(term);
            }
          });
        });
      });
      return [...new Set(terms)];
    }
  
    /**
     * 计算学科术语得分
     */
    calculateSubjectScore(text) {
      const terms = this.extractSubjectTerms(text);
      return Math.min(terms.length * 0.3, 1.5);
    }
  
    /**
     * 提取教育关键词
     */
    extractEducationTerms(text) {
      const terms = [];
      Object.values(educationKeywords).forEach(termList => {
        termList.forEach(term => {
          if (text.includes(term)) {
            terms.push(term);
          }
        });
      });
      return [...new Set(terms)];
    }
  
    /**
     * 分析句式类型（增强版）
     */
    analyzeSentenceType(text) {
      const patterns = {
        definition: /什么(是|叫|叫做)|是什么|定义|概念|含义|意思|解释/,
        method: /怎么|如何|方法|步骤|过程|技巧/,
        comparison: /区别|不同|差异|对比|比较|联系|关系/,
        experiment: /实验|操作|步骤|演示|实践|观察/,
        application: /应用|使用|计算|求解|用法|用在/,
        technique: /技巧|窍门|诀窍|办法|思路|策略/
      };
  
      for (const [type, pattern] of Object.entries(patterns)) {
        if (pattern.test(text)) {
          return type;
        }
      }
      return 'general';
    }
  
    /**
     * 计算句子复杂度
     */
    calculateSentenceComplexity(text) {
      const factors = {
        length: Math.min(text.length / 50, 1),
        punctuation: (text.match(/[，。！？；：]/g) || []).length / 10,
        complexity: (text.match(/[因为|所以|但是|然而|不过|虽然|尽管]/g) || []).length / 5
      };
      
      return (factors.length + factors.punctuation + factors.complexity) / 3;
    }
  
    /**
     * 优化的N-gram提取
     */
    extractOptimizedNgrams(tokens, n) {
      const cacheKey = `${tokens.join('-')}-${n}`;
      if (this.ngramCache.has(cacheKey)) {
        return this.ngramCache.get(cacheKey);
      }
  
      const ngrams = [];
      for (let i = 0; i <= tokens.length - n; i++) {
        const ngram = tokens.slice(i, i + n).join(' ');
        // 过滤掉包含停用词的n-gram
        if (!tokens.slice(i, i + n).some(token => this.stopWords.has(token))) {
          ngrams.push(ngram);
        }
      }
      
      this.ngramCache.set(cacheKey, ngrams);
      return ngrams;
    }
  
    /**
     * 计算公式复杂度
     */
    calculateFormulaComplexity(text) {
      const formulaPatterns = [
        /[a-zA-Z]=[^=]+/g,      // 基础公式
        /\d+[a-zA-Z]/g,         // 数字字母组合
        /[√∑∏∫]/g,             // 数学符号
        /sin|cos|tan|log/gi,    // 数学函数
        /\^|\*|\/|\+|\-/g       // 运算符
      ];
      
      let complexity = 0;
      formulaPatterns.forEach(pattern => {
        const matches = text.match(pattern) || [];
        complexity += matches.length;
      });
      
      return Math.min(complexity / 10, 1);
    }
  
    /**
     * 计算上下文相关性
     */
    calculateContextRelevance(text) {
      // 检查是否包含教育相关的上下文线索
      const educationContexts = [
        '课堂', '学习', '老师', '同学', '课本', '作业', '考试',
        '知识点', '学科', '物理', '数学', '化学', '生物'
      ];
      
      let relevance = 0;
      educationContexts.forEach(context => {
        if (text.includes(context)) {
          relevance += 0.1;
        }
      });
      
      return Math.min(relevance, 1.0);
    }
  
    /**
     * 识别语义模式
     */
    identifySemanticPatterns(text) {
      const patterns = [];
      
      Object.values(this.rules).forEach(rule => {
        if (rule.semanticPatterns) {
          rule.semanticPatterns.forEach(pattern => {
            try {
              if (pattern.test(text)) {
                patterns.push({
                  ruleId: rule.id,
                  type: this.getPatternType(pattern, rule.id),
                  confidence: 0.9,
                  pattern: pattern.toString()
                });
              }
            } catch (error) {
              console.warn(`语义模式匹配错误: ${error.message}`);
            }
          });
        }
      });
      
      return patterns;
    }
  
    /**
     * 获取模式类型
     */
    getPatternType(pattern, ruleId) {
      const typeMap = {
        1: 'definition',
        2: 'application',
        3: 'comparison',
        4: 'experiment',
        5: 'technique',
        6: 'other'
      };
      return typeMap[ruleId] || 'unknown';
    }
  
    /**
     * 分析句法结构
     */
    analyzeSyntacticStructure(text) {
      return {
        hasSubjectVerbObject: this.checkSVOStructure(text),
        questionPosition: this.analyzeQuestionPosition(text),
        clauseCount: this.countClauses(text),
        conjunctionUsage: this.analyzeConjunctions(text)
      };
    }
  
    /**
     * 检查主谓宾结构
     */
    checkSVOStructure(text) {
      // 简化的SVO检测
      const svoPatterns = [
        /\w+是\w+/,
        /\w+有\w+/,
        /\w+做\w+/,
        /\w+用\w+/
      ];
      
      return svoPatterns.some(pattern => pattern.test(text));
    }
  
    /**
     * 分析疑问词位置
     */
    analyzeQuestionPosition(text) {
      const questionWords = ['什么', '怎么', '如何', '为什么', '哪个'];
      
      for (const word of questionWords) {
        const index = text.indexOf(word);
        if (index !== -1) {
          if (index < text.length * 0.3) return 'beginning';
          if (index > text.length * 0.7) return 'end';
          return 'middle';
        }
      }
      return 'none';
    }
  
    /**
     * 计算子句数量
     */
    countClauses(text) {
      const clauseMarkers = ['，', '；', '因为', '所以', '但是', '然而'];
      let count = 1; // 至少一个主句
      
      clauseMarkers.forEach(marker => {
        count += (text.match(new RegExp(marker, 'g')) || []).length;
      });
      
      return count;
    }
  
    /**
     * 分析连接词使用
     */
    analyzeConjunctions(text) {
      const conjunctions = {
        causal: ['因为', '所以', '由于', '因此'],
        adversative: ['但是', '然而', '不过', '可是'],
        additive: ['而且', '并且', '还有', '另外'],
        conditional: ['如果', '假如', '要是', '倘若']
      };
      
      const usage = {};
      Object.entries(conjunctions).forEach(([type, words]) => {
        usage[type] = words.some(word => text.includes(word));
      });
      
      return usage;
    }
  
    /**
     * 增强版匹配得分计算
     */
    calculateEnhancedScore(preprocessed, rule) {
      const { cleaned, tokens, features, semanticPatterns } = preprocessed;
      
      let totalScore = 0;
      const scoreBreakdown = {
        keywordMatch: 0,
        semanticPattern: 0,
        subjectTerm: 0,
        questionWord: 0,
        sentenceStructure: 0,
        contextRelevance: 0,
        exclusionPenalty: 0,
        bonuses: 0
      };
  
      // 1. 关键词匹配得分（增强版）
      const keywordScore = this.calculateEnhancedKeywordScore(cleaned, tokens, rule);
      scoreBreakdown.keywordMatch = keywordScore;
      totalScore += keywordScore * this.weights.keywordMatch;
  
      // 2. 语义模式匹配得分
      const semanticScore = this.calculateSemanticPatternScore(semanticPatterns, rule);
      scoreBreakdown.semanticPattern = semanticScore;
      totalScore += semanticScore * this.weights.semanticPattern;
  
      // 3. 学科术语得分
      const subjectScore = features.subjectScore;
      scoreBreakdown.subjectTerm = subjectScore;
      totalScore += subjectScore * this.weights.subjectTerm;
  
      // 4. 疑问词得分
      const questionScore = features.questionWordScore;
      scoreBreakdown.questionWord = questionScore;
      totalScore += questionScore * this.weights.questionWord;
  
      // 5. 句式结构得分
      const structureScore = this.calculateStructureScore(features, rule);
      scoreBreakdown.sentenceStructure = structureScore;
      totalScore += structureScore * this.weights.sentenceStructure;
  
      // 6. 上下文相关性得分
      const contextScore = features.contextRelevance;
      scoreBreakdown.contextRelevance = contextScore;
      totalScore += contextScore * this.weights.contextRelevance;
  
      // 7. 排除模式惩罚
      const exclusionPenalty = this.calculateExclusionPenalty(cleaned, rule);
      scoreBreakdown.exclusionPenalty = exclusionPenalty;
      totalScore += exclusionPenalty * this.weights.excludePenalty;
  
      // 8. 其他奖励
      const bonuses = this.calculateBonuses(features, rule);
      scoreBreakdown.bonuses = bonuses;
      totalScore += bonuses;
  
      // 应用规则权重
      totalScore *= (rule.weight || 1);
  
      return {
        categoryId: rule.id,
        categoryName: rule.name,
        score: Math.max(0, totalScore),
        scoreBreakdown,
        confidence: this.calculateAdvancedConfidence(totalScore, scoreBreakdown, features)
      };
    }
  
    /**
     * 增强关键词匹配计算
     */
    calculateEnhancedKeywordScore(cleaned, tokens, rule) {
      let score = 0;
      const matchedKeywords = new Set();
  
      // 1. 精确匹配
      rule.keywords.forEach(keyword => {
        if (cleaned.includes(keyword)) {
          score += 1.0;
          matchedKeywords.add(keyword);
        }
      });
  
      // 2. 同义词匹配
      rule.keywords.forEach(keyword => {
        const synonyms = this.synonymDict[keyword] || [];
        synonyms.forEach(synonym => {
          if (cleaned.includes(synonym) && !matchedKeywords.has(synonym)) {
            score += 0.8;
            matchedKeywords.add(synonym);
          }
        });
      });
  
      // 3. 部分匹配（对于复合词）
      tokens.forEach(token => {
        rule.keywords.forEach(keyword => {
          if (token.length > 2 && keyword.length > 2) {
            const similarity = this.calculateStringSimilarity(token, keyword);
            if (similarity > 0.7 && !matchedKeywords.has(token)) {
              score += similarity * 0.6;
              matchedKeywords.add(token);
            }
          }
        });
      });
  
      return score;
    }
  
    /**
     * 计算字符串相似度（简化版）
     */
    calculateStringSimilarity(str1, str2) {
      const longer = str1.length > str2.length ? str1 : str2;
      const shorter = str1.length > str2.length ? str2 : str1;
      
      if (longer.length === 0) return 1.0;
      
      const distance = this.levenshteinDistance(longer, shorter);
      return (longer.length - distance) / longer.length;
    }
  
    /**
     * 编辑距离计算
     */
    levenshteinDistance(str1, str2) {
      const matrix = [];
  
      for (let i = 0; i <= str2.length; i++) {
        matrix[i] = [i];
      }
  
      for (let j = 0; j <= str1.length; j++) {
        matrix[0][j] = j;
      }
  
      for (let i = 1; i <= str2.length; i++) {
        for (let j = 1; j <= str1.length; j++) {
          if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
            matrix[i][j] = matrix[i - 1][j - 1];
          } else {
            matrix[i][j] = Math.min(
              matrix[i - 1][j - 1] + 1,
              matrix[i][j - 1] + 1,
              matrix[i - 1][j] + 1
            );
          }
        }
      }
  
      return matrix[str2.length][str1.length];
    }
  
    /**
     * 语义模式得分计算
     */
    calculateSemanticPatternScore(semanticPatterns, rule) {
      let score = 0;
      
      semanticPatterns.forEach(pattern => {
        if (pattern.ruleId === rule.id) {
          score += pattern.confidence * 1.5; // 语义模式匹配给更高分数
        }
      });
      
      return score;
    }
  
    /**
     * 句式结构得分计算
     */
    calculateStructureScore(features, rule) {
      const sentenceTypeScores = {
        1: { definition: 1.0, method: 0.2, comparison: 0.3, experiment: 0.1, application: 0.2, general: 0.1 },
        2: { definition: 0.2, method: 0.8, comparison: 0.3, experiment: 0.4, application: 1.0, general: 0.2 },
        3: { definition: 0.3, method: 0.2, comparison: 1.0, experiment: 0.1, application: 0.3, general: 0.1 },
        4: { definition: 0.1, method: 0.6, comparison: 0.2, experiment: 1.0, application: 0.5, general: 0.1 },
        5: { definition: 0.2, method: 0.9, comparison: 0.3, experiment: 0.3, application: 0.7, general: 0.2 },
        6: { definition: 0.1, method: 0.1, comparison: 0.1, experiment: 0.1, application: 0.1, general: 1.0 }
      };
      
      const typeScore = sentenceTypeScores[rule.id]?.[features.sentenceType] || 0;
      const complexityBonus = features.sentenceComplexity > 0.5 ? 0.2 : 0;
      
      return typeScore + complexityBonus;
    }
  
    /**
     * 排除模式惩罚计算
     */
    calculateExclusionPenalty(cleaned, rule) {
      if (!rule.excludePatterns) return 0;
      
      let penalty = 0;
      rule.excludePatterns.forEach(pattern => {
        try {
          if (pattern.test(cleaned)) {
            penalty += 2.0; // 重惩罚
          }
        } catch (error) {
          console.warn(`排除模式匹配错误: ${error.message}`);
        }
      });
      
      return penalty;
    }
  
    /**
     * 计算奖励分数
     */
    calculateBonuses(features, rule) {
      let bonuses = 0;
      
      // 疑问标点奖励
      if (features.hasQuestionMark) {
        bonuses += 0.3;
      }
      
      // 教育术语奖励
      if (features.educationTerms.length > 0) {
        bonuses += Math.min(features.educationTerms.length * 0.1, 0.5);
      }
      
      // 公式相关奖励
      if (features.hasFormula && rule.id === 1) {
        bonuses += 0.4; // 定义类问题包含公式获得奖励
      }
      
      // 长度适中奖励
      if (features.length > 8 && features.length < 100) {
        bonuses += 0.2;
      }
      
      return bonuses;
    }
  
    /**
     * 高级置信度计算
     */
    calculateAdvancedConfidence(totalScore, scoreBreakdown, features) {
      // 基础置信度
      let confidence = Math.min(totalScore / 5, 0.95);
      
      // 根据得分分布调整
      const positiveScores = Object.values(scoreBreakdown)
        .filter(score => score > 0);
      
      if (positiveScores.length > 0) {
        const scoreVariance = this.calculateVariance(positiveScores);
        const diversityBonus = Math.min(positiveScores.length * 0.05, 0.2);
        const stabilityBonus = scoreVariance < 0.5 ? 0.1 : 0;
        
        confidence += diversityBonus + stabilityBonus;
      }
      
      // 特征质量调整
      if (features.questionWordScore > 1.0) confidence += 0.1;
      if (features.subjectScore > 0.5) confidence += 0.05;
      if (features.contextRelevance > 0.3) confidence += 0.05;
      
      return Math.min(confidence, 0.98);
    }
  
    /**
     * 计算方差
     */
    calculateVariance(numbers) {
      const mean = numbers.reduce((sum, num) => sum + num, 0) / numbers.length;
      const squaredDiffs = numbers.map(num => Math.pow(num - mean, 2));
      return squaredDiffs.reduce((sum, diff) => sum + diff, 0) / numbers.length;
    }
  
    /**
     * 获取空的预处理结果
     */
    getEmptyPreprocessResult(text) {
      return {
        original: text,
        cleaned: '',
        tokens: [],
        features: {
          length: 0,
          tokenCount: 0,
          hasQuestionMark: false,
          questionWords: [],
          questionWordScore: 0,
          negativeWords: [],
          negativeScore: 0,
          subjectTerms: [],
          subjectScore: 0,
          educationTerms: [],
          sentenceType: 'general',
          sentenceComplexity: 0,
          conceptDensity: 0,
          bigrams: [],
          trigrams: [],
          hasFormula: false,
          formulaComplexity: 0,
          contextRelevance: 0
        },
        semanticPatterns: [],
        syntacticFeatures: {
          hasSubjectVerbObject: false,
          questionPosition: 'none',
          clauseCount: 0,
          conjunctionUsage: {}
        }
      };
    }
  
    /**
     * 主分类方法（增强版）
     */
    classify(questionText) {
      try {
        this.startTime = Date.now();
        
        // 检查缓存
        const cacheKey = questionText.trim().toLowerCase();
        if (this.cache.has(cacheKey)) {
          const cached = this.cache.get(cacheKey);
          return { ...cached, fromCache: true };
        }
  
        // 预处理
        const preprocessed = this.preprocessText(questionText);
        
        if (!preprocessed.cleaned) {
          return this.getDefaultResult('问题文本为空或无效');
        }
  
        // 计算所有分类得分
        const scores = Object.values(this.rules).map(rule => 
          this.calculateEnhancedScore(preprocessed, rule)
        );
  
        // 排序选择最佳
        scores.sort((a, b) => {
          if (Math.abs(b.score - a.score) < 0.1) {
            // 分数接近时，考虑优先级
            const aPriority = getRuleById(a.categoryId)?.priority || 999;
            const bPriority = getRuleById(b.categoryId)?.priority || 999;
            return aPriority - bPriority;
          }
          return b.score - a.score;
        });
  
        const bestMatch = scores[0];
        const secondBest = scores[1];
  
        // 计算最终置信度
        let finalConfidence = bestMatch.confidence;
        
        if (secondBest && secondBest.score > 0) {
          const gap = Math.abs(bestMatch.score - secondBest.score);
          const relativeDiff = gap / Math.max(bestMatch.score, 0.1);
          finalConfidence *= Math.min(relativeDiff + 0.5, 1);
        }
  
        // 低分数归类为其他
        if (bestMatch.score < 0.5) {
          bestMatch.categoryId = 6;
          bestMatch.categoryName = '其他类问题';
          finalConfidence = Math.max(finalConfidence * 0.3, 0.1);
        }
  
        const result = {
          success: true,
          categoryId: bestMatch.categoryId,
          categoryName: bestMatch.categoryName,
          confidence: finalConfidence,
          score: bestMatch.score,
          scoreBreakdown: bestMatch.scoreBreakdown,
          topScores: scores.slice(0, 3),
          features: preprocessed.features,
          semanticPatterns: preprocessed.semanticPatterns,
          processingTime: Date.now() - this.startTime
        };
  
        // 缓存结果
        this.cache.set(cacheKey, result);
        
        if (this.debug) {
          this.logClassificationDetails(questionText, result, preprocessed);
        }
  
        return result;
  
      } catch (error) {
        console.error('❌ 分类过程错误:', error);
        return this.getDefaultResult(error.message);
      }
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
        score: 0
      };
    }
  
    /**
     * 详细日志输出
     */
    logClassificationDetails(questionText, result, preprocessed) {
      console.log(`\n🔍 === 增强版分类详情 ===`);
      console.log(`📝 问题: "${questionText}"`);
      console.log(`🎯 分类: ${result.categoryName} (ID: ${result.categoryId})`);
      console.log(`📊 置信度: ${(result.confidence * 100).toFixed(1)}%`);
      console.log(`⚡ 总分: ${result.score.toFixed(2)}`);
      
      console.log(`\n📈 得分分解:`);
      Object.entries(result.scoreBreakdown).forEach(([key, value]) => {
        if (Math.abs(value) > 0.01) {
          const sign = value > 0 ? '+' : '';
          console.log(`  ${key}: ${sign}${value.toFixed(2)}`);
        }
      });
  
      console.log(`\n🔤 关键特征:`);
      const features = preprocessed.features;
      console.log(`  分词: [${preprocessed.tokens.slice(0, 10).join(', ')}]`);
      console.log(`  疑问词: [${features.questionWords.join(', ')}] (得分: ${features.questionWordScore.toFixed(2)})`);
      console.log(`  学科术语: [${features.subjectTerms.join(', ')}] (得分: ${features.subjectScore.toFixed(2)})`);
      console.log(`  句式类型: ${features.sentenceType}`);
      console.log(`  上下文相关性: ${features.contextRelevance.toFixed(2)}`);
      
      if (preprocessed.semanticPatterns.length > 0) {
        console.log(`\n🎨 语义模式:`);
        preprocessed.semanticPatterns.forEach(pattern => {
          console.log(`  ${pattern.type}: ${(pattern.confidence * 100).toFixed(1)}% (规则${pattern.ruleId})`);
        });
      }
  
      console.log(`\n🏆 前3名得分:`);
      result.topScores.forEach((score, index) => {
        console.log(`  ${index + 1}. ${score.categoryName}: ${score.score.toFixed(2)} (置信度: ${(score.confidence * 100).toFixed(1)}%)`);
      });
    }
  
    /**
     * 批量分类（增强版）
     */
    classifyBatch(questions) {
      console.log(`🚀 开始增强批量分类 ${questions.length} 个问题`);
      this.startTime = Date.now();
      
      const results = questions.map((question, index) => {
        try {
          const result = this.classify(question.content);
          
          if ((index + 1) % 10 === 0) {
            console.log(`✅ 已处理 ${index + 1}/${questions.length} 个问题`);
          }
          
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
  
      const stats = this.generateBatchStats(results);
      const totalTime = Date.now() - this.startTime;
      
      console.log(`🎉 增强批量分类完成! 用时: ${totalTime}ms`);
      console.log(`  成功率: ${stats.successRate.toFixed(1)}% (${stats.successful}/${questions.length})`);
      console.log(`  平均置信度: ${(stats.averageConfidence * 100).toFixed(1)}%`);
      console.log(`  高置信度占比: ${stats.highConfidenceRate.toFixed(1)}%`);
      
      return {
        results,
        stats,
        total: questions.length,
        successful: stats.successful,
        processingTime: totalTime
      };
    }
  
    /**
     * 生成批量统计信息
     */
    generateBatchStats(results) {
      const stats = {
        successful: 0,
        failed: 0,
        distribution: {},
        averageConfidence: 0,
        highConfidenceCount: 0,
        averageScore: 0,
        cacheHitRate: 0
      };
  
      let totalConfidence = 0;
      let totalScore = 0;
      let cacheHits = 0;
  
      results.forEach(result => {
        if (result.success) {
          stats.successful++;
          
          const categoryName = result.categoryName;
          stats.distribution[categoryName] = (stats.distribution[categoryName] || 0) + 1;
          
          totalConfidence += result.confidence;
          totalScore += result.score || 0;
          
          if (result.confidence > 0.7) {
            stats.highConfidenceCount++;
          }
          
          if (result.fromCache) {
            cacheHits++;
          }
        } else {
          stats.failed++;
        }
      });
  
      // 计算比率
      if (stats.successful > 0) {
        stats.averageConfidence = totalConfidence / stats.successful;
        stats.averageScore = totalScore / stats.successful;
        stats.highConfidenceRate = (stats.highConfidenceCount / stats.successful) * 100;
      }
      
      stats.successRate = (stats.successful / results.length) * 100;
      stats.cacheHitRate = (cacheHits / results.length) * 100;
  
      return stats;
    }
  
    /**
     * 增强测试套件
     */
    test() {
      const enhancedTestCases = [
        // 定义类问题
        { text: '向心加速度的定义式是怎么推导出来的？', expected: 1, difficulty: 'hard' },
        { text: '电场强度是什么意思？', expected: 1, difficulty: 'easy' },
        { text: '什么叫做动量守恒定律？', expected: 1, difficulty: 'medium' },
        { text: '请解释一下牛顿第二定律的物理含义', expected: 1, difficulty: 'medium' },
        
        // 应用类问题
        { text: '牛顿第二定律怎么用在斜面滑块问题上？', expected: 2, difficulty: 'medium' },
        { text: '如何计算电阻的功率？', expected: 2, difficulty: 'easy' },
        { text: '怎么用欧姆定律求电流？', expected: 2, difficulty: 'easy' },
        { text: '这个公式在实际问题中怎么应用？', expected: 2, difficulty: 'medium' },
        
        // 关联类问题
        { text: '动能定理和机械能守恒定律有什么区别？', expected: 3, difficulty: 'medium' },
        { text: '串联和并联电路有什么不同？', expected: 3, difficulty: 'easy' },
        { text: '重力和万有引力是什么关系？', expected: 3, difficulty: 'hard' },
        { text: '速度和加速度有什么联系？', expected: 3, difficulty: 'easy' },
        
        // 实验类问题
        { text: '这个实验的操作步骤是什么？', expected: 4, difficulty: 'easy' },
        { text: '怎么做光的折射实验？', expected: 4, difficulty: 'medium' },
        { text: '测量重力加速度需要什么器材？', expected: 4, difficulty: 'medium' },
        { text: '实验中观察到了什么现象？', expected: 4, difficulty: 'easy' },
        
        // 方法类问题
        { text: '有没有解这类题的技巧？', expected: 5, difficulty: 'easy' },
        { text: '求解圆周运动问题有什么好方法？', expected: 5, difficulty: 'medium' },
        { text: '学习物理有什么窍门吗？', expected: 5, difficulty: 'easy' },
        { text: '怎样更好地理解这个知识点？', expected: 5, difficulty: 'medium' },
        
        // 其他类问题
        { text: '今天天气真好啊', expected: 6, difficulty: 'easy' },
        { text: '老师您辛苦了', expected: 6, difficulty: 'easy' },
        { text: '我肚子饿了', expected: 6, difficulty: 'easy' },
        { text: '这和物理有关系吗？', expected: 6, difficulty: 'medium' }
      ];
  
      console.log('\n🧪 开始增强测试分类器...');
      
      let correct = 0;
      const results = [];
      const difficultyStats = { 
        easy: { correct: 0, total: 0 }, 
        medium: { correct: 0, total: 0 }, 
        hard: { correct: 0, total: 0 } 
      };
  
      enhancedTestCases.forEach((testCase, index) => {
        const result = this.classify(testCase.text);
        const isCorrect = result.categoryId === testCase.expected;
        
        if (isCorrect) {
          correct++;
          difficultyStats[testCase.difficulty].correct++;
        }
        difficultyStats[testCase.difficulty].total++;
        
        results.push({
          index: index + 1,
          question: testCase.text,
          expected: testCase.expected,
          actual: result.categoryId,
          correct: isCorrect,
          confidence: result.confidence,
          score: result.score,
          categoryName: result.categoryName,
          difficulty: testCase.difficulty
        });
  
        const status = isCorrect ? '✅' : '❌';
        const confidenceStr = `${(result.confidence * 100).toFixed(1)}%`;
        console.log(`${status} 测试 ${index + 1} [${testCase.difficulty}]: ${testCase.text.substring(0, 40)}...`);
        console.log(`   预期: ${testCase.expected}, 实际: ${result.categoryId} (${result.categoryName}), 置信度: ${confidenceStr}`);
      });
  
      const accuracy = (correct / enhancedTestCases.length * 100).toFixed(1);
      
      console.log(`\n📊 增强测试完成:`);
      console.log(`  总体准确率: ${accuracy}% (${correct}/${enhancedTestCases.length})`);
      console.log(`  按难度统计:`);
      Object.entries(difficultyStats).forEach(([difficulty, stats]) => {
        const rate = stats.total > 0 ? (stats.correct / stats.total * 100).toFixed(1) : '0.0';
        console.log(`    ${difficulty}: ${rate}% (${stats.correct}/${stats.total})`);
      });
  
      // 置信度统计
      const correctResults = results.filter(r => r.correct);
      const avgConfidence = correctResults.length > 0 ? 
        (correctResults.reduce((sum, r) => sum + r.confidence, 0) / correctResults.length * 100).toFixed(1) : '0.0';
      
      console.log(`  正确分类平均置信度: ${avgConfidence}%`);
  
      // 性能统计
      const perfStats = this.getPerformanceStats();
      console.log(`  缓存命中数: ${perfStats.cacheSize}`);
  
      return {
        accuracy: parseFloat(accuracy),
        correct,
        total: enhancedTestCases.length,
        results,
        difficultyStats,
        averageConfidence: parseFloat(avgConfidence),
        performanceStats: perfStats
      };
    }
  
    /**
     * 清空缓存
     */
    clearCache() {
      this.cache.clear();
      this.ngramCache.clear();
      this.semanticCache.clear();
      console.log('🗑️ 所有缓存已清空');
    }
  
    /**
     * 获取性能统计
     */
    getPerformanceStats() {
      return {
        cacheSize: this.cache.size,
        ngramCacheSize: this.ngramCache.size,
        semanticCacheSize: this.semanticCache.size,
        rulesCount: Object.keys(this.rules).length,
        totalKeywords: this.getTotalKeywordCount(),
        memoryUsage: process.memoryUsage ? process.memoryUsage() : null
      };
    }
  }
  
  // 创建增强分类器单例
  const enhancedClassifier = new EnhancedQuestionClassifier();
  
  module.exports = {
    EnhancedQuestionClassifier,
    enhancedClassifier,
    
    // 导出便捷方法
    classify: (text) => enhancedClassifier.classify(text),
    classifyBatch: (questions) => enhancedClassifier.classifyBatch(questions),
    test: () => enhancedClassifier.test(),
    clearCache: () => enhancedClassifier.clearCache(),
    getPerformanceStats: () => enhancedClassifier.getPerformanceStats()
  };