// frontend/teacher-app/src/router/index.js
import Vue from 'vue'
import VueRouter from 'vue-router'

// 导入页面组件
import Login from '../views/Login.vue'
import Dashboard from '../views/Dashboard.vue'
import QuestionList from '../views/QuestionList.vue'  // 🔥 新增问题列表页面
import Classification from '../views/Classification.vue'
import Statistics from '../views/Statistics.vue'

Vue.use(VueRouter)

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: Login,
    meta: {
      title: '登录',
      requiresAuth: false,
      hideHeader: true
    }
  },
  {
    path: '/',
    name: 'Dashboard',
    component: Dashboard,
    meta: {
      title: '仪表板概览',
      requiresAuth: true,
      roles: ['teacher'],
      icon: 'el-icon-monitor'
    }
  },
  {
    // 🔥 新增：问题列表页面路由
    path: '/questions',
    name: 'QuestionList',
    component: QuestionList,
    meta: {
      title: '问题管理',
      requiresAuth: true,
      roles: ['teacher'],
      icon: 'el-icon-chat-line-round'
    }
  },
  {
    path: '/classification',
    name: 'Classification',
    component: Classification,
    meta: {
      title: 'AI分类管理',
      requiresAuth: true,
      roles: ['teacher'],
      icon: 'el-icon-collection-tag'
    }
  },
  {
    path: '/statistics',
    name: 'Statistics',
    component: Statistics,
    meta: {
      title: '数据统计',
      requiresAuth: true,
      roles: ['teacher'],
      icon: 'el-icon-pie-chart'
    }
  },
  {
    // 🔥 新增：重定向规则 - 兼容旧的问题管理路径
    path: '/question-management',
    redirect: '/questions'
  },
  {
    // 🔥 新增：重定向规则 - 兼容dashboard别名
    path: '/dashboard',
    redirect: '/'
  },
  {
    // 404页面重定向
    path: '*',
    redirect: '/'
  }
]

const router = new VueRouter({
  mode: 'history',
  base: process.env.BASE_URL,
  routes,
  // 路由切换时滚动到顶部
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    } else {
      return { x: 0, y: 0 }
    }
  }
})

// 🔥 全局前置守卫 - 增强版
router.beforeEach((to, from, next) => {
  // 设置页面标题
  document.title = to.meta.title ? `${to.meta.title} - 课堂互动系统(教师端)` : '课堂互动系统(教师端)'
  
  // 添加页面加载进度条
  if (typeof window !== 'undefined' && window.NProgress) {
    window.NProgress.start()
  }
  
  // 🔥 增强：权限验证
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth)
  const token = localStorage.getItem('teacher_token')
  const userStr = localStorage.getItem('teacher_user')
  
  if (requiresAuth) {
    if (!token) {
      // 未登录，跳转到登录页
      console.log('🔒 未登录，跳转到登录页')
      next('/login')
      return
    }
    
    // 验证用户角色
    if (userStr) {
      try {
        const user = JSON.parse(userStr)
        const requiredRoles = to.meta.roles
        
        if (requiredRoles && !requiredRoles.includes(user.role)) {
          console.log('🚫 权限不足，角色不匹配')
          next('/login')
          return
        }
      } catch (error) {
        console.error('用户信息解析失败:', error)
        localStorage.removeItem('teacher_user')
        localStorage.removeItem('teacher_token')
        next('/login')
        return
      }
    }
  }
  
  // 🔥 增强：如果已登录但访问登录页，跳转到首页
  if (to.path === '/login' && token) {
    console.log('✅ 已登录，跳转到首页')
    next('/')
    return
  }
  
  console.log(`🧭 路由跳转: ${from.path} -> ${to.path}`)
  next()
})

// 🔥 全局后置守卫 - 增强版
router.afterEach((to, from) => {
  // 路由切换完成后的操作
  console.log(`✅ 路由切换完成: ${from.path} -> ${to.path}`)
  
  // 结束页面加载进度条
  if (typeof window !== 'undefined' && window.NProgress) {
    window.NProgress.done()
  }
  
  // 🔥 增强：记录用户访问路径（用于分析）
  if (process.env.NODE_ENV === 'development') {
    console.log(`📊 页面访问: ${to.name} (${to.path})`)
  }
  
  // 🔥 增强：页面访问统计（可选）
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('config', 'GA_TRACKING_ID', {
      page_path: to.path
    })
  }
})

// 🔥 路由错误处理
router.onError((error) => {
  console.error('路由错误:', error)
  
  // 对于chunk load失败的错误，尝试刷新页面
  if (error.name === 'ChunkLoadError') {
    window.location.reload()
  }
})

export default router