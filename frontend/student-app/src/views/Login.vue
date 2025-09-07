<template>
  <div class="login-container">
    <div class="login-background">
      <div class="background-shapes">
        <div class="shape shape-1"></div>
        <div class="shape shape-2"></div>
        <div class="shape shape-3"></div>
      </div>
    </div>

    <div class="login-box">
      <div class="login-header">
        <div class="logo">
          <i class="el-icon-edit-outline"></i>
          <h1>课堂互动系统</h1>
        </div>
        <p class="subtitle">学生端登录</p>
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
            placeholder="请输入学号"
            prefix-icon="el-icon-user"
            size="large"
            :maxlength="20"
            clearable
            @keyup.enter.native="handleLogin"
          />
        </el-form-item>

        <el-form-item prop="password">
          <el-input
            v-model="loginForm.password"
            type="password"
            placeholder="请输入密码"
            prefix-icon="el-icon-lock"
            size="large"
            :maxlength="50"
            show-password
            @keyup.enter.native="handleLogin"
          />
        </el-form-item>

        <el-form-item>
          <el-button
            type="primary"
            size="large"
            :loading="loading"
            class="login-button"
            @click="handleLogin"
          >
            <span v-if="!loading">登录</span>
            <span v-else>登录中...</span>
          </el-button>
        </el-form-item>
      </el-form>

      <!-- 测试账号区域 -->
      <div class="test-accounts">
        <div class="divider">
          <span>测试账号</span>
        </div>
        <div class="account-buttons">
          <el-button
            v-for="account in testAccounts"
            :key="account.studentId"
            size="small"
            type="text"
            class="test-account-btn"
            @click="useTestAccount(account)"
          >
            {{ account.name }} ({{ account.studentId }})
          </el-button>
        </div>
        <p class="test-tip">点击上方按钮快速填入测试账号</p>
      </div>

      <!-- 系统状态 -->
      <div class="system-status">
        <div class="status-item">
          <i class="el-icon-circle-check" :class="{ 'status-ok': systemStatus.backend }"></i>
          <span>后端服务</span>
        </div>
        <div class="status-item">
          <i class="el-icon-circle-check" :class="{ 'status-ok': systemStatus.database }"></i>
          <span>数据库</span>
        </div>
      </div>
    </div>

    <!-- 功能介绍 -->
    <div class="feature-intro">
      <h3>功能特色</h3>
      <ul>
        <li><i class="el-icon-edit"></i> 在线提问：随时提交课堂问题</li>
        <li><i class="el-icon-view"></i> 状态追踪：实时查看问题处理状态</li>
        <li><i class="el-icon-collection-tag"></i> 智能分类：AI自动归类问题类型</li>
        <li><i class="el-icon-message"></i> 即时反馈：快速获得老师回复</li>
      </ul>
    </div>
  </div>
</template>

<script>
import { mapActions, mapGetters } from 'vuex'

export default {
  name: 'StudentLogin',
  data() {
    return {
      loading: false,
      loginForm: {
        studentId: '',
        password: ''
      },
      loginRules: {
        studentId: [
          { required: true, message: '请输入学号', trigger: 'blur' },
          { min: 3, max: 20, message: '学号长度在 3 到 20 个字符', trigger: 'blur' },
          { pattern: /^[a-zA-Z0-9]+$/, message: '学号只能包含字母和数字', trigger: 'blur' }
        ],
        password: [
          { required: true, message: '请输入密码', trigger: 'blur' },
          { min: 3, max: 50, message: '密码长度在 3 到 50 个字符', trigger: 'blur' }
        ]
      },
      testAccounts: [
        { studentId: '2024001', name: '张小明', password: 'secret' },
        { studentId: '2024002', name: '李小红', password: 'secret' },
        { studentId: '2024003', name: '王小强', password: 'secret' },
        { studentId: '2024004', name: '陈小花', password: 'secret' },
        { studentId: '2024005', name: '刘小军', password: 'secret' }
      ],
      systemStatus: {
        backend: false,
        database: false
      }
    }
  },
  
  computed: {
    ...mapGetters(['isLoggedIn'])
  },
  
  created() {
    this.checkSystemStatus()
  },

  mounted() {
    // 如果已经登录，直接跳转到首页（但要避免重复导航）
    if (this.isLoggedIn && this.$route.path === '/login') {
      this.redirectAfterLogin()
    }
  },

  methods: {
    ...mapActions(['login']),

    async handleLogin() {
      try {
        // 表单验证
        const valid = await this.$refs.loginForm.validate()
        if (!valid) return

        this.loading = true

        // 调用登录action
        await this.login(this.loginForm)

        this.$message.success('登录成功！')
        
        // 延迟跳转以显示成功消息
        setTimeout(() => {
          this.redirectAfterLogin()
        }, 1000)

      } catch (error) {
        console.error('登录失败:', error)
        // 错误消息已在API拦截器中处理，这里不需要重复显示
      } finally {
        this.loading = false
      }
    },

    redirectAfterLogin() {
      try {
        const redirect = this.$route.query.redirect || '/'
        // 避免重复导航
        if (this.$route.path !== redirect) {
          this.$router.push(redirect)
        }
      } catch (error) {
        console.error('跳转失败:', error)
        // 如果跳转失败，尝试跳转到首页
        if (this.$route.path !== '/') {
          this.$router.push('/')
        }
      }
    },

    useTestAccount(account) {
      this.loginForm.studentId = account.studentId
      this.loginForm.password = account.password
      this.$message.info(`已填入测试账号：${account.name}`)
    },

    async checkSystemStatus() {
      try {
        // 检查后端服务状态
        const response = await this.$api.utils.healthCheck()
        this.systemStatus.backend = response.success || false
        this.systemStatus.database = response.data?.database || false
      } catch (error) {
        console.warn('系统状态检查失败:', error)
        this.systemStatus.backend = false
        this.systemStatus.database = false
      }
    }
  }
}
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  position: relative;
  overflow: hidden;
}

