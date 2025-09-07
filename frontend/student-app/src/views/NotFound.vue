<template>
  <div class="not-found-container">
    <div class="not-found-content">
      <!-- 404动画图标 -->
      <div class="error-animation">
        <div class="error-number">4</div>
        <div class="error-icon">
          <i class="el-icon-warning-outline"></i>
        </div>
        <div class="error-number">4</div>
      </div>
      
      <!-- 错误信息 -->
      <div class="error-info">
        <h1 class="error-title">页面未找到</h1>
        <p class="error-message">
          抱歉，您访问的页面不存在或已被移除
        </p>
        <p class="error-tips">
          请检查网址是否正确，或返回首页继续使用
        </p>
      </div>
      
      <!-- 操作按钮 -->
      <div class="error-actions">
        <el-button 
          type="primary" 
          size="large"
          @click="goHome"
          class="action-btn"
        >
          <i class="el-icon-house"></i>
          返回首页
        </el-button>
        
        <el-button 
          size="large"
          @click="goBack"
          class="action-btn"
        >
          <i class="el-icon-back"></i>
          返回上页
        </el-button>
      </div>
      
      <!-- 快捷导航 -->
      <div class="quick-nav">
        <h3>您可能想要：</h3>
        <div class="nav-links">
          <router-link to="/" class="nav-link">
            <i class="el-icon-edit"></i>
            <span>提交问题</span>
          </router-link>
          
          <router-link to="/my-question" class="nav-link">
            <i class="el-icon-document"></i>
            <span>我的问题</span>
          </router-link>
          
          <router-link to="/about" class="nav-link">
            <i class="el-icon-info"></i>
            <span>关于系统</span>
          </router-link>
        </div>
      </div>
    </div>
    
    <!-- 背景装饰 -->
    <div class="background-decoration">
      <div class="decoration-shape shape-1"></div>
      <div class="decoration-shape shape-2"></div>
      <div class="decoration-shape shape-3"></div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'NotFound',
  
  created() {
    // 设置页面标题
    document.title = '页面未找到 - 课堂互动系统'
  },
  
  methods: {
    goHome() {
      this.$router.push('/')
    },
    
    goBack() {
      // 如果有历史记录就返回上一页，否则去首页
      if (window.history.length > 1) {
        this.$router.go(-1)
      } else {
        this.$router.push('/')
      }
    }
  }
}
</script>

<style scoped>
.not-found-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  position: relative;
  overflow: hidden;
  padding: 20px;
}

.not-found-content {
  text-align: center;
  color: white;
  z-index: 2;
  position: relative;
  max-width: 600px;
}

/* 404动画 */
.error-animation {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 30px;
  font-size: 120px;
  font-weight: bold;
  animation: bounce 2s infinite;
}

.error-number {
  color: rgba(255, 255, 255, 0.9);
  text-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
}

.error-icon {
  margin: 0 20px;
  color: #FFD93D;
  animation: shake 1s infinite;
}

.error-icon i {
  font-size: 100px;
  filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.3));
}

@keyframes bounce {
  0%, 20%, 50%, 80%, 100% {
    transform: translateY(0);
  }
  40% {
    transform: translateY(-10px);
  }
  60% {
    transform: translateY(-5px);
  }
}

@keyframes shake {
  0%, 100% { transform: rotate(0deg); }
  25% { transform: rotate(-5deg); }
  75% { transform: rotate(5deg); }
}

/* 错误信息 */
.error-info {
  margin-bottom: 40px;
}

.error-title {
  font-size: 36px;
  margin: 0 0 20px 0;
  font-weight: 600;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.error-message {
  font-size: 18px;
  margin: 0 0 10px 0;
  opacity: 0.9;
  line-height: 1.6;
}

.error-tips {
  font-size: 14px;
  margin: 0;
  opacity: 0.7;
  line-height: 1.5;
}

/* 操作按钮 */
.error-actions {
  margin-bottom: 40px;
}

.action-btn {
  margin: 0 10px 10px 10px;
  padding: 12px 30px;
  border-radius: 25px;
  font-size: 16px;
  font-weight: 500;
  transition: all 0.3s ease;
}

.action-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.2);
}

.action-btn i {
  margin-right: 8px;
}

/* 快捷导航 */
.quick-nav {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-radius: 15px;
  padding: 25px;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.quick-nav h3 {
  margin: 0 0 20px 0;
  font-size: 18px;
  opacity: 0.9;
}

.nav-links {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 15px;
}

.nav-link {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 15px 20px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  color: white;
  text-decoration: none;
  transition: all 0.3s ease;
  border: 1px solid rgba(255, 255, 255, 0.2);
  min-width: 100px;
}

.nav-link:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: translateY(-3px);
  color: white;
  text-decoration: none;
}

.nav-link i {
  font-size: 24px;
  margin-bottom: 8px;
}

.nav-link span {
  font-size: 14px;
  font-weight: 500;
}

/* 背景装饰 */
.background-decoration {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  overflow: hidden;
}

.decoration-shape {
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
  0%, 100% { 
    transform: translateY(0px) rotate(0deg); 
  }
  50% { 
    transform: translateY(-20px) rotate(10deg); 
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .not-found-container {
    padding: 10px;
  }
  
  .error-animation {
    font-size: 80px;
  }
  
  .error-icon i {
    font-size: 70px;
  }
  
  .error-title {
    font-size: 28px;
  }
  
  .error-message {
    font-size: 16px;
  }
  
  .nav-links {
    flex-direction: column;
    align-items: center;
  }
  
  .nav-link {
    width: 100%;
    max-width: 200px;
  }
  
  .action-btn {
    width: 100%;
    max-width: 250px;
    margin: 5px 0;
  }
}

@media (max-width: 480px) {
  .error-animation {
    font-size: 60px;
    flex-direction: column;
  }
  
  .error-icon {
    margin: 10px 0;
  }
  
  .error-icon i {
    font-size: 50px;
  }
  
  .error-title {
    font-size: 24px;
  }
  
  .quick-nav {
    padding: 20px;
  }
}
</style>