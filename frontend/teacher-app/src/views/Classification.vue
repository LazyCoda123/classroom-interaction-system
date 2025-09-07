<template>
  <div class="classification-container">
    <div class="page-container">
      <!-- 页面标题 -->
      <div class="page-header">
        <h1 class="page-title">
          <i class="el-icon-collection-tag"></i>
          AI智能分类
        </h1>
        <p class="page-subtitle">使用人工智能对学生问题进行自动分类</p>
      </div>

      <!-- 分类控制面板 -->
      <div class="page-card">
        <div class="card-header">
          <h3 class="card-title">
            <i class="el-icon-magic-stick"></i>
            分类控制面板
          </h3>
        </div>
        
        <div class="card-content">
          <div class="control-panel">
            <div class="panel-section">
              <h4>批量分类操作</h4>
              <div class="panel-actions">
                <el-button
                  type="primary"
                  size="large"
                  :loading="classificationLoading"
                  @click="startBatchClassification"
                  icon="el-icon-magic-stick"
                >
                  {{ classificationLoading ? '正在分类...' : '开始AI分类' }}
                </el-button>
                
                <el-button
                  size="large"
                  @click="refreshData"
                  icon="el-icon-refresh"
                >
                  刷新数据
                </el-button>
              </div>
              
              <!-- 分类进度 -->
              <div v-if="classificationLoading" class="progress-section">
                <el-progress
                  :percentage="Math.round(classificationProgress)"
                  :stroke-width="8"
                  status="success"
                />
                <p class="progress-text">正在使用AI分析问题内容...</p>
              </div>
            </div>
            
            <div class="panel-section">
              <h4>分类统计</h4>
              <div class="stats-grid">
                <div class="stat-item">
                  <div class="stat-value">{{ safeQuestionStats.total }}</div>
                  <div class="stat-label">总问题数</div>
                </div>
                <div class="stat-item pending">
                  <div class="stat-value">{{ safeQuestionStats.pending }}</div>
                  <div class="stat-label">待分类</div>
                </div>
                <div class="stat-item classified">
                  <div class="stat-value">{{ safeQuestionStats.classified }}</div>
                  <div class="stat-label">已分类</div>
                </div>
                <div class="stat-item">
                  <div class="stat-value">{{ safeCategories.length }}</div>
                  <div class="stat-label">分类数量</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 分类结果展示 -->
      <div class="page-card">
        <div class="card-header">
          <h3 class="card-title">
            <i class="el-icon-pie-chart"></i>
            分类结果统计
          </h3>
        </div>
        
        <div class="card-content">
          <div class="category-stats">
            <div v-if="questionsLoading" class="loading-state">
              <div class="loading-spinner">
                <i class="el-icon-loading"></i>
                <p>加载中...</p>
              </div>
            </div>
            <div v-else-if="safeCategoryStats.length === 0" class="empty-state">
              <i class="el-icon-document"></i>
              <p>暂无分类数据</p>
            </div>
            <el-row v-else :gutter="20">
              <el-col
                v-for="category in safeCategoryStats"
                :key="category.id"
                :xs="12"
                :sm="8"
                :md="6"
                :lg="4"
              >
                <div class="category-card">
                  <div class="category-header">
                    <h4 class="category-name">{{ category.name }}</h4>
                    <div class="category-count">{{ category.question_count || 0 }}</div>
                  </div>
                  <div class="category-progress">
                    <!-- 🔥 修复：确保percentage是数字类型 -->
                    <el-progress
                      :percentage="safePercentage(category.percentage)"
                      :stroke-width="6"
                      :show-text="false"
                      color="#667eea"
                    />
                    <span class="progress-label">{{ safePercentage(category.percentage).toFixed(1) }}%</span>
                  </div>
                </div>
              </el-col>
            </el-row>
          </div>
        </div>
      </div>

      <!-- 分类详情列表 -->
      <div class="page-card">
        <div class="card-header">
          <h3 class="card-title">
            <i class="el-icon-document"></i>
            问题分类详情
          </h3>
          
          <div class="header-actions">
            <!-- 🔥 修复：使用简化的下拉框避免debounce冲突 -->
            <div class="custom-select">
              <select
                v-model="selectedCategory"
                @change="handleCategoryFilter"
                class="category-filter-select"
              >
                <option value="">按分类筛选</option>
                <option
                  v-for="category in safeCategories"
                  :key="category.id"
                  :value="category.id"
                >
                  {{ category.name }}
                </option>
              </select>
            </div>
          </div>
        </div>
        
        <div class="card-content">
          <div v-if="questionsLoading" class="loading-state">
            <div class="loading-spinner">
              <i class="el-icon-loading"></i>
              <p>加载问题数据中...</p>
            </div>
          </div>
          <div v-else-if="safeQuestions.length === 0" class="empty-state">
            <i class="el-icon-document"></i>
            <p>暂无问题数据</p>
            <el-button @click="refreshData" type="primary">刷新数据</el-button>
          </div>
          <el-table
            v-else
            :data="filteredQuestions"
            stripe
            style="width: 100%"
          >
            <el-table-column
              prop="student_id"
              label="学号"
              width="120"
            />
            
            <el-table-column
              prop="student_name"
              label="学生姓名"
              width="120"
            />
            
            <el-table-column
              prop="content"
              label="问题内容"
              min-width="300"
              show-overflow-tooltip
            />
            
            <el-table-column
              prop="category_name"
              label="AI分类结果"
              width="180"
              align="center"
            >
              <template slot-scope="scope">
                <el-tag
                  v-if="scope.row.category_name"
                  :type="getCategoryTagType(scope.row.category_name)"
                  size="small"
                >
                  {{ scope.row.category_name }}
                </el-tag>
                <span v-else class="text-muted">未分类</span>
              </template>
            </el-table-column>
            
            <el-table-column
              prop="status"
              label="状态"
              width="100"
              align="center"
            >
              <template slot-scope="scope">
                <el-tag
                  :type="scope.row.status === 'classified' ? 'success' : 'warning'"
                  size="small"
                >
                  {{ scope.row.status === 'classified' ? '已分类' : '待分类' }}
                </el-tag>
              </template>
            </el-table-column>
            
            <el-table-column
              label="操作"
              width="200"
              align="center"
            >
              <template slot-scope="scope">
                <div class="action-buttons">
                  <el-button
                    v-if="scope.row.status === 'pending'"
                    type="text"
                    size="small"
                    @click="classifySingleQuestion(scope.row)"
                    icon="el-icon-magic-stick"
                  >
                    分类
                  </el-button>
                  
                  <el-button
                    type="text"
                    size="small"
                    @click="editClassification(scope.row)"
                    icon="el-icon-edit"
                  >
                    修改分类
                  </el-button>
                  
                  <el-button
                    type="text"
                    size="small"
                    @click="viewQuestionDetail(scope.row)"
                    icon="el-icon-view"
                  >
                    查看
                  </el-button>
                </div>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </div>

      <!-- 🔥 修复：修改分类对话框使用原生select -->
      <el-dialog
        title="修改问题分类"
        :visible.sync="editDialogVisible"
        width="500px"
        @close="resetEditDialog"
      >
        <div v-if="editingQuestion">
          <div class="edit-question-info">
            <h4>问题信息</h4>
            <p><strong>学生：</strong>{{ editingQuestion.student_name }} ({{ editingQuestion.student_id }})</p>
            <p><strong>内容：</strong>{{ editingQuestion.content }}</p>
          </div>
          
          <div class="edit-classification">
            <h4>选择新分类</h4>
            <div class="custom-select">
              <select
                v-model="newCategoryId"
                class="category-edit-select"
              >
                <option value="">请选择分类</option>
                <option
                  v-for="category in safeCategories"
                  :key="category.id"
                  :value="category.id"
                >
                  {{ category.name }}
                </option>
              </select>
            </div>
          </div>
        </div>
        
        <span slot="footer" class="dialog-footer">
          <el-button @click="editDialogVisible = false">取消</el-button>
          <el-button
            type="primary"
            @click="saveClassificationEdit"
            :loading="editLoading"
          >
            保存
          </el-button>
        </span>
      </el-dialog>
    </div>
  </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex'

