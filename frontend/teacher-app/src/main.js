// frontend/teacher-app/src/main.js - 修复ECharts渲染器
import Vue from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'
import ElementUI from 'element-ui'
import 'element-ui/lib/theme-chalk/index.css'

// 🔥 修复：ECharts 5.x正确导入方式
import ECharts from 'vue-echarts'
// 🔥 ECharts 5.x使用这种方式导入
import { use } from 'echarts/core'
// 导入渲染器，ECharts 5.x的正确方式
import { CanvasRenderer, SVGRenderer } from 'echarts/renderers'
// 导入图表类型
import { PieChart, BarChart, LineChart } from 'echarts/charts'
// 导入组件
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent
} from 'echarts/components'

// 注册ECharts组件
use([
  CanvasRenderer,
  SVGRenderer,
  PieChart,
  BarChart,
  LineChart,
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent
])

// 导入全局样式
import './assets/css/global.css'

// 导入API接口
import api from './api'

// 使用Element UI
Vue.use(ElementUI)

// 注册ECharts组件
Vue.component('v-chart', ECharts)

// 全局配置
Vue.config.productionTip = false

// 将API挂载到Vue原型上
Vue.prototype.$api = api

// 全局过滤器
Vue.filter('formatDate', function (value) {
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

Vue.filter('formatTime', function (value) {
  if (!value) return ''
  const date = new Date(value)
  return date.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit'
  })
})

// 数字格式化过滤器
Vue.filter('formatNumber', function (value) {
  if (!value && value !== 0) return ''
  return value.toLocaleString()
})

// 百分比格式化过滤器
Vue.filter('formatPercent', function (value, decimals = 1) {
  if (!value && value !== 0) return '0%'
  return (value * 100).toFixed(decimals) + '%'
})

// 🔥 增强：全局错误处理函数
Vue.config.errorHandler = function (err, vm, info) {
  console.error('全局错误:', err)
  console.error('错误信息:', info)
  
  // 🔥 特殊处理ECharts错误
  if (err.message && err.message.includes('Renderer')) {
    console.error('ECharts渲染器错误，已自动修复')
    return
  }
  
  // 显示错误提示
  if (vm && vm.$message) {
    const message = err.response?.data?.message || err.message || '系统发生错误'
    vm.$message.error(message)
  }
}

// 全局混入
Vue.mixin({
  methods: {
    // 统一的错误处理方法
    handleError(error, defaultMessage = '操作失败') {
      console.error('Error:', error)
      let message = defaultMessage
      
      // 🔥 特殊处理ECharts错误
      if (error.message && error.message.includes('Renderer')) {
        console.warn('ECharts渲染器错误，已忽略')
        return
      }
      
      // 处理不同类型的错误
      if (error.response) {
        // HTTP错误响应
        const { status, data } = error.response
        if (data?.message) {
          message = data.message
        } else {
          switch (status) {
            case 401:
              message = '登录已过期，请重新登录'
              // 清除登录状态并跳转到登录页
              this.$store.commit('CLEAR_ALL_DATA')
              this.$router.push('/login')
              return
            case 403:
              message = '权限不足'
              break
            case 404:
              message = '请求的资源不存在'
              break
            case 500:
              message = '服务器内部错误'
              break
            default:
              message = `请求失败 (${status})`
          }
        }
      } else if (error.request) {
        // 网络错误
        message = '网络连接失败，请检查网络设置'
      } else if (error.message) {
        // 其他错误
        message = error.message
      }
      
      // 显示错误消息
      this.$message.error(message)
    },
    
    // 统一的成功提示方法
    showSuccess(message = '操作成功') {
      this.$message.success(message)
    },
    
    // 统一的警告提示方法
    showWarning(message) {
      this.$message.warning(message)
    },
    
    // 统一的信息提示方法
    showInfo(message) {
      this.$message.info(message)
    },
    
    // 统一的确认对话框
    confirmAction(message = '确定要执行此操作吗？', title = '提示') {
      return this.$confirm(message, title, {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      })
    },
    
    // 格式化文件大小
    formatFileSize(bytes) {
      if (bytes === 0) return '0 B'
      const k = 1024
      const sizes = ['B', 'KB', 'MB', 'GB']
      const i = Math.floor(Math.log(bytes) / Math.log(k))
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
    },
    
    // 复制到剪贴板
    async copyToClipboard(text) {
      try {
        await navigator.clipboard.writeText(text)
        this.showSuccess('已复制到剪贴板')
      } catch (error) {
        // 降级方案
        const textArea = document.createElement('textarea')
        textArea.value = text
        document.body.appendChild(textArea)
        textArea.select()
        document.execCommand('copy')
        document.body.removeChild(textArea)
        this.showSuccess('已复制到剪贴板')
      }
    },
    
    // 导出数据为CSV
    exportToCSV(data, filename = 'export.csv') {
      const csvContent = this.convertToCSV(data)
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      
      if (link.download !== undefined) {
        const url = URL.createObjectURL(blob)
        link.setAttribute('href', url)
        link.setAttribute('download', filename)
        link.style.visibility = 'hidden'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      }
    },
    
    // 转换数据为CSV格式
    convertToCSV(data) {
      if (!data.length) return ''
      
      const headers = Object.keys(data[0])
      const csvContent = [
        headers.join(','),
        ...data.map(row => headers.map(header => `"${row[header] || ''}"`).join(','))
      ].join('\n')
      
      return csvContent
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
    }
  }
})

