// frontend/teacher-app/src/store/index.js
import Vue from 'vue'
import Vuex from 'vuex'
import api from '../api'

Vue.use(Vuex)

export default new Vuex.Store({
  state: {
    // 用户认证相关
    token: localStorage.getItem('teacher_token') || '',
    user: JSON.parse(localStorage.getItem('teacher_user') || 'null'),
    
    // 全局加载状态
    globalLoading: false,
    loadingText: '加载中...',
    
    // 系统通知
    systemNotification: null,
    
    // 问题相关数据
    questions: [],
    questionsPagination: {
      current: 1,
      pageSize: 20,
      total: 0
    },
    questionsLoading: false,
    
    // 问题统计数据
    questionStats: {
      total: 0,
      pending: 0,
      classified: 0
    },
    
    // 分类相关数据
    categories: [],
    categoryStats: [],
    
    // 分类操作状态
    classificationLoading: false,
    classificationProgress: 0,
    
    // 学生列表
    students: [],
    
    // 应用状态
    appTitle: '课堂互动系统',
    appVersion: '1.0.0'
  },
  
  mutations: {
    // 设置Token
    SET_TOKEN(state, token) {
      state.token = token
      if (token) {
        localStorage.setItem('teacher_token', token)
      } else {
        localStorage.removeItem('teacher_token')
      }
    },
    
    // 设置用户信息
    SET_USER(state, user) {
      state.user = user
      if (user) {
        localStorage.setItem('teacher_user', JSON.stringify(user))
      } else {
        localStorage.removeItem('teacher_user')
      }
    },
    
    // 设置全局加载状态
    SET_GLOBAL_LOADING(state, { loading, text = '加载中...' }) {
      state.globalLoading = loading
      state.loadingText = text
    },
    
    // 设置系统通知
    SET_SYSTEM_NOTIFICATION(state, notification) {
      state.systemNotification = notification
    },
    
    // 设置问题列表
    SET_QUESTIONS(state, { questions, pagination }) {
      state.questions = questions
      if (pagination) {
        state.questionsPagination = { ...state.questionsPagination, ...pagination }
      }
    },
    
    // 设置问题加载状态
    SET_QUESTIONS_LOADING(state, loading) {
      state.questionsLoading = loading
    },
    
    // 设置问题统计
    SET_QUESTION_STATS(state, stats) {
      state.questionStats = { ...state.questionStats, ...stats }
    },
    
    // 更新单个问题
    UPDATE_QUESTION(state, updatedQuestion) {
      const index = state.questions.findIndex(q => q.id === updatedQuestion.id)
      if (index !== -1) {
        // 🔥 完全更新问题对象，保留原有数据
        const existingQuestion = state.questions[index]
        Vue.set(state.questions, index, { ...existingQuestion, ...updatedQuestion })
      }
    },
    
    // 删除问题
    REMOVE_QUESTION(state, questionId) {
      state.questions = state.questions.filter(q => q.id !== questionId)
      state.questionsPagination.total = Math.max(0, state.questionsPagination.total - 1)
      
      // 🔥 同时更新统计数据
      state.questionStats.total = Math.max(0, state.questionStats.total - 1)
    },
    
    // 设置分类列表
    SET_CATEGORIES(state, categories) {
      state.categories = categories
    },
    
    // 设置分类统计
    SET_CATEGORY_STATS(state, stats) {
      state.categoryStats = stats
    },
    
    // 设置分类操作状态
    SET_CLASSIFICATION_LOADING(state, loading) {
      state.classificationLoading = loading
    },
    
    // 设置分类进度
    SET_CLASSIFICATION_PROGRESS(state, progress) {
      state.classificationProgress = progress
    },
    
    // 设置学生列表
    SET_STUDENTS(state, students) {
      state.students = students
    },
    
    // 清除所有数据
    CLEAR_ALL_DATA(state) {
      state.token = ''
      state.user = null
      state.questions = []
      state.questionsPagination = { current: 1, pageSize: 20, total: 0 }
      state.questionStats = { total: 0, pending: 0, classified: 0 }
      state.categories = []
      state.categoryStats = []
      state.students = []
      localStorage.removeItem('teacher_token')
      localStorage.removeItem('teacher_user')
    }
  },
  
  actions: {
    // 用户登录
    async login({ commit }, credentials) {
      commit('SET_GLOBAL_LOADING', { loading: true, text: '登录中...' })
      
      try {
        const response = await api.auth.login(credentials)
        const { token, user } = response.data.data || response.data
        
        // 验证用户角色
        if (user.role !== 'teacher') {
          throw new Error('请使用教师账号登录')
        }
        
        // 保存认证信息
        commit('SET_TOKEN', token)
        commit('SET_USER', user)
        
        return { success: true, user }
      } catch (error) {
        commit('CLEAR_ALL_DATA')
        throw error
      } finally {
        commit('SET_GLOBAL_LOADING', { loading: false })
      }
    },
    
    // 用户登出
    async logout({ commit }) {
      commit('SET_GLOBAL_LOADING', { loading: true, text: '退出中...' })
      
      try {
        if (this.state.token) {
          await api.auth.logout()
        }
      } catch (error) {
        console.warn('登出接口调用失败:', error)
      } finally {
        commit('CLEAR_ALL_DATA')
        commit('SET_GLOBAL_LOADING', { loading: false })
      }
    },
    
    // 获取当前用户信息
    async fetchCurrentUser({ commit, state }) {
      if (!state.token) {
        throw new Error('未登录')
      }
      
      try {
        const response = await api.auth.getCurrentUser()
        const user = response.data.data?.user || response.data.user
        
        if (user.role !== 'teacher') {
          throw new Error('权限不足')
        }
        
        commit('SET_USER', user)
        return user
      } catch (error) {
        commit('CLEAR_ALL_DATA')
        throw error
      }
    },
    
    // 获取问题列表
    async fetchQuestions({ commit }, params = {}) {
      commit('SET_QUESTIONS_LOADING', true)
      
      try {
        const response = await api.questions.getList(params)
        const data = response.data.data || response.data
        
        commit('SET_QUESTIONS', { 
          questions: data.questions || [], 
          pagination: data.pagination || {} 
        })
        
        if (data.stats) {
          commit('SET_QUESTION_STATS', data.stats.basic || data.stats)
        }
        
        return data
      } catch (error) {
        console.error('获取问题列表失败:', error)
        throw error
      } finally {
        commit('SET_QUESTIONS_LOADING', false)
      }
    },
    
    // 🔥 改进：单个问题分类
    async classifyQuestion({ commit, dispatch }, questionId) {
      try {
        console.log('🤖 开始分类问题:', questionId)
        
        const response = await api.classification.classifyOne(questionId)
        const data = response.data.data || response.data
        
        // 更新本地问题数据
        const updatedQuestion = {
          id: parseInt(questionId),
          category_id: data.categoryId,
          category_name: data.categoryName,
          status: 'classified'
        }
        
        commit('UPDATE_QUESTION', updatedQuestion)
        
        // 更新统计数据
        const currentStats = this.state.questionStats
        commit('SET_QUESTION_STATS', {
          ...currentStats,
          pending: Math.max(0, currentStats.pending - 1),
          classified: currentStats.classified + 1
        })
        
        console.log('✅ 问题分类成功')
        
        return data
      } catch (error) {
        console.error('❌ 问题分类失败:', error)
        throw error
      }
    },
    
    // 🔥 改进：删除问题
    async deleteQuestion({ commit }, questionId) {
      try {
        console.log('🗑️ 开始删除问题:', questionId)
        
        await api.questions.delete(questionId)
        commit('REMOVE_QUESTION', parseInt(questionId))
        
        console.log('✅ 问题删除成功')
        
        return true
      } catch (error) {
        console.error('❌ 问题删除失败:', error)
        throw error
      }
    },
    
    // 获取分类列表
    async fetchCategories({ commit }) {
      try {
        console.log('🔄 开始获取分类列表...')
        
        const response = await api.classification.getCategories()
        console.log('📋 分类API响应:', response.data)
        
        // 根据后端实际返回结构解析数据
        const categories = response.data.data || response.data.categories || []
        
        console.log('✅ 解析到的分类数据:', categories)
        console.log('📊 分类数量:', categories.length)
        
        commit('SET_CATEGORIES', categories)
        return categories
      } catch (error) {
        console.error('💥 获取分类列表失败:', error)
        commit('SET_CATEGORIES', [])
        throw error
      }
    },
    
    // 获取分类统计
    async fetchCategoryStats({ commit }) {
      try {
        console.log('🔄 开始获取分类统计...')
        
        const response = await api.classification.getStats()
        console.log('📊 分类统计API响应:', response.data)
        
        const { categoryStats } = response.data.data || response.data
        
        // 确保每个分类统计项的percentage是数字类型
        const processedStats = (categoryStats || []).map(stat => ({
          ...stat,
          percentage: Number(stat.percentage) || 0,
          question_count: Number(stat.question_count) || 0
        }))
        
        console.log('✅ 处理后的分类统计:', processedStats)
        
        commit('SET_CATEGORY_STATS', processedStats)
        return processedStats
      } catch (error) {
        console.error('💥 获取分类统计失败:', error)
        commit('SET_CATEGORY_STATS', [])
        throw error
      }
    },
    
    // 批量分类
    async classifyAllQuestions({ commit, dispatch }) {
      commit('SET_CLASSIFICATION_LOADING', true)
      commit('SET_CLASSIFICATION_PROGRESS', 0)
      
      try {
        // 模拟进度更新
        const progressTimer = setInterval(() => {
          commit('SET_CLASSIFICATION_PROGRESS', prev => Math.min(prev + 10, 90))
        }, 200)
        
        const response = await api.classification.classifyAll()
        
        clearInterval(progressTimer)
        commit('SET_CLASSIFICATION_PROGRESS', 100)
        
        // 重新获取问题列表和统计
        await Promise.all([
          dispatch('fetchQuestions'),
          dispatch('fetchCategoryStats')
        ])
        
        setTimeout(() => {
          commit('SET_CLASSIFICATION_PROGRESS', 0)
        }, 1000)
        
        return response.data.data || response.data
      } catch (error) {
        commit('SET_CLASSIFICATION_PROGRESS', 0)
        throw error
      } finally {
        commit('SET_CLASSIFICATION_LOADING', false)
      }
    },
    
    // 手动修改问题分类
    async updateQuestionCategory({ commit }, { questionId, categoryId }) {
      try {
        const response = await api.classification.updateCategory(questionId, { categoryId })
        
        const { questionId: id, categoryId: catId, categoryName } = response.data.data || response.data
        
        // 更新本地问题数据
        const updatedQuestion = {
          id: parseInt(id),
          category_id: catId,
          category_name: categoryName,
          status: 'classified'
        }
        commit('UPDATE_QUESTION', updatedQuestion)
        
        return response.data
      } catch (error) {
        throw error
      }
    },
    
    // 获取学生列表
    async fetchStudents({ commit }) {
      try {
        const response = await api.auth.getStudents()
        const students = response.data.data?.students || response.data.students || []
        
        commit('SET_STUDENTS', students)
        return students
      } catch (error) {
        console.error('获取学生列表失败:', error)
        throw error
      }
    },
    
    // 设置系统通知
    setSystemNotification({ commit }, notification) {
      commit('SET_SYSTEM_NOTIFICATION', notification)
    },
    
    // 设置加载状态
    setLoading({ commit }, payload) {
      commit('SET_GLOBAL_LOADING', payload)
    },
    
    // 应用初始化
    async initializeApp({ dispatch, commit, state }) {
      commit('SET_GLOBAL_LOADING', { loading: true, text: '初始化应用...' })
      
      try {
        if (state.token) {
          try {
            await dispatch('fetchCurrentUser')
            await Promise.all([
              dispatch('fetchCategories'),
              dispatch('fetchQuestions', { page: 1, pageSize: 20 })
            ])
          } catch (error) {
            commit('CLEAR_ALL_DATA')
          }
        }
      } catch (error) {
        console.error('应用初始化失败:', error)
      } finally {
        commit('SET_GLOBAL_LOADING', { loading: false })
      }
    }
  },
  
  getters: {
    // 是否已登录
    isLoggedIn: state => !!state.token && !!state.user,
    
    // 当前用户信息
    currentUser: state => state.user,
    
    // 用户角色
    userRole: state => state.user?.role,
    
    // 是否为教师
    isTeacher: state => state.user?.role === 'teacher',
    
    // 全局加载状态
    globalLoading: state => state.globalLoading,
    loadingText: state => state.loadingText,
    
    // 系统通知
    systemNotification: state => state.systemNotification,
    
    // 问题相关
    questions: state => state.questions,
    questionsPagination: state => state.questionsPagination,
    questionsLoading: state => state.questionsLoading,
    questionStats: state => state.questionStats,
    
    // 分类相关
    categories: state => state.categories,
    categoryStats: state => state.categoryStats,
    classificationLoading: state => state.classificationLoading,
    classificationProgress: state => state.classificationProgress,
    
    // 学生列表
    students: state => state.students,
    
    // 按状态筛选问题
    pendingQuestions: state => state.questions.filter(q => q.status === 'pending'),
    classifiedQuestions: state => state.questions.filter(q => q.status === 'classified'),
    
    // 按分类筛选问题
    questionsByCategory: state => {
      const grouped = {}
      state.questions.forEach(question => {
        const category = question.category_name || '未分类'
        if (!grouped[category]) {
          grouped[category] = []
        }
        grouped[category].push(question)
      })
      return grouped
    },
    
    // 应用信息
    appInfo: state => ({
      title: state.appTitle,
      version: state.appVersion
    })
  },
  
  modules: {
    // 可以在这里添加模块化的store
  }
})