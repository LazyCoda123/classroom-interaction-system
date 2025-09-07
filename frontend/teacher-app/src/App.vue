<template>
  <div id="app">
    <!-- 顶部导航栏 -->
    <el-header v-if="$route.path !== '/login'" class="app-header">
      <div class="header-content">
        <div class="logo-area">
          <i class="el-icon-s-data"></i>
          <span class="app-title">课堂互动系统</span>
          <span class="user-type">教师端</span>
        </div>
        
        <!-- 导航菜单 -->
        <div class="nav-menu" v-if="isLoggedIn">
          <el-menu
            :default-active="$route.path"
            mode="horizontal"
            background-color="transparent"
            text-color="white"
            active-text-color="#FFD700"
            :router="true"
            class="header-menu"
          >
            <el-menu-item index="/">
              <i class="el-icon-house"></i>
              <span>问题管理</span>
            </el-menu-item>
            <el-menu-item index="/classification">
              <i class="el-icon-collection-tag"></i>
              <span>AI分类</span>
            </el-menu-item>
            <el-menu-item index="/statistics">
              <i class="el-icon-pie-chart"></i>
              <span>数据统计</span>
            </el-menu-item>
          </el-menu>
        </div>
        
        <div class="user-area" v-if="isLoggedIn">
          <el-dropdown @command="handleUserCommand" trigger="click">
            <span class="user-dropdown">
              <span class="welcome-text">{{ currentUser.name }}</span>
              <i class="el-icon-arrow-down"></i>
            </span>
            <el-dropdown-menu slot="dropdown">
              <el-dropdown-item command="profile">
                <i class="el-icon-user"></i>
                个人信息
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
        </div>
      </div>
    </el-header>

    <!-- 侧边栏（移动端） -->
    <el-drawer
      :visible.sync="mobileMenuVisible"
      direction="ltr"
      size="260px"
      :with-header="false"
      class="mobile-menu-drawer"
    >
      <div class="mobile-menu">
        <div class="mobile-menu-header">
          <div class="logo">
            <i class="el-icon-s-data"></i>
            <span>教师端</span>
          </div>
        </div>
        <el-menu
          :default-active="$route.path"
          :router="true"
          @select="mobileMenuVisible = false"
        >
          <el-menu-item index="/">
            <i class="el-icon-house"></i>
            <span>问题管理</span>
          </el-menu-item>
          <el-menu-item index="/classification">
            <i class="el-icon-collection-tag"></i>
            <span>AI分类</span>
          </el-menu-item>
          <el-menu-item index="/statistics">
            <i class="el-icon-pie-chart"></i>
            <span>数据统计</span>
          </el-menu-item>
        </el-menu>
      </div>
    </el-drawer>

    <!-- 主内容区域 -->
    <el-main :class="{ 'with-header': $route.path !== '/login' }">
      <router-view />
    </el-main>

    <!-- 返回顶部按钮 -->
    <el-backtop
      v-if="$route.path !== '/login'"
      :bottom="50"
      :right="50"
      background-color="#667eea"
    >
      <div class="backtop-content">
        <i class="el-icon-caret-top"></i>
      </div>
    </el-backtop>

    <!-- 全局加载指示器 -->
    <div v-if="globalLoading" class="global-loading">
      <div class="loading-content">
        <el-progress
          type="circle"
          :percentage="loadingProgress"
          :color="loadingColors"
          :width="80"
          :stroke-width="8"
        />
        <p class="loading-text">{{ loadingText }}</p>
      </div>
    </div>

    <!-- 系统通知 -->
    <div v-if="systemNotification" class="system-notification">
      <el-alert
        :title="systemNotification.title"
        :type="systemNotification.type"
        :description="systemNotification.message"
        show-icon
        :closable="true"
        @close="closeSystemNotification"
      />
    </div>
  </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex'

export default {
  name: 'App',
  data() {
    return {
      mobileMenuVisible: false,
      loadingProgress: 0,
      loadingColors: [
        { color: '#f56c6c', percentage: 20 },
        { color: '#e6a23c', percentage: 40 },
        { color: '#5daf34', percentage: 60 },
        { color: '#1989fa', percentage: 80 },
        { color: '#6f7ad3', percentage: 100 }
      ]
    }
  },
  
  computed: {
    ...mapGetters([
      'isLoggedIn', 
      'currentUser', 
      'globalLoading', 
      'loadingText',
      'systemNotification'
    ])
  },
  
  methods: {
    ...mapActions(['logout', 'setSystemNotification']),
    
    // 处理用户下拉菜单命令
    async handleUserCommand(command) {
      switch (command) {
        case 'profile':
          this.showUserProfile()
          break
        case 'settings':
          this.showSettings()
          break
        case 'logout':
          await this.handleLogout()
          break
      }
    },
    
    // 退出登录
    async handleLogout() {
      try {
        await this.confirmAction('确定要退出登录吗？', '退出确认')
        
        await this.logout()
        this.showSuccess('已退出登录')
        this.$router.push('/login')
        
      } catch (error) {
        if (error !== 'cancel') {
          this.handleError(error, '退出登录失败')
        }
      }
    },
    
    // 显示用户信息
    showUserProfile() {
      this.$alert(`
        <div style="text-align: left;">
          <p><strong>姓名：</strong>${this.currentUser.name}</p>
          <p><strong>工号：</strong>${this.currentUser.student_id}</p>
          <p><strong>角色：</strong>教师</p>
        </div>
      `, '个人信息', {
        dangerouslyUseHTMLString: true,
        confirmButtonText: '确定'
      })
    },
    
    // 显示系统设置
    showSettings() {
      this.showInfo('系统设置功能正在开发中...')
    },
    
    // 关闭系统通知
    closeSystemNotification() {
      this.setSystemNotification(null)
    },
    
    // 监听窗口大小变化
    handleResize() {
      // 在小屏幕上自动关闭移动端菜单
      if (window.innerWidth > 768) {
        this.mobileMenuVisible = false
      }
    }
  },
  
  watch: {
    // 监听加载状态，更新进度条
    globalLoading(newVal) {
      if (newVal) {
        this.loadingProgress = 0
        const timer = setInterval(() => {
          this.loadingProgress += 10
          if (this.loadingProgress >= 90) {
            clearInterval(timer)
          }
        }, 100)
      } else {
        this.loadingProgress = 100
        setTimeout(() => {
          this.loadingProgress = 0
        }, 500)
      }
    }
  },
  
  async created() {
    // 应用启动时检查登录状态
    if (this.isLoggedIn) {
      try {
        // 验证token是否仍然有效
        await this.$api.auth.getCurrentUser()
        
        // 设置欢迎通知
        this.setSystemNotification({
          title: '欢迎回来',
          message: `${this.currentUser.name}，欢迎使用课堂互动系统教师端`,
          type: 'success'
        })
        
        // 3秒后自动关闭欢迎通知
        setTimeout(() => {
          this.closeSystemNotification()
        }, 3000)
        
      } catch (error) {
        // token无效，清除登录状态
        await this.$store.dispatch('logout')
        if (this.$route.path !== '/login') {
          this.$router.push('/login')
        }
      }
    }
  },
  
  mounted() {
    // 监听窗口大小变化
    window.addEventListener('resize', this.handleResize)
  },
  
  beforeDestroy() {
    // 移除事件监听器
    window.removeEventListener('resize', this.handleResize)
  }
}
</script>

