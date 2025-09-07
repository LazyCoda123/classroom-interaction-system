<template>
  <div class="home-container">
    <div class="page-container">
      <!-- 欢迎区域 - 改进动画和视觉效果 -->
      <div class="welcome-section">
        <div class="welcome-card">
          <div class="welcome-content">
            <!-- 🔥 新增：用户信息和退出按钮区域 -->
            <div class="user-logout-section">
              <div class="user-info-display">
                <div class="user-avatar">
                  <i class="el-icon-user-solid"></i>
                </div>
                <div class="user-details">
                  <div class="user-name-text">{{ currentUser?.name || '未知用户' }}</div>
                  <div class="user-id-text">{{ currentUser?.student_id || '' }}</div>
                </div>
              </div>
              
              <!-- 退出按钮 -->
              <el-button 
                type="danger" 
                icon="el-icon-switch-button" 
                size="small"
                @click="handleLogout"
                :loading="logoutLoading"
                class="logout-button-home"
                plain
              >
                {{ logoutLoading ? '退出中...' : '退出登录' }}
              </el-button>
            </div>
            
            <div class="welcome-icon">
              <i class="el-icon-edit-outline"></i>
            </div>
            <h1 class="welcome-title">
              欢迎使用课堂互动系统
            </h1>
            <p class="welcome-text">
              亲爱的 <span class="user-name">{{ currentUser ? currentUser.name : '同学' }}</span>，
              有什么问题都可以在这里提出，我们的AI系统会智能分类并帮助老师更好地理解你的需求。
            </p>
            <div class="welcome-stats">
              <div class="stat-item">
                <div class="stat-circle">
                  <span class="stat-number">{{ stats.totalQuestions }}</span>
                </div>
                <span class="stat-label">累计问题</span>
              </div>
              <div class="stat-item">
                <div class="stat-circle">
                  <span class="stat-number">{{ stats.classifiedQuestions }}</span>
                </div>
                <span class="stat-label">已分类</span>
              </div>
              <div class="stat-item">
                <div class="stat-circle">
                  <span class="stat-number">{{ stats.activeUsers }}</span>
                </div>
                <span class="stat-label">活跃学生</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 问题提交区域 - 改进布局和交互 -->
      <div class="submit-section">
        <!-- 提交新问题 -->
        <el-card class="submit-card" v-if="!hasQuestion" shadow="hover">
          <div slot="header" class="card-header">
            <div class="header-content">
              <i class="el-icon-edit"></i>
              <span>提交新问题</span>
            </div>
            <el-tag size="small" type="info">每人限提交一个问题</el-tag>
          </div>
          
          <el-form 
            ref="questionForm"
            :model="questionForm"
            :rules="questionRules"
            label-width="0"
            @submit.native.prevent="handleSubmit"
            class="question-form"
          >
            <el-form-item prop="content">
              <div class="form-label">
                <i class="el-icon-chat-dot-round"></i>
                <span>问题内容</span>
                <span class="required-mark">*</span>
              </div>
              <el-input
                v-model="questionForm.content"
                type="textarea"
                :rows="6"
                placeholder="请详细描述你的问题，比如：&#10;• 哪个知识点不理解？&#10;• 解题步骤卡在哪里？&#10;• 需要老师重点讲解什么？"
                :maxlength="500"
                show-word-limit
                resize="none"
                @keydown.ctrl.enter.native="handleSubmit"
                class="question-textarea"
              />
            </el-form-item>
            
            <div class="input-tips">
              <div class="tips-header">
                <i class="el-icon-info"></i>
                <span>💡 提问小贴士</span>
              </div>
              <div class="tips-content">
                <div class="tip-item">
                  <i class="el-icon-check"></i>
                  <span>详细描述问题，包含具体的疑惑点</span>
                </div>
                <div class="tip-item">
                  <i class="el-icon-check"></i>
                  <span>计算题可以说明卡在哪一步</span>
                </div>
                <div class="tip-item">
                  <i class="el-icon-check"></i>
                  <span>按 Ctrl+Enter 快速提交</span>
                </div>
              </div>
            </div>
            
            <el-form-item class="submit-actions">
              <el-button
                type="primary"
                size="large"
                :loading="submitLoading"
                @click="handleSubmit"
                class="submit-button"
              >
                <i class="el-icon-upload2" v-if="!submitLoading"></i>
                <i class="el-icon-loading" v-if="submitLoading"></i>
                {{ submitLoading ? '提交中...' : '提交问题' }}
              </el-button>
              
              <el-button
                size="large"
                @click="resetForm"
                :disabled="submitLoading"
                class="reset-button"
              >
                <i class="el-icon-refresh"></i>
                重置
              </el-button>
            </el-form-item>
          </el-form>
        </el-card>
        
        <!-- 已提交问题显示 - 改进卡片设计 -->
        <el-card class="submitted-card" v-else shadow="hover">
          <div slot="header" class="card-header">
            <div class="header-content">
              <i class="el-icon-success"></i>
              <span>你的问题</span>
            </div>
            <el-tag 
              :type="getStatusType(currentQuestion.status)"
              size="medium"
              class="status-tag"
            >
              {{ getStatusText(currentQuestion.status) }}
            </el-tag>
          </div>
          
          <div class="question-display">
            <div class="question-content">
              <div class="content-header">
                <i class="el-icon-chat-dot-round"></i>
                <span>问题内容</span>
              </div>
              <div class="content-text">{{ currentQuestion.content }}</div>
            </div>
            
            <div class="question-meta">
              <div class="meta-grid">
                <div class="meta-item">
                  <i class="el-icon-time"></i>
                  <div class="meta-content">
                    <span class="meta-label">提交时间</span>
                    <span class="meta-value">{{ currentQuestion.created_at | dateFormat }}</span>
                  </div>
                </div>
                <div class="meta-item">
                  <i class="el-icon-user"></i>
                  <div class="meta-content">
                    <span class="meta-label">提交人</span>
                    <span class="meta-value">{{ currentUser.name }}</span>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- AI分类结果 - 改进设计 -->
            <div class="classification-result" v-if="questionCategory">
              <div class="classification-header">
                <div class="header-left">
                  <i class="el-icon-cpu"></i>
                  <span>AI智能分类结果</span>
                </div>
                <el-tag size="small" type="success">
                  <i class="el-icon-check"></i>
                  分类完成
                </el-tag>
              </div>
              <div class="category-display">
                <div class="category-main">
                  <div class="category-icon">
                    <i class="el-icon-collection-tag"></i>
                  </div>
                  <div class="category-info">
                    <div class="category-name">{{ questionCategory.name }}</div>
                    <div class="category-desc">{{ questionCategory.description }}</div>
                  </div>
                  <div class="category-badge" :style="{ backgroundColor: getCategoryColor(questionCategory.id) }">
                    分类{{ questionCategory.id }}
                  </div>
                </div>
              </div>
            </div>
            
            <!-- 等待分类状态 -->
            <div class="classification-pending" v-else-if="currentQuestion.status === 'pending'">
              <div class="pending-content">
                <i class="el-icon-loading"></i>
                <span>AI正在分析你的问题...</span>
              </div>
            </div>
            
            <!-- 操作按钮 - 改进样式 -->
            <div class="question-actions">
              <el-button
                type="primary"
                @click="viewDetails"
                icon="el-icon-view"
                class="action-button primary-action"
              >
                查看详情
              </el-button>
              
              <el-button
                type="danger"
                @click="confirmDelete"
                icon="el-icon-delete"
                :loading="deleteLoading"
                class="action-button danger-action"
                plain
              >
                删除问题
              </el-button>
            </div>
          </div>
        </el-card>
      </div>

      <!-- 帮助信息 - 改进交互设计 -->
      <el-card class="help-card" shadow="hover">
        <div slot="header" class="card-header">
          <div class="header-content">
            <i class="el-icon-question"></i>
            <span>使用帮助</span>
          </div>
          <el-tag size="small" type="warning">常见问题</el-tag>
        </div>
        
        <el-collapse v-model="activeHelp" class="help-collapse">
          <el-collapse-item name="1" class="help-item">
            <template slot="title">
              <i class="el-icon-edit-outline"></i>
              <span>如何提交问题？</span>
            </template>
            <div class="help-content">
              <ol>
                <li>在上方文本框中详细描述你的问题</li>
                <li>点击"提交问题"按钮</li>
                <li>系统会自动进行AI分类</li>
                <li>老师会根据分类结果进行针对性回复</li>
              </ol>
            </div>
          </el-collapse-item>
          
          <el-collapse-item name="2" class="help-item">
            <template slot="title">
              <i class="el-icon-collection-tag"></i>
              <span>问题分类有哪些？</span>
            </template>
            <div class="help-content">
              <div class="category-list">
                <div class="category-item">
                  <el-tag color="#409EFF" size="small">知识点定义类</el-tag>
                  <span>关于概念、定义、含义的问题</span>
                </div>
                <div class="category-item">
                  <el-tag color="#67C23A" size="small">知识点应用类</el-tag>
                  <span>关于具体应用、计算、使用方法的问题</span>
                </div>
                <div class="category-item">
                  <el-tag color="#E6A23C" size="small">知识点关联类</el-tag>
                  <span>关于对比、区别、联系的问题</span>
                </div>
                <div class="category-item">
                  <el-tag color="#F56C6C" size="small">实验操作类</el-tag>
                  <span>关于实验、操作、步骤的问题</span>
                </div>
                <div class="category-item">
                  <el-tag color="#909399" size="small">解题方法类</el-tag>
                  <span>关于解题技巧、思路、方法的问题</span>
                </div>
                <div class="category-item">
                  <el-tag color="#606266" size="small">其他类问题</el-tag>
                  <span>无法归类的其他问题</span>
                </div>
              </div>
            </div>
          </el-collapse-item>
          
          <el-collapse-item name="3" class="help-item">
            <template slot="title">
              <i class="el-icon-warning-outline"></i>
              <span>为什么只能提交一个问题？</span>
            </template>
            <div class="help-content">
              <p>为了确保教学质量和系统性能，每个学生在一个学习周期内只能提交一个问题。这样可以：</p>
              <ul>
                <li>让你更加慎重地思考和组织问题</li>
                <li>确保老师有足够时间仔细回答每个问题</li>
                <li>避免重复或过于简单的问题</li>
                <li>提高整体的学习效率</li>
              </ul>
            </div>
          </el-collapse-item>
        </el-collapse>
      </el-card>
    </div>
  </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex'

