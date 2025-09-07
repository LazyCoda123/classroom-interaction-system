<template>
  <div class="question-container">
    <div class="page-container">
      <!-- 🎨 优化后的页面头部 -->
      <div class="page-header">
        <div class="header-background">
          <div class="header-shapes">
            <div class="shape shape-1"></div>
            <div class="shape shape-2"></div>
            <div class="shape shape-3"></div>
          </div>
        </div>
        <div class="header-content">
          <div class="header-icon">
            <i class="el-icon-chat-line-round"></i>
          </div>
          <h1 class="page-title">我的问题</h1>
          <p class="page-subtitle">查看你提交的问题详情和AI智能分析结果</p>
          <div class="status-badge" v-if="currentQuestion">
            <el-tag 
              :type="getStatusType(currentQuestion.status)"
              effect="dark"
              size="medium"
            >
              <i :class="getStatusIcon(currentQuestion.status)"></i>
              {{ getStatusText(currentQuestion.status) }}
            </el-tag>
          </div>
        </div>
      </div>

      <!-- 🎨 优化后的问题详情 -->
      <div class="question-detail" v-if="currentQuestion">
        <div class="detail-grid">
          <!-- 问题内容卡片 -->
          <div class="content-card">
            <div class="card-header">
              <div class="header-icon">
                <i class="el-icon-document"></i>
              </div>
              <div class="header-text">
                <h3>问题内容</h3>
                <span>ID: #{{ currentQuestion.id }}</span>
              </div>
              <el-button
                type="text"
                @click="refreshQuestion"
                :loading="refreshLoading"
                icon="el-icon-refresh"
                class="refresh-btn"
              >
                刷新
              </el-button>
            </div>
            <div class="question-content">
              <div class="content-text">
                {{ currentQuestion.content }}
              </div>
              <div class="content-footer">
                <div class="time-info">
                  <div class="time-item">
                    <i class="el-icon-time"></i>
                    <span>{{ currentQuestion.created_at | dateFormat }}</span>
                  </div>
                  <div class="time-item">
                    <i class="el-icon-refresh-left"></i>
                    <span>{{ currentQuestion.updated_at | timeFromNow }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- AI分类结果卡片 -->
          <div class="classification-card" v-if="questionCategory">
            <div class="card-header">
              <div class="header-icon ai-icon">
                <i class="el-icon-cpu"></i>
              </div>
              <div class="header-text">
                <h3>AI智能分析</h3>
                <span>自动分类完成</span>
              </div>
              <div class="confidence-badge">
                <span>置信度 95%</span>
              </div>
            </div>
            <div class="classification-content">
              <div class="category-display">
                <div class="category-icon">
                  <i class="el-icon-collection-tag"></i>
                </div>
                <div class="category-info">
                  <h4 class="category-name">{{ questionCategory.name }}</h4>
                  <p class="category-description">{{ questionCategory.description }}</p>
                </div>
              </div>
              <div class="analysis-details">
                <div class="analysis-item">
                  <span class="analysis-label">问题类型</span>
                  <span class="analysis-value">{{ questionCategory.name }}</span>
                </div>
                <div class="analysis-item">
                  <span class="analysis-label">匹配关键词</span>
                  <span class="analysis-value">{{ questionCategory.keywords || '定义、含义、概念' }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- 等待分类卡片 -->
          <div class="classification-card pending" v-else-if="currentQuestion.status === 'pending'">
            <div class="card-header">
              <div class="header-icon pending-icon">
                <i class="el-icon-loading"></i>
              </div>
              <div class="header-text">
                <h3>AI分析中</h3>
                <span>正在智能分析问题类型...</span>
              </div>
            </div>
            <div class="pending-content">
              <div class="loading-animation">
                <div class="dots">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
              <p>AI正在深度分析你的问题，通常需要几秒钟时间</p>
            </div>
          </div>
        </div>

        <!-- 🎨 优化后的处理进度 -->
        <div class="progress-section">
          <div class="section-header">
            <h3>
              <i class="el-icon-s-claim"></i>
              处理进度
            </h3>
          </div>
          <div class="progress-timeline">
            <div class="timeline-item completed">
              <div class="timeline-dot">
                <i class="el-icon-check"></i>
              </div>
              <div class="timeline-content">
                <h4>问题已提交</h4>
                <p>{{ currentQuestion.created_at | dateFormat }}</p>
              </div>
            </div>
            
            <div class="timeline-connector" :class="{ active: currentQuestion.status === 'classified' }"></div>
            
            <div class="timeline-item" :class="{ completed: currentQuestion.status === 'classified', active: currentQuestion.status === 'pending' }">
              <div class="timeline-dot">
                <i :class="currentQuestion.status === 'classified' ? 'el-icon-check' : 'el-icon-loading'"></i>
              </div>
              <div class="timeline-content">
                <h4>AI智能分析</h4>
                <p v-if="currentQuestion.status === 'classified'">{{ currentQuestion.updated_at | dateFormat }}</p>
                <p v-else>分析中...</p>
              </div>
            </div>
            
            <div class="timeline-connector" :class="{ active: false }"></div>
            
            <div class="timeline-item">
              <div class="timeline-dot">
                <i class="el-icon-user"></i>
              </div>
              <div class="timeline-content">
                <h4>教师回复</h4>
                <p>预计24小时内</p>
              </div>
            </div>
          </div>
        </div>

        <!-- 🎨 优化后的操作按钮 -->
        <div class="action-section">
          <div class="action-grid">
            <el-button
              type="primary"
              @click="copyQuestionInfo"
              icon="el-icon-document-copy"
              class="action-btn primary-btn"
            >
              <span>复制信息</span>
            </el-button>
            
            <el-button
              @click="exportQuestion"
              icon="el-icon-download"
              class="action-btn"
            >
              <span>导出文档</span>
            </el-button>
            
            <el-button
              type="danger"
              @click="confirmDelete"
              icon="el-icon-delete"
              :loading="deleteLoading"
              class="action-btn danger-btn"
            >
              <span>删除问题</span>
            </el-button>
          </div>
        </div>
      </div>

      <!-- 🎨 优化后的无问题状态 -->
      <div class="no-question" v-else>
        <div class="empty-state">
          <div class="empty-animation">
            <div class="empty-icon">
              <i class="el-icon-document-add"></i>
            </div>
          </div>
          <h3>还没有提交问题</h3>
          <p>每个学生可以提交一个问题，让AI帮你智能分析</p>
          <el-button 
            type="primary" 
            @click="goToSubmit"
            size="large"
            class="submit-btn"
          >
            <i class="el-icon-edit-outline"></i>
            <span>立即提问</span>
          </el-button>
        </div>
      </div>

      <!-- 🎨 优化后的帮助提示 -->
      <div class="help-section">
        <div class="help-header">
          <h3>
            <i class="el-icon-info"></i>
            使用指南
          </h3>
        </div>
        <div class="help-content">
          <div class="help-grid">
            <div class="help-item">
              <div class="help-icon">
                <i class="el-icon-edit"></i>
              </div>
              <div class="help-text">
                <h4>提交问题</h4>
                <p>每个学生只能提交一个问题，请认真思考后提交</p>
              </div>
            </div>
            <div class="help-item">
              <div class="help-icon">
                <i class="el-icon-cpu"></i>
              </div>
              <div class="help-text">
                <h4>AI分析</h4>
                <p>系统会自动分析问题类型，帮助老师更好理解</p>
              </div>
            </div>
            <div class="help-item">
              <div class="help-icon">
                <i class="el-icon-user"></i>
              </div>
              <div class="help-text">
                <h4>教师回复</h4>
                <p>老师会根据分类结果进行针对性回复</p>
              </div>
            </div>
          </div>
        </div>
        
        <!-- 分类参考 -->
        <div class="category-reference">
          <h4>问题分类参考</h4>
          <div class="category-list">
            <div 
              v-for="(category, index) in allCategories" 
              :key="category.id"
              class="category-item"
              :style="{ animationDelay: `${index * 0.1}s` }"
            >
              <div class="category-badge" :style="{ backgroundColor: getCategoryColor(category.id) }">
                {{ index + 1 }}
              </div>
              <div class="category-content">
                <h5>{{ category.name }}</h5>
                <p>{{ category.description }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex'

export default {
  name: 'Question',
  
  data() {
    return {
      refreshLoading: false,
      deleteLoading: false,
      allCategories: [
        {
          id: 1,
          name: '知识点定义类问题',
          description: '关于概念、定义、含义的问题'
        },
        {
          id: 2,
          name: '知识点应用类问题',
          description: '关于具体应用、计算、使用方法的问题'
        },
        {
          id: 3,
          name: '知识点关联类问题',
          description: '关于对比、区别、联系的问题'
        },
        {
          id: 4,
          name: '实验操作类问题',
          description: '关于实验、操作、步骤的问题'
        },
        {
          id: 5,
          name: '解题方法类问题',
          description: '关于解题技巧、思路、方法的问题'
        },
        {
          id: 6,
          name: '其他类问题',
          description: '无法归类的其他问题'
        }
      ]
    }
  },

  computed: {
    ...mapGetters([
      'currentQuestion',
      'questionCategory',
      'hasQuestion'
    ])
  },

  async created() {
    document.title = '我的问题 - 课堂互动系统'
    await this.refreshQuestion()
  },

  methods: {
    ...mapActions([
      'fetchCurrentQuestion',
      'deleteQuestion'
    ]),

    async refreshQuestion() {
      try {
        this.refreshLoading = true
        await this.fetchCurrentQuestion()
        
        if (this.currentQuestion) {
          this.$message.success('问题状态已刷新')
        }
      } catch (error) {
        console.error('刷新问题失败:', error)
        this.$message.error('刷新失败，请稍后重试')
      } finally {
        this.refreshLoading = false
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
        await this.deleteQuestion(this.currentQuestion.id)
        
        this.$message.success('问题删除成功！')
        
      } catch (error) {
        if (error !== 'cancel') {
          console.error('删除问题失败:', error)
        }
      } finally {
        this.deleteLoading = false
      }
    },

    goToSubmit() {
      this.$router.push('/')
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
        'pending': '等待AI分析',
        'classified': '分析完成'
      }
      return statusMap[status] || '未知状态'
    },

    getStatusIcon(status) {
      const iconMap = {
        'pending': 'el-icon-loading',
        'classified': 'el-icon-success'
      }
      return iconMap[status] || 'el-icon-info'
    },

    getCategoryColor(categoryId) {
      const colors = [
        '#667eea', '#764ba2', '#f093fb', '#f5576c', 
        '#4facfe', '#00f2fe', '#43e97b', '#38f9d7'
      ]
      return colors[(categoryId - 1) % colors.length]
    },

    async copyQuestionInfo() {
      try {
        const info = `问题内容：${this.currentQuestion.content}\n` +
                    `提交时间：${this.$options.filters.dateFormat(this.currentQuestion.created_at)}\n` +
                    `处理状态：${this.getStatusText(this.currentQuestion.status)}\n` +
                    `问题ID：#${this.currentQuestion.id}`
        
        await navigator.clipboard.writeText(info)
        this.$message.success('问题信息已复制到剪贴板')
      } catch (error) {
        console.error('复制失败:', error)
        this.$message.error('复制失败，请手动复制')
      }
    },

    exportQuestion() {
      const content = `课堂互动系统 - 问题详情\n\n` +
                     `问题内容：\n${this.currentQuestion.content}\n\n` +
                     `基本信息：\n` +
                     `- 提交时间：${this.$options.filters.dateFormat(this.currentQuestion.created_at)}\n` +
                     `- 处理状态：${this.getStatusText(this.currentQuestion.status)}\n` +
                     `- 问题ID：#${this.currentQuestion.id}\n\n` +
                     (this.questionCategory ? `分类结果：\n${this.questionCategory.name}\n${this.questionCategory.description}\n\n` : '') +
                     `导出时间：${new Date().toLocaleString()}`

      const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `问题详情_${this.currentQuestion.id}.txt`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      
      this.$message.success('问题详情已导出')
    }
  }
}
</script>

<style lang="scss" scoped>
// 🎨 全局样式变量
$primary-color: #667eea;
$secondary-color: #764ba2;
$success-color: #67c23a;
$warning-color: #e6a23c;
$danger-color: #f56c6c;
$info-color: #909399;

$gradient-primary: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
$gradient-success: linear-gradient(135deg, #67c23a 0%, #85ce61 100%);
$gradient-warning: linear-gradient(135deg, #e6a23c 0%, #f7ba2a 100%);

$shadow-light: 0 2px 12px rgba(0, 0, 0, 0.1);
$shadow-medium: 0 4px 20px rgba(0, 0, 0, 0.15);
$shadow-heavy: 0 8px 30px rgba(0, 0, 0, 0.2);

$border-radius: 12px;
$transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

// 🎨 主容器
.question-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  position: relative;
  overflow-x: hidden;
}

.page-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
  position: relative;
}

// 🎨 优化后的页面头部
.page-header {
  position: relative;
  text-align: center;
  margin-bottom: 40px;
  overflow: hidden;
  border-radius: 0 0 30px 30px;
  
  .header-background {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: $gradient-primary;
    
    .header-shapes {
      position: absolute;
      width: 100%;
      height: 100%;
      
      .shape {
        position: absolute;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.1);
        
        &.shape-1 {
          width: 120px;
          height: 120px;
          top: -60px;
          right: -60px;
          animation: float 6s ease-in-out infinite;
        }
        
        &.shape-2 {
          width: 80px;
          height: 80px;
          bottom: -40px;
          left: -40px;
          animation: float 4s ease-in-out infinite reverse;
        }
        
        &.shape-3 {
          width: 60px;
          height: 60px;
          top: 50%;
          left: 10%;
          animation: float 5s ease-in-out infinite;
        }
      }
    }
  }
  
  .header-content {
    position: relative;
    z-index: 2;
    padding: 60px 20px;
    color: white;
    
    .header-icon {
      font-size: 48px;
      margin-bottom: 15px;
      opacity: 0.9;
      color: white !important;
    }
    
    .page-title {
      font-size: 36px;
      margin: 0 0 15px 0;
      font-weight: 700;
      letter-spacing: 1px;
      color: white !important;
      text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }
    
    .page-subtitle {
      font-size: 16px;
      margin: 0 0 25px 0;
      opacity: 0.95;
      line-height: 1.5;
      color: white !important;
      text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
    }
    
    .status-badge {
      display: inline-block;
      
      .el-tag {
        padding: 8px 16px;
        font-size: 14px;
        border: none;
        border-radius: 20px;
        
        i {
          margin-right: 5px;
        }
      }
    }
  }
}

// 🎨 问题详情卡片网格
.detail-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 30px;
  margin-bottom: 30px;
  
  @media (min-width: 768px) {
    grid-template-columns: 1fr 400px;
  }
}

