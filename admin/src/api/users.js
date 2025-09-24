import request from '@/utils/request'

// 获取用户列表
export const getUserList = (params) => {
  return request({
    url: '/admin/users',
    method: 'get',
    params
  })
}

// 封禁用户
export const banUser = (id) => {
  return request({
    url: `/admin/users/${id}/ban`,
    method: 'post'
  })
}

// 解封用户
export const unbanUser = (id) => {
  return request({
    url: `/admin/users/${id}/unban`,
    method: 'post'
  })
}

// 获取用户详情
export const getUserDetail = (id) => {
  return request({
    url: `/admin/users/${id}`,
    method: 'get'
  })
}