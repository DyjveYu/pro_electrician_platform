// pages/profile/certification/certification.js
const app = getApp();
const util = require('../../../utils/util.js');

Page({
  data: {
    mode: 'apply', // apply, view, reapply
    formData: {
      name: '',
      id_card_number: '',
      phone: '',
      certificate_number: '',
      certificate_level: '',
      certificate_start_date: '',
      certificate_end_date: '',
      address: '',
      latitude: '',
      longitude: '',
      service_area: '5' // 默认服务半径5公里
    },
    certificateLevels: ['初级', '中级', '高级', '技师', '高级技师'],
    serviceAreas: ['3', '5', '10', '15', '20'],
    idCardFront: null,
    idCardBack: null,
    certificateImage: null,
    certificationStatus: '', // not_submitted, pending, approved, rejected
    certificationInfo: null,
    region: ['', '', ''],
    customItem: '全部',
    submitDisabled: true,
    errorMsg: ''
  },

  onLoad: function(options) {
    // 根据全局状态或参数设置模式
    const mode = options.mode || 'apply';
    this.setData({ mode });
    
    // 如果是查看模式或重新申请模式，加载认证信息
    if (mode === 'view' || mode === 'reapply') {
      this.loadCertificationInfo();
    }
  },
  
  // 加载认证信息
  loadCertificationInfo: function() {
    const that = this;
    wx.showLoading({ title: '加载中' });
    
    wx.request({
      url: `${app.globalData.apiBaseUrl}/electrician/certification-status`,
      method: 'GET',
      header: {
        'Authorization': `Bearer ${app.globalData.token}`
      },
      success: function(res) {
        wx.hideLoading();
        if (res.data.success && res.data.data) {
          const status = res.data.data.status;
          const certInfo = res.data.data.certification;
          
          that.setData({
            certificationStatus: status,
            certificationInfo: certInfo
          });
          
          // 如果是重新申请模式，填充表单数据
          if (that.data.mode === 'reapply' && certInfo) {
            // 从地址中提取省市区
            let region = ['', '', ''];
            if (certInfo.address) {
              const addressParts = certInfo.address.split(' ');
              if (addressParts.length >= 3) {
                region = addressParts.slice(0, 3);
              }
            }
            
            that.setData({
              formData: {
                name: certInfo.name || '',
                id_card_number: certInfo.id_card_number || '',
                phone: certInfo.phone || '',
                certificate_number: certInfo.certificate_number || '',
                certificate_level: certInfo.certificate_level || '',
                certificate_start_date: certInfo.certificate_start_date ? certInfo.certificate_start_date.split('T')[0] : '',
                certificate_end_date: certInfo.certificate_end_date ? certInfo.certificate_end_date.split('T')[0] : '',
                address: certInfo.address || '',
                latitude: certInfo.latitude || '',
                longitude: certInfo.longitude || '',
                service_area: certInfo.service_area || '5'
              },
              region: region,
              idCardFront: certInfo.id_card_front ? { url: certInfo.id_card_front } : null,
              idCardBack: certInfo.id_card_back ? { url: certInfo.id_card_back } : null,
              certificateImage: certInfo.certificate_image ? { url: certInfo.certificate_image } : null
            });
            
            // 检查表单有效性
            this.checkFormValid();
          }
        }
      },
      fail: function(err) {
        wx.hideLoading();
        wx.showToast({
          title: '获取认证信息失败',
          icon: 'none'
        });
        console.error('获取认证信息失败', err);
      }
    });
  },
  
  // 表单输入处理
  onInputChange: function(e) {
    const { field } = e.currentTarget.dataset;
    const { value } = e.detail;
    
    this.setData({
      [`formData.${field}`]: value
    });
    
    this.checkFormValid();
  },
  
  // 日期选择器
  bindDateChange: function(e) {
    const { field } = e.currentTarget.dataset;
    const { value } = e.detail;
    
    this.setData({
      [`formData.${field}`]: value
    });
    
    this.checkFormValid();
  },
  
  // 地区选择器
  bindRegionChange: function(e) {
    const region = e.detail.value;
    const address = region.join(' ');
    
    this.setData({
      region: region,
      'formData.address': address
    });
    
    this.checkFormValid();
  },
  
  // 获取当前位置
  getLocation: function() {
    const that = this;
    wx.showLoading({ title: '获取位置中' });
    
    wx.getLocation({
      type: 'gcj02',
      success: function(res) {
        const latitude = res.latitude;
        const longitude = res.longitude;
        
        // 逆地址解析
        wx.request({
          url: `https://apis.map.qq.com/ws/geocoder/v1/?location=${latitude},${longitude}&key=YOUR_MAP_KEY`,
          success: function(res) {
            wx.hideLoading();
            if (res.data.status === 0) {
              const result = res.data.result;
              const address = result.address;
              const addressComponent = result.address_component;
              
              // 更新地址和坐标
              that.setData({
                'formData.address': address,
                'formData.latitude': latitude,
                'formData.longitude': longitude,
                region: [addressComponent.province, addressComponent.city, addressComponent.district]
              });
              
              that.checkFormValid();
            }
          },
          fail: function() {
            wx.hideLoading();
            wx.showToast({
              title: '获取地址信息失败',
              icon: 'none'
            });
          }
        });
      },
      fail: function() {
        wx.hideLoading();
        wx.showToast({
          title: '获取位置失败',
          icon: 'none'
        });
      }
    });
  },
  
  // 上传图片
  chooseImage: function(e) {
    const that = this;
    const { type } = e.currentTarget.dataset;
    
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: function(res) {
        const tempFilePath = res.tempFilePaths[0];
        
        // 更新对应的图片
        if (type === 'idCardFront') {
          that.setData({ idCardFront: { path: tempFilePath } });
        } else if (type === 'idCardBack') {
          that.setData({ idCardBack: { path: tempFilePath } });
        } else if (type === 'certificate') {
          that.setData({ certificateImage: { path: tempFilePath } });
        }
        
        that.checkFormValid();
      }
    });
  },
  
  // 检查表单是否有效
  checkFormValid: function() {
    const { formData, idCardFront, idCardBack, certificateImage } = this.data;
    let isValid = true;
    let errorMsg = '';
    
    // 检查必填字段
    if (!formData.name) {
      isValid = false;
      errorMsg = '请填写姓名';
    } else if (!formData.id_card_number) {
      isValid = false;
      errorMsg = '请填写身份证号';
    } else if (!formData.phone) {
      isValid = false;
      errorMsg = '请填写手机号';
    } else if (!formData.certificate_number) {
      isValid = false;
      errorMsg = '请填写证书编号';
    } else if (!formData.certificate_level) {
      isValid = false;
      errorMsg = '请选择证书等级';
    } else if (!formData.certificate_start_date) {
      isValid = false;
      errorMsg = '请选择证书生效日期';
    } else if (!formData.certificate_end_date) {
      isValid = false;
      errorMsg = '请选择证书失效日期';
    } else if (!formData.address) {
      isValid = false;
      errorMsg = '请填写地址';
    }
    
    // 检查图片
    if (!idCardFront || (!idCardFront.path && !idCardFront.url)) {
      isValid = false;
      errorMsg = '请上传身份证正面照片';
    } else if (!idCardBack || (!idCardBack.path && !idCardBack.url)) {
      isValid = false;
      errorMsg = '请上传身份证背面照片';
    } else if (!certificateImage || (!certificateImage.path && !certificateImage.url)) {
      isValid = false;
      errorMsg = '请上传电工证书照片';
    }
    
    this.setData({
      submitDisabled: !isValid,
      errorMsg: errorMsg
    });
  },
  
  // 提交认证
  submitCertification: function() {
    const that = this;
    const { formData, idCardFront, idCardBack, certificateImage } = this.data;
    
    // 再次检查表单有效性
    this.checkFormValid();
    if (this.data.submitDisabled) {
      wx.showToast({
        title: this.data.errorMsg || '请完善表单信息',
        icon: 'none'
      });
      return;
    }
    
    wx.showLoading({ title: '提交中' });
    
    // 上传图片和表单数据
    const uploadTask = wx.uploadFile({
      url: `${app.globalData.apiBaseUrl}/electrician/certification`,
      filePath: idCardFront.path || idCardFront.url,
      name: 'id_card_front',
      header: {
        'Authorization': `Bearer ${app.globalData.token}`
      },
      formData: {
        ...formData
      },
      success: function(res) {
        wx.hideLoading();
        const data = JSON.parse(res.data);
        
        if (data.success) {
          wx.showToast({
            title: '认证申请已提交',
            icon: 'success'
          });
          
          // 更新全局认证状态
          app.globalData.certificationStatus = 'pending';
          
          // 返回上一页或跳转到状态页
          setTimeout(() => {
            wx.navigateBack();
          }, 1500);
        } else {
          wx.showToast({
            title: data.message || '提交失败',
            icon: 'none'
          });
        }
      },
      fail: function(err) {
        wx.hideLoading();
        wx.showToast({
          title: '提交失败',
          icon: 'none'
        });
        console.error('提交认证失败', err);
      }
    });
    
    // 添加其他文件
    uploadTask.onProgressUpdate((res) => {
      console.log('上传进度', res.progress);
    });
  },
  
  // 预览图片
  previewImage: function(e) {
    const { type } = e.currentTarget.dataset;
    let url = '';
    
    if (type === 'idCardFront' && this.data.idCardFront) {
      url = this.data.idCardFront.path || this.data.idCardFront.url;
    } else if (type === 'idCardBack' && this.data.idCardBack) {
      url = this.data.idCardBack.path || this.data.idCardBack.url;
    } else if (type === 'certificate' && this.data.certificateImage) {
      url = this.data.certificateImage.path || this.data.certificateImage.url;
    }
    
    if (url) {
      wx.previewImage({
        urls: [url],
        current: url
      });
    }
  },
  
  // 重新申请认证
  reapplyCertification: function() {
    this.setData({
      mode: 'reapply',
      certificationStatus: ''
    });
  }
});