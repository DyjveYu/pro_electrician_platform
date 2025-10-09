const express = require('express');
const router = express.Router();
const electricianController = require('../controllers/electricianController');
const { authenticateToken } = require('../middleware/auth');

// 提交电工认证申请
router.post('/certification', authenticateToken, electricianController.submitCertification);

// 获取电工认证状态
router.get('/certification/status', authenticateToken, electricianController.getCertificationStatus);

module.exports = router;