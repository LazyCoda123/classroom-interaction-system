<template>
  <div class="question-list-container">
    <div class="page-container">
      <!-- 页面标题和操作栏 -->
      <div class="page-header">
        <div class="header-left">
          <h1 class="page-title">
            <i class="el-icon-chat-line-round"></i>
            问题管理
          </h1>
          <p class="page-subtitle">管理所有学生提交的问题</p>
        </div>
        <div class="header-right">
          <el-button 
            type="primary" 
            icon="el-icon-refresh" 
            @click="refreshData"
            :loading="questionsLoading"
            size="medium"
          >
            刷新数据
          </el-button>
          <el-button 
            type="success" 
            icon="el-icon-magic-stick" 
            @click="goToClassification"
            size="medium"
          >
            AI分类
          </el-button>
        </div>
      </div>

      <!-- 筛选和搜索栏 -->
      <div class="filter-section">
        <el-card class="filter-card">
          <el-row :gutter="20" align="middle">
            <el-col :xs="24" :sm="8" :md="6" :lg="4">
              <div class="filter-item">
                <label class="filter-label">状态筛选</label>
                <el-select 
                  v-model="filterStatus" 
                  placeholder="选择状态" 
                  clearable 
                  size="medium"
                  style="width: 100%"
                  @change="handleFilterChange"
                >
                  <el-option label="全部" value=""></el-option>
                  <el-option label="待分类" value="pending"></el-option>
                  <el-option label="已分类" value="classified"></el-option>
                </el-select>
              </div>
            </el-col>
            
            <el-col :xs="24" :sm="8" :md="6" :lg="4">
              <div class="filter-item">
                <label class="filter-label">分类筛选</label>
                <el-select 
                  v-model="filterCategoryId" 
                  placeholder="选择分类" 
                  clearable 
                  size="medium"
                  style="width: 100%"
                  @change="handleFilterChange"
                >
                  <el-option label="全部分类" value=""></el-option>
                  <el-option 
                    v-for="category in categories" 
                    :key="category.id" 
                    :label="category.name" 
                    :value="category.id"
                  ></el-option>
                </el-select>
              </div>
            </el-col>
            
            <el-col :xs="24" :sm="8" :md="12" :lg="8">
              <div class="filter-item">
                <label class="filter-label">搜索</label>
                <el-input
                  v-model="searchKeyword"
                  placeholder="搜索问题内容或学生姓名"
                  clearable
                  size="medium"
                  @input="handleSearchInput"
                  @clear="handleFilterChange"
                >
                  <i slot="prefix" class="el-input__icon el-icon-search"></i>
                </el-input>
              </div>
            </el-col>
            
            <el-col :xs="24" :sm="24" :md="24" :lg="8">
              <div class="filter-actions">
                <el-button @click="resetFilters" icon="el-icon-refresh-left" size="medium">
                  重置筛选
                </el-button>
                <el-button type="primary" @click="exportQuestions" icon="el-icon-download" size="medium">
                  导出数据
                </el-button>
              </div>
            </el-col>
          </el-row>
        </el-card>
      </div>

      <!-- 统计概览 -->
      <div class="stats-section">
        <el-row :gutter="20">
          <el-col :xs="6" :sm="6" :md="6" :lg="6">
            <div class="stat-item total">
              <div class="stat-number">{{ originalQuestions.length }}</div>
              <div class="stat-label">总问题数</div>
            </div>
          </el-col>
          <el-col :xs="6" :sm="6" :md="6" :lg="6">
            <div class="stat-item pending">
              <div class="stat-number">{{ pendingCount }}</div>
              <div class="stat-label">待分类</div>
            </div>
          </el-col>
          <el-col :xs="6" :sm="6" :md="6" :lg="6">
            <div class="stat-item classified">
              <div class="stat-number">{{ classifiedCount }}</div>
              <div class="stat-label">已分类</div>
            </div>
          </el-col>
          <el-col :xs="6" :sm="6" :md="6" :lg="6">
            <div class="stat-item filtered">
              <div class="stat-number">{{ filteredQuestions.length }}</div>
              <div class="stat-label">筛选结果</div>
            </div>
          </el-col>
        </el-row>
      </div>

      <!-- 问题列表 -->
      <div class="list-section">
        <el-card class="list-card">
          <div class="card-header">
            <h3 class="card-title">
              <i class="el-icon-list"></i>
              问题列表
              <span class="question-count">({{ paginatedQuestions.length }}/{{ filteredQuestions.length }})</span>
            </h3>
            <div class="list-actions">
              <el-button-group>
                <el-button 
                  :type="viewMode === 'card' ? 'primary' : ''" 
                  icon="el-icon-s-grid" 
                  @click="viewMode = 'card'"
                  size="small"
                >
                  卡片视图
                </el-button>
                <el-button 
                  :type="viewMode === 'table' ? 'primary' : ''" 
                  icon="el-icon-s-order" 
                  @click="viewMode = 'table'"
                  size="small"
                >
                  表格视图
                </el-button>
              </el-button-group>
            </div>
          </div>

          <div class="card-content">
            <!-- 加载状态 -->
            <div v-if="questionsLoading" class="loading-state">
              <div class="loading-content">
                <i class="el-icon-loading"></i>
                <p>加载问题列表中...</p>
              </div>
            </div>

            <!-- 卡片视图 -->
            <div v-else-if="viewMode === 'card'" class="card-view">
              <div v-if="paginatedQuestions.length > 0" class="question-grid">
                <div 
                  v-for="question in paginatedQuestions" 
                  :key="question.id" 
                  class="question-card"
                  @click="showQuestionDetail(question)"
                >
                  <div class="question-header">
                    <div class="student-info">
                      <i class="el-icon-user"></i>
                      <span class="student-name">{{ question.student_name || '未知学生' }}</span>
                      <span class="student-id">({{ question.student_id || 'N/A' }})</span>
                    </div>
                    <div class="question-status">
                      <el-tag 
                        :type="question.status === 'classified' ? 'success' : 'warning'" 
                        size="mini"
                      >
                        {{ question.status === 'classified' ? '已分类' : '待分类' }}
                      </el-tag>
                    </div>
                  </div>
                  
                  <div class="question-content">
                    <p class="question-text">{{ question.content || '无内容' }}</p>
                  </div>
                  
                  <div class="question-footer">
                    <div class="question-meta">
                      <div class="category-info" v-if="question.category_name">
                        <i class="el-icon-collection-tag"></i>
                        <span>{{ question.category_name }}</span>
                      </div>
                      <div class="time-info">
                        <i class="el-icon-time"></i>
                        <span>{{ formatTime(question.created_at) }}</span>
                      </div>
                    </div>
                    <div class="question-actions">
                      <el-button 
                        v-if="question.status === 'pending'" 
                        type="primary" 
                        size="mini" 
                        @click.stop="classifyQuestion(question.id)"
                        :loading="classifyingIds.includes(question.id)"
                      >
                        分类
                      </el-button>
                      <el-button type="text" size="mini" @click.stop="showQuestionDetail(question)">
                        查看详情
                      </el-button>
                    </div>
                  </div>
                </div>
              </div>
              
              <div v-else class="empty-state">
                <i class="el-icon-chat-line-round"></i>
                <p>{{ getEmptyMessage() }}</p>
                <el-button @click="resetFilters" type="primary">重置筛选条件</el-button>
              </div>
            </div>

            <!-- 表格视图 -->
            <div v-else class="table-view">
              <el-table 
                :data="paginatedQuestions" 
                stripe 
                @row-click="showQuestionDetail"
                empty-text="暂无数据"
                class="question-table"
                v-loading="questionsLoading"
              >
                <el-table-column prop="student_name" label="学生姓名" width="120">
                  <template slot-scope="scope">
                    <div class="student-cell">
                      <div class="student-name">{{ scope.row.student_name || '未知学生' }}</div>
                      <div class="student-id">{{ scope.row.student_id || 'N/A' }}</div>
                    </div>
                  </template>
                </el-table-column>
                
                <el-table-column prop="content" label="问题内容" min-width="300">
                  <template slot-scope="scope">
                    <div class="question-content-cell">
                      <p class="content-preview">{{ getContentPreview(scope.row.content) }}</p>
                      <el-button 
                        v-if="(scope.row.content || '').length > 100" 
                        type="text" 
                        size="mini" 
                        @click.stop="showQuestionDetail(scope.row)"
                      >
                        查看完整内容
                      </el-button>
                    </div>
                  </template>
                </el-table-column>
                
                <el-table-column prop="status" label="状态" width="100">
                  <template slot-scope="scope">
                    <el-tag 
                      :type="scope.row.status === 'classified' ? 'success' : 'warning'" 
                      size="mini"
                    >
                      {{ scope.row.status === 'classified' ? '已分类' : '待分类' }}
                    </el-tag>
                  </template>
                </el-table-column>
                
                <el-table-column prop="category_name" label="分类" width="120">
                  <template slot-scope="scope">
                    <span v-if="scope.row.category_name" class="category-tag">
                      <i class="el-icon-collection-tag"></i>
                      {{ scope.row.category_name }}
                    </span>
                    <span v-else class="no-category">未分类</span>
                  </template>
                </el-table-column>
                
                <el-table-column prop="created_at" label="提交时间" width="160">
                  <template slot-scope="scope">
                    {{ formatTime(scope.row.created_at) }}
                  </template>
                </el-table-column>
                
                <el-table-column label="操作" width="150" fixed="right">
                  <template slot-scope="scope">
                    <el-button 
                      v-if="scope.row.status === 'pending'" 
                      type="primary" 
                      size="mini" 
                      @click.stop="classifyQuestion(scope.row.id)"
                      :loading="classifyingIds.includes(scope.row.id)"
                    >
                      分类
                    </el-button>
                    <el-button 
                      type="text" 
                      size="mini" 
                      @click.stop="showQuestionDetail(scope.row)"
                    >
                      详情
                    </el-button>
                    <el-button 
                      type="text" 
                      size="mini" 
                      @click.stop="deleteQuestion(scope.row)"
                      style="color: #f56c6c;"
                      :loading="deletingIds.includes(scope.row.id)"
                    >
                      删除
                    </el-button>
                  </template>
                </el-table-column>
              </el-table>
            </div>
          </div>
        </el-card>
      </div>

      <!-- 分页 -->
      <div class="pagination-section" v-if="!questionsLoading && filteredQuestions.length > 0">
        <el-pagination
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
          :current-page="currentPage"
          :page-sizes="[10, 20, 50, 100]"
          :page-size="pageSize"
          :total="filteredQuestions.length"
          layout="total, sizes, prev, pager, next, jumper"
          background
        />
      </div>
    </div>

    <!-- 问题详情弹窗 -->
    <el-dialog
      title="问题详情"
      :visible.sync="detailDialogVisible"
      width="600px"
      @close="closeDetailDialog"
    >
      <div v-if="selectedQuestion" class="question-detail">
        <div class="detail-section">
          <h4>学生信息</h4>
          <p><strong>姓名：</strong>{{ selectedQuestion.student_name || '未知学生' }}</p>
          <p><strong>学号：</strong>{{ selectedQuestion.student_id || 'N/A' }}</p>
        </div>
        
        <div class="detail-section">
          <h4>问题内容</h4>
          <div class="question-content-full">{{ selectedQuestion.content || '无内容' }}</div>
        </div>
        
        <div class="detail-section">
          <h4>分类信息</h4>
          <p><strong>状态：</strong>
            <el-tag :type="selectedQuestion.status === 'classified' ? 'success' : 'warning'" size="mini">
              {{ selectedQuestion.status === 'classified' ? '已分类' : '待分类' }}
            </el-tag>
          </p>
          <p v-if="selectedQuestion.category_name">
            <strong>分类：</strong>{{ selectedQuestion.category_name }}
          </p>
        </div>
        
        <div class="detail-section">
          <h4>时间信息</h4>
          <p><strong>提交时间：</strong>{{ formatFullTime(selectedQuestion.created_at) }}</p>
          <p v-if="selectedQuestion.updated_at && selectedQuestion.updated_at !== selectedQuestion.created_at">
            <strong>更新时间：</strong>{{ formatFullTime(selectedQuestion.updated_at) }}
          </p>
        </div>
      </div>
      
      <span slot="footer" class="dialog-footer">
        <el-button @click="closeDetailDialog">关闭</el-button>
        <el-button 
          v-if="selectedQuestion && selectedQuestion.status === 'pending'" 
          type="primary" 
          @click="classifyQuestion(selectedQuestion.id)"
          :loading="classifyingIds.includes(selectedQuestion.id)"
        >
          进行分类
        </el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex'

