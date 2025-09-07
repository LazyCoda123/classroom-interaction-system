// frontend/student-app/src/store/index.js
import Vue from 'vue'
import Vuex from 'vuex'
import api from '../api'

Vue.use(Vuex)

export default new Vuex.Store({
  state: {
    // 用户认证相关
    token: localStorage.getItem('student_token') || '',
    user: JSON.parse(localStorage.getItem('student_user') || 'null'),
    isLoggedIn: false,
    
    // 问题相关
    currentQuestion: null,
    questionHistory: [],
    
    // 分类相关
    categories: [],
    
    // UI状态
    loading: false,
    error: null
  },

  getters: {
    // 用户认证状态
    isLoggedIn: state => !!state.token && !!state.user,
    currentUser: state => state.user,
    userRole: state => state.user?.role || '',
    
    // 问题相关 - 🔥 添加缺失的 currentQuestion getter
    currentQuestion: state => state.currentQuestion,
    hasQuestion: state => !!state.currentQuestion,
    questionStatus: state => state.currentQuestion?.status || '',
    questionCategory: state => {
      if (!state.currentQuestion || !state.currentQuestion.category_id) return null
      return state.categories.find(cat => cat.id === state.currentQuestion.category_id)
    },
    
    // 分类相关
    categoriesMap: state => {
      const map = {}
      state.categories.forEach(cat => {
        map[cat.id] = cat
      })
      return map
    }
  },

  mutations: {
    // 认证相关
    SET_TOKEN(state, token) {
      state.token = token
      if (token) {
        localStorage.setItem('student_token', token)
      } else {
        localStorage.removeItem('student_token')
      }
    },

    SET_USER(state, user) {
      state.user = user
      state.isLoggedIn = !!user
      if (user) {
        localStorage.setItem('student_user', JSON.stringify(user))
      } else {
        localStorage.removeItem('student_user')
      }
    },

    // 问题相关
    SET_CURRENT_QUESTION(state, question) {
      state.currentQuestion = question
    },

    SET_QUESTION_HISTORY(state, history) {
      state.questionHistory = history
    },

    UPDATE_QUESTION_STATUS(state, { id, status, category_id }) {
      if (state.currentQuestion && state.currentQuestion.id === id) {
        state.currentQuestion.status = status
        if (category_id) {
          state.currentQuestion.category_id = category_id
        }
      }
    },

    // 分类相关
    SET_CATEGORIES(state, categories) {
      state.categories = categories
    },

    // UI状态
    SET_LOADING(state, loading) {
      state.loading = loading
    },

    SET_ERROR(state, error) {
      state.error = error
    },

    CLEAR_ERROR(state) {
      state.error = null
    }
  },

  actions: {
    // 用户登录
    async login({ commit, dispatch }, loginData) {
      try {
        commit('SET_LOADING', true)
        commit('CLEAR_ERROR')

        console.log('🔐 开始登录:', loginData.studentId)
        const response = await api.auth.login(loginData)
        
        if (response.success) {
          const { token, user } = response.data
          
          console.log('✅ 登录成功, Token:', token.substring(0, 20) + '...')
          console.log('👤 用户信息:', user)
          
          commit('SET_TOKEN', token)
          commit('SET_USER', user)
          
          // 登录成功后获取用户的问题
          try {
            console.log('📋 获取用户问题...')
            await dispatch('fetchCurrentQuestion')
          } catch (error) {
            // 获取问题失败不影响登录流程
            console.warn('⚠️ 获取当前问题失败:', error.message)
          }
          
          return response
        } else {
          throw new Error(response.message || '登录失败')
        }
      } catch (error) {
        console.error('❌ 登录失败:', error)
        commit('SET_ERROR', error.message)
        throw error
      } finally {
        commit('SET_LOADING', false)
      }
    },

    // 用户登出
    async logout({ commit }) {
      try {
        // 调用后端登出接口（如果有）
        await api.auth.logout().catch(() => {
          // 忽略登出接口错误，继续清除本地状态
        })
      } finally {
        // 清除本地状态
        commit('SET_TOKEN', '')
        commit('SET_USER', null)
        commit('SET_CURRENT_QUESTION', null)
        commit('SET_QUESTION_HISTORY', [])
        commit('CLEAR_ERROR')
      }
    },

    // 获取当前用户信息
    async fetchCurrentUser({ commit, state }) {
      if (!state.token) return null
      
      try {
        const response = await api.auth.getCurrentUser()
        
        if (response.success) {
          commit('SET_USER', response.data)
          return response.data
        }
      } catch (error) {
        console.error('获取用户信息失败:', error)
        // 如果token失效，清除登录状态
        if (error.message && error.message.includes('token')) {
          commit('SET_TOKEN', '')
          commit('SET_USER', null)
        }
        throw error
      }
    },

    // 提交问题
    async submitQuestion({ commit, dispatch }, questionData) {
      try {
        commit('SET_LOADING', true)
        commit('CLEAR_ERROR')

        console.log('📝 提交问题:', questionData)
        const response = await api.questions.submit(questionData)
        
        if (response.success) {
          console.log('✅ 问题提交成功')
          // 提交成功后重新获取当前问题
          try {
            await dispatch('fetchCurrentQuestion')
          } catch (error) {
            console.warn('获取问题状态失败:', error)
          }
          return response
        } else {
          throw new Error(response.message || '提交问题失败')
        }
      } catch (error) {
        console.error('❌ 提交问题失败:', error)
        commit('SET_ERROR', error.message)
        throw error
      } finally {
        commit('SET_LOADING', false)
      }
    },

    // 获取当前学生的问题 - 🔥 重点修复这个action
    async fetchCurrentQuestion({ commit, state }) {
      try {
        // 检查是否有token
        if (!state.token) {
          console.warn('⚠️ 没有token，无法获取问题')
          commit('SET_CURRENT_QUESTION', null)
          return null
        }

        console.log('📋 获取当前问题, Token存在:', !!state.token)
        const response = await api.questions.getMine()
        
        if (response.success) {
          console.log('✅ 获取问题成功:', response.data)
          commit('SET_CURRENT_QUESTION', response.data)
          return response.data
        } else {
          console.log('ℹ️ 当前没有问题')
          commit('SET_CURRENT_QUESTION', null)
          return null
        }
      } catch (error) {
        console.error('❌ 获取问题失败:', error)
        
        // 403 错误特殊处理
        if (error.response && error.response.status === 403) {
          console.error('🚫 权限被拒绝，可能token失效')
          commit('SET_TOKEN', '')
          commit('SET_USER', null)
        }
        
        commit('SET_CURRENT_QUESTION', null)
        // 重新包装错误以提供更好的错误信息
        const wrappedError = new Error('获取问题失败: ' + (error.message || '未知错误'))
        wrappedError.originalError = error
        throw wrappedError
      }
    },

    // 更新问题
    async updateQuestion({ commit, dispatch }, { id, data }) {
      try {
        commit('SET_LOADING', true)
        commit('CLEAR_ERROR')

        const response = await api.questions.update(id, data)
        
        if (response.success) {
          // 更新成功后重新获取问题
          try {
            await dispatch('fetchCurrentQuestion')
          } catch (error) {
            console.warn('获取问题状态失败:', error)
          }
          return response
        } else {
          throw new Error(response.message || '更新问题失败')
        }
      } catch (error) {
        commit('SET_ERROR', error.message)
        throw error
      } finally {
        commit('SET_LOADING', false)
      }
    },

    // 删除问题
    // 删除问题 - 🔥 修复为调用学生专用的删除API
async deleteQuestion({ commit }) {
    try {
      commit('SET_LOADING', true)
      commit('CLEAR_ERROR')
  
      console.log('🗑️ 开始删除学生问题')
      
      // 🔥 改为调用学生专用的删除API
      const response = await api.questions.deleteMine()
      
      if (response.success) {
        console.log('✅ 问题删除成功')
        
        // 删除成功后清除当前问题
        commit('SET_CURRENT_QUESTION', null)
        return response
      } else {
        throw new Error(response.message || '删除问题失败')
      }
    } catch (error) {
      console.error('❌ 删除问题失败:', error)
      commit('SET_ERROR', error.message)
      throw error
    } finally {
      commit('SET_LOADING', false)
    }
  },

    // 获取所有分类
    async fetchCategories({ commit }) {
      try {
        const response = await api.categories.getAll()
        
        if (response.success) {
          commit('SET_CATEGORIES', response.data)
          return response.data
        } else {
          commit('SET_CATEGORIES', [])
          return []
        }
      } catch (error) {
        console.error('获取分类失败:', error)
        commit('SET_CATEGORIES', [])
        throw error
      }
    },

    // 清除错误状态
    clearError({ commit }) {
      commit('CLEAR_ERROR')
    },

    // 初始化应用数据
    async initializeApp({ dispatch, commit, state }) {
      try {
        console.log('🚀 初始化应用...')
        
        // 如果有token，验证用户状态
        if (state.token) {
          try {
            console.log('🔐 验证token有效性...')
            await dispatch('fetchCurrentUser')
            await dispatch('fetchCurrentQuestion')
            console.log('✅ 用户状态验证成功')
          } catch (error) {
            console.warn('⚠️ 用户状态验证失败:', error.message)
            // 如果验证失败，清除可能无效的认证状态
            if (error.message && error.message.includes('token')) {
              commit('SET_TOKEN', '')
              commit('SET_USER', null)
            }
          }
        }
        
        // 获取分类数据
        try {
          await dispatch('fetchCategories')
        } catch (error) {
          console.warn('获取分类数据失败:', error)
        }
        
      } catch (error) {
        console.error('应用初始化失败:', error)
      }
    }
  },

  modules: {
    // 可以在这里添加模块化的store
  }
})