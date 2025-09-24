// app.js
App({
  globalData: {
    userInfo: null,
    token: null,
    baseUrl: 'http://localhost:3000/api', // 开发环境API地址
    isLogin: false,
    currentRole: 'user', // user | electrician
    systemInfo: null,
    location: null
  },

  onLaunch() {
    console.log('小程序启动');
    
    // 获取系统信息
    this.getSystemInfo();
    
    // 检查登录状态
    this.checkLoginStatus();
    
    // 获取位置权限
    this.getLocationPermission();
  },

  onShow() {
    console.log('小程序显示');
  },

  onHide() {
    console.log('小程序隐藏');
  },

  // 获取系统信息
  getSystemInfo() {
    wx.getSystemInfo({
      success: (res) => {
        this.globalData.systemInfo = res;
      }
    });
  },

  // 检查登录状态
  checkLoginStatus() {
    const token = wx.getStorageSync('token');
    if (token) {
      this.globalData.token = token;
      this.globalData.isLogin = true;
      
      // 获取用户信息
      this.getUserInfo();
      
      // 获取当前角色
      const currentRole = wx.getStorageSync('currentRole');
      if (currentRole) {
        this.globalData.currentRole = currentRole;
      }
    }
  },

  // 获取用户信息
  getUserInfo() {
    wx.request({
      url: `${this.globalData.baseUrl}/auth/userinfo`,
      method: 'GET',
      header: {
        'Authorization': `Bearer ${this.globalData.token}`
      },
      success: (res) => {
        if (res.data.code === 0) {
          this.globalData.userInfo = res.data.data;
        }
      }
    });
  },

  // 获取位置权限
  getLocationPermission() {
    wx.getSetting({
      success: (res) => {
        if (!res.authSetting['scope.userLocation']) {
          wx.authorize({
            scope: 'scope.userLocation',
            success: () => {
              this.getLocation();
            }
          });
        } else {
          this.getLocation();
        }
      }
    });
  },

  // 获取位置
  getLocation() {
    wx.getLocation({
      type: 'gcj02',
      success: (res) => {
        this.globalData.location = {
          latitude: res.latitude,
          longitude: res.longitude
        };
      }
    });
  },

  // 登录方法
  login(phone, code, callback) {
    wx.request({
      url: `${this.globalData.baseUrl}/auth/login`,
      method: 'POST',
      data: {
        phone,
        code
      },
      success: (res) => {
        if (res.data.code === 0) {
          const { token, userInfo } = res.data.data;
          
          // 保存登录状态
          this.globalData.token = token;
          this.globalData.userInfo = userInfo;
          this.globalData.isLogin = true;
          
          // 保存到本地存储
          wx.setStorageSync('token', token);
          
          if (callback && typeof callback === 'function') {
            callback(true);
          }
        } else {
          if (callback && typeof callback === 'function') {
            callback(false, res.data.message);
          }
        }
      },
      fail: (err) => {
        if (callback && typeof callback === 'function') {
          callback(false, '网络请求失败');
        }
      }
    });
  },

  // 退出登录
  logout() {
    // 清除本地存储
    wx.removeStorageSync('token');
    wx.removeStorageSync('currentRole');
    
    // 重置全局数据
    this.globalData.token = null;
    this.globalData.userInfo = null;
    this.globalData.isLogin = false;
    this.globalData.currentRole = 'user';
    
    // 跳转到登录页
    wx.reLaunch({
      url: '/pages/login/login'
    });
  },

  // 切换角色
  switchRole(role) {
    if (role !== 'user' && role !== 'electrician') {
      return;
    }
    
    this.globalData.currentRole = role;
    wx.setStorageSync('currentRole', role);
  }
});