export default {
  name: 'QuestionList',
  
  data() {
    return {
      // 视图模式
      viewMode: 'card', // 'card' | 'table'
      
      // 🔥 前端筛选状态
      originalQuestions: [], // 存储所有原始数据
      filterStatus: '', // 状态筛选
      filterCategoryId: '', // 分类筛选
      searchKeyword: '', // 搜索关键词
      
      // 分页相关
      currentPage: 1,
      pageSize: 20,
      
      // 搜索防抖
      searchTimer: null,
      
      // 操作状态
      classifyingIds: [],
      deletingIds: [],
      
      // 问题详情弹窗
      detailDialogVisible: false,
      selectedQuestion: null
    }
  },
  
  computed: {
    ...mapGetters([
      'questions',
      'questionsLoading',
      'categories'
    ]),
    
    // 🔥 前端筛选后的问题列表
    filteredQuestions() {
      let filtered = [...this.originalQuestions]
      
      // 状态筛选
      if (this.filterStatus) {
        filtered = filtered.filter(q => q.status === this.filterStatus)
        console.log('🔍 状态筛选后:', filtered.length, '条数据')
      }
      
      // 分类筛选
      if (this.filterCategoryId) {
        filtered = filtered.filter(q => {
          if (this.filterCategoryId === 'uncategorized') {
            return !q.category_id
          }
          return q.category_id == this.filterCategoryId
        })
        console.log('🔍 分类筛选后:', filtered.length, '条数据')
      }
      
      // 搜索筛选
      if (this.searchKeyword && this.searchKeyword.trim()) {
        const keyword = this.searchKeyword.trim().toLowerCase()
        filtered = filtered.filter(q => 
          (q.content || '').toLowerCase().includes(keyword) ||
          (q.student_name || '').toLowerCase().includes(keyword) ||
          (q.student_id || '').toLowerCase().includes(keyword)
        )
        console.log('🔍 搜索筛选后:', filtered.length, '条数据')
      }
      
      return filtered
    },
    
    // 🔥 分页后的问题列表
    paginatedQuestions() {
      const start = (this.currentPage - 1) * this.pageSize
      const end = start + this.pageSize
      return this.filteredQuestions.slice(start, end)
    },
    
    // 统计数据
    pendingCount() {
      return this.originalQuestions.filter(q => q.status === 'pending').length
    },
    
    classifiedCount() {
      return this.originalQuestions.filter(q => q.status === 'classified').length
    }
  },
  
  async created() {
    console.log('🔄 QuestionList组件初始化')
    await this.initializeData()
  },
  
  methods: {
    ...mapActions([
      'fetchQuestions',
      'fetchCategories'
    ]),
    
    // 初始化数据
    async initializeData() {
      try {
        console.log('📋 开始初始化问题列表数据')
        
        // 先获取分类数据
        await this.fetchCategories()
        
        // 然后加载问题列表
        await this.loadQuestions()
        
        console.log('✅ 问题列表数据初始化完成')
      } catch (error) {
        console.error('❌ 数据初始化失败:', error)
        this.$message.error('数据加载失败，请刷新页面重试')
      }
    },
    
    // 🔥 修复：加载问题列表（使用合理的参数）
    async loadQuestions() {
      try {
        console.log('📋 开始加载问题列表数据')
        
        // 🔥 修复1：使用合理的 limit 参数，而不是 1000
        // 🔥 修复2：如果失败，回退到使用现有数据
        try {
          // 先尝试加载更多数据用于前端筛选
          await this.fetchQuestions({ page: 1, limit: 50 })
          this.originalQuestions = [...this.questions]
          console.log('✅ 加载了', this.originalQuestions.length, '条问题数据')
        } catch (apiError) {
          console.warn('⚠️ API 调用失败，使用 Store 中现有数据:', apiError.message)
          
          // 🔥 修复3：如果 API 失败，尝试使用 Store 中现有的数据
          if (this.questions && this.questions.length > 0) {
            this.originalQuestions = [...this.questions]
            console.log('✅ 使用现有数据:', this.originalQuestions.length, '条')
          } else {
            // 如果 Store 中也没有数据，尝试默认参数
            console.log('🔄 尝试使用默认参数重新加载...')
            await this.fetchQuestions({ page: 1, limit: 20 })
            this.originalQuestions = [...this.questions]
            console.log('✅ 使用默认参数加载了', this.originalQuestions.length, '条数据')
          }
        }
        
        console.log('✅ 问题列表加载完成，共', this.originalQuestions.length, '条数据')
      } catch (error) {
        console.error('❌ 加载问题列表失败:', error)
        
        // 🔥 修复4：如果完全失败，至少提供空数据以确保页面不崩溃
        this.originalQuestions = []
        this.$message.error('加载问题列表失败，请稍后重试')
      }
    },
    
    // 🔥 筛选条件变化处理
    handleFilterChange() {
      console.log('🔄 筛选条件变化:', {
        status: this.filterStatus,
        categoryId: this.filterCategoryId,
        search: this.searchKeyword
      })
      
      // 重置到第一页
      this.currentPage = 1
      
      // 前端筛选会自动通过 computed 生效
      this.$nextTick(() => {
        console.log('🔍 筛选结果:', this.filteredQuestions.length, '条数据')
      })
    },
    
    // 🔥 搜索输入处理（防抖）
    handleSearchInput() {
      console.log('🔍 搜索输入:', this.searchKeyword)
      
      if (this.searchTimer) {
        clearTimeout(this.searchTimer)
      }
      
      this.searchTimer = setTimeout(() => {
        console.log('🔍 执行搜索筛选')
        this.handleFilterChange()
      }, 300)
    },
    
    // 重置筛选条件
    resetFilters() {
      console.log('🔄 重置筛选条件')
      
      this.filterStatus = ''
      this.filterCategoryId = ''
      this.searchKeyword = ''
      this.currentPage = 1
      
      this.$nextTick(() => {
        console.log('✅ 筛选条件已重置，显示', this.filteredQuestions.length, '条数据')
      })
    },
    
    // 刷新数据
    async refreshData() {
      console.log('🔄 手动刷新数据')
      await this.loadQuestions()
      this.$message.success('数据刷新成功')
    },
    
    // 分页大小变化
    handleSizeChange(newSize) {
      console.log('📄 分页大小变化:', newSize)
      this.pageSize = newSize
      this.currentPage = 1
    },
    
    // 当前页变化
    handleCurrentChange(newPage) {
      console.log('📄 当前页变化:', newPage)
      this.currentPage = newPage
    },
    
    // 显示问题详情
    showQuestionDetail(question) {
      console.log('📖 显示问题详情:', question.id)
      this.selectedQuestion = question
      this.detailDialogVisible = true
    },
    
    // 关闭详情弹窗
    closeDetailDialog() {
      this.detailDialogVisible = false
      this.selectedQuestion = null
    },
    
    // 🔥 分类问题
    async classifyQuestion(questionId) {
      if (this.classifyingIds.includes(questionId)) {
        return // 防止重复点击
      }
      
      this.classifyingIds.push(questionId)
      
      try {
        console.log('🤖 开始分类问题:', questionId)
        this.$message.info('正在进行AI分类...')
        
        await this.$store.dispatch('classifyQuestion', questionId)
        
        this.$message.success('问题分类成功')
        
        // 刷新列表
        await this.loadQuestions()
        
        // 如果详情弹窗打开，关闭它
        if (this.detailDialogVisible) {
          this.closeDetailDialog()
        }
        
        console.log('✅ 问题分类完成')
      } catch (error) {
        console.error('❌ 分类失败:', error)
        this.$message.error('分类失败: ' + (error.message || '请稍后重试'))
      } finally {
        // 移除loading状态
        const index = this.classifyingIds.indexOf(questionId)
        if (index > -1) {
          this.classifyingIds.splice(index, 1)
        }
      }
    },
    
    // 🔥 删除问题
    async deleteQuestion(question) {
      if (this.deletingIds.includes(question.id)) {
        return // 防止重复点击
      }
      
      try {
        await this.$confirm(
          `确定要删除学生"${question.student_name || '未知学生'}"的问题吗？`, 
          '确认删除', {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning'
          }
        )
        
        this.deletingIds.push(question.id)
        
        console.log('🗑️ 开始删除问题:', question.id)
        
        await this.$store.dispatch('deleteQuestion', question.id)
        
        this.$message.success('问题删除成功')
        
        // 刷新列表
        await this.loadQuestions()
        
        console.log('✅ 问题删除完成')
      } catch (error) {
        if (error !== 'cancel') {
          console.error('❌ 删除失败:', error)
          this.$message.error('删除失败: ' + (error.message || '请稍后重试'))
        }
      } finally {
        // 移除loading状态
        const index = this.deletingIds.indexOf(question.id)
        if (index > -1) {
          this.deletingIds.splice(index, 1)
        }
      }
    },
    
    // 导出问题数据
    exportQuestions() {
      this.$message.info('导出功能开发中...')
    },
    
    // 跳转到分类页面
    goToClassification() {
      this.$router.push('/classification')
    },
    
    // 格式化时间
    formatTime(time) {
      if (!time) return '未知时间'
      try {
        const date = new Date(time)
        return date.toLocaleString('zh-CN', {
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit'
        })
      } catch (error) {
        return '时间格式错误'
      }
    },
    
    // 格式化完整时间
    formatFullTime(time) {
      if (!time) return '未知时间'
      try {
        const date = new Date(time)
        return date.toLocaleString('zh-CN')
      } catch (error) {
        return '时间格式错误'
      }
    },
    
    // 获取内容预览
    getContentPreview(content) {
      if (!content) return '无内容'
      return content.length > 100 ? content.substring(0, 100) + '...' : content
    },
    
    // 获取空状态消息
    getEmptyMessage() {
      if (this.searchKeyword || this.filterStatus || this.filterCategoryId) {
        return '没有符合筛选条件的问题'
      }
      if (this.originalQuestions.length === 0) {
        return '暂无问题数据'
      }
      return '暂无数据'
    }
  }
}
</script>

