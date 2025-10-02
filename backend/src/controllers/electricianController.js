const pool = require('../config/database');
const { v4: uuidv4 } = require('uuid');

/**
 * 提交电工认证申请
 */
async function submitCertification(req, res) {
  const { 
    name, id_card_number, phone, certificate_number, 
    certificate_level, certificate_start_date, certificate_end_date, 
    address, latitude, longitude, service_area 
  } = req.body;
  
  const userId = req.user.id;
  
  // 获取上传的文件路径
  const idCardFrontPath = req.files['id_card_front'] ? req.files['id_card_front'][0].path.replace(/\\/g, '/') : null;
  const idCardBackPath = req.files['id_card_back'] ? req.files['id_card_back'][0].path.replace(/\\/g, '/') : null;
  const certificateImagePath = req.files['certificate_image'] ? req.files['certificate_image'][0].path.replace(/\\/g, '/') : null;
  
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    // 检查用户是否已经提交过认证
    const [existingCerts] = await connection.query(
      'SELECT * FROM electrician_certifications WHERE user_id = ?',
      [userId]
    );
    
    let certificationId;
    
    if (existingCerts.length > 0) {
      // 更新现有认证
      certificationId = existingCerts[0].id;
      await connection.query(
        `UPDATE electrician_certifications SET 
        name = ?, id_card_number = ?, phone = ?, certificate_number = ?,
        certificate_level = ?, certificate_start_date = ?, certificate_end_date = ?,
        address = ?, latitude = ?, longitude = ?, service_area = ?,
        id_card_front = ?, id_card_back = ?, certificate_image = ?,
        status = 'pending', updated_at = NOW()
        WHERE id = ?`,
        [
          name, id_card_number, phone, certificate_number,
          certificate_level, certificate_start_date, certificate_end_date,
          address, latitude, longitude, service_area,
          idCardFrontPath, idCardBackPath, certificateImagePath,
          certificationId
        ]
      );
    } else {
      // 创建新认证
      certificationId = uuidv4();
      await connection.query(
        `INSERT INTO electrician_certifications (
          id, user_id, name, id_card_number, phone, certificate_number,
          certificate_level, certificate_start_date, certificate_end_date,
          address, latitude, longitude, service_area,
          id_card_front, id_card_back, certificate_image,
          status, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', NOW(), NOW())`,
        [
          certificationId, userId, name, id_card_number, phone, certificate_number,
          certificate_level, certificate_start_date, certificate_end_date,
          address, latitude, longitude, service_area,
          idCardFrontPath, idCardBackPath, certificateImagePath
        ]
      );
    }
    
    await connection.commit();
    
    res.status(200).json({
      success: true,
      message: '认证申请已提交，等待审核',
      data: { certification_id: certificationId }
    });
    
  } catch (error) {
    await connection.rollback();
    console.error('提交电工认证失败:', error);
    res.status(500).json({
      success: false,
      message: '提交认证申请失败',
      error: error.message
    });
  } finally {
    connection.release();
  }
}

/**
 * 获取认证状态
 */
async function getCertificationStatus(req, res) {
  const userId = req.user.id;
  
  try {
    const [certifications] = await pool.query(
      'SELECT * FROM electrician_certifications WHERE user_id = ?',
      [userId]
    );
    
    if (certifications.length === 0) {
      return res.status(200).json({
        success: true,
        data: { status: 'not_submitted' }
      });
    }
    
    const certification = certifications[0];
    
    res.status(200).json({
      success: true,
      data: {
        status: certification.status,
        certification: {
          id: certification.id,
          name: certification.name,
          id_card_number: certification.id_card_number,
          phone: certification.phone,
          certificate_number: certification.certificate_number,
          certificate_level: certification.certificate_level,
          certificate_start_date: certification.certificate_start_date,
          certificate_end_date: certification.certificate_end_date,
          address: certification.address,
          latitude: certification.latitude,
          longitude: certification.longitude,
          service_area: certification.service_area,
          id_card_front: certification.id_card_front,
          id_card_back: certification.id_card_back,
          certificate_image: certification.certificate_image,
          reject_reason: certification.reject_reason,
          created_at: certification.created_at,
          updated_at: certification.updated_at
        }
      }
    });
    
  } catch (error) {
    console.error('获取认证状态失败:', error);
    res.status(500).json({
      success: false,
      message: '获取认证状态失败',
      error: error.message
    });
  }
}

module.exports = {
  submitCertification,
  getCertificationStatus
};