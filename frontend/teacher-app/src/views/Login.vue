<template>
  <div class="login-container">
    <div class="login-background">
      <div class="background-shapes">
        <div class="shape shape-1"></div>
        <div class="shape shape-2"></div>
        <div class="shape shape-3"></div>
        <div class="shape shape-4"></div>
      </div>
    </div>
    
    <div class="login-form-container">
      <div class="login-form-card">
        <div class="login-header">
          <div class="logo">
            <i class="el-icon-s-data"></i>
          </div>
          <h1 class="title">课堂互动系统</h1>
          <p class="subtitle">教师管理端</p>
          <p class="description">管理学生问题，AI智能分类，数据统计分析</p>
        </div>
        
        <el-form
          ref="loginForm"
          :model="loginForm"
          :rules="loginRules"
          class="login-form"
          @submit.native.prevent="handleLogin"
        >
          <el-form-item prop="studentId">
            <el-input
              v-model="loginForm.studentId"
              placeholder="请输入教师工号"
              prefix-icon="el-icon-user"
              size="large"
              clearable
              @keyup.enter.native="handleLogin"
            >
              <template slot="prepend">工号</template>
            </el-input>
          </el-form-item>
          
          <el-form-item prop="password">
            <el-input
              v-model="loginForm.password"
              type="password"
              placeholder="请输入密码"
              prefix-icon="el-icon-lock"
              size="large"
              show-password
              clearable
              @keyup.enter.native="handleLogin"
            >
              <template slot="prepend">密码</template>
            </el-input>
          </el-form-item>
          
          <el-form-item>
            <el-checkbox v-model="rememberLogin" class="remember-checkbox">
              记住登录状态
            </el-checkbox>
          </el-form-item>
          
          <el-form-item>
            <el-button
              type="primary"
              size="large"
              :loading="loginLoading"
              @click="handleLogin"
              class="login-button"
            >
              {{ loginLoading ? '登录中...' : '登录管理系统' }}
            </el-button>
          </el-form-item>
        </el-form>
        
        <div class="login-footer">
          <div class="demo-section">
            <p class="demo-title">演示账号</p>
            <div class="demo-account">
              <el-tag
                class="demo-tag"
                @click="fillDemoAccount"
                type="success"
              >
                {{ demoAccount.name }} ({{ demoAccount.studentId }})
              </el-tag>
            </div>
            <p class="demo-note">点击标签可快速填入演示账号</p>
          </div>
          
          <div class="features-section">
            <h4 class="features-title">系统功能</h4>
            <div class="features-list">
              <div class="feature-item">
                <i class="el-icon-document"></i>
                <span>问题管理</span>
              </div>
              <div class="feature-item">
                <i class="el-icon-magic-stick"></i>
                <span>AI智能分类</span>
              </div>
              <div class="feature-item">
                <i class="el-icon-pie-chart"></i>
                <span>数据统计</span>
              </div>
              <div class="feature-item">
                <i class="el-icon-download"></i>
                <span>数据导出</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 系统状态指示器 -->
    <div class="system-status">
      <el-tooltip content="系统状态" placement="left">
        <div class="status-indicator" :class="systemStatusClass">
          <i :class="systemStatusIcon"></i>
        </div>
      </el-tooltip>
    </div>
  </div>
</template>

<script>
import { mapActions } from 'vuex'

