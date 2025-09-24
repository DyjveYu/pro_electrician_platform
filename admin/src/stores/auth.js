import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { adminLogin, getAdminInfo } from '@/api/auth'

export const useAuthStore = defineStore('auth', () => {
  const token = ref(localStorage.getItem('admin_token') || '')
  const adminInfo = ref(null)
  const loading = ref(false)

  const isLoggedIn = computed(() => !!token.value)

  // 登录
  const login = async (credentials) => {
    loading.value = true
    try {
      const response = await adminLogin(credentials)
      if (response.code === 200) {
        token.value = response.data.token
        adminInfo.value = response.data.admin
        localStorage.setItem('admin_token', token.value)
        return { success: true }
      } else {
        return { success: false, message: response.message }
      }
    } catch (error) {
      return { success: false, message: error.message || '登录失败' }
    } finally {
      loading.value = false
    }
  }

  // 获取管理员信息
  const fetchAdminInfo = async () => {
    if (!token.value) return
    
    try {
      const response = await getAdminInfo()
      if (response.code === 200) {
        adminInfo.value = response.data
      }
    } catch (error) {
      console.error('获取管理员信息失败:', error)
    }
  }

  // 登出
  const logout = () => {
    token.value = ''
    adminInfo.value = null
    localStorage.removeItem('admin_token')
  }

  // 初始化时获取管理员信息
  if (token.value) {
    fetchAdminInfo()
  }

  return {
    token,
    adminInfo,
    loading,
    isLoggedIn,
    login,
    logout,
    fetchAdminInfo
  }
})