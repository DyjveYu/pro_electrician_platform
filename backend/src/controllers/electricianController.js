const pool = require('../config/database');

/**
 * 提交电工认证申请
 */
const submitCertification = async (req, res) => {
  const { user_id } = req.user;
  const { 
    real_name, 
    id_card, 
    certificate_number, 
    certificate_start_date, 
    certificate_end_date, 
    service_area,
    region
  } = req.body;

  try {
    // 检查是否已存在认证记录
    const checkResult = await pool.query(
      'SELECT * FROM electrician_certifications WHERE user_id = ?',
      [user_id]
    );

    let query;
    let params;

    if (checkResult[0].length > 0) {
      // 更新现有记录
      query = `
        UPDATE electrician_certifications 
        SET real_name = ?, id_card = ?, certificate_number = ?, 
        certificate_start_date = ?, certificate_end_date = ?, 
        service_area = ?, region = ?, status = 'pending', 
        updated_at = NOW(), reject_reason = NULL
        WHERE user_id = ?
      `;
      params = [
        real_name, id_card, certificate_number, 
        certificate_start_date, certificate_end_date, 
        service_area, JSON.stringify(region), user_id
      ];
    } else {
      // 创建新记录
      query = `
        INSERT INTO electrician_certifications 
        (user_id, real_name, id_card, certificate_number, 
        certificate_start_date, certificate_end_date, 
        service_area, region, status, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', NOW(), NOW())
      `;
      params = [
        user_id, real_name, id_card, certificate_number, 
        certificate_start_date, certificate_end_date, 
        service_area, JSON.stringify(region)
      ];
    }

    await pool.query(query, params);

    // 更新用户角色为电工（待审核）
    await pool.query(
      'UPDATE users SET role = "electrician_pending" WHERE id = ?',
      [user_id]
    );

    res.status(200).json({
      success: true,
      message: '认证申请提交成功，等待审核'
    });
  } catch (error) {
    console.error('提交电工认证失败:', error);
    res.status(500).json({
      success: false,
      message: '提交认证申请失败，请稍后重试',
      error: error.message
    });
  }
};

/**
 * 获取电工认证状态
 */
const getCertificationStatus = async (req, res) => {
  const { user_id } = req.user;

  try {
    const [rows] = await pool.query(
      'SELECT * FROM electrician_certifications WHERE user_id = ?',
      [user_id]
    );

    if (rows.length === 0) {
      return res.status(200).json({
        success: true,
        data: {
          status: 'not_submitted',
          message: '未提交认证'
        }
      });
    }

    const certification = rows[0];
    let message = '';

    switch (certification.status) {
      case 'pending':
        message = '认证审核中';
        break;
      case 'approved':
        message = '认证已通过';
        break;
      case 'rejected':
        message = `认证被拒绝: ${certification.reject_reason || '无原因'}`;
        break;
      default:
        message = '未知状态';
    }

    res.status(200).json({
      success: true,
      data: {
        status: certification.status,
        message,
        certification
      }
    });
  } catch (error) {
    console.error('获取电工认证状态失败:', error);
    res.status(500).json({
      success: false,
      message: '获取认证状态失败，请稍后重试',
      error: error.message
    });
  }
};

module.exports = {
  submitCertification,
  getCertificationStatus
};