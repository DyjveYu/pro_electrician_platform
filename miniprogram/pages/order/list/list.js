// pages/order/list/list.js
Page({
  data: {
    currentTab: 0,
    tabs: [
      { name: '待接单', status: 'pending' },
      { name: '进行中', status: 'in_progress' },
      { name: '待支付', status: 'pending_payment' },
      { name: '已完成', status: 'completed' }
    ],
    orders: [],
    loading: false,
    hasMore: true,
    page: 1,
    pageSize: 10
  },

  onLoad(options) {
    // 如果从其他页面传入tab参数
    if (options.tab) {
      const tabIndex = parseInt(options.tab);
      if (tabIndex >= 0 && tabIndex < this.data.tabs.length) {
        this.setData({ currentTab: tabIndex });
      }
    }
    this.loadOrders();
  },

  onShow() {
    // 页面显示时刷新数据
    this.refreshOrders();
  },

  onPullDownRefresh() {
    this.refreshOrders();
  },

  onReachBottom() {
    if (this.data.hasMore && !this.data.loading) {
      this.loadMoreOrders();
    }
  },

  // 切换Tab
  switchTab(e) {
    const index = e.currentTarget.dataset.index;
    if (index !== this.data.currentTab) {
      this.setData({
        currentTab: index,
        orders: [],
        page: 1,
        hasMore: true
      });
      this.loadOrders();
    }
  },

  // 刷新订单列表
  refreshOrders() {
    this.setData({
      orders: [],
      page: 1,
      hasMore: true
    });
    this.loadOrders();
  },

  // 加载订单列表
  loadOrders() {
    if (this.data.loading) return;
    
    this.setData({ loading: true });
    
    const app = getApp();
    const currentStatus = this.data.tabs[this.data.currentTab].status;
    
    wx.request({
      url: `${app.globalData.baseUrl}/orders`,
      method: 'GET',
      header: {
        'Authorization': `Bearer ${app.globalData.token}`
      },
      data: {
        status: currentStatus,
        page: this.data.page,
        pageSize: this.data.pageSize,
        role: app.globalData.currentRole
      },
      success: (res) => {
        wx.stopPullDownRefresh();
        this.setData({ loading: false });
        
        if (res.data.code === 0 || res.data.code === 200) {
          const newOrders = res.data.data.list || [];
          this.setData({
            orders: this.data.page === 1 ? newOrders : this.data.orders.concat(newOrders),
            hasMore: newOrders.length === this.data.pageSize
          });
        } else {
          wx.showToast({ title: res.data.message || '加载失败', icon: 'none' });
        }
      },
      fail: () => {
        wx.stopPullDownRefresh();
        this.setData({ loading: false });
        wx.showToast({ title: '网络错误，请重试', icon: 'none' });
      }
    });
  },

  // 加载更多订单
  loadMoreOrders() {
    this.setData({ page: this.data.page + 1 });
    this.loadOrders();
  },

  // 查看订单详情
  viewOrderDetail(e) {
    const orderId = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/order/detail/detail?id=${orderId}`
    });
  },

  // 取消订单
  cancelOrder(e) {
    const orderId = e.currentTarget.dataset.id;
    const that = this;
    
    wx.showModal({
      title: '确认取消',
      content: '确定要取消这个订单吗？',
      success(res) {
        if (res.confirm) {
          that.performCancelOrder(orderId);
        }
      }
    });
  },

  // 执行取消订单
  performCancelOrder(orderId) {
    const app = getApp();
    
    wx.request({
      url: `${app.globalData.baseUrl}/orders/${orderId}/cancel`,
      method: 'POST',
      header: {
        'Authorization': `Bearer ${app.globalData.token}`
      },
      success: (res) => {
        if (res.data.code === 0) {
          wx.showToast({ title: '订单已取消', icon: 'success' });
          this.refreshOrders();
        } else {
          wx.showToast({ title: res.data.message || '取消失败', icon: 'none' });
        }
      },
      fail: () => {
        wx.showToast({ title: '网络错误，请重试', icon: 'none' });
      }
    });
  },

  // 接单（电工）
  acceptOrder(e) {
    const orderId = e.currentTarget.dataset.id;
    const app = getApp();
    
    wx.request({
      url: `${app.globalData.baseUrl}/orders/${orderId}/accept`,
      method: 'POST',
      header: {
        'Authorization': `Bearer ${app.globalData.token}`
      },
      success: (res) => {
        if (res.data.code === 0) {
          wx.showToast({ title: '接单成功', icon: 'success' });
          this.refreshOrders();
        } else {
          wx.showToast({ title: res.data.message || '接单失败', icon: 'none' });
        }
      },
      fail: () => {
        wx.showToast({ title: '网络错误，请重试', icon: 'none' });
      }
    });
  },

  // 完成订单（电工）
  completeOrder(e) {
    const orderId = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/order/detail/detail?id=${orderId}&action=complete`
    });
  },

  // 去支付（用户）
  goToPay(e) {
    const orderId = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/payment/payment?orderId=${orderId}`
    });
  },

  // 联系对方
  contactUser(e) {
    const phone = e.currentTarget.dataset.phone;
    wx.makePhoneCall({
      phoneNumber: phone
    });
  },

  // 格式化时间
  formatTime(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) {
      return '刚刚';
    } else if (diff < 3600000) {
      return Math.floor(diff / 60000) + '分钟前';
    } else if (diff < 86400000) {
      return Math.floor(diff / 3600000) + '小时前';
    } else {
      return date.toLocaleDateString();
    }
  }
});