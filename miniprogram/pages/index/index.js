// pages/index/index.js
const app = getApp();
const { SystemAPI, OrderAPI, AuthAPI } = require('../../utils/api');
const { formatTime, formatDistance, getOrderStatusText } = require('../../utils/util');

Page({
  data: {
    userInfo: null,
    locationText: '北京市朝阳区',
    recentOrders: [
      {
        id: 1,
        title: '客厅灯具安装',
        status: 'completed',
        statusText: '已完成',
        electrician_name: '张师傅',
        created_at: '2024-01-15 14:30',
        createdTime: '2024-01-15 14:30',
        rating: 5,
        final_price: 120
      },
      {
        id: 2,
        title: '厨房插座维修',
        status: 'completed',
        statusText: '已完成',
        electrician_name: '李师傅',
        created_at: '2024-01-12 09:15',
        createdTime: '2024-01-12 09:15',
        rating: 4.8,
        final_price: 80
      },
      {
        id: 3,
        title: '卫生间照明修理',
        status: 'completed',
        statusText: '已完成',
        electrician_name: '王师傅',
        created_at: '2024-01-10 16:20',
        createdTime: '2024-01-10 16:20',
        rating: 4.9,
        final_price: 95
      }
    ]
  },

  onLoad() {
    console.log('首页加载');
  },

  onShow() {
    console.log('首页显示');
  },

  onPullDownRefresh() {
    wx.stopPullDownRefresh();
  },



  /**
   * 位置点击
   */
  onLocationTap() {
    console.log('位置点击');
  },

  /**
   * 创建工单
   */
  createOrder() {
    wx.navigateTo({
      url: '/pages/order/create/create'
    });
  },

  /**
   * 查看所有工单
   */
  viewAllOrders() {
    wx.switchTab({
      url: '/pages/order/list/list'
    });
  },

  /**
   * 查看工单详情
   */
  viewOrderDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/order/detail/detail?id=${id}`
    });
  }
});