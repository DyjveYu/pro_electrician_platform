# 电工维修平台API接口设计文档

## 1. 接口概述

### 1.1 基本信息

* **API版本**: v1.0

* **基础URL**: `https://api.electrician-platform.com/api/v1`

* **协议**: HTTPS

* **数据格式**: JSON

* **字符编码**: UTF-8

### 1.2 认证方式

使用JWT Token进行身份认证，Token需要在请求头中携带：

```
Authorization: Bearer <token>
```

### 1.3 统一响应格式

所有API接口都遵循统一的响应格式：

```json
{
  "code": 200,
  "message": "success",
  "data": {},
  "timestamp": 1640995200000
}
```

**字段说明：**

* `code`: 状态码，200表示成功

* `message`: 响应消息

* `data`: 响应数据

* `timestamp`: 响应时间戳

## 2. 错误码定义

| 错误码 | 错误信息                  | 说明       |
| --- | --------------------- | -------- |
| 200 | success               | 请求成功     |
| 400 | Bad Request           | 请求参数错误   |
| 401 | Unauthorized          | 未授权，需要登录 |
| 403 | Forbidden             | 权限不足     |
| 404 | Not Found             | 资源不存在    |
| 409 | Conflict              | 资源冲突     |
| 422 | Validation Error      | 参数验证失败   |
| 500 | Internal Server Error | 服务器内部错误  |

### 业务错误码

| 错误码  | 错误信息    | 说明         |
| ---- | ------- | ---------- |
| 1001 | 手机号格式错误 | 手机号格式不正确   |
| 1002 | 验证码错误   | 短信验证码错误    |
| 1003 | 验证码已过期  | 验证码超时      |
| 1004 | 用户不存在   | 用户未注册      |
| 1005 | 用户已被封禁  | 用户状态异常     |
| 2001 | 工单不存在   | 工单ID无效     |
| 2002 | 工单状态错误  | 当前状态不允许此操作 |
| 2003 | 工单已被抢单  | 工单已被其他电工接单 |
| 2004 | 无权限操作工单 | 非工单相关用户    |
| 3001 | 支付订单不存在 | 支付订单无效     |
| 3002 | 支付金额错误  | 支付金额与订单不符  |
| 3003 | 支付已完成   | 重复支付       |
| 4001 | 认证信息不完整 | 电工认证信息缺失   |
| 4002 | 认证已存在   | 重复提交认证     |
| 4003 | 认证未通过   | 电工认证未通过    |

## 3. 用户认证模块

### 3.1 发送验证码

**接口地址**: `POST /auth/send-code`

**请求参数**:

```json
{
  "phone": "13800138000"
}
```

**响应示例**:

```json
{
  "code": 200,
  "message": "验证码发送成功",
  "data": {
    "expire_time": 300
  },
  "timestamp": 1640995200000
}
```

### 3.2 手机号登录

**接口地址**: `POST /auth/login`

**请求参数**:

```json
{
  "phone": "13800138000",
  "code": "123456"
}
```

**响应示例**:

```json
{
  "code": 200,
  "message": "登录成功",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "phone": "13800138000",
      "nickname": "用户昵称",
      "avatar": "https://example.com/avatar.jpg",
      "current_role": "user",
      "can_be_electrician": false
    }
  },
  "timestamp": 1640995200000
}
```

### 3.3 获取用户信息

**接口地址**: `GET /auth/profile`

**请求头**: 需要Authorization

**响应示例**:

```json
{
  "code": 200,
  "message": "获取成功",
  "data": {
    "id": 1,
    "phone": "13800138000",
    "nickname": "用户昵称",
    "avatar": "https://example.com/avatar.jpg",
    "current_role": "user",
    "can_be_electrician": false,
    "created_at": "2024-01-01T00:00:00Z"
  },
  "timestamp": 1640995200000
}
```

### 3.4 角色切换

**接口地址**: `POST /auth/switch-role`

**请求参数**:

```json
{
  "role": "electrician"
}
```

**响应示例**:

```json
{
  "code": 200,
  "message": "角色切换成功",
  "data": {
    "current_role": "electrician"
  },
  "timestamp": 1640995200000
}
```

### 3.5 更新用户信息

**接口地址**: `PUT /auth/profile`

**请求参数**:

```json
{
  "nickname": "新昵称",
  "avatar": "https://example.com/new-avatar.jpg"
}
```

**响应示例**:

```json
{
  "code": 200,
  "message": "更新成功",
  "data": {
    "id": 1,
    "nickname": "新昵称",
    "avatar": "https://example.com/new-avatar.jpg"
  },
  "timestamp": 1640995200000
}
```

