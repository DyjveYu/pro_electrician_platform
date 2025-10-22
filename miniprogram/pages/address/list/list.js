// pages/address/list/list.js
Page({
  data: {
    addresses: [],
    loading: false,
    from: '' // 来源页面
  },

  onLoad(options) {
    this.setData({ from: options.from || '' });
    this.loadAddresses();
  },

  onShow() {
    this.loadAddresses();
  },

  // 加载地址列表
  loadAddresses() {
    this.setData({ loading: true });
    
    const app = getApp();
    wx.request({
      url: `${app.globalData.baseUrl}/addresses`,
      method: 'GET',
      header: {
        'Authorization': `Bearer ${app.globalData.token}`
      },
      success: (res) => {
        this.setData({ loading: false });
        if (res.data.code === 0) {
          this.setData({ addresses: res.data.data });
        }
      },
      fail: () => {
        this.setData({ loading: false });
        wx.showToast({ title: '加载失败', icon: 'none' });
      }
    });
  },

  // 选择地址
  selectAddress(e) {
    const address = e.currentTarget.dataset.address;
    
    if (this.data.from === 'order') {
      // 从下单页面来的，返回选中的地址
      const pages = getCurrentPages();
      const prevPage = pages[pages.length - 2];
      if (prevPage) {
        prevPage.setData({ selectedAddress: address });
      }
      wx.navigateBack();
    }
  },

  // 编辑地址
  editAddress(e) {
    const addressId = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/address/edit/edit?id=${addressId}`
    });
  },

  // 添加地址
  addAddress() {
    wx.navigateTo({
      url: '/pages/address/edit/edit'
    });
  },

  // 删除地址
  deleteAddress(e) {
    const addressId = e.currentTarget.dataset.id;
    
    wx.showModal({
      title: '确认删除',
      content: '确定要删除这个地址吗？',
      success: (res) => {
        if (res.confirm) {
          this.performDeleteAddress(addressId);
        }
      }
    });
  },

  // 执行删除地址
  performDeleteAddress(addressId) {
    const app = getApp();
    
    wx.request({
      url: `${app.globalData.baseUrl}/addresses/${addressId}`,
      method: 'DELETE',
      header: {
        'Authorization': `Bearer ${app.globalData.token}`
      },
      success: (res) => {
        if (res.data.code === 0) {
          wx.showToast({ title: '删除成功', icon: 'success' });
          this.loadAddresses();
        } else {
          wx.showToast({ title: res.data.message || '删除失败', icon: 'none' });
        }
      },
      fail: () => {
        wx.showToast({ title: '网络错误', icon: 'none' });
      }
    });
  }
});