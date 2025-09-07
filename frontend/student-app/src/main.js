// frontend/student-app/src/main.js
import Vue from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'
import ElementUI from 'element-ui'
import 'element-ui/lib/theme-chalk/index.css'

// 导入API
import api from './api'

// 导入全局样式
import './assets/css/global.css'

// 使用Element UI，并自定义消息样式
Vue.use(ElementUI)

// 自定义Element UI消息样式，修复颜色问题
const originalMessage = ElementUI.Message
const customMessage = (options) => {
  if (typeof options === 'string') {
    options = { message: options }
  }
  
  // 确保错误消息有清晰的颜色对比
  if (options.type === 'error') {
    options.customClass = 'custom-error-message'
  } else if (options.type === 'warning') {
    options.customClass = 'custom-warning-message'
  } else if (options.type === 'success') {
    options.customClass = 'custom-success-message'
  } else if (options.type === 'info') {
    options.customClass = 'custom-info-message'
  }
  
  return originalMessage(options)
}

// 复制原有的静态方法
Object.keys(originalMessage).forEach(key => {
  if (typeof originalMessage[key] === 'function') {
    customMessage[key] = (options) => {
      if (typeof options === 'string') {
        options = { message: options, type: key }
      } else {
        options.type = key
      }
      return customMessage(options)
    }
  } else {
    customMessage[key] = originalMessage[key]
  }
})

// 替换默认的Message
Vue.prototype.$message = customMessage

// 将API挂载到Vue原型上，这样所有组件都可以通过this.$api访问
Vue.prototype.$api = api

// 全局错误处理
Vue.config.errorHandler = (err, vm, info) => {
  console.error('Vue Error:', err)
  console.error('Component:', vm)
  console.error('Info:', info)
  
  // 可以在这里添加错误上报逻辑
  if (process.env.NODE_ENV === 'production') {
    // 发送错误到监控服务
    // errorReporting.captureException(err)
  }
}

// 全局警告处理
Vue.config.warnHandler = (msg, vm, trace) => {
  if (process.env.NODE_ENV === 'development') {
    console.warn('Vue Warning:', msg)
    console.warn('Component:', vm)
    console.warn('Trace:', trace)
  }
}

// 生产环境配置
Vue.config.productionTip = false

// 全局过滤器
Vue.filter('dateFormat', (value) => {
  if (!value) return ''
  const date = new Date(value)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
})

Vue.filter('timeFromNow', (value) => {
  if (!value) return ''
  const now = new Date()
  const date = new Date(value)
  const diff = now - date
  
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  
  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes}分钟前`
  if (hours < 24) return `${hours}小时前`
  return `${days}天前`
})

// 全局方法
Vue.prototype.$utils = {
  // 复制到剪贴板
  copyToClipboard(text) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text)
    } else {
      // 兼容性方案
      const textarea = document.createElement('textarea')
      textarea.value = text
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
      return Promise.resolve()
    }
  },
  
  // 防抖函数
  debounce(func, wait) {
    let timeout
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout)
        func(...args)
      }
      clearTimeout(timeout)
      timeout = setTimeout(later, wait)
    }
  },
  
  // 节流函数
  throttle(func, limit) {
    let inThrottle
    return function(...args) {
      if (!inThrottle) {
        func.apply(this, args)
        inThrottle = true
        setTimeout(() => inThrottle = false, limit)
      }
    }
  },
  
  // 格式化文件大小
  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }
}

// 全局常量
Vue.prototype.$constants = {
  // 问题状态
  QUESTION_STATUS: {
    PENDING: 'pending',
    CLASSIFIED: 'classified'
  },
  
  // 用户角色
  USER_ROLES: {
    STUDENT: 'student',
    TEACHER: 'teacher'
  },
  
  // 问题分类
  CATEGORIES: {
    DEFINITION: 1,      // 知识点定义类问题
    APPLICATION: 2,     // 知识点应用类问题
    RELATION: 3,        // 知识点关联类问题
    EXPERIMENT: 4,      // 实验操作类问题
    METHOD: 5,          // 解题方法类问题
    OTHER: 6            // 其他类问题
  }
}

// 创建Vue实例
new Vue({
  router,
  store,
  render: h => h(App)
}).$mount('#app')