export default {
  name: 'Classification',
  data() {
    return {
      selectedCategory: '',  // 🔥 修复：使用空字符串而不是null
      editDialogVisible: false,
      editingQuestion: null,
      newCategoryId: '',     // 🔥 修复：使用空字符串而不是null
      editLoading: false
    }
  },
  
  computed: {
    ...mapGetters([
      'questions',
      'questionsLoading',
      'questionStats',
      'categories',
      'categoryStats',
      'classificationLoading',
      'classificationProgress'
    ]),
    
    // 安全的数据访问计算属性
    safeQuestions() {
      return this.questions || []
    },
    
    safeCategories() {
      return this.categories || []
    },
    
    safeCategoryStats() {
      return this.categoryStats || []
    },
    
    safeQuestionStats() {
      return {
        total: this.questionStats?.total || 0,
        pending: this.questionStats?.pending || 0,
        classified: this.questionStats?.classified || 0
      }
    },
    
    // 筛选后的问题列表
    filteredQuestions() {
      if (!this.selectedCategory) {
        return this.safeQuestions
      }
      return this.safeQuestions.filter(q => q.category_id == this.selectedCategory)
    }
  },
  
  methods: {
    ...mapActions([
      'fetchQuestions',
      'fetchCategories',
      'fetchCategoryStats',
      'classifyAllQuestions',
      'classifyQuestion',
      'updateQuestionCategory'
    ]),
    
    // 🔥 修复：安全的百分比处理方法，确保返回数字
    safePercentage(value) {
      if (value === null || value === undefined || value === '') return 0
      const num = parseFloat(value)
      return isNaN(num) ? 0 : Math.min(100, Math.max(0, num))
    },
    
    // 获取分类标签类型
    getCategoryTagType(categoryName) {
      const types = {
        '知识点定义类问题': 'primary',
        '知识点应用类问题': 'success',
        '知识点关联类问题': 'info',
        '实验操作类问题': 'warning',
        '解题方法类问题': 'danger',
        '其他类问题': 'default'
      }
      return types[categoryName] || 'default'
    },
    
    // 错误处理工具方法
    showSuccess(message) {
      this.$message({
        message,
        type: 'success',
        duration: 3000
      })
    },
    
    showError(message) {
      this.$message({
        message,
        type: 'error',
        duration: 3000
      })
    },
    
    showWarning(message) {
      this.$message({
        message,
        type: 'warning',
        duration: 3000
      })
    },
    
    handleError(error, defaultMessage) {
      console.error('操作错误:', error)
      const message = error?.response?.data?.message || error?.message || defaultMessage
      this.showError(message)
    },
    
    async confirmAction(message, title) {
      try {
        await this.$confirm(message, title, {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        })
        return true
      } catch {
        throw 'cancel'
      }
    },
    
    // 开始批量分类
    async startBatchClassification() {
      try {
        await this.confirmAction(
          '确定要对所有待分类的问题进行AI自动分类吗？\n\n此操作可能需要一些时间。',
          'AI批量分类'
        )
        
        const result = await this.classifyAllQuestions()
        
        this.showSuccess(`AI分类完成！成功分类 ${result.classified} 个问题`)
        
        // 刷新数据
        await this.refreshData()
        
      } catch (error) {
        if (error !== 'cancel') {
          this.handleError(error, 'AI分类失败')
        }
      }
    },
    
    // 单个问题分类
    async classifySingleQuestion(question) {
      try {
        await this.classifyQuestion(question.id)
        this.showSuccess(`问题分类成功`)
        
        // 刷新数据
        await this.refreshData()
        
      } catch (error) {
        this.handleError(error, '问题分类失败')
      }
    },
    
    // 修改分类
    editClassification(question) {
      this.editingQuestion = question
      this.newCategoryId = question.category_id || ''  // 🔥 修复：确保是字符串
      this.editDialogVisible = true
    },
    
    // 保存分类修改
    async saveClassificationEdit() {
      if (!this.newCategoryId) {
        this.showWarning('请选择分类')
        return
      }
      
      this.editLoading = true
      
      try {
        await this.updateQuestionCategory({
          questionId: this.editingQuestion.id,
          categoryId: parseInt(this.newCategoryId)  // 🔥 修复：确保传递整数
        })
        
        this.showSuccess('分类修改成功')
        this.editDialogVisible = false
        
        // 刷新数据
        await this.refreshData()
        
      } catch (error) {
        this.handleError(error, '分类修改失败')
      } finally {
        this.editLoading = false
      }
    },
    
    // 重置编辑对话框
    resetEditDialog() {
      this.editingQuestion = null
      this.newCategoryId = ''
      this.editLoading = false
    },
    
    // 分类筛选
    handleCategoryFilter() {
      // 可以在这里添加其他筛选逻辑
    },
    
    // 🔥 修复：查看问题详情 - 添加路由错误处理
    viewQuestionDetail(question) {
      this.$router.push({
        path: '/',
        query: { questionId: question.id }
      }).catch(err => {
        if (err.name !== 'NavigationDuplicated') {
          console.error('路由跳转错误:', err)
        }
      })
    },
    
    // 刷新数据
    async refreshData() {
      try {
        // 先检查登录状态
        if (!this.$store.getters.isLoggedIn) {
          this.showError('请先登录')
          this.$router.push('/login').catch(err => {
            if (err.name !== 'NavigationDuplicated') {
              console.error('路由跳转错误:', err)
            }
          })
          return
        }
        
        await Promise.all([
          this.fetchQuestions(),
          this.fetchCategories(),
          this.fetchCategoryStats()
        ])
      } catch (error) {
        this.handleError(error, '数据刷新失败')
      }
    }
  },
  
  async created() {
    // 页面加载时获取数据
    await this.refreshData()
  }
}
</script>