<style lang="scss" scoped>
// 样式代码与之前相同，为了节省空间这里省略
.question-list-container {
  min-height: calc(100vh - 60px);
  background: #f5f7fa;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 30px;
  
  .header-left {
    .page-title {
      font-size: 32px;
      font-weight: 600;
      color: #333;
      margin: 0 0 10px 0;
      display: flex;
      align-items: center;
      
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
  
  .header-right {
    display: flex;
    gap: 12px;
  }
}

.filter-section {
  margin-bottom: 20px;
  
  .filter-card {
    .filter-item {
      margin-bottom: 15px;
      
      .filter-label {
        display: block;
        font-size: 14px;
        color: #666;
        margin-bottom: 5px;
        font-weight: 500;
      }
    }
    
    .filter-actions {
      display: flex;
      gap: 10px;
      justify-content: flex-end;
      align-items: flex-end;
      height: 60px;
    }
  }
}

.stats-section {
  margin-bottom: 20px;
  
  .stat-item {
    background: white;
    padding: 20px;
    border-radius: 8px;
    text-align: center;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
    transition: all 0.3s ease;
    
    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }
    
    .stat-number {
      font-size: 28px;
      font-weight: 700;
      margin-bottom: 5px;
    }
    
    .stat-label {
      font-size: 14px;
      color: #666;
    }
    
    &.total .stat-number {
      color: #667eea;
    }
    
    &.pending .stat-number {
      color: #e6a23c;
    }
    
    &.classified .stat-number {
      color: #67c23a;
    }
    
    &.filtered .stat-number {
      color: #409eff;
    }
  }
}

.list-section {
  margin-bottom: 20px;
  
  .list-card {
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-bottom: 20px;
      border-bottom: 1px solid #f0f2f5;
      margin-bottom: 20px;
      
      .card-title {
        font-size: 18px;
        font-weight: 600;
        color: #333;
        margin: 0;
        display: flex;
        align-items: center;
        
        i {
          margin-right: 8px;
          color: #667eea;
        }
        
        .question-count {
          font-size: 14px;
          color: #999;
          font-weight: normal;
        }
      }
    }
  }
}

