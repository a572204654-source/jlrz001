# 项目管理API文档

## 1. 获取项目列表

**接口说明**：获取项目列表，支持关键词搜索

**请求地址**：`GET /api/projects`

**是否需要认证**：是

### 请求参数

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| page | Number | 否 | 页码，默认1 |
| pageSize | Number | 否 | 每页数量，默认20 |
| keyword | String | 否 | 搜索关键词（项目名称或编号） |

### 请求示例

```javascript
wx.request({
  url: 'https://your-domain.com/api/projects',
  method: 'GET',
  header: {
    'Authorization': 'Bearer ' + wx.getStorageSync('token')
  },
  data: {
    page: 1,
    pageSize: 20,
    keyword: '综合体'
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
        "description": "上海市浦东新区大型商业综合体项目",
        "address": "上海市浦东新区世纪大道XXX号",
        "startDate": "2024-01-01",
        "endDate": "2024-12-31",
        "creatorId": 1,
        "createdAt": "2024-01-01T00:00:00.000Z",
        "updatedAt": "2024-01-01T00:00:00.000Z",
        "workCount": 3
      }
    ]
  },
  "timestamp": 1699200000000
}
```

---

## 2. 获取项目详情

**接口说明**：获取指定项目的详细信息

**请求地址**：`GET /api/projects/:id`

**是否需要认证**：是

### 请求参数

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| id | Number | 是 | 项目ID（路径参数） |

### 请求示例

```javascript
wx.request({
  url: 'https://your-domain.com/api/projects/1',
  method: 'GET',
  header: {
    'Authorization': 'Bearer ' + wx.getStorageSync('token')
  },
  success(res) {
    console.log('项目详情:', res.data)
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
    "projectName": "城市综合体建设项目",
    "projectCode": "CTZH-2024-001",
    "organization": "华建监理有限公司",
    "chiefEngineer": "李建国",
    "description": "上海市浦东新区大型商业综合体项目，总建筑面积约15万平方米",
    "address": "上海市浦东新区世纪大道XXX号",
    "startDate": "2024-01-01",
    "endDate": "2024-12-31",
    "creatorId": 1,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z",
    "workCount": 3
  },
  "timestamp": 1699200000000
}
```

---

## 3. 新增项目

**接口说明**：创建新项目

**请求地址**：`POST /api/projects`

**是否需要认证**：是

### 请求参数

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| projectName | String | 是 | 项目名称 |
| projectCode | String | 是 | 项目编号（唯一） |
| organization | String | 是 | 监理机构 |
| chiefEngineer | String | 是 | 总监理工程师 |
| description | String | 否 | 项目描述 |
| address | String | 否 | 项目地址 |
| startDate | String | 否 | 开始日期（YYYY-MM-DD） |
| endDate | String | 否 | 结束日期（YYYY-MM-DD） |

### 请求示例

```javascript
wx.request({
  url: 'https://your-domain.com/api/projects',
  method: 'POST',
  header: {
    'Authorization': 'Bearer ' + wx.getStorageSync('token')
  },
  data: {
    projectName: '城市综合体建设项目',
    projectCode: 'CTZH-2024-001',
    organization: '华建监理有限公司',
    chiefEngineer: '李建国',
    description: '上海市浦东新区大型商业综合体项目',
    address: '上海市浦东新区世纪大道XXX号',
    startDate: '2024-01-01',
    endDate: '2024-12-31'
  },
  success(res) {
    console.log('创建成功:', res.data)
  }
})
```

### 响应数据

```json
{
  "code": 0,
  "message": "创建成功",
  "data": {
    "id": 1
  },
  "timestamp": 1699200000000
}
```

---

## 4. 编辑项目

**接口说明**：更新指定项目的信息

**请求地址**：`PUT /api/projects/:id`

**是否需要认证**：是

### 请求参数

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| id | Number | 是 | 项目ID（路径参数） |
| projectName | String | 否 | 项目名称 |
| projectCode | String | 否 | 项目编号 |
| organization | String | 否 | 监理机构 |
| chiefEngineer | String | 否 | 总监理工程师 |
| description | String | 否 | 项目描述 |
| address | String | 否 | 项目地址 |
| startDate | String | 否 | 开始日期 |
| endDate | String | 否 | 结束日期 |

### 请求示例

```javascript
wx.request({
  url: 'https://your-domain.com/api/projects/1',
  method: 'PUT',
  header: {
    'Authorization': 'Bearer ' + wx.getStorageSync('token')
  },
  data: {
    description: '更新后的项目描述'
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

## 5. 删除项目

**接口说明**：删除指定项目（项目下不能有工程）

**请求地址**：`DELETE /api/projects/:id`

**是否需要认证**：是

### 请求参数

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| id | Number | 是 | 项目ID（路径参数） |

### 请求示例

```javascript
wx.request({
  url: 'https://your-domain.com/api/projects/1',
  method: 'DELETE',
  header: {
    'Authorization': 'Bearer ' + wx.getStorageSync('token')
  },
  success(res) {
    console.log('删除成功:', res.data)
  }
})
```

### 响应数据

```json
{
  "code": 0,
  "message": "删除成功",
  "data": {},
  "timestamp": 1699200000000
}
```

---

## 错误码说明

| 错误码 | 说明 |
|--------|------|
| 0 | 成功 |
| 400 | 参数错误/项目编号已存在/项目下存在工程无法删除 |
| 401 | 未授权/Token无效 |
| 404 | 项目不存在 |
| 500 | 服务器错误 |

