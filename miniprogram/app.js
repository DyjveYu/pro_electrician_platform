// app.js
App({
  globalData: {
    userInfo: null,
    token: null,
    apiBaseUrl: 'http://localhost:3000/api',
    role: 'user', // 默认角色：user 或 electrician
    isElectricianCertified: false,
    certificationStatus: null,
    location: null,
    socketConnected: false
  },
  
  onLaunch: function() {
    // 获取本地存储的用户信息和token
    const token = wx.getStorageSync('token');
    const userInfo = wx.getStorageSync('userInfo');
    const role = wx.getStorageSync('role') || 'user';
    
    if (token) {
      this.globalData.token = token;
      this.globalData.userInfo = userInfo;
      this.globalData.role = role;
      
      // 如果是电工角色，检查认证状态
      if (role === 'electrician') {
        this.checkElectricianStatus();
      }
    }
    
    // 获取位置信息
    this.getLocation();
  },
  
  // 检查电工认证状态
  checkElectricianStatus: function() {
    const that = this;
    wx.request({
      url: `${that.globalData.apiBaseUrl}/electrician/certification-status`,
      method: 'GET',
      header: {
        'Authorization': `Bearer ${that.globalData.token}`
      },
      success: function(res) {
        if (res.data.success && res.data.data) {
          that.globalData.certificationStatus = res.data.data.status;
          that.globalData.isElectricianCertified = res.data.data.status === 'approved';
        }
      }
    });
  },
  
  // 获取位置信息
  getLocation: function() {
    const that = this;
    wx.getLocation({
      type: 'gcj02',
      success: function(res) {
        that.globalData.location = {
          latitude: res.latitude,
          longitude: res.longitude
        };
      },
      fail: function() {
        wx.showToast({
          title: '获取位置信息失败',
          icon: 'none'
        });
      }
    });
  },
  
  // 切换角色
  switchRole: function(role) {
    this.globalData.role = role;
    wx.setStorageSync('role', role);
    
    // 如果切换到电工角色，检查认证状态
    if (role === 'electrician') {
      this.checkElectricianStatus();
    }
    
    // 发布角色切换事件
    wx.getSystemInfo({
      success: function(res) {
        if (res.platform === 'devtools') {
          console.log('角色已切换为:', role);
        }
      }
    });
  },
  
  // 登出
  logout: function() {
    this.globalData.userInfo = null;
    this.globalData.token = null;
    this.globalData.role = 'user';
    this.globalData.isElectricianCertified = false;
    this.globalData.certificationStatus = null;
    
    wx.removeStorageSync('token');
    wx.removeStorageSync('userInfo');
    wx.removeStorageSync('role');
    
    // 跳转到登录页
    wx.reLaunch({
      url: '/pages/login/login'
    });
  }
});