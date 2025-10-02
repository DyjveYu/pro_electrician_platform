const express = require('express');
const router = express.Router();
const electricianController = require('../controllers/electricianController');
const { verifyToken, isElectrician } = require('../middleware/authMiddleware');
const { upload, handleUploadError } = require('../middleware/uploadMiddleware');

/**
 * @route GET /api/v1/electricians
 * @desc 获取所有电工列表
 * @access Public
 */
router.get('/', electricianController.getAllElectricians);

/**
 * @route GET /api/v1/electricians/:id
 * @desc 获取特定电工信息
 * @access Public
 */
router.get('/:id', electricianController.getElectricianById);

/**
 * @route POST /api/v1/electricians/certification
 * @desc 提交电工认证申请
 * @access Private
 */
router.post(
  '/certification',
  verifyToken,
  upload.fields([
    { name: 'idCardFront', maxCount: 1 },
    { name: 'idCardBack', maxCount: 1 },
    { name: 'qualification', maxCount: 1 },
    { name: 'profilePhoto', maxCount: 1 }
  ]),
  handleUploadError,
  electricianController.submitCertification
);

/**
 * @route GET /api/v1/electricians/certification/status
 * @desc 获取电工认证状态
 * @access Private
 */
router.get(
  '/certification/status',
  verifyToken,
  electricianController.getCertificationStatus
);

/**
 * @route PUT /api/v1/electricians/profile
 * @desc 更新电工个人资料
 * @access Private (电工)
 */
router.put(
  '/profile',
  verifyToken,
  isElectrician,
  electricianController.updateProfile
);

/**
 * @route GET /api/v1/electricians/nearby
 * @desc 获取附近可用的电工
 * @access Public
 */
router.get('/nearby', electricianController.getNearbyElectricians);

module.exports = router;