// 🎨 内容卡片
.content-card, .classification-card {
  background: white;
  border-radius: $border-radius;
  box-shadow: $shadow-light;
  overflow: hidden;
  transition: $transition;
  
  &:hover {
    transform: translateY(-5px);
    box-shadow: $shadow-medium;
  }
  
  .card-header {
    padding: 20px;
    background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
    border-bottom: 1px solid #f0f0f0;
    display: flex;
    align-items: center;
    gap: 15px;
    
    .header-icon {
      width: 40px;
      height: 40px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: $gradient-primary;
      color: white;
      font-size: 18px;
      
      &.ai-icon {
        background: $gradient-success;
      }
      
      &.pending-icon {
        background: $gradient-warning;
        
        i {
          animation: spin 2s linear infinite;
        }
      }
    }
    
    .header-text {
      flex: 1;
      
      h3 {
        margin: 0 0 5px 0;
        font-size: 16px;
        font-weight: 600;
        color: #333;
      }
      
      span {
        font-size: 12px;
        color: #666;
      }
    }
    
    .confidence-badge, .refresh-btn {
      background: rgba($primary-color, 0.1);
      color: $primary-color;
      border: none;
      border-radius: 15px;
      padding: 5px 12px;
      font-size: 12px;
      font-weight: 500;
    }
  }
}

