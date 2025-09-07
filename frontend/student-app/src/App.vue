<template>
  <div id="app">
    <!-- 顶部导航栏 -->
    <el-header v-if="$route.path !== '/login'" class="app-header">
      <div class="header-content">
        <div class="logo-area">
          <i class="el-icon-edit-outline"></i>
          <span class="app-title">课堂互动系统</span>
        </div>
        
        <div class="nav-menu">
          <el-menu
            :default-active="$route.path"
            mode="horizontal"
            background-color="transparent"
            text-color="white"
            active-text-color="#FFD93D"
            @select="handleMenuSelect"
          >
            <el-menu-item index="/">
              <i class="el-icon-edit"></i>
              <span>提交问题</span>
            </el-menu-item>
            <el-menu-item index="/my-question">
              <i class="el-icon-document"></i>
              <span>我的问题</span>
            </el-menu-item>
            <el-menu-item index="/about">
              <i class="el-icon-info"></i>
              <span>关于系统</span>
            </el-menu-item>
          </el-menu>
        </div>

        <div class="user-info" v-if="currentUser">
          <el-dropdown @command="handleUserCommand">
            <span class="user-dropdown">
              <i class="el-icon-user"></i>
              {{ currentUser.name }}
              <i class="el-icon-arrow-down"></i>
            </span>
            <el-dropdown-menu slot="dropdown">
              <el-dropdown-item command="profile">
                <i class="el-icon-user"></i>
                个人信息
              </el-dropdown-item>
              <el-dropdown-item command="logout" divided>
                <i class="el-icon-switch-button"></i>
                退出登录
              </el-dropdown-item>
            </el-dropdown-menu>
          </el-dropdown>
        </div>
      </div>
    </el-header>

    <!-- 主要内容区域 -->
    <el-main class="app-main" :class="{ 'with-header': $route.path !== '/login' }">
      <router-view />
    </el-main>

    <!-- 全局加载指示器 -->
    <div v-if="loading" class="global-loading">
      <div class="loading-content">
        <el-icon class="is-loading">
          <i class="el-icon-loading"></i>
        </el-icon>
        <p>加载中...</p>
      </div>
    </div>

    <!-- 返回顶部按钮 -->
    <el-backtop v-if="$route.path !== '/login'" :bottom="50">
      <div class="backtop-content">
        <i class="el-icon-caret-top"></i>
      </div>
    </el-backtop>
  </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex'

export default {
  name: 'App',
  
  computed: {
    ...mapGetters(['currentUser', 'isLoggedIn']),
    
    // 使用store中的loading状态
    loading() {
      return this.$store.state.loading
    }
  },

  async created() {
    // 初始化应用
    try {
      await this.initializeApp()
    } catch (error) {
      console.error('应用初始化失败:', error)
    }
  },

  methods: {
    ...mapActions(['logout', 'initializeApp']),

    handleMenuSelect(index) {
      if (this.$route.path !== index) {
        this.$router.push(index)
      }
    },

    async handleUserCommand(command) {
      switch (command) {
        case 'profile':
          this.$message.info('个人信息页面开发中...')
          break
        case 'logout':
          await this.handleLogout()
          break
      }
    },

    async handleLogout() {
      try {
        await this.$confirm('确定要退出登录吗？', '确认退出', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        })

        await this.logout()
        this.$message.success('已退出登录')
        this.$router.push('/login')
      } catch (error) {
        if (error !== 'cancel') {
          console.error('退出登录失败:', error)
          this.$message.error('退出登录失败')
        }
      }
    }
  }
}
</script>

<style>
/* 全局样式重置 */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Helvetica Neue', Helvetica, 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', Arial, sans-serif;
  background: #f5f7fa;
}

#app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

/* 顶部导航栏 */
.app-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  padding: 0;
  height: 60px !important;
  line-height: 60px;
  position: sticky;
  top: 0;
  z-index: 1000;
}

.header-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 100%;
}

.logo-area {
  display: flex;
  align-items: center;
  color: white;
  font-size: 18px;
  font-weight: 600;
}

.logo-area i {
  font-size: 24px;
  margin-right: 10px;
}

.nav-menu {
  flex: 1;
  margin: 0 40px;
}

.nav-menu .el-menu {
  border-bottom: none;
}

.nav-menu .el-menu-item {
  border-bottom: 2px solid transparent !important;
  transition: all 0.3s ease;
}

.nav-menu .el-menu-item:hover {
  background-color: rgba(255, 255, 255, 0.1) !important;
  color: white !important;
}

.nav-menu .el-menu-item.is-active {
  background-color: rgba(255, 255, 255, 0.1) !important;
  border-bottom-color: #FFD93D !important;
}

.user-info {
  color: white;
}

.user-dropdown {
  cursor: pointer;
  padding: 10px 15px;
  border-radius: 20px;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 5px;
}

.user-dropdown:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

/* 主要内容区域 */
.app-main {
  flex: 1;
  padding: 0;
  transition: all 0.3s ease;
}

.app-main.with-header {
  padding-top: 0;
}

/* 全局加载指示器 */
.global-loading {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.loading-content {
  text-align: center;
  color: #666;
}

.loading-content i {
  font-size: 40px;
  margin-bottom: 15px;
  color: #667eea;
}

.loading-content p {
  font-size: 16px;
  margin: 0;
}

/* 返回顶部按钮 */
.backtop-content {
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 18px;
  transition: all 0.3s ease;
}

.backtop-content:hover {
  transform: scale(1.1);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .header-content {
    padding: 0 10px;
  }
  
  .nav-menu {
    display: none;
  }
  
  .app-title {
    font-size: 16px;
  }
  
  .logo-area i {
    font-size: 20px;
  }
}

/* Element UI 样式覆盖 */
.el-header {
  padding: 0 !important;
}

.el-main {
  padding: 0 !important;
}

.el-dropdown-menu {
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  border: none;
}

.el-dropdown-menu__item {
  padding: 12px 20px;
  transition: all 0.3s ease;
}

.el-dropdown-menu__item:hover {
  background-color: #f0f2f5;
  color: #667eea;
}

.el-dropdown-menu__item i {
  margin-right: 8px;
  width: 16px;
}

/* 滚动条样式 */
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}
</style>