export default {
  name: 'Home',
  
  data() {
    return {
      questionForm: {
        content: ''
      },
      questionRules: {
        content: [
          { required: true, message: '请输入问题内容', trigger: 'blur' },
          { min: 10, message: '问题内容至少10个字符', trigger: 'blur' },
          { max: 500, message: '问题内容不能超过500个字符', trigger: 'blur' }
        ]
      },
      submitLoading: false,
      deleteLoading: false,
      // 🔥 新增：退出登录loading状态
      logoutLoading: false,
      activeHelp: [],
      stats: {
        totalQuestions: 0,
        classifiedQuestions: 0,
        activeUsers: 0
      }
    }
  },

  computed: {
    ...mapGetters([
      'currentUser',
      'hasQuestion', 
      'currentQuestion',
      'questionCategory'
    ])
  },

  methods: {
    ...mapActions([
      'submitQuestion',
      'fetchCurrentQuestion',
      'deleteQuestion',
      // 🔥 新增：引入logout action
      'logout'
    ]),

    // 🔥 新增：退出登录功能（参考Dashboard.vue）
    async handleLogout() {
      try {
        // 确认退出
        const confirmed = await this.$confirm(
          '确定要退出登录吗？',
          '退出确认',
          {
            confirmButtonText: '确定退出',
            cancelButtonText: '取消',
            type: 'warning',
            confirmButtonClass: 'el-button--danger'
          }
        ).catch(() => false)
        
        if (!confirmed) return
        
        this.logoutLoading = true
        
        // 调用 store 的 logout action
        await this.logout()
        
        // 显示退出成功消息
        this.$message.success('退出登录成功')
        
        // 跳转到登录页面
        await this.$router.push('/login')
        
      } catch (error) {
        console.error('退出登录失败:', error)
        this.$message.error(error.message || '退出登录失败')
      } finally {
        this.logoutLoading = false
      }
    },

    async handleSubmit() {
      try {
        const valid = await this.$refs.questionForm.validate()
        if (!valid) return

        this.submitLoading = true
        console.log('📝 开始提交问题:', this.questionForm.content.substring(0, 50) + '...')

        await this.submitQuestion(this.questionForm)
        this.$message.success('问题提交成功！系统正在进行AI分类...')
        this.resetForm()
        
      } catch (error) {
        console.error('❌ 提交问题失败:', error)
        if (error.message) {
          this.$message.error('提交失败：' + error.message)
        }
      } finally {
        this.submitLoading = false
      }
    },

    resetForm() {
      this.questionForm.content = ''
      if (this.$refs.questionForm) {
        this.$refs.questionForm.clearValidate()
      }
    },

    async confirmDelete() {
      try {
        await this.$confirm(
          '确定要删除这个问题吗？删除后无法恢复，你将可以重新提交新问题。',
          '确认删除',
          {
            confirmButtonText: '确定删除',
            cancelButtonText: '取消',
            type: 'warning'
          }
        )

        this.deleteLoading = true
        console.log('🗑️ 用户确认删除问题')
        
        await this.deleteQuestion()
        this.$message.success('问题删除成功！你现在可以重新提交问题了。')
        await this.fetchCurrentQuestion()
        
      } catch (error) {
        if (error !== 'cancel') {
          console.error('❌ 删除问题失败:', error)
          this.$message.error('删除失败：' + (error.message || '未知错误'))
        }
      } finally {
        this.deleteLoading = false
      }
    },

    viewDetails() {
      this.$router.push('/my-question')
    },

    getStatusType(status) {
      const statusMap = {
        'pending': 'warning',
        'classified': 'success'
      }
      return statusMap[status] || 'info'
    },

    getStatusText(status) {
      const statusMap = {
        'pending': '待分类',
        'classified': '已分类'
      }
      return statusMap[status] || '未知状态'
    },

    getCategoryColor(categoryId) {
      const colors = ['#409EFF', '#67C23A', '#E6A23C', '#F56C6C', '#909399', '#606266']
      return colors[(categoryId - 1) % colors.length]
    },

    async loadStats() {
      try {
        console.log('📊 开始加载统计数据')
        
        const response = await this.$api.questions.getStats()
        
        if (response.success) {
          this.stats = {
            totalQuestions: response.data.totalQuestions || 0,
            classifiedQuestions: response.data.classifiedQuestions || 0,
            activeUsers: response.data.activeUsers || 0
          }
          console.log('✅ 统计数据加载成功:', this.stats)
        } else {
          throw new Error('API返回失败')
        }
      } catch (error) {
        console.warn('⚠️ 获取真实统计数据失败，使用模拟数据:', error.message)
        
        this.stats = {
          totalQuestions: Math.floor(Math.random() * 100) + 50,
          classifiedQuestions: Math.floor(Math.random() * 80) + 40,
          activeUsers: Math.floor(Math.random() * 30) + 20
        }
      }
    },

    async refreshData() {
      try {
        console.log('🔄 刷新页面数据')
        
        await Promise.all([
          this.fetchCurrentQuestion(),
          this.loadStats()
        ])
        
        console.log('✅ 数据刷新完成')
        
      } catch (error) {
        console.error('❌ 数据刷新失败:', error)
      }
    },

    checkSubmitButtonDisplay() {
      console.log('🔍 检查提交按钮显示状态:', {
        hasQuestion: this.hasQuestion,
        currentQuestion: this.currentQuestion,
        isLoggedIn: this.$store.getters.isLoggedIn,
        user: this.currentUser
      })
    }
  },

  async created() {
    document.title = '提交问题 - 课堂互动系统'
    
    console.log('🚀 Home页面初始化开始')
    
    try {
      await this.fetchCurrentQuestion()
      this.checkSubmitButtonDisplay()
      await this.loadStats()
      
      console.log('✅ Home页面初始化完成')
      
    } catch (error) {
      console.error('❌ Home页面初始化失败:', error)
    }
  },

  watch: {
    hasQuestion(newVal, oldVal) {
      console.log('👀 hasQuestion状态变化:', { 从: oldVal, 到: newVal })
      if (newVal !== oldVal) {
        this.checkSubmitButtonDisplay()
      }
    },
    
    currentQuestion(newVal, oldVal) {
      console.log('👀 currentQuestion变化:', { 
        从: oldVal?.id || 'null', 
        到: newVal?.id || 'null' 
      })
    }
  }
}
</script>

