// pages/message/detail/detail.js
Page({
  data: {
    messageId: '',
    message: null,
    loading: true
  },

  onLoad(options) {
    if (options.id) {
      this.setData({ messageId: options.id });
      this.loadMessageDetail();
    }
  },

  // 加载消息详情
  loadMessageDetail() {
    const app = getApp();
    
    wx.request({
      url: `${app.globalData.baseUrl}/messages/${this.data.messageId}`,
      method: 'GET',
      header: {
        'Authorization': `Bearer ${app.globalData.token}`
      },
      success: (res) => {
        this.setData({ loading: false });
        if (res.data.code === 0) {
          this.setData({ message: res.data.data });
          // 标记为已读
          this.markAsRead();
        }
      },
      fail: () => {
        this.setData({ loading: false });
        wx.showToast({ title: '加载失败', icon: 'none' });
      }
    });
  },

  // 标记为已读
  markAsRead() {
    const app = getApp();
    
    wx.request({
      url: `${app.globalData.baseUrl}/messages/${this.data.messageId}/read`,
      method: 'POST',
      header: {
        'Authorization': `Bearer ${app.globalData.token}`
      }
    });
  }
});