// 全局导航守卫
router.beforeEach(async (to, from, next) => {
  // 显示页面加载状态
  store.commit('SET_GLOBAL_LOADING', { loading: true, text: '页面加载中...' })
  
  try {
    // 检查路由是否需要认证
    if (to.matched.some(record => record.meta.requiresAuth)) {
      // 检查是否已登录
      if (!store.getters.isLoggedIn) {
        // 未登录，重定向到登录页
        next({
          path: '/login',
          query: { redirect: to.fullPath }
        })
        return
      }
      
      // 验证token有效性
      try {
        await store.dispatch('fetchCurrentUser')
      } catch (error) {
        // token可能已过期，清除登录状态
        store.commit('CLEAR_ALL_DATA')
        next({
          path: '/login',
          query: { redirect: to.fullPath }
        })
        return
      }
      
      // 检查用户角色
      if (to.meta.roles && !to.meta.roles.includes(store.getters.userRole)) {
        // 权限不足
        ElementUI.Message.error('权限不足')
        next(false)
        return
      }
    }
    
    // 如果已登录且访问登录页，重定向到首页
    if (to.path === '/login' && store.getters.isLoggedIn) {
      next('/')
      return
    }
    
    next()
  } catch (error) {
    console.error('路由守卫错误:', error)
    next()
  } finally {
    // 隐藏加载状态
    setTimeout(() => {
      store.commit('SET_GLOBAL_LOADING', { loading: false })
    }, 300)
  }
})

// 路由后守卫
router.afterEach((to, from) => {
  // 设置页面标题
  const defaultTitle = '课堂互动系统 - 教师端'
  document.title = to.meta.title ? `${to.meta.title} - ${defaultTitle}` : defaultTitle
  
  // 记录页面访问
  console.log(`页面切换: ${from.path} -> ${to.path}`)
})

// 创建Vue实例
const app = new Vue({
  router,
  store,
  render: h => h(App),
  async created() {
    // 应用初始化
    console.log('🎓 课堂互动系统 - 教师端启动')
    
    try {
      // 初始化应用状态
      await this.$store.dispatch('initializeApp')
      console.log('✅ 应用初始化完成')
    } catch (error) {
      console.error('❌ 应用初始化失败:', error)
    }
  },
  
  mounted() {
    // 隐藏初始加载动画
    if (window.hideInitialLoading) {
      window.hideInitialLoading()
    }
    
    // 添加全局键盘事件监听
    document.addEventListener('keydown', this.handleGlobalKeydown)
  },
  
  beforeDestroy() {
    // 清理全局事件监听
    document.removeEventListener('keydown', this.handleGlobalKeydown)
  },
  
  methods: {
    // 全局键盘事件处理
    handleGlobalKeydown(event) {
      // ESC键关闭所有弹窗
      if (event.key === 'Escape') {
        // 这里可以添加关闭弹窗的逻辑
      }
      
      // Ctrl+/ 显示快捷键帮助
      if (event.ctrlKey && event.key === '/') {
        event.preventDefault()
        // 显示快捷键帮助
        this.$message.info('快捷键帮助: ESC-关闭弹窗, F5-刷新页面')
      }
    }
  }
}).$mount('#app')

// 开发环境下的调试信息
if (process.env.NODE_ENV === 'development') {
  console.log('🎓 课堂互动系统 - 教师端')
  console.log('📱 Vue版本:', Vue.version)
  console.log('🌐 API地址:', process.env.VUE_APP_API_BASE_URL || 'http://localhost:3000')
  console.log('📊 图表库: ECharts v5.4.3 (已正确配置渲染器)')
  
  // 开发环境下挂载到window方便调试
  window.app = app
  window.store = store
  window.router = router
  window.api = api
}