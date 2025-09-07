// frontend/teacher-app/src/api/index.js
import axios from 'axios'
import { Message, Loading } from 'element-ui'

// 创建axios实例
const axiosInstance = axios.create({
  baseURL: process.env.VUE_APP_API_BASE_URL || 'http://localhost:3000',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// 请求计数器，用于全局loading
let requestCount = 0
let loadingInstance = null

// 显示全局loading
function showLoading() {
  if (requestCount === 0) {
    loadingInstance = Loading.service({
      text: '处理中...',
      background: 'rgba(0, 0, 0, 0.7)'
    })
  }
  requestCount++
}

// 隐藏全局loading
function hideLoading() {
  requestCount--
  if (requestCount <= 0) {
    requestCount = 0
    if (loadingInstance) {
      loadingInstance.close()
      loadingInstance = null
    }
  }
}

// 请求拦截器
axiosInstance.interceptors.request.use(
  config => {
    console.log(`🚀 API请求: ${config.method?.toUpperCase()} ${config.url}`)
    
    // 从localStorage获取token
    const token = localStorage.getItem('teacher_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    
    // 对于某些长时间操作显示loading
    if (config.showLoading !== false) {
      showLoading()
    }
    
    return config
  },
  error => {
    console.error('请求错误:', error)
    hideLoading()
    return Promise.reject(error)
  }
)

// 响应拦截器
axiosInstance.interceptors.response.use(
  response => {
    hideLoading()
    
    const res = response.data
    
    // 如果后端返回的success字段为false，视为业务错误
    if (res.success === false) {
      Message.error(res.message || '操作失败')
      return Promise.reject(new Error(res.message || '操作失败'))
    }
    
    return response
  },
  error => {
    hideLoading()
    
    console.error('响应错误:', error)
    
    let message = '网络错误'
    
    if (error.response) {
      const { status, data } = error.response
      
      switch (status) {
        case 400:
          message = data.message || '请求参数错误'
          break
        case 401:
          message = '登录已过期，请重新登录'
          localStorage.removeItem('teacher_token')
          localStorage.removeItem('teacher_user')
          setTimeout(() => {
            window.location.href = '/login'
          }, 1500)
          break
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
          message = data.message || `请求失败 (${status})`
      }
    } else if (error.request) {
      message = '无法连接到服务器，请检查网络'
    } else {
      message = error.message
    }
    
    Message.error(message)
    return Promise.reject(error)
  }
)

// API接口定义
const apiMethods = {
  // 认证相关接口
  auth: {
    login(credentials) {
      return axiosInstance.post('/api/auth/login', credentials)
    },
    
    getCurrentUser() {
      return axiosInstance.get('/api/auth/me')
    },
    
    logout() {
      return axiosInstance.post('/api/auth/logout')
    },
    
    getStudents() {
      return axiosInstance.get('/api/auth/students')
    },
    
    getUserStats() {
      return axiosInstance.get('/api/auth/stats')
    }
  },
  
  // 问题相关接口
  questions: {
    // 🔥 获取问题列表 - 支持筛选参数
    getList(params = {}) {
      console.log('📋 调用问题列表API:', params)
      return axiosInstance.get('/api/questions', { 
        params: {
          page: params.page || 1,
          limit: params.limit || params.pageSize || 20,
          status: params.status,
          categoryId: params.categoryId,
          search: params.search,
          ...params
        }
      })
    },
    
    // 获取问题详情
    getDetail(id) {
      return axiosInstance.get(`/api/questions/${id}`)
    },
    
    // 🔥 删除问题
    delete(id) {
      console.log('🗑️ 调用删除问题API:', id)
      return axiosInstance.delete(`/api/questions/${id}`)
    },
    
    // 获取问题统计
    getStats() {
      return axiosInstance.get('/api/questions/stats/overview')
    },
    
    // 批量更新问题状态
    batchUpdateStatus(questionIds, status) {
      return axiosInstance.patch('/api/questions/batch/status', {
        questionIds,
        status
      })
    }
  },
  
  // 分类相关接口
  classification: {
    // 🔥 获取分类列表
    getCategories() {
      console.log('📂 调用获取分类列表API')
      return axiosInstance.get('/api/categories')
    },
    
    // 🔥 单个问题分类 - 主要方法
    classifyOne(questionId) {
      console.log('🤖 调用单个问题分类API:', questionId)
      return axiosInstance.post(`/api/classification/classify/${questionId}`, {}, {
        showLoading: true
      })
    },
    
    // 批量分类
    classifyAll() {
      console.log('🤖 调用批量分类API')
      return axiosInstance.post('/api/classification/classify-all', {}, {
        timeout: 60000,
        showLoading: true
      })
    },
    
    // 🔥 更新问题分类
    updateCategory(questionId, data) {
      console.log('📝 调用更新分类API:', questionId, data)
      return axiosInstance.put(`/api/classification/classify/${questionId}`, data)
    },
    
    // 获取分类统计
    getStats() {
      console.log('📊 调用分类统计API')
      return axiosInstance.get('/api/classification/stats')
    },
    
    // 获取特定分类下的问题
    getCategoryQuestions(categoryId, params = {}) {
      return axiosInstance.get(`/api/classification/categories/${categoryId}/questions`, {
        params
      })
    },
    
    // 重置分类
    resetClassification(questionIds) {
      return axiosInstance.post('/api/classification/reset', {
        questionIds
      })
    }
  },
  
  // 分类管理接口
  categories: {
    getAll() {
      return axiosInstance.get('/api/categories')
    },
    
    create(categoryData) {
      return axiosInstance.post('/api/categories', categoryData)
    },
    
    update(id, categoryData) {
      return axiosInstance.put(`/api/categories/${id}`, categoryData)
    },
    
    delete(id) {
      return axiosInstance.delete(`/api/categories/${id}`)
    },
    
    // 获取分类统计
    getStats() {
      return axiosInstance.get('/api/categories/stats/summary')
    }
  },
  
  // 🔥 新增：统计相关接口（为Statistics页面准备）
  statistics: {
    // 获取综合统计
    getOverview() {
      return axiosInstance.get('/api/questions/stats/overview')
    },
    
    // 获取活动统计
    getActivity() {
      return axiosInstance.get('/api/questions/stats/activity')
    },
    
    // 获取分类统计
    getCategoryStats() {
      return axiosInstance.get('/api/classification/stats')
    },
    
    // 获取时间趋势
    getTrends(params = {}) {
      return axiosInstance.get('/api/statistics/trends', { params })
    },
    
    // 获取学生活跃度
    getStudentActivity(params = {}) {
      return axiosInstance.get('/api/statistics/students', { params })
    }
  },
  
  // 🔥 新增：数据导出接口
  export: {
    exportQuestions(params = {}) {
      return axiosInstance.get('/api/export/questions', {
        params,
        responseType: 'blob'
      })
    },
    
    exportStats(params = {}) {
      return axiosInstance.get('/api/export/stats', {
        params,
        responseType: 'blob'
      })
    }
  },
  
  // 🔥 新增：批量操作接口
  batch: {
    deleteQuestions(questionIds) {
      return axiosInstance.post('/api/batch/delete-questions', {
        questionIds
      })
    },
    
    classifyQuestions(questionIds, categoryId) {
      return axiosInstance.post('/api/batch/classify-questions', {
        questionIds,
        categoryId
      })
    }
  },
  
  // 工具方法
  utils: {
    async testConnection() {
      try {
        const response = await axiosInstance.get('/')
        return response.data
      } catch (error) {
        throw new Error('API连接测试失败')
      }
    },
    
    async healthCheck() {
      try {
        const response = await axiosInstance.get('/health', { showLoading: false })
        return response.data
      } catch (error) {
        throw new Error('健康检查失败')
      }
    },
    
    uploadFile(file, onProgress) {
      const formData = new FormData()
      formData.append('file', file)
      
      return axiosInstance.post('/api/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: onProgress,
        timeout: 120000
      })
    },
    
    async downloadFile(url, filename) {
      try {
        const response = await axiosInstance.get(url, {
          responseType: 'blob',
          showLoading: true
        })
        
        const blob = new Blob([response.data])
        const downloadUrl = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = downloadUrl
        link.download = filename || 'download'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        window.URL.revokeObjectURL(downloadUrl)
        
        return true
      } catch (error) {
        throw new Error('文件下载失败')
      }
    }
  }
}

// 创建统一的API对象，支持两种调用方式
const api = {
  // 支持 api.auth.login() 调用方式
  ...apiMethods,
  
  // 支持 api.get() 调用方式
  get: axiosInstance.get.bind(axiosInstance),
  post: axiosInstance.post.bind(axiosInstance),
  put: axiosInstance.put.bind(axiosInstance),
  patch: axiosInstance.patch.bind(axiosInstance),
  delete: axiosInstance.delete.bind(axiosInstance),
  
  // 原始axios实例
  instance: axiosInstance,
  
  // 拦截器管理
  interceptors: axiosInstance.interceptors,
  
  // 默认配置
  defaults: axiosInstance.defaults
}

// 导出API
export default api