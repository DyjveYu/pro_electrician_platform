// pages/profile/profile/profile.js
Page({
  data: {
    userInfo: null,
    currentRole: 'user',
    electricianInfo: null,
    menuItems: [
      {
        id: 'address',
        title: '地址管理',
        icon: '📍',
        url: '/pages/address/list/list',
        showForRole: ['user']
      },
      {
        id: 'certification',
        title: '电工认证',
        icon: '🔧',
        url: '/pages/profile/certification/certification',
        showForRole: ['user', 'electrician']
      },
      {
        id: 'edit',
        title: '编辑资料',
        icon: '✏️',
        url: '/pages/profile/edit/edit',
        showForRole: ['user', 'electrician']
      },
      {
        id: 'switch-role',
        title: '角色切换',
        icon: '🔄',
        url: '/pages/profile/switch-role/switch-role',
        showForRole: ['user', 'electrician']
      },
      {
        id: 'settings',
        title: '设置',
        icon: '⚙️',
        url: '/pages/profile/settings/settings',
        showForRole: ['user', 'electrician']
      }
    ],
    stats: {
      totalOrders: 0,
      completedOrders: 0,
      totalAmount: 0,
      rating: 0
    }
  },

  onLoad() {
    this.loadUserInfo();
  },

  onShow() {
    // 页面显示时刷新数据
    this.loadUserInfo();
  },

  onPullDownRefresh() {
    this.loadUserInfo();
  },

  // 加载用户信息
  loadUserInfo() {
    const app = getApp();
    
    // 检查是否已登录
    if (!app.globalData.token) {
      console.log('用户未登录，跳转到登录页');
      // 延迟跳转，避免与登录成功后的跳转冲突
      setTimeout(() => {
        wx.reLaunch({
          url: '/pages/login/login'
        });
      }, 100);
      return;
    }
    
    // 从全局数据获取用户信息
    if (app.globalData.userInfo) {
      this.setData({
        userInfo: app.globalData.userInfo,
        currentRole: app.globalData.currentRole
      });
    }
    
    // 从服务器获取最新用户信息
    wx.request({
      url: `${app.globalData.baseUrl}/auth/userinfo`,
      method: 'GET',
      header: {
        'Authorization': `Bearer ${app.globalData.token}`
      },
      success: (res) => {
        wx.stopPullDownRefresh();
        if (res.data.code === 0) {
          const userInfo = res.data.data.user;
          const stats = res.data.data.stats || {
            totalOrders: 0,
            completedOrders: 0,
            totalAmount: 0,
            rating: 0
          };
          
          this.setData({ 
            userInfo,
            stats: {
              totalOrders: stats.total_orders || 0,
              completedOrders: stats.completed_orders || 0,
              totalAmount: app.globalData.currentRole === 'user' ? (stats.total_spent || 0) : (stats.total_earned || 0),
              rating: 0
            }
          });
          
          // 更新全局用户信息
          app.globalData.userInfo = userInfo;
          
          // 如果是电工角色，获取电工信息
          if (app.globalData.currentRole === 'electrician' && userInfo.isElectrician) {
            this.loadElectricianInfo();
          }
        } else if (res.data.code === 401) {
          // token无效，重新登录
          console.log('token无效，重新登录');
          app.logout();
        } else {
          console.log('获取用户信息失败:', res.data.message);
          wx.showToast({
            title: res.data.message || '获取用户信息失败',
            icon: 'none'
          });
        }
      },
      fail: (err) => {
        wx.stopPullDownRefresh();
        console.log('获取用户信息失败:', err);
        wx.showToast({
          title: '网络连接失败',
          icon: 'none'
        });
      }
    });
  },

  // 加载电工信息
  loadElectricianInfo() {
    const app = getApp();
    
    wx.request({
      url: `${app.globalData.baseUrl}/electricians/profile`,
      method: 'GET',
      header: {
        'Authorization': `Bearer ${app.globalData.token}`
      },
      success: (res) => {
        if (res.data.code === 0) {
          this.setData({ electricianInfo: res.data.data });
        }
      },
      fail: () => {
        console.log('获取电工信息失败');
      }
    });
  },



  // 点击菜单项
  onMenuItemTap(e) {
    const item = e.currentTarget.dataset.item;
    
    if (item.id === 'certification') {
      // 电工认证特殊处理
      this.handleCertification();
    } else {
      wx.navigateTo({
        url: item.url
      });
    }
  },

  // 处理电工认证
  handleCertification() {
    const app = getApp();
    
    if (this.data.userInfo && this.data.userInfo.isElectrician) {
      // 已认证，显示认证信息
      wx.navigateTo({
        url: '/pages/profile/certification/certification?mode=view'
      });
    } else {
      // 未认证，进入认证流程
      wx.navigateTo({
        url: '/pages/profile/certification/certification?mode=apply'
      });
    }
  },

  // 查看头像
  previewAvatar() {
    if (this.data.userInfo && this.data.userInfo.avatar) {
      wx.previewImage({
        urls: [this.data.userInfo.avatar]
      });
    }
  },

  // 退出登录
  logout() {
    wx.showModal({
      title: '确认退出',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          const app = getApp();
          app.logout();
        }
      }
    });
  },

  // 过滤菜单项
  getFilteredMenuItems() {
    const currentRole = this.data.currentRole;
    return this.data.menuItems.filter(item => 
      item.showForRole.includes(currentRole)
    );
  },

  // 获取认证状态文本
  getCertificationStatusText() {
    if (!this.data.userInfo) return '未认证';
    
    if (this.data.userInfo.isElectrician) {
      return '已认证';
    } else if (this.data.userInfo.certificationStatus === 'pending') {
      return '审核中';
    } else if (this.data.userInfo.certificationStatus === 'rejected') {
      return '审核未通过';
    } else {
      return '未认证';
    }
  },

  // 获取角色显示文本
  getRoleText() {
    return this.data.currentRole === 'electrician' ? '电工' : '用户';
  },

  // 导航到编辑资料页面
  navigateToEdit() {
    wx.navigateTo({
      url: '/pages/profile/edit/edit'
    });
  },

  // 导航到角色切换页面
  navigateToSwitchRole() {
    wx.navigateTo({
      url: '/pages/profile/switch-role/switch-role'
    });
  },

  // 导航到设置页面
  navigateToSettings() {
    wx.showToast({
      title: '功能开发中',
      icon: 'none'
    });
  },

  // 导航到关于页面
  navigateToAbout() {
    wx.showToast({
      title: '功能开发中',
      icon: 'none'
    });
  }
});