<template>
  <div class="dashboard-container">
    <div class="page-container">
      <!-- 页面标题 - 添加用户信息和退出按钮 -->
      <div class="page-header">
        <div class="header-content">
          <div class="title-section">
            <h1 class="page-title">
              <i class="el-icon-monitor"></i>
              仪表板概览
            </h1>
            <p class="page-subtitle">欢迎回来！这里是课堂互动系统的总体概况</p>
          </div>
          
          <!-- 用户信息和操作区域 -->
          <div class="user-section">
            <div class="user-info">
              <div class="user-avatar">
                <i class="el-icon-user-solid"></i>
              </div>
              <div class="user-details">
                <div class="user-name">{{ currentUser?.name || '未知用户' }}</div>
                <div class="user-role">{{ currentUser?.student_id || '' }}</div>
              </div>
            </div>
            
            <el-dropdown @command="handleCommand" placement="bottom-end">
              <el-button type="text" class="user-menu-trigger">
                <i class="el-icon-arrow-down"></i>
              </el-button>
              <el-dropdown-menu slot="dropdown">
                <el-dropdown-item command="profile">
                  <i class="el-icon-user"></i>
                  个人资料
                </el-dropdown-item>
                <el-dropdown-item command="settings">
                  <i class="el-icon-setting"></i>
                  系统设置
                </el-dropdown-item>
                <el-dropdown-item divided command="logout">
                  <i class="el-icon-switch-button"></i>
                  退出登录
                </el-dropdown-item>
              </el-dropdown-menu>
            </el-dropdown>
            
            <!-- 快速退出按钮 -->
            <el-button 
              type="danger" 
              icon="el-icon-switch-button" 
              size="small"
              @click="handleLogout"
              :loading="logoutLoading"
              class="logout-button"
            >
              {{ logoutLoading ? '退出中...' : '退出' }}
            </el-button>
          </div>
        </div>
      </div>

      <!-- 数据概览卡片 -->
      <div class="overview-section">
        <el-row :gutter="20">
          <el-col :xs="12" :sm="6" :md="6" :lg="6">
            <div class="stat-card total">
              <div class="stat-icon">
                <i class="el-icon-document"></i>
              </div>
              <div class="stat-content">
                <div class="stat-value">{{ questionStats.total || 0 }}</div>
                <div class="stat-label">总问题数</div>
                <div class="stat-trend">
                  <i class="el-icon-arrow-up trend-up"></i>
                  <span>+5%</span>
                </div>
              </div>
            </div>
          </el-col>
          
          <el-col :xs="12" :sm="6" :md="6" :lg="6">
            <div class="stat-card pending">
              <div class="stat-icon">
                <i class="el-icon-warning"></i>
              </div>
              <div class="stat-content">
                <div class="stat-value">{{ questionStats.pending || 0 }}</div>
                <div class="stat-label">待分类</div>
                <div class="stat-trend">
                  <i class="el-icon-arrow-down trend-down"></i>
                  <span>-2%</span>
                </div>
              </div>
            </div>
          </el-col>
          
          <el-col :xs="12" :sm="6" :md="6" :lg="6">
            <div class="stat-card classified">
              <div class="stat-icon">
                <i class="el-icon-success"></i>
              </div>
              <div class="stat-content">
                <div class="stat-value">{{ questionStats.classified || 0 }}</div>
                <div class="stat-label">已分类</div>
                <div class="stat-trend">
                  <i class="el-icon-arrow-up trend-up"></i>
                  <span>+12%</span>
                </div>
              </div>
            </div>
          </el-col>
          
          <el-col :xs="12" :sm="6" :md="6" :lg="6">
            <div class="stat-card students">
              <div class="stat-icon">
                <i class="el-icon-user"></i>
              </div>
              <div class="stat-content">
                <div class="stat-value">{{ activeStudents || 0 }}</div>
                <div class="stat-label">活跃学生</div>
                <div class="stat-trend">
                  <i class="el-icon-arrow-up trend-up"></i>
                  <span>+8%</span>
                </div>
              </div>
            </div>
          </el-col>
        </el-row>
      </div>

      <!-- 快速操作区域 -->
      <div class="quick-actions-section">
        <div class="page-card">
          <div class="card-header">
            <h3 class="card-title">
              <i class="el-icon-lightning"></i>
              快速操作
            </h3>
          </div>
          <div class="card-content">
            <el-row :gutter="15">
              <el-col :xs="12" :sm="8" :md="6" :lg="4">
                <div class="action-card" @click="goToClassification">
                  <div class="action-icon">
                    <i class="el-icon-magic-stick"></i>
                  </div>
                  <div class="action-text">AI分类</div>
                  <div class="action-desc">智能分析问题</div>
                </div>
              </el-col>
              
              <el-col :xs="12" :sm="8" :md="6" :lg="4">
                <div class="action-card" @click="goToStatistics">
                  <div class="action-icon">
                    <i class="el-icon-pie-chart"></i>
                  </div>
                  <div class="action-text">数据统计</div>
                  <div class="action-desc">查看详细数据</div>
                </div>
              </el-col>
              
              <el-col :xs="12" :sm="8" :md="6" :lg="4">
                <div class="action-card" @click="refreshAllData">
                  <div class="action-icon">
                    <i class="el-icon-refresh"></i>
                  </div>
                  <div class="action-text">刷新数据</div>
                  <div class="action-desc">更新最新状态</div>
                </div>
              </el-col>
              
              <el-col :xs="12" :sm="8" :md="6" :lg="4">
                <div class="action-card" @click="exportData">
                  <div class="action-icon">
                    <i class="el-icon-download"></i>
                  </div>
                  <div class="action-text">导出数据</div>
                  <div class="action-desc">下载统计报告</div>
                </div>
              </el-col>
              
              <el-col :xs="12" :sm="8" :md="6" :lg="4">
                <div class="action-card" @click="viewSettings">
                  <div class="action-icon">
                    <i class="el-icon-setting"></i>
                  </div>
                  <div class="action-text">系统设置</div>
                  <div class="action-desc">配置系统参数</div>
                </div>
              </el-col>
              
              <el-col :xs="12" :sm="8" :md="6" :lg="4">
                <div class="action-card" @click="viewHelp">
                  <div class="action-icon">
                    <i class="el-icon-question"></i>
                  </div>
                  <div class="action-text">帮助中心</div>
                  <div class="action-desc">使用指南</div>
                </div>
              </el-col>
            </el-row>
          </div>
        </div>
      </div>

      <!-- 最近活动 -->
      <el-row :gutter="20">
        <!-- 最新问题 -->
        <el-col :xs="24" :sm="24" :md="12" :lg="12">
          <div class="page-card">
            <div class="card-header">
              <h3 class="card-title">
                <i class="el-icon-chat-line-round"></i>
                最新问题
              </h3>
              <el-button type="text" @click="goToAllQuestions">查看全部</el-button>
            </div>
            <div class="card-content">
              <div v-if="recentQuestions.length > 0">
                <div
                  v-for="question in recentQuestions.slice(0, 5)"
                  :key="question.id"
                  class="question-item"
                >
                  <div class="question-content">
                    <p class="question-text">{{ question.content.substring(0, 50) }}...</p>
                    <div class="question-meta">
                      <span class="student-name">{{ question.student_name }}</span>
                      <span class="question-time">{{ formatTime(question.created_at) }}</span>
                    </div>
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
              </div>
              <div v-else class="empty-state">
                <i class="el-icon-chat-line-round"></i>
                <p>暂无最新问题</p>
              </div>
            </div>
          </div>
        </el-col>
        
        <!-- 分类统计 -->
        <el-col :xs="24" :sm="24" :md="12" :lg="12">
          <div class="page-card">
            <div class="card-header">
              <h3 class="card-title">
                <i class="el-icon-collection-tag"></i>
                分类统计
              </h3>
              <el-button type="text" @click="goToStatistics">查看详情</el-button>
            </div>
            <div class="card-content">
              <div v-if="categoryStats.length > 0">
                <div
                  v-for="category in categoryStats.slice(0, 6)"
                  :key="category.id"
                  class="category-item"
                >
                  <div class="category-info">
                    <span class="category-name">{{ category.name }}</span>
                    <span class="category-count">{{ category.question_count }}</span>
                  </div>
                  <div class="category-progress">
                    <!-- 🔧 修复：确保percentage是数字类型 -->
                    <el-progress
                      :percentage="getPercentage(category.percentage)"
                      :stroke-width="6"
                      :show-text="false"
                      color="#667eea"
                    />
                  </div>
                </div>
              </div>
              <div v-else class="empty-state">
                <i class="el-icon-collection-tag"></i>
                <p>暂无分类数据</p>
              </div>
            </div>
          </div>
        </el-col>
      </el-row>

      <!-- 系统状态 -->
      <div class="page-card">
        <div class="card-header">
          <h3 class="card-title">
            <i class="el-icon-cpu"></i>
            系统状态
          </h3>
        </div>
        <div class="card-content">
          <el-row :gutter="20">
            <el-col :xs="24" :sm="8" :md="8" :lg="8">
              <div class="status-item">
                <div class="status-label">数据库连接</div>
                <div class="status-value online">
                  <i class="el-icon-success"></i>
                  正常
                </div>
              </div>
            </el-col>
            
            <el-col :xs="24" :sm="8" :md="8" :lg="8">
              <div class="status-item">
                <div class="status-label">AI服务</div>
                <div class="status-value online">
                  <i class="el-icon-success"></i>
                  正常
                </div>
              </div>
            </el-col>
            
            <el-col :xs="24" :sm="8" :md="8" :lg="8">
              <div class="status-item">
                <div class="status-label">系统负载</div>
                <div class="status-value normal">
                  <i class="el-icon-info"></i>
                  正常
                </div>
              </div>
            </el-col>
          </el-row>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex'

