// pages/profile/edit/edit.js
Page({
  data: {
    userInfo: {
      nickname: '',
      avatar: '',
      phone: ''
    },
    uploading: false,
    saving: false
  },

  onLoad() {
    this.loadUserInfo();
  },

  // 加载用户信息
  loadUserInfo() {
    const app = getApp();
    if (app.globalData.userInfo) {
      this.setData({
        userInfo: {
          nickname: app.globalData.userInfo.nickname || '',
          avatar: app.globalData.userInfo.avatar || '',
          phone: app.globalData.userInfo.phone || ''
        }
      });
    }
  },

  // 输入昵称
  onNicknameInput(e) {
    this.setData({
      'userInfo.nickname': e.detail.value
    });
  },

  // 选择头像
  chooseAvatar() {
    const that = this;
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success(res) {
        const tempFilePath = res.tempFilePaths[0];
        that.uploadAvatar(tempFilePath);
      }
    });
  },

  // 上传头像
  uploadAvatar(filePath) {
    this.setData({ uploading: true });
    
    const app = getApp();
    wx.uploadFile({
      url: `${app.globalData.baseUrl}/upload/avatar`,
      filePath: filePath,
      name: 'avatar',
      header: {
        'Authorization': `Bearer ${app.globalData.token}`
      },
      success: (res) => {
        this.setData({ uploading: false });
        const data = JSON.parse(res.data);
        if (data.code === 0) {
          this.setData({
            'userInfo.avatar': data.data.url
          });
          wx.showToast({ title: '头像上传成功', icon: 'success' });
        } else {
          wx.showToast({ title: data.message || '上传失败', icon: 'none' });
        }
      },
      fail: () => {
        this.setData({ uploading: false });
        wx.showToast({ title: '上传失败，请重试', icon: 'none' });
      }
    });
  },

  // 保存用户信息
  saveUserInfo() {
    if (!this.validateForm()) return;
    
    if (this.data.saving) return;
    
    this.setData({ saving: true });
    
    const app = getApp();
    // 准备请求数据，只包含必要字段
    const requestData = {
      nickname: this.data.userInfo.nickname
    };
    
    // 如果有头像，则添加到请求数据中
    if (this.data.userInfo.avatar) {
      requestData.avatar = this.data.userInfo.avatar;
    }
    
    wx.request({
      url: `${app.globalData.baseUrl}/users/profile`,
      method: 'PUT',
      header: {
        'Authorization': `Bearer ${app.globalData.token}`
      },
      data: requestData,
      success: (res) => {
        this.setData({ saving: false });
        if (res.data.code === 0) {
          // 更新全局用户信息
          app.globalData.userInfo = {
            ...app.globalData.userInfo,
            ...this.data.userInfo
          };
          
          wx.showToast({ title: '保存成功', icon: 'success' });
          setTimeout(() => {
            wx.navigateBack();
          }, 1500);
        } else {
          wx.showToast({ title: res.data.message || '保存失败', icon: 'none' });
        }
      },
      fail: () => {
        this.setData({ saving: false });
        wx.showToast({ title: '网络错误，请重试', icon: 'none' });
      }
    });
  },

  // 表单验证
  validateForm() {
    if (!this.data.userInfo.nickname.trim()) {
      wx.showToast({ title: '请输入昵称', icon: 'none' });
      return false;
    }
    return true;
  }
});