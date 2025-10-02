const multer = require('multer');
const path = require('path');
const fs = require('fs');

// 确保上传目录存在
const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// 配置存储
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // 根据文件类型创建不同的子目录
    let subDir = 'misc';
    
    if (file.fieldname.includes('id_card')) {
      subDir = 'id_cards';
    } else if (file.fieldname.includes('certificate')) {
      subDir = 'certificates';
    } else if (file.fieldname.includes('avatar')) {
      subDir = 'avatars';
    } else if (file.fieldname.includes('order')) {
      subDir = 'orders';
    }
    
    const destPath = path.join(uploadDir, subDir);
    if (!fs.existsSync(destPath)) {
      fs.mkdirSync(destPath, { recursive: true });
    }
    
    cb(null, destPath);
  },
  filename: function (req, file, cb) {
    // 生成唯一文件名
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

// 文件过滤器
const fileFilter = (req, file, cb) => {
  // 允许的文件类型
  const allowedTypes = /jpeg|jpg|png|gif|pdf/;
  
  // 检查文件扩展名
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  
  // 检查MIME类型
  const mimetype = allowedTypes.test(file.mimetype);
  
  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb(new Error('只允许上传图片和PDF文件'));
  }
};

// 创建multer实例
const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 限制文件大小为5MB
  }
});

module.exports = upload;