export default {
  name: 'Dashboard',
  data() {
    return {
      activeStudents: 0,
      logoutLoading: false
    }
  },
  
  computed: {
    ...mapGetters([
      'questionStats',
      'categoryStats',
      'questions',
      'currentUser'
    ]),
    
    // 最近的问题
    recentQuestions() {
      return this.questions.slice(0, 5)
    }
  },
  
  methods: {
    ...mapActions([
      'fetchQuestions',
      'fetchCategoryStats',
      'fetchStudents',
      'logout'
    ]),
    
    // 🔧 新增：确保percentage转换为数字类型的方法
    getPercentage(value) {
      // 如果值为null、undefined或空字符串，返回0
      if (value === null || value === undefined || value === '') {
        return 0
      }
      // 转换为数字，如果转换失败返回0
      const numValue = Number(value)
      return isNaN(numValue) ? 0 : Math.min(Math.max(numValue, 0), 100)
    },
    
    // 格式化时间
    formatTime(time) {
      if (!time) return ''
      const date = new Date(time)
      return date.toLocaleString('zh-CN', {
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      })
    },
    
    // 🔥 新增：处理用户下拉菜单命令
    handleCommand(command) {
      switch (command) {
        case 'profile':
          this.viewProfile()
          break
        case 'settings':
          this.viewSettings()
          break
        case 'logout':
          this.handleLogout()
          break
        default:
          console.log('未知命令:', command)
      }
    },
    
    // 🔥 新增：查看个人资料
    viewProfile() {
      this.$message.info('个人资料功能开发中...')
      // 这里可以添加跳转到个人资料页面的逻辑
      // this.$router.push('/profile')
    },
    
    // 🔥 新增：退出登录功能
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
    
    // 导航到分类页面
    goToClassification() {
      this.$router.push('/classification').catch(err => {
        if (err.name !== 'NavigationDuplicated') {
          console.error('路由跳转错误:', err)
        }
      })
    },
    
    // 导航到统计页面
    goToStatistics() {
      this.$router.push('/statistics').catch(err => {
        if (err.name !== 'NavigationDuplicated') {
          console.error('路由跳转错误:', err)
        }
      })
    },
    
    // 导航到所有问题页面 - 🔥 修复跳转逻辑
    goToAllQuestions() {
      this.$router.push('/questions').catch(err => {
        if (err.name !== 'NavigationDuplicated') {
          console.error('路由跳转错误:', err)
        }
      })
    },
    
    // 刷新所有数据
    async refreshAllData() {
      try {
        this.$message.info('正在刷新数据...')
        await Promise.all([
          this.fetchQuestions(),
          this.fetchCategoryStats(),
          this.fetchStudents()
        ])
        this.$message.success('数据刷新成功')
      } catch (error) {
        console.error('数据刷新失败:', error)
        this.$message.error('数据刷新失败')
      }
    },
    
    // 导出数据
    exportData() {
      this.$message.info('导出功能开发中...')
    },
    
    // 查看设置
    viewSettings() {
      this.$message.info('设置功能开发中...')
    },
    
    // 查看帮助
    viewHelp() {
      this.$message.info('帮助中心开发中...')
    },
    
    // 获取活跃学生数
    async fetchActiveStudents() {
      try {
        // 这里可以添加获取活跃学生数的API调用
        this.activeStudents = this.questionStats.total || 0
      } catch (error) {
        console.error('获取活跃学生数失败:', error)
      }
    },
    
    // 初始化数据
    async initDashboard() {
      try {
        await Promise.all([
          this.fetchQuestions(),
          this.fetchCategoryStats(),
          this.fetchStudents(),
          this.fetchActiveStudents()
        ])
      } catch (error) {
        console.error('仪表板初始化失败:', error)
        this.$message.error('仪表板初始化失败')
      }
    }
  },
  
  async created() {
    // 组件创建时初始化数据
    await this.initDashboard()
  }
}
</script>

