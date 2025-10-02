// app.js
App({
  globalData: {
    userInfo: null,
    token: '',
    role: 'user', // 默认角色：普通用户
    apiBaseUrl: 'https://api.electrician-platform.com/api/v1',
    socketUrl: 'wss://socket.electrician-platform.com',
    version: '1.0.0',
    location: null,
    systemInfo: null
  },
  
  onLaunch: function() {
    // 获取系统信息
    this.getSystemInfo();
    
    // 检查登录状态
    this.checkLoginStatus();
    
    // 获取位置信息
    this.getLocation();
  },
  
  // 获取系统信息
  getSystemInfo: function() {
    try {
      const systemInfo = wx.getSystemInfoSync();
      this.globalData.systemInfo = systemInfo;
      console.log('系统信息:', systemInfo);
    } catch (e) {
      console.error('获取系统信息失败:', e);
    }
  },
  
  // 检查登录状态
  checkLoginStatus: function() {
    const token = wx.getStorageSync('token');
    const userInfo = wx.getStorageSync('userInfo');
    const role = wx.getStorageSync('role');
    
    if (token && userInfo) {
      this.globalData.token = token;
      this.globalData.userInfo = userInfo;
      if (role) {
        this.globalData.role = role;
      }
      console.log('用户已登录:', userInfo);
    } else {
      console.log('用户未登录');
    }
  },
  
  // 获取位置信息
  getLocation: function() {
    wx.getLocation({
      type: 'gcj02',
      success: (res) => {
        this.globalData.location = {
          latitude: res.latitude,
          longitude: res.longitude
        };
        console.log('位置信息:', this.globalData.location);
      },
      fail: (err) => {
        console.error('获取位置失败:', err);
      }
    });
  },
  
  // 登录方法
  login: function(userInfo, callback) {
    // 保存用户信息
    this.globalData.userInfo = userInfo;
    wx.setStorageSync('userInfo', userInfo);
    
    // 保存token
    if (userInfo.token) {
      this.globalData.token = userInfo.token;
      wx.setStorageSync('token', userInfo.token);
    }
    
    // 保存角色
    if (userInfo.role) {
      this.globalData.role = userInfo.role;
      wx.setStorageSync('role', userInfo.role);
    }
    
    if (callback && typeof callback === 'function') {
      callback(userInfo);
    }
  },
  
  // 退出登录
  logout: function(callback) {
    // 清除本地存储
    wx.removeStorageSync('token');
    wx.removeStorageSync('userInfo');
    wx.removeStorageSync('role');
    
    // 重置全局数据
    this.globalData.userInfo = null;
    this.globalData.token = '';
    this.globalData.role = 'user';
    
    if (callback && typeof callback === 'function') {
      callback();
    }
  },
  
  // 切换角色
  switchRole: function(role, callback) {
    if (role === 'user' || role === 'electrician') {
      this.globalData.role = role;
      wx.setStorageSync('role', role);
      
      if (callback && typeof callback === 'function') {
        callback(role);
      }
    }
  }
});