## 4. 工单管理模块

### 4.1 创建工单

**接口地址**: `POST /orders`

**请求参数**:

```json
{
  "service_type_id": 1,
  "title": "电路故障维修",
  "description": "客厅电路突然断电，需要检修",
  "images": ["https://example.com/image1.jpg"],
  "contact_name": "张三",
  "contact_phone": "13800138000",
  "address_id": 1,
  "service_address": "北京市朝阳区xxx小区1号楼101",
  "longitude": 116.397128,
  "latitude": 39.916527
}
```

**响应示例**:

```json
{
  "code": 200,
  "message": "工单创建成功",
  "data": {
    "id": 1,
    "order_no": "ORD202401010001",
    "status": "pending"
  },
  "timestamp": 1640995200000
}
```

### 4.2 获取工单列表

**接口地址**: `GET /orders`

**请求参数**:

* `status`: 工单状态（可选）

* `page`: 页码，默认1

* `limit`: 每页数量，默认10

* `role`: 角色类型（user/electrician）

**响应示例**:

```json
{
  "code": 200,
  "message": "获取成功",
  "data": {
    "list": [
      {
        "id": 1,
        "order_no": "ORD202401010001",
        "title": "电路故障维修",
        "status": "pending",
        "final_amount": 0,
        "service_address": "北京市朝阳区xxx小区1号楼101",
        "created_at": "2024-01-01T00:00:00Z",
        "service_type": {
          "id": 1,
          "name": "电路维修"
        }
      }
    ],
    "total": 1,
    "page": 1,
    "limit": 10
  },
  "timestamp": 1640995200000
}
```

### 4.3 获取工单详情

**接口地址**: `GET /orders/{id}`

**响应示例**:

```json
{
  "code": 200,
  "message": "获取成功",
  "data": {
    "id": 1,
    "order_no": "ORD202401010001",
    "title": "电路故障维修",
    "description": "客厅电路突然断电，需要检修",
    "images": ["https://example.com/image1.jpg"],
    "status": "pending",
    "final_amount": 0,
    "repair_content": null,
    "repair_images": null,
    "contact_name": "张三",
    "contact_phone": "13800138000",
    "service_address": "北京市朝阳区xxx小区1号楼101",
    "created_at": "2024-01-01T00:00:00Z",
    "user": {
      "id": 1,
      "nickname": "用户昵称",
      "avatar": "https://example.com/avatar.jpg"
    },
    "electrician": null,
    "service_type": {
      "id": 1,
      "name": "电路维修"
    }
  },
  "timestamp": 1640995200000
}
```

### 4.4 电工抢单

**接口地址**: `POST /orders/{id}/accept`

**响应示例**:

```json
{
  "code": 200,
  "message": "抢单成功",
  "data": {
    "id": 1,
    "status": "accepted",
    "accepted_at": "2024-01-01T01:00:00Z"
  },
  "timestamp": 1640995200000
}
```

### 4.5 取消工单

**接口地址**: `POST /orders/{id}/cancel`

**请求参数**:

```json
{
  "reason": "临时有事，暂时不需要维修"
}
```

**响应示例**:

```json
{
  "code": 200,
  "message": "工单取消成功",
  "data": {
    "id": 1,
    "status": "cancelled",
    "cancelled_at": "2024-01-01T02:00:00Z"
  },
  "timestamp": 1640995200000
}
```

### 4.6 更新维修信息

**接口地址**: `PUT /orders/{id}/repair-info`

**请求参数**:

```json
{
  "repair_content": "更换了客厅主开关，修复了短路问题",
  "final_amount": 150.00,
  "repair_images": ["https://example.com/repair1.jpg"]
}
```

**响应示例**:

```json
{
  "code": 200,
  "message": "维修信息更新成功",
  "data": {
    "id": 1,
    "repair_content": "更换了客厅主开关，修复了短路问题",
    "final_amount": 150.00,
    "status": "in_progress"
  },
  "timestamp": 1640995200000
}
```

### 4.7 确认维修金额

**接口地址**: `POST /orders/{id}/confirm-amount`

**响应示例**:

```json
{
  "code": 200,
  "message": "金额确认成功",
  "data": {
    "id": 1,
    "status": "in_progress"
  },
  "timestamp": 1640995200000
}
```

### 4.8 完成工单

**接口地址**: `POST /orders/{id}/complete`

**响应示例**:

```json
{
  "code": 200,
  "message": "工单完成",
  "data": {
    "id": 1,
    "status": "completed",
    "completed_at": "2024-01-01T03:00:00Z"
  },
  "timestamp": 1640995200000
}
```

