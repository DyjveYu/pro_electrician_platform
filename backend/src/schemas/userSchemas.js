const Joi = require('joi');

// 用户资料更新验证模式
const updateProfile = {
  body: Joi.object({
    nickname: Joi.string().min(1).max(50).optional().messages({
      'string.min': '昵称不能为空',
      'string.max': '昵称不能超过50个字符'
    }),
    avatar: Joi.string().optional().messages({
      'string.empty': '头像不能为空字符串'
    }),
    gender: Joi.string().valid('male', 'female', 'unknown').optional().messages({
      'any.only': '性别只能是male、female或unknown'
    }),
    birthday: Joi.date().optional().messages({
      'date.base': '生日必须是有效的日期格式'
    }),
    bio: Joi.string().max(200).optional().messages({
      'string.max': '个人简介不能超过200个字符'
    })
  }).min(1).messages({
    'object.min': '至少需要提供一个要更新的字段'
  })
};

// 获取用户资料验证模式
const getProfile = {
  params: Joi.object({
    id: Joi.string().optional()
  })
};

module.exports = {
  updateProfile,
  getProfile
};