<style lang="scss" scoped>
.classification-container {
  min-height: calc(100vh - 60px);
  background: #f5f7fa;
}

.page-header {
  margin-bottom: 30px;
  text-align: center;
  
  .page-title {
    font-size: 32px;
    font-weight: 600;
    color: #333;
    margin: 0 0 10px 0;
    display: flex;
    align-items: center;
    justify-content: center;
    
    i {
      margin-right: 15px;
      color: #667eea;
    }
  }
  
  .page-subtitle {
    font-size: 16px;
    color: #666;
    margin: 0;
  }
}

.control-panel {
  .panel-section {
    margin-bottom: 30px;
    
    &:last-child {
      margin-bottom: 0;
    }
    
    h4 {
      font-size: 16px;
      font-weight: 600;
      color: #333;
      margin: 0 0 15px 0;
    }
    
    .panel-actions {
      display: flex;
      gap: 15px;
      margin-bottom: 20px;
      
      @media (max-width: 768px) {
        flex-direction: column;
      }
    }
    
    .progress-section {
      margin-top: 20px;
      
      .progress-text {
        text-align: center;
        margin-top: 10px;
        color: #666;
        font-size: 14px;
      }
    }
    
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 20px;
      
      .stat-item {
        text-align: center;
        padding: 20px;
        background: #f8f9ff;
        border-radius: 8px;
        
        &.pending {
          background: linear-gradient(135deg, #fff7e6 0%, #ffe7ba 100%);
        }
        
        &.classified {
          background: linear-gradient(135deg, #f0f9f0 0%, #d4edda 100%);
        }
        
        .stat-value {
          font-size: 24px;
          font-weight: 700;
          color: #667eea;
          margin-bottom: 5px;
        }
        
        .stat-label {
          font-size: 14px;
          color: #666;
        }
      }
    }
  }
}

.category-stats {
  .category-card {
    background: white;
    border-radius: 8px;
    padding: 20px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
    margin-bottom: 15px;
    transition: all 0.3s ease;
    
    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
    }
    
    .category-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 15px;
      
      .category-name {
        font-size: 14px;
        font-weight: 600;
        color: #333;
        margin: 0;
        flex: 1;
      }
      
      .category-count {
        font-size: 20px;
        font-weight: 700;
        color: #667eea;
      }
    }
    
    .category-progress {
      display: flex;
      align-items: center;
      gap: 10px;
      
      .el-progress {
        flex: 1;
      }
      
      .progress-label {
        font-size: 12px;
        color: #666;
        min-width: 40px;
      }
    }
  }
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  
  .header-actions {
    @media (max-width: 768px) {
      width: 100%;
      margin-top: 15px;
    }
  }
}