export default {
  name: 'Login',
  data() {
    return {
      loginForm: {
        studentId: '',
        password: ''
      },
      loginRules: {
        studentId: [
          { required: true, message: '请输入教师工号', trigger: 'blur' },
          { min: 3, max: 20, message: '工号长度为3-20个字符', trigger: 'blur' }
        ],
        password: [
          { required: true, message: '请输入密码', trigger: 'blur' },
          { min: 6, message: '密码长度不能少于6个字符', trigger: 'blur' }
        ]
      },
      loginLoading: false,
      rememberLogin: false,
      
      // 演示账号
      demoAccount: {
        studentId: 'teacher001',
        name: '李老师',
        password: 'secret'
      },
      
      // 系统状态
      systemStatus: 'checking', // checking, online, offline
      statusCheckTimer: null
    }
  },
  
  computed: {
    systemStatusClass() {
      return {
        'status-online': this.systemStatus === 'online',
        'status-offline': this.systemStatus === 'offline',
        'status-checking': this.systemStatus === 'checking'
      }
    },
    
    systemStatusIcon() {
      switch (this.systemStatus) {
        case 'online': return 'el-icon-success'
        case 'offline': return 'el-icon-error'
        default: return 'el-icon-loading'
      }
    }
  },
  
  methods: {
    ...mapActions(['login']),
    
    // 处理登录 - 修复版
    async handleLogin() {
      try {
        // 表单验证
        const valid = await this.$refs.loginForm.validate().catch(() => false)
        if (!valid) {
          return
        }
        
        this.loginLoading = true
        
        // 准备登录数据
        const loginData = {
          studentId: this.loginForm.studentId.trim(),
          password: this.loginForm.password
        }
        
        // 调用登录action - 修复API调用
        const result = await this.login(loginData)
        
        // 登录成功提示
        this.$message.success(`欢迎回来，${result.user.name}！`)
        
        // 如果选择记住登录状态
        if (this.rememberLogin) {
          localStorage.setItem('remember_login', 'true')
          localStorage.setItem('remember_student_id', loginData.studentId)
        } else {
          localStorage.removeItem('remember_login')
          localStorage.removeItem('remember_student_id')
        }
        
        // 登录成功后跳转
        const redirectPath = this.$route.query.redirect || '/'
        await this.$router.push(redirectPath)
        
      } catch (error) {
        console.error('登录失败:', error)
        
        // 改进的错误处理
        let errorMessage = '登录失败'
        
        if (error.response) {
          const { status, data } = error.response
          if (data?.message) {
            errorMessage = data.message
          } else {
            switch (status) {
              case 401:
                errorMessage = '工号或密码错误'
                break
              case 403:
                errorMessage = '账号已被禁用'
                break
              case 404:
                errorMessage = '账号不存在'
                break
              case 429:
                errorMessage = '登录尝试过于频繁，请稍后再试'
                break
              case 500:
                errorMessage = '服务器错误，请稍后再试'
                break
              default:
                errorMessage = '网络错误，请检查网络连接'
            }
          }
        } else if (error.request) {
          errorMessage = '无法连接到服务器，请检查网络'
        } else if (error.message) {
          errorMessage = error.message
        }
        
        // 显示错误消息
        this.$message({
          message: errorMessage,
          type: 'error',
          duration: 4000,
          showClose: true
        })
        
        // 清空密码字段
        this.loginForm.password = ''
        
        // 聚焦到工号字段（如果工号为空）或密码字段
        this.$nextTick(() => {
          if (!this.loginForm.studentId) {
            this.$refs.loginForm.$el.querySelector('input[placeholder*="工号"]').focus()
          } else {
            this.$refs.loginForm.$el.querySelector('input[type="password"]').focus()
          }
        })
        
      } finally {
        this.loginLoading = false
      }
    },
    
    // 填入演示账号
    fillDemoAccount() {
      this.loginForm.studentId = this.demoAccount.studentId
      this.loginForm.password = this.demoAccount.password
      this.$message.info(`已填入 ${this.demoAccount.name} 的登录信息`)
    },
    
    // 检查系统状态 - 修复版
    async checkSystemStatus() {
      try {
        await this.$api.utils.healthCheck()
        this.systemStatus = 'online'
      } catch (error) {
        this.systemStatus = 'offline'
        console.warn('系统状态检查失败:', error)
      }
    },
    
    // 开始状态检查定时器
    startStatusCheck() {
      this.checkSystemStatus()
      this.statusCheckTimer = setInterval(() => {
        this.checkSystemStatus()
      }, 30000) // 每30秒检查一次
    },
    
    // 停止状态检查定时器
    stopStatusCheck() {
      if (this.statusCheckTimer) {
        clearInterval(this.statusCheckTimer)
        this.statusCheckTimer = null
      }
    },
    
    // 加载保存的登录信息
    loadSavedLoginInfo() {
      const remembered = localStorage.getItem('remember_login')
      const savedStudentId = localStorage.getItem('remember_student_id')
      
      if (remembered && savedStudentId) {
        this.rememberLogin = true
        this.loginForm.studentId = savedStudentId
      }
    }
  },
  
  created() {
    // 页面加载时清除可能存在的错误状态
    this.$store.commit('SET_GLOBAL_LOADING', { loading: false })
    
    // 如果已经登录，直接跳转到首页
    if (this.$store.getters.isLoggedIn) {
      this.$router.push('/')
      return
    }
    
    // 加载保存的登录信息
    this.loadSavedLoginInfo()
    
    // 开始系统状态检查
    this.startStatusCheck()
  },
  
  mounted() {
    // 自动聚焦到工号输入框
    this.$nextTick(() => {
      if (!this.loginForm.studentId) {
        this.$refs.loginForm.$el.querySelector('input[placeholder*="工号"]').focus()
      } else {
        this.$refs.loginForm.$el.querySelector('input[type="password"]').focus()
      }
    })
  },
  
  beforeDestroy() {
    // 清理定时器
    this.stopStatusCheck()
  }
}
</script>

<style lang="scss" scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
}

