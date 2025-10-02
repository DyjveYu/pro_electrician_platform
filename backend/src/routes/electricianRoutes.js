const express = require('express');
const router = express.Router();
const electricianController = require('../controllers/electricianController');
const { authenticate } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

// 提交电工认证申请
router.post('/certification', 
  authenticate,
  upload.fields([
    { name: 'id_card_front', maxCount: 1 },
    { name: 'id_card_back', maxCount: 1 },
    { name: 'certificate_image', maxCount: 1 }
  ]),
  electricianController.submitCertification
);

// 获取认证状态
router.get('/certification-status', authenticate, electricianController.getCertificationStatus);

module.exports = router;