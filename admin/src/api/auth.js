import request from '@/utils/request'

// 管理员登录
export const adminLogin = (data) => {
  return request({
    url: '/admin/auth/login',
    method: 'post',
    data
  })
}

// 获取管理员信息
export const getAdminInfo = () => {
  return request({
    url: '/admin/auth/info',
    method: 'get'
  })
}

// 管理员登出
export const adminLogout = () => {
  return request({
    url: '/admin/auth/logout',
    method: 'post'
  })
}