// 🎨 问题内容
.question-content {
  padding: 30px;
  
  .content-text {
    background: linear-gradient(135deg, #f8f9ff 0%, #e6f3ff 100%);
    padding: 25px;
    border-radius: 12px;
    border-left: 4px solid $primary-color;
    font-size: 16px;
    line-height: 1.8;
    color: #333;
    margin-bottom: 20px;
    position: relative;
    
    &::before {
      content: '"';
      position: absolute;
      top: -10px;
      left: 15px;
      font-size: 40px;
      color: $primary-color;
      opacity: 0.3;
    }
  }
  
  .content-footer {
    .time-info {
      display: flex;
      gap: 20px;
      
      .time-item {
        display: flex;
        align-items: center;
        gap: 8px;
        color: #666;
        font-size: 14px;
        
        i {
          color: $primary-color;
        }
      }
    }
  }
}

// 🎨 AI分类结果
.classification-content {
  padding: 30px;
  
  .category-display {
    display: flex;
    align-items: center;
    gap: 20px;
    padding: 20px;
    background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
    border-radius: 12px;
    margin-bottom: 20px;
    
    .category-icon {
      width: 50px;
      height: 50px;
      border-radius: 50%;
      background: $gradient-success;
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 20px;
    }
    
    .category-info {
      flex: 1;
      
      .category-name {
        margin: 0 0 8px 0;
        font-size: 18px;
        font-weight: 600;
        color: #333;
      }
      
      .category-description {
        margin: 0;
        color: #666;
        line-height: 1.5;
      }
    }
  }
  
  .analysis-details {
    display: grid;
    gap: 15px;
    
    .analysis-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 15px;
      background: #f8f9fa;
      border-radius: 8px;
      
      .analysis-label {
        font-weight: 500;
        color: #666;
      }
      
      .analysis-value {
        color: #333;
        font-weight: 600;
      }
    }
  }
}

