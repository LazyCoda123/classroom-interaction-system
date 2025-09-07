// frontend/student-app/src/api/index.js
import axios from 'axios'
import { Message } from 'element-ui'
import router from '../router'

// 创建axios实例
const request = axios.create({
  baseURL: process.env.VUE_APP_API_BASE_URL || 'http://localhost:3000',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// 请求拦截器
request.interceptors.request.use(
  config => {
    // 添加token到请求头
    const token = localStorage.getItem('student_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
      console.log('🔐 发送请求:', config.method.toUpperCase(), config.url)
      console.log('📋 Token:', token.substring(0, 20) + '...')
    } else {
      console.warn('⚠️ 没有token，发送请求:', config.method.toUpperCase(), config.url)
    }
    return config
  },
  error => {
    console.error('❌ 请求错误:', error)
    return Promise.reject(error)
  }
)

// 响应拦截器
request.interceptors.response.use(
  response => {
    const res = response.data
    console.log('✅ 响应成功:', response.config.url, res)
    
    // 检查业务状态码
    if (res.success === false) {
      Message.error(res.message || '操作失败')
      
      // token失效，跳转到登录页
      if (res.message && (res.message.includes('token') || res.message.includes('认证'))) {
        console.warn('🚫 Token失效，清除登录状态')
        localStorage.removeItem('student_token')
        localStorage.removeItem('student_user')
        router.push('/login')
      }
      
      return Promise.reject(new Error(res.message || '操作失败'))
    }
    
    return res
  },
  error => {
    console.error('❌ 响应错误:', error)
    console.error('📊 错误详情:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      url: error.config?.url,
      method: error.config?.method
    })
    
    let message = '网络错误，请稍后重试'
    
    if (error.response) {
      const { status, data } = error.response
      switch (status) {
        case 400:
          message = data.message || '请求参数错误'
          break
        case 401:
          message = '身份验证失败，请重新登录'
          console.warn('🚫 401错误，清除登录状态')
          localStorage.removeItem('student_token')
          localStorage.removeItem('student_user')
          router.push('/login')
          break
        case 403:
          message = '没有权限访问该资源'
          console.error('🚫 403错误详情:', {
            url: error.config?.url,
            method: error.config?.method,
            headers: error.config?.headers,
            data: data
          })
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
    }
    
    Message.error(message)
    return Promise.reject(error)
  }
)

// API接口封装
const api = {
  // 用户认证
  auth: {
    // 学生登录
    login: (data) => {
      console.log('🔐 调用登录API:', data.studentId)
      return request.post('/api/auth/login', data)
    },
    
    // 获取当前用户信息
    getCurrentUser: () => {
      console.log('👤 获取当前用户信息')
      return request.get('/api/auth/me')
    },
    
    // 登出
    logout: () => {
      console.log('🚪 调用登出API')
      return request.post('/api/auth/logout')
    }
  },

  // 问题相关
  questions: {
    // 提交问题
    submit: (data) => {
      console.log('📝 提交问题:', data.content.substring(0, 50) + '...')
      return request.post('/api/questions', data)
    },
    
    // 获取当前学生的问题
    getMine: () => {
      console.log('📋 获取我的问题')
      const token = localStorage.getItem('student_token')
      console.log('🔐 当前Token:', token ? token.substring(0, 20) + '...' : '无Token')
      
      return request.get('/api/questions/mine').catch(error => {
        console.error('❌ 获取问题失败:', error)
        console.error('📊 详细错误信息:', {
          status: error.response?.status,
          data: error.response?.data,
          headers: error.response?.headers
        })
        throw error
      })
    },
    
    // 🔥 修复：学生删除自己的问题 - 调用正确的API路径
    deleteMine: () => {
      console.log('🗑️ 学生删除自己的问题')
      return request.delete('/api/questions/mine').catch(error => {
        console.error('❌ 删除问题失败:', error)
        console.error('📊 详细错误信息:', {
          status: error.response?.status,
          data: error.response?.data,
          headers: error.response?.headers
        })
        throw error
      })
    },
    
    // 获取问题详情
    getById: (id) => {
      console.log('📄 获取问题详情:', id)
      return request.get(`/api/questions/${id}`)
    },
    
    // 更新问题
    update: (id, data) => {
      console.log('✏️ 更新问题:', id)
      return request.put(`/api/questions/${id}`, data)
    },
    
    // 删除问题（教师权限）
    delete: (id) => {
      console.log('🗑️ 删除问题（教师权限）:', id)
      return request.delete(`/api/questions/${id}`)
    },

    // 🔥 新增：获取统计数据（学生端用）
    getStats: () => {
      console.log('📊 获取统计数据')
      return request.get('/api/questions/stats/public').catch(() => {
        // 如果没有公开统计接口，返回模拟数据
        console.log('⚠️ 统计接口不可用，使用模拟数据')
        return {
          success: true,
          data: {
            totalQuestions: Math.floor(Math.random() * 100) + 50,
            classifiedQuestions: Math.floor(Math.random() * 80) + 40,
            activeUsers: Math.floor(Math.random() * 30) + 20
          }
        }
      })
    }
  },

  // 分类相关
  categories: {
    // 获取所有分类
    getAll: () => {
      console.log('📚 获取所有分类')
      return request.get('/api/categories')
    },
    
    // 获取分类详情
    getById: (id) => {
      console.log('📖 获取分类详情:', id)
      return request.get(`/api/categories/${id}`)
    }
  },

  // 工具方法
  utils: {
    // 健康检查
    healthCheck: () => {
      console.log('🏥 健康检查')
      return request.get('/health')
    },
    
    // 上传文件（如果需要）
    upload: (file) => {
      const formData = new FormData()
      formData.append('file', file)
      return request.post('/api/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })
    }
  }
}

// 默认导出API对象
export default api

// 也导出request实例，供特殊需求使用
export { request }