import request from '@/utils/request'

// 获取工单列表
export const getOrderList = (params) => {
  return request({
    url: '/admin/orders',
    method: 'get',
    params
  })
}

// 更新工单状态
export const updateOrderStatus = (id, data) => {
  return request({
    url: `/admin/orders/${id}/status`,
    method: 'put',
    data
  })
}

// 获取工单详情
export const getOrderDetail = (id) => {
  return request({
    url: `/admin/orders/${id}`,
    method: 'get'
  })
}

// 获取数据统计
export const getStatistics = (params) => {
  return request({
    url: '/admin/statistics',
    method: 'get',
    params
  })
}