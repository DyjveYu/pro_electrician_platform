// pages/order/create/create.js
const DEFAULT_SERVICE_TYPES = [
  { id: 1, name: '电路维修', icon: '🔌' },
  { id: 2, name: '开关插座', icon: '🔘' },
  { id: 3, name: '灯具安装', icon: '💡' },
  { id: 4, name: '其他电工服务', icon: '⚡' }
];

Page({
  data: {
    serviceTypes: [],              // 从后端或回退到默认值
    selectedServiceTypeId: null,   // 用于模板判断样式（避免复杂表达式）
    selectedServiceType: null,     // 提交时用的完整对象
    description: '',
    images: [],
    contactName: '',
    contactPhone: '',
    address: '',
    latitude: '',
    longitude: '',
    submitting: false
  },

  onLoad() {
    this.loadServiceTypes();
    this.getUserInfo();
  },

  // 预填联系人
  getUserInfo() {
    const app = getApp();
    if (app && app.globalData && app.globalData.userInfo) {
      this.setData({
        contactName: app.globalData.userInfo.nickname || '',
        contactPhone: app.globalData.userInfo.phone || ''
      });
    }
  },

  // 尝试从后端加载服务类型，失败则回退到默认数组
  loadServiceTypes() {
    const app = getApp();
    const url = `${app.globalData.baseUrl}/service-types`;
    console.log('加载服务类型，URL=', url);

    wx.request({
      url,
      method: 'GET',
      success: (res) => {
        // 兼容后端两种风格： code === 0 / code === 200
        const ok = res && res.data && (res.data.code === 0 || res.data.code === 200);
        if (ok && Array.isArray(res.data.data) && res.data.data.length > 0) {
          console.log('从后端加载到服务类型：', res.data.data);
          this.setData({ serviceTypes: res.data.data });
        } else {
          console.warn('后端返回的 service-types 格式不符合预期，回退到默认值', res && res.data);
          this.setData({ serviceTypes: DEFAULT_SERVICE_TYPES });
        }
      },
      fail: (err) => {
        console.warn('获取 service-types 失败，使用默认值。错误：', err);
        this.setData({ serviceTypes: DEFAULT_SERVICE_TYPES });
      }
    });
  },

  // 选择服务类型；模板中应使用 selectedServiceTypeId 判定高亮
  selectServiceType(e) {
    const index = e.currentTarget.dataset.index;
    // 防护：若 index 未定义，尝试用 data-id 字段
    if (typeof index === 'undefined') {
      const id = e.currentTarget.dataset.id;
      const found = this.data.serviceTypes.find(s => s.id == id);
      this.setData({
        selectedServiceTypeId: id,
        selectedServiceType: found || null
      });
      return;
    }

    const selected = this.data.serviceTypes[index];
    if (!selected) return;
    this.setData({
      selectedServiceTypeId: selected.id,
      selectedServiceType: selected
    });
  },

  // 文本输入处理
  onDescriptionInput(e) {
    this.setData({ description: e.detail.value });
  },
  onContactNameInput(e) {
    this.setData({ contactName: e.detail.value });
  },
  onContactPhoneInput(e) {
    this.setData({ contactPhone: e.detail.value });
  },

  // 上传图片（简化）
  chooseImage() {
    wx.chooseImage({
      count: 3 - (this.data.images?.length || 0),
      success: (res) => {
        this.setData({ images: [...(this.data.images || []), ...res.tempFilePaths] });
      }
    });
  },

  // 地图选择地址（保证经纬度）
  chooseLocation() {
    const that = this;
    wx.chooseLocation({
      success(res) {
        const full = (res.address && res.name) ? `${res.address}${res.name}` : (res.address || res.name || '');
        that.setData({
          address: full,
          latitude: res.latitude,
          longitude: res.longitude
        });
        console.log('地图选点结果：', { full, latitude: res.latitude, longitude: res.longitude });
      },
      fail(err) {
        console.error('chooseLocation 失败：', err);
        wx.showToast({ title: '选择地址失败', icon: 'none' });
      }
    });
  },

  // 表单验证
  validateForm() {
    if (!this.data.selectedServiceTypeId) {
      wx.showToast({ title: '请选择服务类型', icon: 'none' });
      return false;
    }
    if (!this.data.description || !this.data.description.trim()) {
      wx.showToast({ title: '请描述问题详情', icon: 'none' });
      return false;
    }
    if (!this.data.address || !this.data.address.trim()) {
      wx.showToast({ title: '请选择服务地址', icon: 'none' });
      return false;
    }
    if (!this.data.contactName || !this.data.contactName.trim()) {
      wx.showToast({ title: '请输入联系人', icon: 'none' });
      return false;
    }
    if (!/^1[3-9]\d{9}$/.test(this.data.contactPhone)) {
      wx.showToast({ title: '请输入正确手机号', icon: 'none' });
      return false;
    }
    if (!this.data.latitude || !this.data.longitude) {
      wx.showToast({ title: '请选择地图上的具体位置以获取经纬度', icon: 'none' });
      return false;
    }
    return true;
  },

  // 提交订单（字段名与后端保持一致）
  submitOrder() {
    if (!this.validateForm()) return;
    if (this.data.submitting) return;

    this.setData({ submitting: true });
    const app = getApp();

    const payload = {
      service_type_id: this.data.selectedServiceType.id,
      title: this.data.selectedServiceType.name || '无标题',
      description: this.data.description || '',
      contact_name: this.data.contactName,
      contact_phone: this.data.contactPhone,
      service_address: this.data.address,
      latitude: this.data.latitude,
      longitude: this.data.longitude,
      images: this.data.images || []
    };

    console.log('提交的订单 payload:', payload);

    wx.request({
      url: `${app.globalData.baseUrl}/orders`,
      method: 'POST',
      header: { 'Authorization': `Bearer ${app.globalData.token}`, 'Content-Type': 'application/json' },
      data: payload,
      success: (res) => {
        this.setData({ submitting: false });
        console.log('创建订单返回：', res && res.data);
        if (res && res.data && (res.data.code === 0 || res.data.code === 200)) {
          wx.showToast({ title: '订单提交成功', icon: 'success' });
          setTimeout(() => wx.navigateBack(), 1500);
        } else {
          wx.showToast({ title: res.data?.message || '提交失败', icon: 'none' });
        }
      },
      fail: (err) => {
        this.setData({ submitting: false });
        console.error('提交订单失败：', err);
        wx.showToast({ title: '网络错误，请重试', icon: 'none' });
      }
    });
  }
});