// 🎨 等待状态
.pending-content {
  padding: 30px;
  text-align: center;
  
  .loading-animation {
    margin-bottom: 20px;
    
    .dots {
      display: inline-flex;
      gap: 8px;
      
      span {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: $warning-color;
        animation: loading 1.4s ease-in-out infinite both;
        
        &:nth-child(1) { animation-delay: -0.32s; }
        &:nth-child(2) { animation-delay: -0.16s; }
        &:nth-child(3) { animation-delay: 0s; }
      }
    }
  }
  
  p {
    color: #666;
    margin: 0;
  }
}

// 🎨 处理进度
.progress-section {
  background: white;
  border-radius: $border-radius;
  padding: 30px;
  box-shadow: $shadow-light;
  margin-bottom: 30px;
  
  .section-header {
    margin-bottom: 30px;
    
    h3 {
      margin: 0;
      font-size: 18px;
      font-weight: 600;
      color: #333;
      display: flex;
      align-items: center;
      gap: 10px;
      
      i {
        color: $primary-color;
      }
    }
  }
  
  .progress-timeline {
    display: flex;
    align-items: center;
    justify-content: space-between;
    position: relative;
    
    .timeline-item {
      flex: 1;
      text-align: center;
      position: relative;
      
      &.completed .timeline-dot {
        background: $success-color;
        border-color: $success-color;
        
        i {
          color: white;
        }
      }
      
      &.active .timeline-dot {
        background: $warning-color;
        border-color: $warning-color;
        
        i {
          color: white;
          animation: spin 2s linear infinite;
        }
      }
      
      .timeline-dot {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        background: #f5f5f5;
        border: 2px solid #ddd;
        display: flex;
        align-items: center;
        justify-content: center;
        margin: 0 auto 15px;
        transition: $transition;
        
        i {
          font-size: 16px;
          color: #999;
        }
      }
      
      .timeline-content {
        h4 {
          margin: 0 0 5px 0;
          font-size: 14px;
          font-weight: 600;
          color: #333;
        }
        
        p {
          margin: 0;
          font-size: 12px;
          color: #666;
        }
      }
    }
    
    .timeline-connector {
      position: absolute;
      top: 19px;
      left: 0;
      right: 0;
      height: 2px;
      background: #eee;
      z-index: -1;
      
      &.active {
        background: $success-color;
      }
    }
  }
}