.login-background {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  overflow: hidden;
}

.background-shapes {
  position: relative;
  width: 100%;
  height: 100%;
}

.shape {
  position: absolute;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 50%;
  animation: float 6s ease-in-out infinite;
}

.shape-1 {
  width: 200px;
  height: 200px;
  top: 10%;
  left: 10%;
  animation-delay: 0s;
}

.shape-2 {
  width: 150px;
  height: 150px;
  top: 60%;
  right: 15%;
  animation-delay: 2s;
}

.shape-3 {
  width: 100px;
  height: 100px;
  bottom: 20%;
  left: 60%;
  animation-delay: 4s;
}

@keyframes float {
  0%, 100% { transform: translateY(0px) rotate(0deg); }
  50% { transform: translateY(-20px) rotate(10deg); }
}

.login-box {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 20px;
  padding: 40px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 400px;
  position: relative;
  z-index: 1;
}

.login-header {
  text-align: center;
  margin-bottom: 30px;
}

.logo {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 10px;
}

.logo i {
  font-size: 40px;
  color: #667eea;
  margin-right: 10px;
}

.logo h1 {
  color: #333;
  font-size: 28px;
  font-weight: 600;
  margin: 0;
}

.subtitle {
  color: #666;
  font-size: 16px;
  margin: 0;
}

.login-form {
  margin-bottom: 20px;
}

.login-form .el-form-item {
  margin-bottom: 20px;
}

.login-button {
  width: 100%;
  height: 48px;
  border-radius: 24px;
  font-size: 16px;
  font-weight: 600;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  transition: all 0.3s ease;
}

.login-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);
}

/* 测试账号区域 */
.test-accounts {
  margin: 30px 0;
  padding: 20px;
  background: #f8f9ff;
  border-radius: 12px;
  border: 1px solid #e6ebff;
}

.divider {
  text-align: center;
  margin-bottom: 15px;
  position: relative;
}

.divider span {
  background: #f8f9ff;
  padding: 0 15px;
  color: #666;
  font-size: 14px;
  font-weight: 500;
}

.divider::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  height: 1px;
  background: #e0e6ff;
  z-index: 0;
}

.account-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: center;
  margin-bottom: 10px;
}

.test-account-btn {
  padding: 8px 12px !important;
  color: #667eea !important;
  border: 1px solid #e6ebff !important;
  border-radius: 8px !important;
  background: white !important;
  font-size: 12px !important;
  transition: all 0.3s ease !important;
}

.test-account-btn:hover {
  background: #667eea !important;
  color: white !important;
  transform: translateY(-1px);
}

.test-tip {
  text-align: center;
  color: #999;
  font-size: 12px;
  margin: 0;
}

/* 系统状态 */
.system-status {
  display: flex;
  justify-content: space-around;
  margin-top: 20px;
  padding: 15px;
  background: #f0f2f5;
  border-radius: 8px;
}

.status-item {
  display: flex;
  align-items: center;
  font-size: 13px;
  color: #666;
}

.status-item i {
  margin-right: 5px;
  color: #d9d9d9;
  transition: color 0.3s ease;
}

.status-item i.status-ok {
  color: #52c41a;
}

/* 功能介绍 */
.feature-intro {
  position: fixed;
  bottom: 30px;
  right: 30px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  padding: 20px;
  border-radius: 15px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  max-width: 280px;
  z-index: 1;
}

.feature-intro h3 {
  color: #333;
  font-size: 16px;
  margin: 0 0 15px 0;
  text-align: center;
}

.feature-intro ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.feature-intro li {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
  color: #666;
  font-size: 13px;
}

.feature-intro li i {
  color: #667eea;
  margin-right: 8px;
  width: 16px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .login-container {
    padding: 10px;
  }
  
  .login-box {
    padding: 30px 20px;
  }
  
  .feature-intro {
    display: none;
  }
  
  .account-buttons {
    flex-direction: column;
  }
  
  .test-account-btn {
    width: 100% !important;
    text-align: center !important;
  }
}

/* Element UI 样式覆盖 */
.login-form .el-input__inner {
  height: 48px;
  border-radius: 24px;
  border: 1px solid #e6ebff;
  background: rgba(255, 255, 255, 0.8);
  transition: all 0.3s ease;
}

.login-form .el-input__inner:focus {
  border-color: #667eea;
  box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.2);
}

.login-form .el-form-item__error {
  background: rgba(245, 108, 108, 0.1);
  color: #f56c6c;
  padding: 5px 10px;
  border-radius: 6px;
  font-size: 12px;
  margin-top: 5px;
  border: 1px solid rgba(245, 108, 108, 0.3);
}
</style>