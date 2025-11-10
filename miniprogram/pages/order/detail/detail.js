// pages/order/detail/detail.js
const { getOrderStatusText } = require('../../../utils/util');
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
      // 初始化防重复请求标记
      this._firstShowSkipped = false;
      this._fetchingDetail = false;
      this.loadOrderDetail();
    } else {
      wx.showToast({ title: '订单ID不能为空', icon: 'none' });
      setTimeout(() => {
        wx.navigateBack();
      }, 1500);
    }
  },

  onShow() {
    // 页面显示时刷新数据；避免与onLoad的首次显示重复触发
    if (!this._firstShowSkipped) {
      this._firstShowSkipped = true;
      return;
    }
    if (this.data.orderId) {
      this.loadOrderDetail();
    }
  },

  onPullDownRefresh() {
    this.loadOrderDetail();
  },

  // 加载订单详情
  loadOrderDetail() {
    // 避免并发重复请求触发后端限流
    if (this._fetchingDetail) return;
    this._fetchingDetail = true;
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
        this._fetchingDetail = false;
        
        const code = res?.data?.code;
        const ok = code === 0 || code === 200 || res.statusCode === 200 || res?.data?.success === true;
        if (ok) {
          // 兼容后端返回结构：{ data: { order: {...} } }
          const raw = res?.data?.data?.order || res?.data?.data || {};
          const normalizedStatus = raw.status === 'confirmed' ? 'in_progress' : raw.status;
          const order = {
            ...raw,
            // 字段名映射，兼容后端字段
            orderNumber: raw.orderNumber || raw.order_no,
            createTime: raw.createTime || raw.created_at,
            serviceTypeName: raw.serviceTypeName || (raw.serviceType && raw.serviceType.name) || '',
            contactName: raw.contactName || raw.contact_name,
            contactPhone: raw.contactPhone || raw.contact_phone,
            address: raw.address || raw.service_address,
            images: Array.isArray(raw.images) ? raw.images : [],
            workContent: raw.workContent || raw.repair_content || '',
            workImages: Array.isArray(raw.workImages) ? raw.workImages : (Array.isArray(raw.repair_images) ? raw.repair_images : []),
            amount: raw.amount || raw.final_amount || raw.estimated_amount || ''
          };

          this.setData({ 
            order: {
              ...order,
              status: normalizedStatus,
              statusText: getOrderStatusText(normalizedStatus)
            }
          });

          // 如果是完成订单操作，初始化表单数据（使用后端字段）
          if (this.data.action === 'complete') {
            this.setData({
              workContent: order.workContent || '',
              finalAmount: order.amount ? String(order.amount) : ''
            });
          }
        } else {
          wx.showToast({ title: res.data.message || '加载失败', icon: 'none' });
        }
      },
      fail: () => {
        wx.stopPullDownRefresh();
        this.setData({ loading: false });
        this._fetchingDetail = false;
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
      method: 'PUT',
      header: {
        'Authorization': `Bearer ${app.globalData.token}`
      },
      success: (res) => {
        const code = res?.data?.code;
        const ok = code === 0 || code === 200 || res.statusCode === 200 || res?.data?.success === true;
        if (ok) {
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
    
    wx.showModal({
      title: '确认接单',
      content: '确认接下此订单并开始服务？',
      confirmText: '接单',
      success: (res) => {
        if (!res.confirm) return;
        
        wx.showLoading({ title: '接单中...' });
        wx.request({
          url: `${app.globalData.baseUrl}/orders/${this.data.orderId}/take`,
          method: 'POST',
          header: {
            'Authorization': `Bearer ${app.globalData.token}`
          },
          success: (res) => {
            wx.hideLoading();
            const code = res?.data?.code;
            const success = code === 0 || code === 200 || res.statusCode === 200 || res?.data?.success === true;
            if (success) {
              wx.showToast({ title: '接单成功', icon: 'success' });
              this.loadOrderDetail();
            } else {
              wx.showToast({ title: res?.data?.message || '接单失败', icon: 'none' });
            }
          },
          fail: () => {
            wx.hideLoading();
            wx.showToast({ title: '网络错误，请重试', icon: 'none' });
          }
        });
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