.login-background {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  
  .background-shapes {
    position: relative;
    width: 100%;
    height: 100%;
    
    .shape {
      position: absolute;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.1);
      animation: float 8s ease-in-out infinite;
      
      &.shape-1 {
        width: 300px;
        height: 300px;
        top: 10%;
        left: 10%;
        animation-delay: 0s;
      }
      
      &.shape-2 {
        width: 200px;
        height: 200px;
        top: 60%;
        right: 15%;
        animation-delay: 2s;
      }
      
      &.shape-3 {
        width: 150px;
        height: 150px;
        bottom: 20%;
        left: 20%;
        animation-delay: 4s;
      }
      
      &.shape-4 {
        width: 120px;
        height: 120px;
        top: 30%;
        right: 30%;
        animation-delay: 6s;
      }
    }
  }
}

@keyframes float {
  0%, 100% {
    transform: translateY(0px) rotate(0deg);
  }
  33% {
    transform: translateY(-30px) rotate(120deg);
  }
  66% {
    transform: translateY(-15px) rotate(240deg);
  }
}

.login-form-container {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 450px;
  padding: 20px;
}

.login-form-card {
  background: white;
  border-radius: 20px;
  padding: 40px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
  backdrop-filter: blur(10px);
}

.login-header {
  text-align: center;
  margin-bottom: 40px;
  
  .logo {
    width: 90px;
    height: 90px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 25px;
    
    i {
      font-size: 42px;
      color: white;
    }
  }
  
  .title {
    font-size: 32px;
    font-weight: 600;
    color: #333;
    margin: 0 0 8px 0;
  }
  
  .subtitle {
    font-size: 18px;
    color: #667eea;
    margin: 0 0 8px 0;
    font-weight: 500;
  }
  
  .description {
    font-size: 14px;
    color: #999;
    margin: 0;
  }
}

.login-form {
  .el-form-item {
    margin-bottom: 24px;
    
    &:last-child {
      margin-bottom: 0;
    }
  }
  
  .remember-checkbox {
    color: #666;
    font-size: 14px;
  }
  
  .login-button {
    width: 100%;
    height: 50px;
    font-size: 16px;
    font-weight: 500;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border: none;
    border-radius: 10px;
    
    &:hover {
      background: linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%);
    }
  }
}

.login-footer {
  margin-top: 30px;
  
  .demo-section {
    text-align: center;
    margin-bottom: 30px;
    
    .demo-title {
      font-size: 14px;
      color: #666;
      margin-bottom: 12px;
    }
    
    .demo-account {
      margin-bottom: 10px;
      
      .demo-tag {
        cursor: pointer;
        padding: 8px 16px;
        font-size: 13px;
        transition: all 0.3s ease;
        
        &:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
        }
      }
    }
    
    .demo-note {
      font-size: 12px;
      color: #999;
      margin: 0;
    }
  }
  
  .features-section {
    .features-title {
      font-size: 16px;
      color: #333;
      margin: 0 0 15px 0;
      text-align: center;
    }
    
    .features-list {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 12px;
      
      .feature-item {
        display: flex;
        align-items: center;
        padding: 8px 12px;
        background: #f8f9ff;
        border-radius: 8px;
        font-size: 14px;
        color: #666;
        
        i {
          margin-right: 8px;
          color: #667eea;
          font-size: 16px;
        }
      }
    }
  }
}

.system-status {
  position: fixed;
  bottom: 30px;
  right: 30px;
  z-index: 1000;
  
  .status-indicator {
    width: 50px;
    height: 50px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 20px;
    cursor: pointer;
    transition: all 0.3s ease;
    
    &.status-online {
      background: linear-gradient(135deg, #67C23A 0%, #85CE61 100%);
      
      &:hover {
        transform: scale(1.1);
      }
    }
    
    &.status-offline {
      background: linear-gradient(135deg, #F56C6C 0%, #F78989 100%);
      
      &:hover {
        transform: scale(1.1);
      }
    }
    
    &.status-checking {
      background: linear-gradient(135deg, #E6A23C 0%, #F7BA2A 100%);
      
      i {
        animation: spin 1s linear infinite;
      }
    }
  }
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

// 响应式设计
@media (max-width: 768px) {
  .login-form-card {
    margin: 20px;
    padding: 30px 25px;
  }
  
  .login-header {
    margin-bottom: 30px;
    
    .logo {
      width: 70px;
      height: 70px;
      
      i {
        font-size: 32px;
      }
    }
    
    .title {
      font-size: 26px;
    }
    
    .subtitle {
      font-size: 16px;
    }
  }
  
  .features-list {
    grid-template-columns: 1fr !important;
  }
  
  .system-status {
    bottom: 20px;
    right: 20px;
    
    .status-indicator {
      width: 40px;
      height: 40px;
      font-size: 16px;
    }
  }
}

// Element UI 样式覆盖
:deep(.el-input-group__prepend) {
  background: #f8f9ff;
  color: #667eea;
  border-color: #eee;
  font-weight: 500;
}

:deep(.el-input__inner) {
  border-radius: 0 8px 8px 0;
  border: 2px solid #eee;
  
  &:focus {
    border-color: #667eea;
  }
}

:deep(.el-input--large .el-input__inner) {
  height: 48px;
  line-height: 48px;
}
</style>