### 4.9 获取附近工单

**接口地址**: `GET /orders/nearby`

**请求参数**:

* `longitude`: 经度

* `latitude`: 纬度

* `distance`: 距离范围（米），默认1000

* `page`: 页码，默认1

* `limit`: 每页数量，默认10

**响应示例**:

```json
{
  "code": 200,
  "message": "获取成功",
  "data": {
    "list": [
      {
        "id": 1,
        "order_no": "ORD202401010001",
        "title": "电路故障维修",
        "service_address": "北京市朝阳区xxx小区1号楼101",
        "distance": 500,
        "created_at": "2024-01-01T00:00:00Z",
        "service_type": {
          "name": "电路维修"
        }
      }
    ],
    "total": 1,
    "page": 1,
    "limit": 10
  },
  "timestamp": 1640995200000
}
```

## 5. 支付模块

### 5.1 创建支付订单

**接口地址**: `POST /payments/create`

**请求参数**:

```json
{
  "order_id": 1,
  "payment_method": "wechat"
}
```

**响应示例**:

```json
{
  "code": 200,
  "message": "支付订单创建成功",
  "data": {
    "payment_id": 1,
    "out_trade_no": "PAY202401010001",
    "amount": 150.00,
    "payment_params": {
      "appId": "wx1234567890",
      "timeStamp": "1640995200",
      "nonceStr": "abc123",
      "package": "prepay_id=wx123456789",
      "signType": "RSA",
      "paySign": "signature"
    }
  },
  "timestamp": 1640995200000
}
```

### 5.2 查询支付状态

**接口地址**: `GET /payments/{id}/status`

**响应示例**:

```json
{
  "code": 200,
  "message": "查询成功",
  "data": {
    "payment_id": 1,
    "status": "success",
    "paid_at": "2024-01-01T04:00:00Z"
  },
  "timestamp": 1640995200000
}
```

### 5.3 测试支付

**接口地址**: `POST /payments/test-pay`

**请求参数**:

```json
{
  "order_id": 1
}
```

**响应示例**:

```json
{
  "code": 200,
  "message": "测试支付成功",
  "data": {
    "payment_id": 1,
    "status": "success"
  },
  "timestamp": 1640995200000
}
```

## 6. 评价模块

### 6.1 提交评价

**接口地址**: `POST /reviews`

**请求参数**:

```json
{
  "order_id": 1,
  "rating": 5,
  "content": "服务很好，维修及时专业",
  "images": ["https://example.com/review1.jpg"]
}
```

**响应示例**:

```json
{
  "code": 200,
  "message": "评价提交成功",
  "data": {
    "id": 1,
    "rating": 5,
    "content": "服务很好，维修及时专业"
  },
  "timestamp": 1640995200000
}
```

### 6.2 获取评价详情

**接口地址**: `GET /reviews/order/{order_id}`

**响应示例**:

```json
{
  "code": 200,
  "message": "获取成功",
  "data": {
    "id": 1,
    "rating": 5,
    "content": "服务很好，维修及时专业",
    "images": ["https://example.com/review1.jpg"],
    "created_at": "2024-01-01T05:00:00Z",
    "user": {
      "nickname": "用户昵称",
      "avatar": "https://example.com/avatar.jpg"
    }
  },
  "timestamp": 1640995200000
}
```

## 7. 地址管理模块

### 7.1 获取地址列表

**接口地址**: `GET /addresses`

**响应示例**:

```json
{
  "code": 200,
  "message": "获取成功",
  "data": [
    {
      "id": 1,
      "contact_name": "张三",
      "contact_phone": "13800138000",
      "province": "北京市",
      "city": "北京市",
      "district": "朝阳区",
      "detail_address": "xxx小区1号楼101",
      "is_default": true
    }
  ],
  "timestamp": 1640995200000
}
```

### 7.2 添加地址

**接口地址**: `POST /addresses`

**请求参数**:

```json
{
  "contact_name": "李四",
  "contact_phone": "13900139000",
  "province": "北京市",
  "city": "北京市",
  "district": "海淀区",
  "detail_address": "yyy小区2号楼201",
  "longitude": 116.297128,
  "latitude": 39.916527,
  "is_default": false
}
```

**响应示例**:

```json
{
  "code": 200,
  "message": "地址添加成功",
  "data": {
    "id": 2,
    "contact_name": "李四",
    "contact_phone": "13900139000"
  },
  "timestamp": 1640995200000
}
```

### 7.3 更新地址

**接口地址**: `PUT /addresses/{id}`

**请求参数**:

```json
{
  "contact_name": "李四",
  "contact_phone": "13900139000",
  "detail_address": "yyy小区2号楼202"
}
```