.loading-state {
  padding: 60px 20px;
  text-align: center;
  
  .loading-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 15px;
    
    i {
      font-size: 32px;
      color: #667eea;
    }
    
    p {
      font-size: 16px;
      color: #666;
      margin: 0;
    }
  }
}

.card-view {
  .question-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
    gap: 20px;
  }
  
  .question-card {
    background: white;
    border: 1px solid #e4e7ed;
    border-radius: 8px;
    padding: 20px;
    cursor: pointer;
    transition: all 0.3s ease;
    
    &:hover {
      border-color: #667eea;
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.15);
    }
    
    .question-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 15px;
      
      .student-info {
        display: flex;
        align-items: center;
        gap: 5px;
        
        i {
          color: #667eea;
        }
        
        .student-name {
          font-weight: 600;
          color: #333;
        }
        
        .student-id {
          color: #999;
          font-size: 12px;
        }
      }
    }
    
    .question-content {
      margin-bottom: 15px;
      
      .question-text {
        font-size: 14px;
        line-height: 1.6;
        color: #333;
        margin: 0;
        display: -webkit-box;
        -webkit-line-clamp: 3;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }
    }
    
    .question-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      
      .question-meta {
        display: flex;
        flex-direction: column;
        gap: 5px;
        
        .category-info,
        .time-info {
          display: flex;
          align-items: center;
          gap: 5px;
          font-size: 12px;
          color: #666;
          
          i {
            color: #999;
          }
        }
      }
      
      .question-actions {
        display: flex;
        gap: 5px;
      }
    }
  }
}

