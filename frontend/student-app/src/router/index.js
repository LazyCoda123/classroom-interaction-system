// frontend/student-app/src/router/index.js
import Vue from 'vue'
import VueRouter from 'vue-router'
import store from '../store'
import { Message } from 'element-ui'

// 导入页面组件
import Login from '../views/Login.vue'
import Home from '../views/Home.vue'
import Question from '../views/Question.vue'

Vue.use(VueRouter)

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: Login,
    meta: {
      title: '学生登录',
      requiresAuth: false,
      hideInMenu: true
    }
  },
  {
    path: '/',
    name: 'Home',
    component: Home,
    meta: {
      title: '提交问题',
      requiresAuth: true,
      icon: 'el-icon-edit'
    }
  },
  {
    path: '/my-question',
    name: 'Question',
    component: Question,
    meta: {
      title: '我的问题',
      requiresAuth: true,
      icon: 'el-icon-document'
    }
  },
  {
    path: '/about',
    name: 'About',
    component: () => import('../views/About.vue'),
    meta: {
      title: '关于系统',
      requiresAuth: false,
      icon: 'el-icon-info'
    }
  },
  // 404页面
  {
    path: '/404',
    name: 'NotFound',
    component: () => import('../views/NotFound.vue'),
    meta: {
      title: '页面未找到',
      requiresAuth: false,
      hideInMenu: true
    }
  },
  // 重定向所有未匹配的路由到404
  {
    path: '*',
    redirect: '/404'
  }
]

const router = new VueRouter({
  mode: 'history',
  base: process.env.BASE_URL,
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    } else {
      return { x: 0, y: 0 }
    }
  }
})

// 修复Vue Router重复导航警告
const originalPush = VueRouter.prototype.push
const originalReplace = VueRouter.prototype.replace

VueRouter.prototype.push = function push(location, onResolve, onReject) {
  if (onResolve || onReject) {
    return originalPush.call(this, location, onResolve, onReject)
  }
  return originalPush.call(this, location).catch(err => {
    if (err.name !== 'NavigationDuplicated') {
      throw err
    }
  })
}

VueRouter.prototype.replace = function replace(location, onResolve, onReject) {
  if (onResolve || onReject) {
    return originalReplace.call(this, location, onResolve, onReject)
  }
  return originalReplace.call(this, location).catch(err => {
    if (err.name !== 'NavigationDuplicated') {
      throw err
    }
  })
}

// 路由守卫
router.beforeEach(async (to, from, next) => {
  try {
    // 设置页面标题
    if (to.meta.title) {
      document.title = `${to.meta.title} - 课堂互动系统`
    }

    // 检查路由是否需要认证
    if (to.meta.requiresAuth) {
      const isLoggedIn = store.getters.isLoggedIn
      
      if (!isLoggedIn) {
        Message.warning('请先登录')
        // 避免重复导航：只在不是已经在登录页时才跳转
        if (to.path !== '/login') {
          next({
            path: '/login',
            query: { redirect: to.fullPath }
          })
        } else {
          next()
        }
        return
      }
      
      // 如果已登录但没有用户信息，尝试获取
      if (!store.state.user && store.state.token) {
        try {
          await store.dispatch('fetchCurrentUser')
        } catch (error) {
          console.error('获取用户信息失败:', error)
          Message.error('登录状态已过期，请重新登录')
          // 清除无效的token
          store.commit('SET_TOKEN', '')
          store.commit('SET_USER', null)
          if (to.path !== '/login') {
            next('/login')
          } else {
            next()
          }
          return
        }
      }
    }

    // 如果已登录访问登录页，重定向到首页（但要避免重复导航）
    if (to.path === '/login' && store.getters.isLoggedIn) {
      if (from.path !== '/') {
        next('/')
      } else {
        next()
      }
      return
    }

    next()
  } catch (error) {
    console.error('路由守卫错误:', error)
    Message.error('页面跳转失败')
    next(false)
  }
})

router.afterEach((to, from) => {
  // 页面跳转完成后的处理
  console.log(`页面跳转: ${from.path} -> ${to.path}`)
})

// 路由错误处理
router.onError(error => {
  console.error('路由错误:', error)
  if (error.name !== 'NavigationDuplicated') {
    Message.error('页面加载失败，请刷新重试')
  }
})

export default router