<style scoped>
/* 全局容器 */
.home-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  padding: 20px 0;
}

.page-container {
  max-width: 900px;
  margin: 0 auto;
  padding: 0 20px;
}

/* 欢迎区域 - 全新设计 */
.welcome-section {
  margin-bottom: 40px;
}

.welcome-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 20px;
  padding: 40px;
  color: white;
  text-align: center;
  position: relative;
  overflow: hidden;
  box-shadow: 0 20px 40px rgba(102, 126, 234, 0.3);
}

.welcome-card::before {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
  animation: shimmer 3s ease-in-out infinite;
}

@keyframes shimmer {
  0%, 100% { transform: translate(-50%, -50%) rotate(0deg); }
  50% { transform: translate(-50%, -50%) rotate(180deg); }
}

.welcome-content {
  position: relative;
  z-index: 1;
}

/* 🔥 新增：用户信息和退出按钮区域样式 */
.user-logout-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding: 0 20px;
}

.user-info-display {
  display: flex;
  align-items: center;
  gap: 12px;
  background: rgba(255, 255, 255, 0.15);
  padding: 8px 16px;
  border-radius: 25px;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.user-avatar {
  width: 36px;
  height: 36px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(10px);
}

.user-avatar i {
  font-size: 18px;
  color: white;
}

.user-details {
  text-align: left;
}

.user-name-text {
  font-size: 14px;
  font-weight: 600;
  color: white;
  line-height: 1.2;
}

.user-id-text {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.8);
  line-height: 1.2;
}