.table-view {
  .question-table {
    .student-cell {
      .student-name {
        font-weight: 600;
      }
      
      .student-id {
        font-size: 12px;
        color: #999;
      }
    }
    
    .question-content-cell {
      .content-preview {
        margin: 0 0 5px 0;
        line-height: 1.4;
      }
    }
    
    .category-tag {
      display: flex;
      align-items: center;
      gap: 3px;
      font-size: 12px;
      
      i {
        color: #667eea;
      }
    }
    
    .no-category {
      color: #999;
      font-size: 12px;
    }
  }
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #999;
  
  i {
    font-size: 48px;
    margin-bottom: 15px;
    display: block;
    color: #ddd;
  }
  
  p {
    margin: 0 0 20px 0;
    font-size: 16px;
  }
}

.pagination-section {
  display: flex;
  justify-content: center;
  padding: 20px 0;
}

.question-detail {
  .detail-section {
    margin-bottom: 20px;
    
    h4 {
      font-size: 16px;
      font-weight: 600;
      color: #333;
      margin: 0 0 10px 0;
      padding-bottom: 8px;
      border-bottom: 1px solid #f0f2f5;
    }
    
    p {
      margin: 8px 0;
      line-height: 1.6;
    }
    
    .question-content-full {
      background: #f8f9fa;
      padding: 15px;
      border-radius: 6px;
      line-height: 1.6;
      white-space: pre-wrap;
      word-break: break-word;
    }
  }
}

@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    gap: 20px;
    
    .header-right {
      width: 100%;
      justify-content: flex-start;
    }
  }
  
  .filter-section {
    .filter-actions {
      height: auto;
      justify-content: flex-start;
      flex-wrap: wrap;
    }
  }
  
  .card-view .question-grid {
    grid-template-columns: 1fr;
  }
  
  .list-section .card-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 15px;
  }
}
</style>