.edit-question-info {
  margin-bottom: 20px;
  padding: 15px;
  background: #f8f9ff;
  border-radius: 6px;
  
  h4 {
    margin: 0 0 10px 0;
    color: #333;
  }
  
  p {
    margin: 5px 0;
    color: #666;
    
    strong {
      color: #333;
    }
  }
}

.edit-classification {
  h4 {
    margin: 0 0 15px 0;
    color: #333;
  }
}

.text-muted {
  color: #999;
  font-size: 12px;
}

// 🔥 新增：自定义下拉框样式，替代ElSelect避免debounce冲突
.custom-select {
  position: relative;
  display: inline-block;
  
  select {
    appearance: none;
    -webkit-appearance: none;
    -moz-appearance: none;
    background: white;
    border: 1px solid #dcdfe6;
    border-radius: 4px;
    padding: 8px 30px 8px 12px;
    font-size: 14px;
    color: #606266;
    cursor: pointer;
    transition: border-color 0.2s cubic-bezier(0.645, 0.045, 0.355, 1);
    
    &:focus {
      outline: none;
      border-color: #409eff;
    }
    
    &:hover {
      border-color: #c0c4cc;
    }
  }
  
  // 自定义下拉箭头
  &::after {
    content: '';
    position: absolute;
    right: 10px;
    top: 50%;
    transform: translateY(-50%);
    width: 0;
    height: 0;
    border-left: 4px solid transparent;
    border-right: 4px solid transparent;
    border-top: 5px solid #c0c4cc;
    pointer-events: none;
  }
}

.category-filter-select {
  width: 200px;
}

.category-edit-select {
  width: 100%;
}

// 自定义加载状态样式
.loading-state {
  padding: 60px 20px;
  text-align: center;
  
  .loading-spinner {
    i {
      font-size: 32px;
      color: #667eea;
      margin-bottom: 15px;
      animation: spin 1s linear infinite;
    }
    
    p {
      color: #666;
      font-size: 14px;
      margin: 0;
    }
  }
}

.empty-state {
  padding: 60px 20px;
  text-align: center;
  color: #999;
  
  i {
    font-size: 48px;
    margin-bottom: 20px;
    color: #ddd;
  }
  
  p {
    font-size: 16px;
    margin-bottom: 20px;
  }
}

// 旋转动画
@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

@media (max-width: 768px) {
  .page-header .page-title {
    font-size: 24px;
  }
  
  .control-panel .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .category-stats {
    .el-col {
      margin-bottom: 15px;
    }
  }
  
  .card-header {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>