// 🎨 操作按钮
.action-section {
  background: white;
  border-radius: $border-radius;
  padding: 30px;
  box-shadow: $shadow-light;
  margin-bottom: 30px;
  
  .action-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 15px;
    
    .action-btn {
      height: 50px;
      border-radius: 25px;
      font-weight: 500;
      transition: $transition;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      
      &.primary-btn {
        background: $gradient-primary;
        border: none;
        color: white;
        
        &:hover {
          transform: translateY(-2px);
          box-shadow: $shadow-medium;
        }
      }
      
      &.danger-btn {
        background: linear-gradient(135deg, #f56c6c 0%, #ff7875 100%);
        border: none;
        color: white;
        
        &:hover {
          transform: translateY(-2px);
          box-shadow: $shadow-medium;
        }
      }
      
      &:not(.primary-btn):not(.danger-btn) {
        border: 2px solid #e9ecef;
        background: white;
        color: #333;
        
        &:hover {
          border-color: $primary-color;
          color: $primary-color;
          transform: translateY(-2px);
        }
      }
    }
  }
}

// 🎨 无问题状态
.no-question {
  background: white;
  border-radius: $border-radius;
  box-shadow: $shadow-light;
  margin-bottom: 30px;
  
  .empty-state {
    padding: 60px 30px;
    text-align: center;
    
    .empty-animation {
      margin-bottom: 30px;
      
      .empty-icon {
        font-size: 80px;
        color: #ddd;
        animation: float 3s ease-in-out infinite;
      }
    }
    
    h3 {
      margin: 0 0 15px 0;
      font-size: 24px;
      color: #333;
      font-weight: 600;
    }
    
    p {
      margin: 0 0 30px 0;
      color: #666;
      font-size: 16px;
      line-height: 1.5;
    }
    
    .submit-btn {
      height: 50px;
      padding: 0 30px;
      background: $gradient-primary;
      border: none;
      border-radius: 25px;
      font-size: 16px;
      font-weight: 500;
      
      &:hover {
        transform: translateY(-2px);
        box-shadow: $shadow-medium;
      }
    }
  }
}