<style lang="scss" scoped>
.dashboard-container {
  min-height: calc(100vh - 60px);
  background: #f5f7fa;
}

.page-header {
  margin-bottom: 30px;
  
  .header-content {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 20px;
    
    .title-section {
      flex: 1;
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
    
    .user-section {
      display: flex;
      align-items: center;
      gap: 15px;
      flex-shrink: 0;
      
      .user-info {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 8px 16px;
        background: white;
        border-radius: 25px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        
        .user-avatar {
          width: 40px;
          height: 40px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          
          i {
            font-size: 20px;
            color: white;
          }
        }
        
        .user-details {
          .user-name {
            font-size: 16px;
            font-weight: 600;
            color: #333;
            line-height: 1.2;
          }
          
          .user-role {
            font-size: 12px;
            color: #999;
            line-height: 1.2;
          }
        }
      }
      
      .user-menu-trigger {
        padding: 8px;
        color: #666;
        
        &:hover {
          color: #667eea;
        }
      }
      
      .logout-button {
        border-radius: 20px;
        padding: 8px 20px;
        font-weight: 500;
        transition: all 0.3s ease;
        
        &:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 15px rgba(245, 108, 108, 0.3);
        }
      }
    }
  }
}

.overview-section {
  margin-bottom: 30px;
  
  .stat-card {
    background: white;
    border-radius: 12px;
    padding: 24px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
    display: flex;
    align-items: center;
    transition: all 0.3s ease;
    margin-bottom: 15px;
    
    &:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
    }
    
    .stat-icon {
      width: 60px;
      height: 60px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-right: 20px;
      
      i {
        font-size: 28px;
        color: white;
      }
    }
    
    .stat-content {
      flex: 1;
      
      .stat-value {
        font-size: 32px;
        font-weight: 700;
        margin-bottom: 5px;
      }
      
      .stat-label {
        font-size: 14px;
        color: #666;
        font-weight: 500;
      }
      
      .stat-trend {
        display: flex;
        align-items: center;
        margin-top: 5px;
        font-size: 12px;
        
        .trend-up {
          color: #67c23a;
        }
        
        .trend-down {
          color: #f56c6c;
        }
        
        span {
          margin-left: 4px;
        }
      }
    }
    
    &.total {
      .stat-icon {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      }
      .stat-value {
        color: #667eea;
      }
    }
    
    &.pending {
      .stat-icon {
        background: linear-gradient(135deg, #E6A23C 0%, #F7BA2A 100%);
      }
      .stat-value {
        color: #E6A23C;
      }
    }
    
    &.classified {
      .stat-icon {
        background: linear-gradient(135deg, #67C23A 0%, #85CE61 100%);
      }
      .stat-value {
        color: #67C23A;
      }
    }
    
    &.students {
      .stat-icon {
        background: linear-gradient(135deg, #409EFF 0%, #36CFC9 100%);
      }
      .stat-value {
        color: #409EFF;
      }
    }
  }
}

.quick-actions-section {
  margin-bottom: 30px;
  
  .action-card {
    background: white;
    border-radius: 12px;
    padding: 20px;
    text-align: center;
    cursor: pointer;
    transition: all 0.3s ease;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
    margin-bottom: 15px;
    
    &:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
    }
    
    .action-icon {
      width: 50px;
      height: 50px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 15px;
      
      i {
        font-size: 24px;
        color: white;
      }
    }
    
    .action-text {
      font-size: 16px;
      font-weight: 600;
      color: #333;
      margin-bottom: 5px;
    }
    
    .action-desc {
      font-size: 12px;
      color: #999;
    }
  }
}

.question-item {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 15px 0;
  border-bottom: 1px solid #f0f2f5;
  
  &:last-child {
    border-bottom: none;
  }
  
  .question-content {
    flex: 1;
    
    .question-text {
      font-size: 14px;
      color: #333;
      margin: 0 0 8px 0;
      line-height: 1.4;
    }
    
    .question-meta {
      display: flex;
      gap: 12px;
      font-size: 12px;
      color: #666;
      
      .student-name {
        font-weight: 500;
      }
    }
  }
  
  .question-status {
    margin-left: 15px;
  }
}

.category-item {
  padding: 12px 0;
  border-bottom: 1px solid #f0f2f5;
  
  &:last-child {
    border-bottom: none;
  }
  
  .category-info {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
    
    .category-name {
      font-size: 14px;
      color: #333;
    }
    
    .category-count {
      font-size: 14px;
      font-weight: 600;
      color: #667eea;
    }
  }
  
  .category-progress {
    .el-progress {
      margin-bottom: 0;
    }
  }
}

.empty-state {
  text-align: center;
  padding: 40px 20px;
  color: #999;
  
  i {
    font-size: 32px;
    margin-bottom: 10px;
    display: block;
  }
  
  p {
    margin: 0;
    font-size: 14px;
  }
}

.status-item {
  text-align: center;
  padding: 15px;
  
  .status-label {
    font-size: 14px;
    color: #666;
    margin-bottom: 8px;
  }
  
  .status-value {
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 14px;
    font-weight: 600;
    
    i {
      margin-right: 5px;
    }
    
    &.online {
      color: #67c23a;
    }
    
    &.normal {
      color: #409eff;
    }
  }
}

// 🔥 响应式设计优化
@media (max-width: 1200px) {
  .page-header .header-content {
    flex-direction: column;
    align-items: center;
    text-align: center;
    
    .user-section {
      margin-top: 20px;
    }
  }
}

@media (max-width: 768px) {
  .page-header .header-content {
    .title-section .page-title {
      font-size: 24px;
    }
    
    .user-section {
      flex-direction: column;
      gap: 10px;
      
      .user-info {
        .user-details {
          text-align: center;
        }
      }
    }
  }
  
  .overview-section .stat-card {
    .stat-icon {
      width: 50px;
      height: 50px;
      margin-right: 15px;
      
      i {
        font-size: 24px;
      }
    }
    
    .stat-content .stat-value {
      font-size: 24px;
    }
  }
  
  .action-card {
    .action-icon {
      width: 40px;
      height: 40px;
      
      i {
        font-size: 20px;
      }
    }
    
    .action-text {
      font-size: 14px;
    }
  }
}

// Element UI 下拉菜单样式覆盖
:deep(.el-dropdown-menu) {
  .el-dropdown-menu__item {
    padding: 12px 20px;
    
    i {
      margin-right: 8px;
      width: 16px;
    }
    
    &:hover {
      background-color: #f5f7fa;
      color: #667eea;
    }
  }
}
</style>