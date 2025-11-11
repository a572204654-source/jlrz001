# 用户API文档

## 1. 获取用户信息

**接口说明**：获取当前登录用户的详细信息及统计数据

**请求地址**：`GET /api/user/info`

**是否需要认证**：是

### 请求参数

无

### 请求示例

```javascript
wx.request({
  url: 'https://your-domain.com/api/user/info',
  method: 'GET',
  header: {
    'Authorization': 'Bearer ' + wx.getStorageSync('token')
  },
  success(res) {
    console.log('用户信息:', res.data)
  }
})
```

### 响应数据

```json
{
  "code": 0,
  "message": "操作成功",
  "data": {
    "id": 1,
    "openid": "oxxxxxxxxxxxxxx",
    "unionid": "",
    "nickname": "张三",
    "avatar": "https://example.com/avatar.jpg",
    "organization": "华建监理有限公司",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-11-07T00:00:00.000Z",
    "stats": {
      "projectCount": 3,
      "logCount": 25,
      "monthLogCount": 5
    }
  },
  "timestamp": 1699200000000
}
```

### 响应字段说明

| 字段名 | 类型 | 说明 |
|--------|------|------|
| id | Number | 用户ID |
| openid | String | 微信OpenID |
| unionid | String | 微信UnionID |
| nickname | String | 用户昵称 |
| avatar | String | 用户头像URL |
| organization | String | 所属监理机构 |
| createdAt | String | 创建时间 |
| updatedAt | String | 更新时间 |
| stats | Object | 统计信息 |
| stats.projectCount | Number | 创建的项目数 |
| stats.logCount | Number | 填写的日志总数 |
| stats.monthLogCount | Number | 本月填写的日志数 |

---

## 2. 更新用户信息

**接口说明**：更新当前登录用户的信息

**请求地址**：`PUT /api/user/info`

**是否需要认证**：是

### 请求参数

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| nickname | String | 否 | 用户昵称 |
| avatar | String | 否 | 用户头像URL |
| organization | String | 否 | 所属监理机构 |

### 请求示例

```javascript
wx.request({
  url: 'https://your-domain.com/api/user/info',
  method: 'PUT',
  header: {
    'Authorization': 'Bearer ' + wx.getStorageSync('token')
  },
  data: {
    nickname: '张三',
    avatar: 'https://example.com/new-avatar.jpg',
    organization: '华建监理有限公司'
  },
  success(res) {
    console.log('更新成功:', res.data)
  }
})
```

### 响应数据

```json
{
  "code": 0,
  "message": "更新成功",
  "data": {},
  "timestamp": 1699200000000
}
```

---

## 3. 获取用户项目列表

**接口说明**：获取当前用户创建的项目列表

**请求地址**：`GET /api/user/projects`

**是否需要认证**：是

### 请求参数

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| page | Number | 否 | 页码，默认1 |
| pageSize | Number | 否 | 每页数量，默认20 |

### 请求示例

```javascript
wx.request({
  url: 'https://your-domain.com/api/user/projects',
  method: 'GET',
  header: {
    'Authorization': 'Bearer ' + wx.getStorageSync('token')
  },
  data: {
    page: 1,
    pageSize: 20
  },
  success(res) {
    console.log('项目列表:', res.data)
  }
})
```

### 响应数据

```json
{
  "code": 0,
  "message": "操作成功",
  "data": {
    "total": 3,
    "page": 1,
    "pageSize": 20,
    "list": [
      {
        "id": 1,
        "projectName": "城市综合体建设项目",
        "projectCode": "CTZH-2024-001",
        "organization": "华建监理有限公司",
        "chiefEngineer": "李建国",
        "address": "上海市浦东新区世纪大道XXX号",
        "startDate": "2024-01-01",
        "endDate": "2024-12-31",
        "createdAt": "2024-01-01T00:00:00.000Z",
        "workCount": 3
      }
    ]
  },
  "timestamp": 1699200000000
}
```

---

## 4. 获取用户日志统计

**接口说明**：获取用户的监理日志统计信息

**请求地址**：`GET /api/user/log-stats`

**是否需要认证**：是

### 请求参数

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| month | String | 否 | 月份（YYYY-MM格式），默认当前月 |

### 请求示例

```javascript
wx.request({
  url: 'https://your-domain.com/api/user/log-stats',
  method: 'GET',
  header: {
    'Authorization': 'Bearer ' + wx.getStorageSync('token')
  },
  data: {
    month: '2024-11'
  },
  success(res) {
    console.log('日志统计:', res.data)
  }
})
```

### 响应数据

```json
{
  "code": 0,
  "message": "操作成功",
  "data": {
    "monthCount": 5,
    "totalCount": 25,
    "submittedCount": 25,
    "pendingCount": 0,
    "passRate": "100%"
  },
  "timestamp": 1699200000000
}
```

### 响应字段说明

| 字段名 | 类型 | 说明 |
|--------|------|------|
| monthCount | Number | 本月日志数 |
| totalCount | Number | 总日志数 |
| submittedCount | Number | 已提交日志数 |
| pendingCount | Number | 待审核日志数 |
| passRate | String | 通过率 |

---

## 错误码说明

| 错误码 | 说明 |
|--------|------|
| 0 | 成功 |
| 400 | 参数错误 |
| 401 | 未授权/Token无效 |
| 500 | 服务器错误 |