// 🎨 帮助指南
.help-section {
  background: white;
  border-radius: $border-radius;
  padding: 30px;
  box-shadow: $shadow-light;
  
  .help-header {
    margin-bottom: 25px;
    
    h3 {
      margin: 0;
      font-size: 18px;
      font-weight: 600;
      color: #333;
      display: flex;
      align-items: center;
      gap: 10px;
      
      i {
        color: $primary-color;
      }
    }
  }
  
  .help-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 20px;
    margin-bottom: 30px;
    
    .help-item {
      display: flex;
      align-items: flex-start;
      gap: 15px;
      padding: 20px;
      background: #f8f9fa;
      border-radius: 10px;
      transition: $transition;
      
      &:hover {
        background: #e9ecef;
        transform: translateY(-2px);
      }
      
      .help-icon {
        width: 40px;
        height: 40px;
        border-radius: 10px;
        background: $gradient-primary;
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 16px;
        flex-shrink: 0;
      }
      
      .help-text {
        h4 {
          margin: 0 0 8px 0;
          font-size: 16px;
          font-weight: 600;
          color: #333;
        }
        
        p {
          margin: 0;
          font-size: 14px;
          color: #666;
          line-height: 1.5;
        }
      }
    }
  }
  
  .category-reference {
    border-top: 1px solid #f0f0f0;
    padding-top: 25px;
    
    h4 {
      margin: 0 0 20px 0;
      font-size: 16px;
      font-weight: 600;
      color: #333;
    }
    
    .category-list {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 15px;
      
      .category-item {
        display: flex;
        align-items: center;
        gap: 15px;
        padding: 15px;
        background: #f8f9fa;
        border-radius: 10px;
        transition: $transition;
        opacity: 0;
        animation: slideInUp 0.6s ease forwards;
        
        &:hover {
          background: #e9ecef;
          transform: translateX(5px);
        }
        
        .category-badge {
          width: 30px;
          height: 30px;
          border-radius: 50%;
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          font-weight: 600;
          flex-shrink: 0;
        }
        
        .category-content {
          h5 {
            margin: 0 0 5px 0;
            font-size: 14px;
            font-weight: 600;
            color: #333;
          }
          
          p {
            margin: 0;
            font-size: 12px;
            color: #666;
            line-height: 1.4;
          }
        }
      }
    }
  }
}

// 🎨 动画效果
@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

@keyframes loading {
  0%, 80%, 100% { transform: scale(0); }
  40% { transform: scale(1); }
}

@keyframes slideInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

// 🎨 响应式设计
@media (max-width: 768px) {
  .page-container {
    padding: 0 15px;
  }
  
  .page-header .header-content {
    padding: 40px 20px;
    
    .page-title {
      font-size: 28px;
    }
  }
  
  .detail-grid {
    grid-template-columns: 1fr;
  }
  
  .action-grid {
    grid-template-columns: 1fr;
  }
  
  .help-grid {
    grid-template-columns: 1fr;
  }
  
  .category-list {
    grid-template-columns: 1fr;
  }
  
  .progress-timeline {
    flex-direction: column;
    
    .timeline-connector {
      display: none;
    }
    
    .timeline-item {
      margin-bottom: 20px;
      
      &:last-child {
        margin-bottom: 0;
      }
    }
  }
}

@media (max-width: 480px) {
  .content-card .card-header {
    flex-direction: column;
    text-align: center;
    gap: 10px;
  }
  
  .classification-content .category-display {
    flex-direction: column;
    text-align: center;
  }
}
</style>