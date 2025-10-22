// pages/payment/payment/payment.js
Page({
  data: {
    orderId: '',
    order: null,
    paymentMethods: [
      { id: 'wechat', name: '微信支付', icon: '💚', desc: '推荐使用' },
      { id: 'alipay', name: '支付宝', icon: '🔵', desc: '快速支付' }
    ],
    selectedMethod: 'wechat',
    paying: false
  },

  onLoad(options) {
    if (options.orderId) {
      this.setData({ orderId: options.orderId });
      this.loadOrderInfo();
    }
  },

  // 加载订单信息
  loadOrderInfo() {
    const app = getApp();
    wx.request({
      url: `${app.globalData.baseUrl}/orders/${this.data.orderId}`,
      method: 'GET',
      header: {
        'Authorization': `Bearer ${app.globalData.token}`
      },
      success: (res) => {
        if (res.data.code === 0) {
          this.setData({ order: res.data.data });
        }
      }
    });
  },

  // 选择支付方式
  selectPaymentMethod(e) {
    const methodId = e.currentTarget.dataset.method;
    this.setData({ selectedMethod: methodId });
  },

  // 发起支付
  startPayment() {
    if (this.data.paying) return;
    
    this.setData({ paying: true });
    
    const app = getApp();
    wx.request({
      url: `${app.globalData.baseUrl}/payments/create`,
      method: 'POST',
      header: {
        'Authorization': `Bearer ${app.globalData.token}`
      },
      data: {
        orderId: this.data.orderId,
        paymentMethod: this.data.selectedMethod
      },
      success: (res) => {
        this.setData({ paying: false });
        if (res.data.code === 0) {
          this.processPayment(res.data.data);
        } else {
          wx.showToast({ title: res.data.message || '支付失败', icon: 'none' });
        }
      },
      fail: () => {
        this.setData({ paying: false });
        wx.showToast({ title: '网络错误', icon: 'none' });
      }
    });
  },

  // 处理支付
  processPayment(paymentData) {
    if (this.data.selectedMethod === 'wechat') {
      // 微信支付
      wx.requestPayment({
        timeStamp: paymentData.timeStamp,
        nonceStr: paymentData.nonceStr,
        package: paymentData.package,
        signType: paymentData.signType,
        paySign: paymentData.paySign,
        success: () => {
          this.paymentSuccess();
        },
        fail: () => {
          wx.showToast({ title: '支付取消', icon: 'none' });
        }
      });
    } else {
      // 其他支付方式
      wx.showToast({ title: '支付方式暂未开放', icon: 'none' });
    }
  },

  // 支付成功
  paymentSuccess() {
    wx.redirectTo({
      url: `/pages/payment/result/result?orderId=${this.data.orderId}&status=success`
    });
  }
});