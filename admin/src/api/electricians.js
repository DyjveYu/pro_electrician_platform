import request from '@/utils/request'

// 获取电工列表
export const getElectricianList = (params) => {
  return request({
    url: '/admin/electricians',
    method: 'get',
    params
  })
}

// 审核电工认证
export const approveElectrician = (id, data) => {
  return request({
    url: `/admin/electricians/${id}/review`,
    method: 'put',
    data: {
      status: 'approved',
      ...data
    }
  })
}

// 驳回电工认证
export const rejectElectrician = (id, data) => {
  return request({
    url: `/admin/electricians/${id}/review`,
    method: 'put',
    data: {
      status: 'rejected',
      reason: data.reason || ''
    }
  })
}

// 获取电工详情
export const getElectricianDetail = (id) => {
  return request({
    url: `/admin/electricians/${id}`,
    method: 'get'
  })
}

// 封禁电工
export const banElectrician = (id) => {
  return request({
    url: `/admin/electricians/${id}/ban`,
    method: 'post'
  })
}

// 解封电工
export const unbanElectrician = (id) => {
  return request({
    url: `/admin/electricians/${id}/unban`,
    method: 'post'
  })
}