<style lang="scss">
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Helvetica Neue', Helvetica, 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', '微软雅黑', Arial, sans-serif;
  background-color: #f5f7fa;
}

#app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

// 顶部导航栏样式
.app-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 0;
  height: 60px !important;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  
  .header-content {
    height: 100%;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0 20px;
    max-width: 1400px;
    margin: 0 auto;
    
    .logo-area {
      display: flex;
      align-items: center;
      flex: 0 0 auto;
      
      i {
        font-size: 24px;
        margin-right: 10px;
      }
      
      .app-title {
        font-size: 20px;
        font-weight: 600;
        margin-right: 10px;
      }
      
      .user-type {
        background: rgba(255, 255, 255, 0.2);
        padding: 4px 8px;
        border-radius: 12px;
        font-size: 12px;
        font-weight: 500;
      }
    }
    
    .nav-menu {
      flex: 1;
      display: flex;
      justify-content: center;
      
      .header-menu {
        border: none;
        
        .el-menu-item {
          border-bottom: none !important;
          color: rgba(255, 255, 255, 0.9) !important;
          font-weight: 500;
          
          &:hover {
            background: rgba(255, 255, 255, 0.1) !important;
            color: white !important;
          }
          
          &.is-active {
            background: rgba(255, 255, 255, 0.2) !important;
            color: #FFD700 !important;
          }
          
          i {
            margin-right: 5px;
          }
        }
      }
    }
    
    .user-area {
      flex: 0 0 auto;
      
      .user-dropdown {
        display: flex;
        align-items: center;
        cursor: pointer;
        padding: 8px 12px;
        border-radius: 6px;
        transition: background 0.3s ease;
        
        &:hover {
          background: rgba(255, 255, 255, 0.1);
        }
        
        .welcome-text {
          margin-right: 5px;
          font-weight: 500;
        }
      }
    }
  }
}

// 移动端菜单
.mobile-menu-drawer {
  .mobile-menu {
    .mobile-menu-header {
      padding: 20px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      
      .logo {
        display: flex;
        align-items: center;
        font-size: 18px;
        font-weight: 600;
        
        i {
          margin-right: 10px;
          font-size: 24px;
        }
      }
    }
  }
}

// 主内容区域样式
.el-main {
  padding: 0;
  flex: 1;
  
  &.with-header {
    padding-top: 20px;
  }
}

// 返回顶部按钮样式
.backtop-content {
  height: 100%;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  color: white;
}

// 全局加载指示器
.global-loading {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.7);
  z-index: 2000;
  display: flex;
  justify-content: center;
  align-items: center;
  
  .loading-content {
    text-align: center;
    color: white;
    
    .loading-text {
      font-size: 16px;
      margin-top: 20px;
      font-weight: 500;
    }
  }
}

// 系统通知样式
.system-notification {
  position: fixed;
  top: 80px;
  right: 20px;
  z-index: 1000;
  max-width: 400px;
  
  .el-alert {
    border-radius: 8px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  }
}

// Element UI 样式覆盖
.el-message {
  top: 80px !important;
}

.el-dropdown-menu {
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}

.el-dropdown-menu__item {
  display: flex;
  align-items: center;
  
  i {
    margin-right: 8px;
    width: 16px;
  }
}

// 响应式设计
@media (max-width: 768px) {
  .app-header .header-content {
    padding: 0 15px;
    
    .nav-menu {
      display: none;
    }
    
    .logo-area .app-title {
      font-size: 18px;
    }
    
    .user-area .welcome-text {
      display: none;
    }
  }
  
  .system-notification {
    right: 10px;
    left: 10px;
    max-width: none;
  }
}

// 动画效果
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s;
}

.fade-enter, .fade-leave-to {
  opacity: 0;
}

// 页面容器样式
.page-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 20px;
}

@media (max-width: 768px) {
  .page-container {
    padding: 0 10px;
  }
}
</style>