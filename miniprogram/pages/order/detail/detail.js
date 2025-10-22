// pages/order/detail/detail.js
Page({
  data: {
    orderId: '',
    order: null,
    loading: true,
    action: '', // complete, pay等操作
    // 完成订单相关
    workContent: '',
    workImages: [],
    finalAmount: '',
    completing: false
  },

  onLoad(options) {
    if (options.id) {
      this.setData({ 
        orderId: options.id,
        action: options.action || ''
      });
      this.loadOrderDetail();
    } else {
      wx.showToast({ title: '订单ID不能为空', icon: 'none' });
      setTimeout(() => {
        wx.navigateBack();
      }, 1500);
    }
  },

  onShow() {
    // 页面显示时刷新数据
    if (this.data.orderId) {
      this.loadOrderDetail();
    }
  },

  onPullDownRefresh() {
    this.loadOrderDetail();
  },

  // 加载订单详情
  loadOrderDetail() {
    const app = getApp();
    
    wx.request({
      url: `${app.globalData.baseUrl}/orders/${this.data.orderId}`,
      method: 'GET',
      header: {
        'Authorization': `Bearer ${app.globalData.token}`
      },
      success: (res) => {
        wx.stopPullDownRefresh();
        this.setData({ loading: false });
        
        if (res.data.code === 0) {
          this.setData({ order: res.data.data });
          
          // 如果是完成订单操作，初始化表单数据
          if (this.data.action === 'complete' && res.data.data.workContent) {
            this.setData({
              workContent: res.data.data.workContent || '',
              finalAmount: res.data.data.amount ? res.data.data.amount.toString() : ''
            });
          }
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

  // 预览图片
  previewImage(e) {
    const current = e.currentTarget.dataset.src;
    const urls = e.currentTarget.dataset.urls;
    wx.previewImage({
      current,
      urls
    });
  },

  // 联系对方
  makePhoneCall(e) {
    const phone = e.currentTarget.dataset.phone;
    wx.makePhoneCall({
      phoneNumber: phone
    });
  },

  // 取消订单
  cancelOrder() {
    const that = this;
    wx.showModal({
      title: '确认取消',
      content: '确定要取消这个订单吗？',
      success(res) {
        if (res.confirm) {
          that.performCancelOrder();
        }
      }
    });
  },

  // 执行取消订单
  performCancelOrder() {
    const app = getApp();
    
    wx.request({
      url: `${app.globalData.baseUrl}/orders/${this.data.orderId}/cancel`,
      method: 'POST',
      header: {
        'Authorization': `Bearer ${app.globalData.token}`
      },
      success: (res) => {
        if (res.data.code === 0) {
          wx.showToast({ title: '订单已取消', icon: 'success' });
          setTimeout(() => {
            wx.navigateBack();
          }, 1500);
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
  acceptOrder() {
    const app = getApp();
    
    wx.request({
      url: `${app.globalData.baseUrl}/orders/${this.data.orderId}/accept`,
      method: 'POST',
      header: {
        'Authorization': `Bearer ${app.globalData.token}`
      },
      success: (res) => {
        if (res.data.code === 0) {
          wx.showToast({ title: '接单成功', icon: 'success' });
          this.loadOrderDetail();
        } else {
          wx.showToast({ title: res.data.message || '接单失败', icon: 'none' });
        }
      },
      fail: () => {
        wx.showToast({ title: '网络错误，请重试', icon: 'none' });
      }
    });
  },

  // 输入维修内容
  onWorkContentInput(e) {
    this.setData({
      workContent: e.detail.value
    });
  },

  // 输入最终金额
  onFinalAmountInput(e) {
    this.setData({
      finalAmount: e.detail.value
    });
  },

  // 选择维修图片
  chooseWorkImage() {
    const that = this;
    wx.chooseImage({
      count: 3 - this.data.workImages.length,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success(res) {
        const tempFilePaths = res.tempFilePaths;
        that.setData({
          workImages: that.data.workImages.concat(tempFilePaths)
        });
      }
    });
  },

  // 删除维修图片
  deleteWorkImage(e) {
    const index = e.currentTarget.dataset.index;
    const workImages = this.data.workImages;
    workImages.splice(index, 1);
    this.setData({ workImages });
  },

  // 完成订单
  completeOrder() {
    if (!this.validateCompleteForm()) return;
    
    if (this.data.completing) return;
    
    this.setData({ completing: true });
    
    const app = getApp();
    const completeData = {
      workContent: this.data.workContent,
      workImages: this.data.workImages,
      finalAmount: parseFloat(this.data.finalAmount)
    };
    
    wx.request({
      url: `${app.globalData.baseUrl}/orders/${this.data.orderId}/complete`,
      method: 'POST',
      header: {
        'Authorization': `Bearer ${app.globalData.token}`
      },
      data: completeData,
      success: (res) => {
        this.setData({ completing: false });
        if (res.data.code === 0) {
          wx.showToast({ title: '订单已完成', icon: 'success' });
          setTimeout(() => {
            wx.navigateBack();
          }, 1500);
        } else {
          wx.showToast({ title: res.data.message || '完成失败', icon: 'none' });
        }
      },
      fail: () => {
        this.setData({ completing: false });
        wx.showToast({ title: '网络错误，请重试', icon: 'none' });
      }
    });
  },

  // 验证完成订单表单
  validateCompleteForm() {
    if (!this.data.workContent.trim()) {
      wx.showToast({ title: '请输入维修内容', icon: 'none' });
      return false;
    }
    if (!this.data.finalAmount || parseFloat(this.data.finalAmount) <= 0) {
      wx.showToast({ title: '请输入正确的金额', icon: 'none' });
      return false;
    }
    return true;
  },

  // 去支付
  goToPay() {
    wx.navigateTo({
      url: `/pages/payment/payment?orderId=${this.data.orderId}`
    });
  },

  // 确认金额（用户）
  confirmAmount() {
    const app = getApp();
    
    wx.request({
      url: `${app.globalData.baseUrl}/orders/${this.data.orderId}/confirm-amount`,
      method: 'POST',
      header: {
        'Authorization': `Bearer ${app.globalData.token}`
      },
      success: (res) => {
        if (res.data.code === 0) {
          wx.showToast({ title: '金额已确认', icon: 'success' });
          this.loadOrderDetail();
        } else {
          wx.showToast({ title: res.data.message || '确认失败', icon: 'none' });
        }
      },
      fail: () => {
        wx.showToast({ title: '网络错误，请重试', icon: 'none' });
      }
    });
  },

  // 格式化时间
  formatTime(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleString();
  }
});