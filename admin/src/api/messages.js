import request from '@/utils/request'

// 获取系统通知列表
export function getMessages(params) {
  return request({
    url: '/admin/messages',
    method: 'get',
    params
  })
}

// 获取通知详情
export function getMessageDetail(id) {
  return request({
    url: `/admin/messages/${id}`,
    method: 'get'
  })
}

// 创建通知
export function createMessage(data) {
  return request({
    url: '/admin/messages',
    method: 'post',
    data
  })
}

// 更新通知
export function updateMessage(id, data) {
  return request({
    url: `/admin/messages/${id}`,
    method: 'put',
    data
  })
}

// 删除通知
export function deleteMessage(id) {
  return request({
    url: `/admin/messages/${id}`,
    method: 'delete'
  })
}

// 发布通知
export function publishMessage(id) {
  return request({
    url: `/admin/messages/${id}/publish`,
    method: 'post'
  })
}

// 撤回通知
export function revokeMessage(id) {
  return request({
    url: `/admin/messages/${id}/revoke`,
    method: 'post'
  })
}