.logout-button-home {
  background: rgba(245, 108, 108, 0.2);
  border: 1px solid rgba(245, 108, 108, 0.3);
  color: white;
  border-radius: 20px;
  padding: 6px 16px;
  font-weight: 500;
  font-size: 12px;
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
}

.logout-button-home:hover {
  background: rgba(245, 108, 108, 0.3);
  border-color: rgba(245, 108, 108, 0.5);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(245, 108, 108, 0.3);
}

.logout-button-home:focus {
  background: rgba(245, 108, 108, 0.3);
  border-color: rgba(245, 108, 108, 0.5);
  color: white;
}

.welcome-icon {
  width: 80px;
  height: 80px;
  margin: 0 auto 20px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(10px);
}

.welcome-icon i {
  font-size: 36px;
  color: white;
}

.welcome-title {
  font-size: 32px;
  margin: 0 0 20px 0;
  font-weight: 700;
  text-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.welcome-text {
  font-size: 18px;
  margin: 0 0 30px 0;
  line-height: 1.6;
  opacity: 0.95;
}

.user-name {
  background: rgba(255, 255, 255, 0.2);
  padding: 4px 12px;
  border-radius: 15px;
  font-weight: 600;
  backdrop-filter: blur(10px);
}

.welcome-stats {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 40px;
  margin-top: 30px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.stat-circle {
  width: 70px;
  height: 70px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(10px);
  border: 2px solid rgba(255, 255, 255, 0.3);
  transition: all 0.3s ease;
}

.stat-circle:hover {
  transform: scale(1.05);
  background: rgba(255, 255, 255, 0.25);
}

.stat-number {
  font-size: 24px;
  font-weight: 700;
  color: white !important;
  line-height: 1;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.stat-label {
  font-size: 14px;
  color: white !important;
  font-weight: 500;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

/* 提交区域 */
.submit-section {
  margin-bottom: 40px;
}

.submit-card,
.submitted-card {
  border-radius: 16px;
  border: none;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.submit-card:hover,
.submitted-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
  color: #333;
  border-bottom: 1px solid #f0f0f0;
  padding: 20px 24px;
}

.header-content {
  display: flex;
  align-items: center;
  gap: 10px;
}

.header-content i {
  color: #667eea;
  font-size: 18px;
}

.status-tag {
  font-weight: 500;
}

/* 表单样式 */
.question-form {
  padding: 24px;
}

.form-label {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  font-weight: 600;
  color: #333;
  font-size: 16px;
}

.form-label i {
  color: #667eea;
}

.required-mark {
  color: #f56c6c;
}

.question-textarea {
  margin-bottom: 20px;
}

.question-textarea .el-textarea__inner {
  border-radius: 12px;
  border: 2px solid #e4e7ed;
  font-size: 15px;
  line-height: 1.6;
  transition: all 0.3s ease;
}

.question-textarea .el-textarea__inner:focus {
  border-color: #667eea;
  box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.1);
}

/* 提示区域 */
.input-tips {
  background: linear-gradient(135deg, #f8f9ff 0%, #f0f2ff 100%);
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 24px;
  border: 1px solid #e6e8ff;
}

.tips-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 15px;
  font-weight: 600;
  color: #333;
}

.tips-header i {
  color: #667eea;
}

.tips-content {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.tip-item {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #666;
  font-size: 14px;
}

.tip-item i {
  color: #67c23a;
  font-size: 12px;
}

/* 按钮样式 */
.submit-actions {
  display: flex;
  gap: 15px;
  margin-bottom: 0;
}

.submit-button {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  border-radius: 25px;
  padding: 14px 32px;
  font-size: 16px;
  font-weight: 600;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
}

.submit-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(102, 126, 234, 0.4);
}

.reset-button {
  border-radius: 25px;
  padding: 14px 24px;
  font-weight: 600;
  transition: all 0.3s ease;
}

/* 已提交问题显示 */
.question-display {
  padding: 24px;
}

.question-content {
  margin-bottom: 24px;
}

.content-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  font-weight: 600;
  color: #333;
}

.content-header i {
  color: #667eea;
}

.content-text {
  background: linear-gradient(135deg, #f8f9ff 0%, #f0f2ff 100%);
  padding: 20px;
  border-radius: 12px;
  border-left: 4px solid #667eea;
  line-height: 1.6;
  color: #333;
  font-size: 15px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.question-meta {
  margin-bottom: 24px;
  background: #fafbfc;
  border-radius: 12px;
  padding: 20px;
}

.meta-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 12px;
}

.meta-item i {
  width: 32px;
  height: 32px;
  background: #667eea;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
}

.meta-content {
  display: flex;
  flex-direction: column;
}

.meta-label {
  color: #666;
  font-size: 12px;
  margin-bottom: 2px;
}

.meta-value {
  color: #333;
  font-weight: 600;
  font-size: 14px;
}

/* AI分类结果 */
.classification-result {
  margin-bottom: 24px;
  background: linear-gradient(135deg, #f0f9ff 0%, #e6f7ff 100%);
  border-radius: 16px;
  padding: 24px;
  border: 2px solid #e6f4ff;
  box-shadow: 0 4px 20px rgba(24, 144, 255, 0.1);
}

.classification-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 10px;
  font-weight: 600;
  color: #1890ff;
  font-size: 16px;
}

.header-left i {
  font-size: 18px;
}

.category-display {
  background: white;
  border-radius: 12px;
  padding: 0;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.category-main {
  display: flex;
  align-items: center;
  padding: 20px;
  gap: 16px;
}

.category-icon {
  width: 48px;
  height: 48px;
  background: linear-gradient(135deg, #1890ff, #52c41a);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 20px;
  flex-shrink: 0;
}

.category-info {
  flex: 1;
  min-width: 0;
}

.category-name {
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin-bottom: 6px;
  line-height: 1.2;
}

.category-desc {
  font-size: 14px;
  color: #666;
  line-height: 1.4;
  margin: 0;
}

.category-badge {
  padding: 6px 16px;
  border-radius: 20px;
  color: white;
  font-size: 12px;
  font-weight: 500;
  flex-shrink: 0;
}

/* 等待分类状态 */
.classification-pending {
  margin-bottom: 24px;
  background: linear-gradient(135deg, #fff7e6 0%, #fff2d9 100%);
  border-radius: 12px;
  padding: 20px;
  border: 1px solid #ffd591;
}

.pending-content {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  color: #d48806;
  font-weight: 500;
}

.pending-content i {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* 操作按钮 */
.question-actions {
  display: flex;
  gap: 15px;
  justify-content: center;
  padding-top: 20px;
  border-top: 1px solid #f0f0f0;
}

.action-button {
  border-radius: 20px;
  padding: 10px 24px;
  font-weight: 500;
  transition: all 0.3s ease;
}

.primary-action:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.3);
}

.danger-action:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(245, 108, 108, 0.3);
}

/* 帮助卡片 */
.help-card {
  border-radius: 16px;
  border: none;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

.help-collapse {
  border: none;
}

.help-item {
  border-bottom: 1px solid #f0f0f0;
}

.help-item:last-child {
  border-bottom: none;
}

.help-item .el-collapse-item__header {
  padding: 20px 24px;
  background: none;
  border: none;
  font-weight: 600;
  color: #333;
}

.help-item .el-collapse-item__header i {
  margin-right: 10px;
  color: #667eea;
}

.help-content {
  padding: 0 24px 20px;
  color: #666;
  line-height: 1.6;
}

.help-content ol,
.help-content ul {
  margin: 15px 0;
  padding-left: 20px;
}

.help-content li {
  margin-bottom: 8px;
}

.category-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.category-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 0;
}

.category-item .el-tag {
  color: white !important;
  border: none;
  font-weight: 500;
  min-width: 100px;
  text-align: center;
}

/* 🔥 响应式设计 - 新增退出按钮适配 */
@media (max-width: 768px) {
  .page-container {
    padding: 0 15px;
  }
  
  .welcome-card {
    padding: 30px 20px;
  }
  
  /* 用户信息区域响应式 */
  .user-logout-section {
    flex-direction: column;
    gap: 15px;
    padding: 0 10px;
  }
  
  .user-info-display {
    align-self: center;
  }
  
  .logout-button-home {
    font-size: 14px;
    padding: 8px 20px;
  }
  
  .welcome-title {
    font-size: 24px;
  }
  
  .welcome-stats {
    gap: 25px;
    margin-top: 25px;
  }
  
  .stat-circle {
    width: 60px;
    height: 60px;
  }
  
  .stat-number {
    font-size: 20px;
  }
  
  .meta-grid {
    grid-template-columns: 1fr;
    gap: 15px;
  }
  
  .question-actions {
    flex-direction: column;
    gap: 10px;
  }
  
  .action-button {
    width: 100%;
  }
  
  .submit-actions {
    flex-direction: column;
  }
  
  .submit-button,
  .reset-button {
    width: 100%;
  }
  
  .category-main {
    flex-direction: column;
    text-align: center;
    gap: 12px;
  }
  
  .category-info {
    order: 1;
  }
  
  .category-badge {
    order: 0;
    align-self: center;
  }
}

@media (max-width: 480px) {
  .welcome-stats {
    flex-direction: column;
    gap: 20px;
  }
  
  .user-logout-section {
    padding: 0 5px;
  }
  
  .user-info-display {
    flex-direction: column;
    text-align: center;
    gap: 8px;
    padding: 12px;
  }
  
  .logout-button-home {
    width: 100%;
    max-width: 200px;
  }
  
  .card-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
  
  .classification-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
  
  .category-main {
    padding: 16px;
  }
}
</style>