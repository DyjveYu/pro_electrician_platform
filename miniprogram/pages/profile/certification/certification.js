// pages/profile/certification/certification.js
const app = getApp();

Page({
  data: {
    // 表单数据
    formData: {
      name: '',
      idNumber: '',
      phone: '',
      address: '',
      experience: '',
      specialties: []
    },
    // 专长选项
    specialtyOptions: [
      { id: 1, name: '室内线路维修', checked: false },
      { id: 2, name: '电器安装', checked: false },
      { id: 3, name: '照明系统', checked: false },
      { id: 4, name: '电路故障排查', checked: false },
      { id: 5, name: '配电箱维护', checked: false },
      { id: 6, name: '智能家居布线', checked: false }
    ],
    // 上传的图片
    uploadedImages: {
      idCardFront: '',
      idCardBack: '',
      qualification: '',
      profilePhoto: ''
    },
    // 上传状态
    uploading: false,
    // 提交状态
    submitting: false,
    // 表单验证错误
    errors: {}
  },

  onLoad: function(options) {
    // 检查是否已登录
    if (!app.globalData.token) {
      wx.showToast({
        title: '请先登录',
        icon: 'none',
        success: () => {
          setTimeout(() => {
            wx.navigateTo({
              url: '/pages/login/login'
            });
          }, 1500);
        }
      });
      return;
    }
    
    // 检查认证状态
    this.checkCertificationStatus();
  },
  
  // 检查认证状态
  checkCertificationStatus: function() {
    wx.showLoading({
      title: '加载中',
    });
    
    wx.request({
      url: `${app.globalData.apiBaseUrl}/electricians/certification/status`,
      method: 'GET',
      header: {
        'Authorization': `Bearer ${app.globalData.token}`
      },
      success: (res) => {
        if (res.statusCode === 200) {
          const status = res.data.status;
          
          // 如果已经提交认证或已认证，则跳转到状态页
          if (status === 'pending' || status === 'approved') {
            wx.redirectTo({
              url: `/pages/profile/certification/status?status=${status}`
            });
          }
        }
      },
      complete: () => {
        wx.hideLoading();
      }
    });
  },

  // 输入框变化处理
  handleInputChange: function(e) {
    const { field } = e.currentTarget.dataset;
    const { value } = e.detail;
    
    this.setData({
      [`formData.${field}`]: value,
      [`errors.${field}`]: ''
    });
  },
  
  // 专长选择处理
  handleSpecialtyChange: function(e) {
    const selectedValues = e.detail.value;
    const specialtyOptions = this.data.specialtyOptions.map(item => {
      return {
        ...item,
        checked: selectedValues.includes(item.id.toString())
      };
    });
    
    const specialties = specialtyOptions
      .filter(item => item.checked)
      .map(item => item.name);
    
    this.setData({
      specialtyOptions,
      'formData.specialties': specialties,
      'errors.specialties': ''
    });
  },

  // 上传图片
  uploadImage: function(e) {
    const { type } = e.currentTarget.dataset;
    
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const tempFilePath = res.tempFilePaths[0];
        
        this.setData({
          [`uploadedImages.${type}`]: tempFilePath,
          [`errors.${type}`]: ''
        });
      }
    });
  },

  // 预览图片
  previewImage: function(e) {
    const { type } = e.currentTarget.dataset;
    const image = this.data.uploadedImages[type];
    
    if (image) {
      wx.previewImage({
        urls: [image],
        current: image
      });
    }
  },

  // 验证表单
  validateForm: function() {
    let isValid = true;
    const errors = {};
    const { formData, uploadedImages } = this.data;
    
    // 验证姓名
    if (!formData.name.trim()) {
      errors.name = '请输入姓名';
      isValid = false;
    }
    
    // 验证身份证号
    if (!formData.idNumber.trim()) {
      errors.idNumber = '请输入身份证号';
      isValid = false;
    } else if (!/^\d{17}[\dX]$/.test(formData.idNumber)) {
      errors.idNumber = '身份证号格式不正确';
      isValid = false;
    }
    
    // 验证手机号
    if (!formData.phone.trim()) {
      errors.phone = '请输入手机号';
      isValid = false;
    } else if (!/^1\d{10}$/.test(formData.phone)) {
      errors.phone = '手机号格式不正确';
      isValid = false;
    }
    
    // 验证地址
    if (!formData.address.trim()) {
      errors.address = '请输入地址';
      isValid = false;
    }
    
    // 验证工作经验
    if (!formData.experience.trim()) {
      errors.experience = '请输入工作经验';
      isValid = false;
    }
    
    // 验证专长
    if (formData.specialties.length === 0) {
      errors.specialties = '请选择至少一项专长';
      isValid = false;
    }
    
    // 验证图片
    if (!uploadedImages.idCardFront) {
      errors.idCardFront = '请上传身份证正面照';
      isValid = false;
    }
    
    if (!uploadedImages.idCardBack) {
      errors.idCardBack = '请上传身份证背面照';
      isValid = false;
    }
    
    if (!uploadedImages.qualification) {
      errors.qualification = '请上传资格证书';
      isValid = false;
    }
    
    if (!uploadedImages.profilePhoto) {
      errors.profilePhoto = '请上传个人照片';
      isValid = false;
    }
    
    this.setData({ errors });
    return isValid;
  },

  // 提交表单
  submitForm: function() {
    // 表单验证
    if (!this.validateForm()) {
      wx.showToast({
        title: '请完善表单信息',
        icon: 'none'
      });
      return;
    }
    
    this.setData({ submitting: true });
    
    // 上传图片并提交表单
    this.uploadAllImages();
  },
  
  // 上传所有图片
  uploadAllImages: function() {
    this.setData({ uploading: true });
    
    wx.showLoading({
      title: '正在上传...',
    });
    
    const { uploadedImages } = this.data;
    const uploadTasks = [];
    const uploadedFiles = {};
    
    // 准备上传任务
    Object.keys(uploadedImages).forEach(key => {
      if (uploadedImages[key]) {
        const task = this.uploadFile(key, uploadedImages[key]);
        uploadTasks.push(task);
      }
    });
    
    // 执行所有上传任务
    Promise.all(uploadTasks)
      .then(results => {
        results.forEach(result => {
          uploadedFiles[result.type] = result.path;
        });
        
        // 上传完成后提交表单
        this.submitCertification(uploadedFiles);
      })
      .catch(error => {
        console.error('上传失败:', error);
        wx.hideLoading();
        wx.showToast({
          title: '上传失败，请重试',
          icon: 'none'
        });
        this.setData({
          uploading: false,
          submitting: false
        });
      });
  },
  
  // 上传单个文件
  uploadFile: function(type, filePath) {
    return new Promise((resolve, reject) => {
      wx.uploadFile({
        url: `${app.globalData.apiBaseUrl}/upload`,
        filePath: filePath,
        name: type,
        header: {
          'Authorization': `Bearer ${app.globalData.token}`
        },
        success: (res) => {
          if (res.statusCode === 200) {
            const data = JSON.parse(res.data);
            resolve({
              type: type,
              path: data.path
            });
          } else {
            reject(new Error(`上传${type}失败`));
          }
        },
        fail: (err) => {
          reject(err);
        }
      });
    });
  },
  
  // 提交认证申请
  submitCertification: function(uploadedFiles) {
    const { formData } = this.data;
    
    const certificationData = {
      ...formData,
      ...uploadedFiles
    };
    
    wx.request({
      url: `${app.globalData.apiBaseUrl}/electricians/certification`,
      method: 'POST',
      header: {
        'Authorization': `Bearer ${app.globalData.token}`,
        'Content-Type': 'application/json'
      },
      data: certificationData,
      success: (res) => {
        if (res.statusCode === 201 || res.statusCode === 200) {
          wx.showToast({
            title: '提交成功',
            icon: 'success',
            success: () => {
              setTimeout(() => {
                wx.redirectTo({
                  url: '/pages/profile/certification/status?status=pending'
                });
              }, 1500);
            }
          });
        } else {
          wx.showToast({
            title: res.data.message || '提交失败',
            icon: 'none'
          });
        }
      },
      fail: (err) => {
        console.error('提交失败:', err);
        wx.showToast({
          title: '提交失败，请重试',
          icon: 'none'
        });
      },
      complete: () => {
        wx.hideLoading();
        this.setData({
          uploading: false,
          submitting: false
        });
      }
    });
  }
});