// pages/index/index.js
const app = getApp();
const { SystemAPI, OrderAPI, AuthAPI } = require('../../utils/api');
const { formatTime, formatDistance, getOrderStatusText } = require('../../utils/util');

Page({
  data: {
    userInfo: null,
    currentRole: 'user', // 当前用户角色
    locationText: '北京市朝阳区',
    latitude: null,
    longitude: null,
    // 用户角色的最近订单
    recentOrders: [
      {
        id: 1,
        title: '客厅灯具安装',
        status: 'completed',
        statusText: '已完成',
        electrician_name: '张师傅',
        created_at: '2024-01-15 14:30',
        createdTime: '2024-01-15 14:30',
        rating: 5,
        final_price: 120
      },
      {
        id: 2,
        title: '厨房插座维修',
        status: 'completed',
        statusText: '已完成',
        electrician_name: '李师傅',
        created_at: '2024-01-12 09:15',
        createdTime: '2024-01-12 09:15',
        rating: 4.8,
        final_price: 80
      },
      {
        id: 3,
        title: '卫生间照明修理',
        status: 'completed',
        statusText: '已完成',
        electrician_name: '王师傅',
        created_at: '2024-01-10 16:20',
        createdTime: '2024-01-10 16:20',
        rating: 4.9,
        final_price: 95
      }
    ],
    // 电工角色的附近订单
    nearbyOrders: [],
    loading: false,
    showQuoteModal: false,
    selectedOrderId: null,
    quotePrice: ''
  },

  onLoad() {
    console.log('首页加载');
    this.initPage();
  },

  onShow() {
    console.log('首页显示');
    this.initPage();
  },

  onPullDownRefresh() {
    this.loadData().finally(() => {
      wx.stopPullDownRefresh();
    });
  },

  /**
   * 初始化页面
   */
  initPage() {
    // 获取用户角色
    const currentRole = app.globalData.currentRole || 'user';
    this.setData({ currentRole });
    
    // 获取用户位置
    this.getCurrentLocation();
    
    // 加载数据
    this.loadData();
  },

  /**
   * 获取当前位置
   */
  getCurrentLocation() {
    wx.getLocation({
      type: 'gcj02',
      success: (res) => {
        this.setData({
          latitude: res.latitude,
          longitude: res.longitude
        });
        
        // 逆地理编码获取地址
        this.reverseGeocode(res.latitude, res.longitude);
      },
      fail: (err) => {
        console.log('获取位置失败:', err);
        // 使用默认位置
        this.setData({
          locationText: '北京市朝阳区'
        });
      }
    });
  },

  /**
   * 逆地理编码
   */
  reverseGeocode(latitude, longitude) {
    // 这里可以调用地图API进行逆地理编码
    // 暂时使用默认地址
    this.setData({
      locationText: '当前位置'
    });
  },

  /**
   * 加载数据
   */
  async loadData() {
    if (this.data.currentRole === 'electrician') {
      await this.loadNearbyOrders();
    } else {
      await this.loadRecentOrders();
    }
  },

  /**
   * 加载附近订单（电工角色）
   */
  async loadNearbyOrders() {
    try {
      this.setData({ loading: true });
      
      const params = {
        page: 1,
        limit: 20,
        my_orders: false, // 获取可接的订单
        status: 'pending' // 只获取待接单的订单
      };
      
      // 暂时移除地理位置参数，避免后端查询错误
      // TODO: 后续实现完整的地理位置筛选功能
      
      const response = await OrderAPI.getOrderList(params);
      
      if (response.code === 0) {
        const orders = response.data.orders || response.data.list || [];
        const formattedOrders = orders.map(order => ({
          ...order,
          statusText: getOrderStatusText(order.status),
          createdTime: formatTime(order.created_at),
          distance: this.calculateDistance(order.latitude, order.longitude)
        }));
        
        this.setData({
          nearbyOrders: formattedOrders
        });
      }
    } catch (error) {
      console.error('加载附近订单失败:', error);
      wx.showToast({
        title: '加载订单失败',
        icon: 'none'
      });
    } finally {
      this.setData({ loading: false });
    }
  },

  /**
   * 加载最近订单（用户角色）
   */
  async loadRecentOrders() {
    try {
      this.setData({ loading: true });
      
      const response = await OrderAPI.getOrderList({
        page: 1,
        limit: 5,
        my_orders: true
      });
      
      if (response.code === 0) {
        const orders = response.data.orders || response.data.list || [];
        const formattedOrders = orders.map(order => ({
          ...order,
          statusText: getOrderStatusText(order.status),
          createdTime: formatTime(order.created_at)
        }));
        
        this.setData({
          recentOrders: formattedOrders
        });
      }
    } catch (error) {
      console.error('加载最近订单失败:', error);
      // 保持使用模拟数据
    } finally {
      this.setData({ loading: false });
    }
  },

  /**
   * 计算距离
   */
  calculateDistance(lat, lng) {
    if (!this.data.latitude || !this.data.longitude || !lat || !lng) {
      return '';
    }
    
    const distance = formatDistance(
      this.data.latitude,
      this.data.longitude,
      lat,
      lng
    );
    
    return distance;
  },

  /**
   * 点击位置
   */
  onLocationTap() {
    wx.chooseLocation({
      success: (res) => {
        this.setData({
          locationText: res.name || res.address,
          latitude: res.latitude,
          longitude: res.longitude
        });
        // 重新加载数据
        this.loadData();
      }
    });
  },

  /**
   * 创建订单（用户角色）
   */
  createOrder() {
    if (this.data.currentRole !== 'user') {
      wx.showToast({
        title: '请切换到用户身份',
        icon: 'none'
      });
      return;
    }
    
    wx.navigateTo({
      url: '/pages/order/create/create'
    });
  },

  /**
   * 查看所有订单
   */
  viewAllOrders() {
    wx.navigateTo({
      url: '/pages/order/list/list'
    });
  },

  /**
   * 查看订单详情
   */
  viewOrderDetail(e) {
    const orderId = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/order/detail/detail?id=${orderId}`
    });
  },

  /**
   * 抢单（电工角色）
   */
  takeOrder(e) {
    const orderId = e.currentTarget.dataset.id;
    
    if (this.data.currentRole !== 'electrician') {
      wx.showToast({
        title: '请切换到电工身份',
        icon: 'none'
      });
      return;
    }
    
    // 显示报价弹窗
    this.setData({
      showQuoteModal: true,
      selectedOrderId: orderId,
      quotePrice: ''
    });
  },

  /**
   * 关闭报价弹窗
   */
  closeQuoteModal() {
    this.setData({
      showQuoteModal: false,
      selectedOrderId: null,
      quotePrice: ''
    });
  },

  /**
   * 报价输入
   */
  onQuotePriceInput(e) {
    this.setData({
      quotePrice: e.detail.value
    });
  },

  /**
   * 确认抢单
   */
  async confirmTakeOrder() {
    const { selectedOrderId, quotePrice } = this.data;
    
    if (!quotePrice || parseFloat(quotePrice) <= 0) {
      wx.showToast({
        title: '请输入有效报价',
        icon: 'none'
      });
      return;
    }
    
    try {
      wx.showLoading({ title: '提交中...' });
      
      const response = await OrderAPI.takeOrder({
        order_id: selectedOrderId,
        quoted_price: parseFloat(quotePrice)
      });
      
      if (response.code === 0) {
        wx.showToast({
          title: '抢单成功',
          icon: 'success'
        });
        
        // 关闭弹窗
        this.closeQuoteModal();
        
        // 重新加载订单列表
        this.loadNearbyOrders();
      } else {
        wx.showToast({
          title: response.message || '抢单失败',
          icon: 'none'
        });
      }
    } catch (error) {
      console.error('抢单失败:', error);
      wx.showToast({
        title: '抢单失败',
        icon: 'none'
      });
    } finally {
      wx.hideLoading();
    }
  },

  /**
   * 刷新订单列表
   */
  refreshOrders() {
    this.loadData();
  }
});