**响应示例**:

```json
{
  "code": 200,
  "message": "地址更新成功",
  "data": {
    "id": 2
  },
  "timestamp": 1640995200000
}
```

### 7.4 删除地址

**接口地址**: `DELETE /addresses/{id}`

**响应示例**:

```json
{
  "code": 200,
  "message": "地址删除成功",
  "data": {},
  "timestamp": 1640995200000
}
```

## 8. 电工认证模块

### 8.1 提交认证申请

**接口地址**: `POST /electrician/certification`

**请求参数**:

```json
{
  "real_name": "王五",
  "id_card": "110101199001011234",
  "electrician_cert_no": "DG123456789",
  "cert_start_date": "2020-01-01",
  "cert_end_date": "2025-01-01"
}
```

**响应示例**:

```json
{
  "code": 200,
  "message": "认证申请提交成功",
  "data": {
    "id": 1,
    "status": "approved"
  },
  "timestamp": 1640995200000
}
```

### 8.2 获取认证状态

**接口地址**: `GET /electrician/certification`

**响应示例**:

```json
{
  "code": 200,
  "message": "获取成功",
  "data": {
    "id": 1,
    "real_name": "王五",
    "electrician_cert_no": "DG123456789",
    "cert_start_date": "2020-01-01",
    "cert_end_date": "2025-01-01",
    "status": "approved",
    "created_at": "2024-01-01T00:00:00Z"
  },
  "timestamp": 1640995200000
}
```

### 8.3 更新认证信息

**接口地址**: `PUT /electrician/certification`

**请求参数**:

```json
{
  "real_name": "王五",
  "id_card": "110101199001011234",
  "electrician_cert_no": "DG123456789",
  "cert_start_date": "2020-01-01",
  "cert_end_date": "2026-01-01"
}
```

**响应示例**:

```json
{
  "code": 200,
  "message": "认证信息更新成功",
  "data": {
    "id": 1,
    "status": "approved"
  },
  "timestamp": 1640995200000
}
```

## 9. 消息模块

### 9.1 获取消息列表

**接口地址**: `GET /messages`

**请求参数**:

* `type`: 消息类型（order/system）

* `page`: 页码，默认1

* `limit`: 每页数量，默认20

**响应示例**:

```json
{
  "code": 200,
  "message": "获取成功",
  "data": {
    "list": [
      {
        "id": 1,
        "type": "order",
        "title": "工单状态更新",
        "content": "您的工单ORD202401010001已被电工接单",
        "related_id": 1,
        "is_read": false,
        "created_at": "2024-01-01T01:00:00Z"
      }
    ],
    "total": 1,
    "unread_count": 1
  },
  "timestamp": 1640995200000
}
```

### 9.2 标记消息已读

**接口地址**: `POST /messages/{id}/read`

**响应示例**:

```json
{
  "code": 200,
  "message": "标记成功",
  "data": {
    "id": 1,
    "is_read": true,
    "read_at": "2024-01-01T06:00:00Z"
  },
  "timestamp": 1640995200000
}
```

### 9.3 获取未读消息数量

**接口地址**: `GET /messages/unread-count`

**响应示例**:

```json
{
  "code": 200,
  "message": "获取成功",
  "data": {
    "order_count": 2,
    "system_count": 1,
    "total_count": 3
  },
  "timestamp": 1640995200000
}
```

## 10. 文件上传模块

### 10.1 图片上传

**接口地址**: `POST /upload/image`

**请求方式**: multipart/form-data

**请求参数**:

* `file`: 图片文件

* `type`: 图片类型（avatar/order/repair/review）

**响应示例**:

```json
{
  "code": 200,
  "message": "上传成功",
  "data": {
    "url": "https://example.com/uploads/images/20240101/abc123.jpg",
    "size": 1024000,
    "type": "image/jpeg"
  },
  "timestamp": 1640995200000
}
```

## 11. 系统配置模块

### 11.1 获取服务类型列表

**接口地址**: `GET /service-types`

**响应示例**:

```json
{
  "code": 200,
  "message": "获取成功",
  "data": [
    {
      "id": 1,
      "name": "电路维修",
      "description": "家庭电路故障检修，包括短路、断路等问题",
      "icon_url": "https://example.com/icons/circuit.png"
    },
    {
      "id": 2,
      "name": "开关插座",
      "description": "开关插座安装、维修、更换",
      "icon_url": "https://example.com/icons/switch.png"
    }
  ],
  "timestamp": 1640995200000
}
```

### 11.2 获取系统配置

**接口地址**: `GET /system/config`

**请求参数**:

