# 工程管理API文档

## 1. 获取工程列表

**接口说明**：获取工程列表，支持按项目筛选和关键词搜索

**请求地址**：`GET /api/works`

**是否需要认证**：是

### 请求参数

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| projectId | Number | 否 | 项目ID |
| page | Number | 否 | 页码，默认1 |
| pageSize | Number | 否 | 每页数量，默认20 |
| keyword | String | 否 | 搜索关键词（工程名称或编号） |

### 请求示例

```javascript
wx.request({
  url: 'https://your-domain.com/api/works',
  method: 'GET',
  header: {
    'Authorization': 'Bearer ' + wx.getStorageSync('token')
  },
  data: {
    projectId: 1,
    page: 1,
    pageSize: 20
  },
  success(res) {
    console.log('工程列表:', res.data)
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
        "projectId": 1,
        "workName": "主体结构工程",
        "workCode": "CTZH-2024-001-ZTJ",
        "unitWork": "第一施工段",
        "startDate": "2024-01-01",
        "endDate": "2024-06-30",
        "color": "#0d9488",
        "description": "主体结构施工监理",
        "creatorId": 1,
        "createdAt": "2024-01-01T00:00:00.000Z",
        "updatedAt": "2024-01-01T00:00:00.000Z"
      }
    ]
  },
  "timestamp": 1699200000000
}
```

---

## 2. 获取工程详情

**接口说明**：获取指定工程的详细信息

**请求地址**：`GET /api/works/:id`

**是否需要认证**：是

### 请求参数

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| id | Number | 是 | 工程ID（路径参数） |

### 请求示例

```javascript
wx.request({
  url: 'https://your-domain.com/api/works/1',
  method: 'GET',
  header: {
    'Authorization': 'Bearer ' + wx.getStorageSync('token')
  },
  success(res) {
    console.log('工程详情:', res.data)
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
    "projectId": 1,
    "projectName": "城市综合体建设项目",
    "projectCode": "CTZH-2024-001",
    "workName": "主体结构工程",
    "workCode": "CTZH-2024-001-ZTJ",
    "unitWork": "第一施工段",
    "startDate": "2024-01-01",
    "endDate": "2024-06-30",
    "color": "#0d9488",
    "description": "主体结构施工监理",
    "organization": "华建监理有限公司",
    "chiefEngineer": "李建国",
    "creatorId": 1,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  },
  "timestamp": 1699200000000
}
```

---

## 3. 新增工程

**接口说明**：在指定项目下创建新工程

**请求地址**：`POST /api/works`

**是否需要认证**：是

### 请求参数

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| projectId | Number | 是 | 所属项目ID |
| workName | String | 是 | 工程名称 |
| workCode | String | 是 | 工程编号（唯一） |
| unitWork | String | 是 | 单位工程 |
| startDate | String | 否 | 监理日志开始时间（YYYY-MM-DD） |
| endDate | String | 否 | 监理日志结束时间（YYYY-MM-DD） |
| color | String | 否 | 工程标识颜色，默认#0d9488 |
| description | String | 否 | 工程描述 |

### 请求示例

```javascript
wx.request({
  url: 'https://your-domain.com/api/works',
  method: 'POST',
  header: {
    'Authorization': 'Bearer ' + wx.getStorageSync('token')
  },
  data: {
    projectId: 1,
    workName: '主体结构工程',
    workCode: 'CTZH-2024-001-ZTJ',
    unitWork: '第一施工段',
    startDate: '2024-01-01',
    endDate: '2024-06-30',
    color: '#0d9488',
    description: '主体结构施工监理'
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

## 4. 编辑工程

**接口说明**：更新指定工程的信息

**请求地址**：`PUT /api/works/:id`

**是否需要认证**：是

### 请求参数

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| id | Number | 是 | 工程ID（路径参数） |
| workName | String | 否 | 工程名称 |
| workCode | String | 否 | 工程编号 |
| unitWork | String | 否 | 单位工程 |
| startDate | String | 否 | 监理日志开始时间 |
| endDate | String | 否 | 监理日志结束时间 |
| color | String | 否 | 工程标识颜色 |
| description | String | 否 | 工程描述 |

### 请求示例

```javascript
wx.request({
  url: 'https://your-domain.com/api/works/1',
  method: 'PUT',
  header: {
    'Authorization': 'Bearer ' + wx.getStorageSync('token')
  },
  data: {
    description: '更新后的工程描述'
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

## 5. 删除工程

**接口说明**：删除指定工程（工程下不能有监理日志）

**请求地址**：`DELETE /api/works/:id`

**是否需要认证**：是

### 请求参数

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| id | Number | 是 | 工程ID（路径参数） |

### 请求示例

```javascript
wx.request({
  url: 'https://your-domain.com/api/works/1',
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
| 400 | 参数错误/工程编号已存在/工程下存在日志无法删除 |
| 401 | 未授权/Token无效 |
| 404 | 工程不存在/项目不存在 |
| 500 | 服务器错误 |

