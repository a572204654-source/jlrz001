# 认证API文档

## 1. 微信登录

**接口说明**：用户通过微信小程序code登录系统

**请求地址**：`POST /api/auth/wechat-login`

**是否需要认证**：否

### 请求参数

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| code | String | 是 | 微信登录code |

### 请求示例

```javascript
wx.request({
  url: 'https://your-domain.com/api/auth/wechat-login',
  method: 'POST',
  data: {
    code: 'wx_login_code_from_wechat'
  },
  success(res) {
    console.log('登录成功:', res.data)
    // 保存token到本地
    wx.setStorageSync('token', res.data.data.token)
  }
})
```

### 响应数据

```json
{
  "code": 0,
  "message": "登录成功",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "isNewUser": false,
    "userInfo": {
      "id": 1,
      "openid": "oxxxxxxxxxxxxxx",
      "nickname": "张三",
      "avatar": "https://example.com/avatar.jpg",
      "organization": "华建监理有限公司"
    }
  },
  "timestamp": 1699200000000
}
```

### 响应字段说明

| 字段名 | 类型 | 说明 |
|--------|------|------|
| token | String | JWT认证token |
| isNewUser | Boolean | 是否新用户 |
| userInfo | Object | 用户信息 |
| userInfo.id | Number | 用户ID |
| userInfo.openid | String | 微信OpenID |
| userInfo.nickname | String | 用户昵称 |
| userInfo.avatar | String | 用户头像 |
| userInfo.organization | String | 所属监理机构 |

---

## 2. 退出登录

**接口说明**：用户退出登录

**请求地址**：`POST /api/auth/logout`

**是否需要认证**：是

### 请求参数

无

### 请求示例

```javascript
wx.request({
  url: 'https://your-domain.com/api/auth/logout',
  method: 'POST',
  header: {
    'Authorization': 'Bearer ' + wx.getStorageSync('token')
  },
  success(res) {
    console.log('退出成功:', res.data)
    // 清除本地token
    wx.removeStorageSync('token')
  }
})
```

### 响应数据

```json
{
  "code": 0,
  "message": "退出成功",
  "data": {},
  "timestamp": 1699200000000
}
```

---

## 错误码说明

| 错误码 | 说明 |
|--------|------|
| 0 | 成功 |
| 400 | 参数错误 |
| 401 | 未授权/Token无效 |
| 500 | 服务器错误 |

