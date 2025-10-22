// pages/order/create/create.js
Page({
  data: {
    serviceTypes: [
      { id: 1, name: '电路维修', icon: '🔌' },
      { id: 2, name: '开关插座', icon: '🔘' },
      { id: 3, name: '灯具安装', icon: '💡' },
      { id: 4, name: '电器维修', icon: '🔧' },
      { id: 5, name: '其他电工服务', icon: '⚡' }
    ],
    selectedServiceType: null,
    description: '',
    images: [],
    selectedAddress: null,
    contactName: '',
    contactPhone: '',
    submitting: false
  },

  onLoad(options) {
    // 获取用户信息
    this.getUserInfo();
    // 获取默认地址
    this.getDefaultAddress();
  },

  // 获取用户信息
  getUserInfo() {
    const app = getApp();
    if (app.globalData.userInfo) {
      this.setData({
        contactName: app.globalData.userInfo.nickname || '',
        contactPhone: app.globalData.userInfo.phone || ''
      });
    }
  },

  // 获取默认地址
  getDefaultAddress() {
    // TODO: 调用API获取用户默认地址
    console.log('获取默认地址');
  },

  // 选择服务类型
  selectServiceType(e) {
    const index = e.currentTarget.dataset.index;
    this.setData({
      selectedServiceType: this.data.serviceTypes[index]
    });
  },

  // 输入问题描述
  onDescriptionInput(e) {
    this.setData({
      description: e.detail.value
    });
  },

  // 选择图片
  chooseImage() {
    const that = this;
    wx.chooseImage({
      count: 3 - this.data.images.length,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success(res) {
        const tempFilePaths = res.tempFilePaths;
        that.setData({
          images: that.data.images.concat(tempFilePaths)
        });
      }
    });
  },

  // 删除图片
  deleteImage(e) {
    const index = e.currentTarget.dataset.index;
    const images = this.data.images;
    images.splice(index, 1);
    this.setData({ images });
  },

  // 预览图片
  previewImage(e) {
    const index = e.currentTarget.dataset.index;
    wx.previewImage({
      current: this.data.images[index],
      urls: this.data.images
    });
  },

  // 选择地址
  selectAddress() {
    wx.navigateTo({
      url: '/pages/address/list/list?from=order'
    });
  },

  // 输入联系人
  onContactNameInput(e) {
    this.setData({
      contactName: e.detail.value
    });
  },

  // 输入联系电话
  onContactPhoneInput(e) {
    this.setData({
      contactPhone: e.detail.value
    });
  },

  // 表单验证
  validateForm() {
    if (!this.data.selectedServiceType) {
      wx.showToast({ title: '请选择服务类型', icon: 'none' });
      return false;
    }
    if (!this.data.description.trim()) {
      wx.showToast({ title: '请描述问题详情', icon: 'none' });
      return false;
    }
    if (!this.data.selectedAddress) {
      wx.showToast({ title: '请选择服务地址', icon: 'none' });
      return false;
    }
    if (!this.data.contactName.trim()) {
      wx.showToast({ title: '请输入联系人', icon: 'none' });
      return false;
    }
    if (!this.data.contactPhone.trim()) {
      wx.showToast({ title: '请输入联系电话', icon: 'none' });
      return false;
    }
    // 验证手机号格式
    const phoneReg = /^1[3-9]\d{9}$/;
    if (!phoneReg.test(this.data.contactPhone)) {
      wx.showToast({ title: '请输入正确的手机号', icon: 'none' });
      return false;
    }
    return true;
  },

  // 提交订单
  submitOrder() {
    if (!this.validateForm()) return;
    
    if (this.data.submitting) return;
    
    this.setData({ submitting: true });
    
    const app = getApp();
    const orderData = {
      serviceTypeId: this.data.selectedServiceType.id,
      serviceTypeName: this.data.selectedServiceType.name,
      description: this.data.description,
      images: this.data.images,
      addressId: this.data.selectedAddress.id,
      address: this.data.selectedAddress.fullAddress,
      contactName: this.data.contactName,
      contactPhone: this.data.contactPhone
    };
    
    // TODO: 调用创建订单API
    wx.request({
      url: `${app.globalData.baseUrl}/orders`,
      method: 'POST',
      header: {
        'Authorization': `Bearer ${app.globalData.token}`
      },
      data: orderData,
      success: (res) => {
        this.setData({ submitting: false });
        if (res.data.code === 0) {
          wx.showToast({ title: '订单提交成功', icon: 'success' });
          setTimeout(() => {
            wx.navigateBack();
          }, 1500);
        } else {
          wx.showToast({ title: res.data.message || '提交失败', icon: 'none' });
        }
      },
      fail: () => {
        this.setData({ submitting: false });
        wx.showToast({ title: '网络错误，请重试', icon: 'none' });
      }
    });
  }
});