* `keys`: 配置键名，多个用逗号分隔

**响应示例**:

```json
{
  "code": 200,
  "message": "获取成功",
  "data": {
    "nearby_distance": "1000",
    "max_image_size": "10485760",
    "supported_image_types": "jpg,png,jpeg"
  },
  "timestamp": 1640995200000
}
```

## 12. 管理后台API

### 12.1 管理员登录

**接口地址**: `POST /admin/auth/login`

**请求参数**:

```json
{
  "username": "admin",
  "password": "admin123"
}
```

**响应示例**:

```json
{
  "code": 200,
  "message": "登录成功",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "admin": {
      "id": 1,
      "username": "admin",
      "real_name": "系统管理员"
    }
  },
  "timestamp": 1640995200000
}
```

### 12.2 用户管理

**获取用户列表**: `GET /admin/users`

**请求参数**:

* `page`: 页码

* `limit`: 每页数量

* `keyword`: 搜索关键词

* `status`: 用户状态

**响应示例**:

```json
{
  "code": 200,
  "message": "获取成功",
  "data": {
    "list": [
      {
        "id": 1,
        "phone": "13800138000",
        "nickname": "用户昵称",
        "current_role": "user",
        "can_be_electrician": false,
        "status": "active",
        "created_at": "2024-01-01T00:00:00Z"
      }
    ],
    "total": 1,
    "page": 1,
    "limit": 10
  },
  "timestamp": 1640995200000
}
```

**封禁用户**: `POST /admin/users/{id}/ban`

**解封用户**: `POST /admin/users/{id}/unban`

### 12.3 电工管理

**获取电工列表**: `GET /admin/electricians`

**审核电工认证**: `POST /admin/electricians/{id}/approve`

**驳回电工认证**: `POST /admin/electricians/{id}/reject`

### 12.4 工单管理

**获取工单列表**: `GET /admin/orders`

**更新工单状态**: `PUT /admin/orders/{id}/status`

**获取数据统计**: `GET /admin/statistics`

### 12.5 系统通知管理

**发布系统通知**: `POST /admin/messages/system`

**请求参数**:

```json
{
  "title": "系统维护通知",
  "content": "系统将于今晚22:00-24:00进行维护，期间可能影响使用",
  "target_users": "all"
}
```

## 13. 接口测试说明

### 13.1 测试环境

* **测试地址**: `https://test-api.electrician-platform.com/api/v1`

* **测试账号**:

  * 普通用户: 手机号 `13800138000`，验证码 `123456`

  * 管理员: 用户名 `admin`，密码 `admin123`

### 13.2 测试工具

推荐使用以下工具进行API测试：

* Postman

* Insomnia

* curl命令行

### 13.3 测试流程

1. **用户注册登录测试**

   * 发送验证码

   * 手机号登录

   * 获取用户信息

2. **工单流程测试**

   * 创建工单

   * 电工抢单

   * 更新维修信息

   * 完成工单

   * 支付测试

   * 评价测试

3. **角色切换测试**

   * 提交电工认证

   * 切换到电工角色

   * 查看附近工单

### 13.4 测试数据

测试环境提供以下测试数据：

* 预置服务类型

* 测试用户账号

* 示例工单数据

* 测试支付功能

### 13.5 错误处理测试

测试各种错误场景：

* 参数验证错误

* 权限验证错误

* 业务逻辑错误

* 网络异常处理

## 14. 接口版本管理

### 14.1 版本策略

* 使用URL路径版本控制：`/api/v1/`

* 向后兼容原则

* 废弃接口提前通知

### 14.2 版本更新日志

**v1.0 (2024-01-01)**

* 初始版本发布

* 包含所有核心功能接口

## 15. 安全说明

### 15.1 接口安全

* 所有接口使用HTTPS协议

* JWT Token认证

* 请求参数验证

* SQL注入防护

* XSS攻击防护

### 15.2 限流策略

* 每个IP每分钟最多100次请求

* 登录接口每分钟最多5次请求

* 发送验证码每分钟最多1次

### 15.3 数据脱敏

* 手机号中间4位脱敏显示

* 身份证号部分脱敏

* 敏感信息不在日志中记录

***

**注意事项：**

1. 所有时间字段均使用ISO 8601格式
2. 金额字段使用Decimal类型，保留2位小数
3. 图片URL需要完整的HTTP/HTTPS地址
4. 分页参数page从1开始
5. 测试环境数据会定期清理，请勿用于生产
6. 生产环境部署前需要更新所有密钥和配置
7. 建议客户端实现请求重试和错误处理机制
8. 接口调用频率过高可能被限流，请合理控制请求频率

