# 监理日志API文档

## 1. 获取监理日志列表

**接口说明**：获取监理日志列表，支持多条件筛选

**请求地址**：`GET /api/supervision-logs`

**是否需要认证**：是

### 请求参数

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| projectId | Number | 否 | 项目ID |
| workId | Number | 否 | 工程ID |
| userId | Number | 否 | 用户ID，默认当前用户 |
| startDate | String | 否 | 开始日期（YYYY-MM-DD） |
| endDate | String | 否 | 结束日期（YYYY-MM-DD） |
| page | Number | 否 | 页码，默认1 |
| pageSize | Number | 否 | 每页数量，默认20 |

### 请求示例

```javascript
wx.request({
  url: 'https://your-domain.com/api/supervision-logs',
  method: 'GET',
  header: {
    'Authorization': 'Bearer ' + wx.getStorageSync('token')
  },
  data: {
    projectId: 1,
    workId: 1,
    startDate: '2024-10-01',
    endDate: '2024-10-31',
    page: 1,
    pageSize: 20
  },
  success(res) {
    console.log('监理日志列表:', res.data)
  }
})
```

### 响应数据

```json
{
  "code": 0,
  "message": "操作成功",
  "data": {
    "total": 5,
    "page": 1,
    "pageSize": 20,
    "stats": {
      "monthCount": 5,
      "totalCount": 25
    },
    "list": [
      {
        "id": 1,
        "projectId": 1,
        "projectName": "城市综合体建设项目",
        "workId": 1,
        "workName": "主体结构工程",
        "userId": 1,
        "userName": "张三",
        "logDate": "2024-10-21",
        "logDateText": "2024-10-21",
        "weather": "晴 16-24℃ 南风2级",
        "createdAt": "2024-10-21T00:00:00.000Z"
      }
    ]
  },
  "timestamp": 1699200000000
}
```

---

## 2. 获取监理日志详情

**接口说明**：获取指定监理日志的详细信息，包含附件

**请求地址**：`GET /api/supervision-logs/:id`

**是否需要认证**：是

### 请求参数

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| id | Number | 是 | 日志ID（路径参数） |

### 请求示例

```javascript
wx.request({
  url: 'https://your-domain.com/api/supervision-logs/1',
  method: 'GET',
  header: {
    'Authorization': 'Bearer ' + wx.getStorageSync('token')
  },
  success(res) {
    console.log('监理日志详情:', res.data)
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
    "workId": 1,
    "workName": "主体结构工程",
    "workCode": "CTZH-2024-001-ZTJ",
    "userId": 1,
    "userName": "张三",
    "logDate": "2024-10-21",
    "weather": "晴 16-24℃ 南风2级",
    "projectDynamics": "今日完成主体结构第三层混凝土浇筑...",
    "supervisionWork": "1. 检查模板支撑系统...",
    "safetyWork": "1. 检查高处作业防护措施...",
    "recorderName": "张三",
    "recorderDate": "2024-10-21",
    "reviewerName": "李建国",
    "reviewerDate": "2024-10-22",
    "createdAt": "2024-10-21T00:00:00.000Z",
    "updatedAt": "2024-10-21T00:00:00.000Z",
    "attachments": [
      {
        "id": 1,
        "fileName": "现场照片1.jpg",
        "fileType": "image",
        "fileUrl": "https://example.com/photo1.jpg",
        "fileSize": 1024000,
        "createdAt": "2024-10-21T00:00:00.000Z"
      }
    ]
  },
  "timestamp": 1699200000000
}
```

---

## 3. 新增监理日志

**接口说明**：创建新的监理日志记录

**请求地址**：`POST /api/supervision-logs`

**是否需要认证**：是

### 请求参数

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| projectId | Number | 是 | 项目ID |
| workId | Number | 是 | 工程ID |
| logDate | String | 是 | 日志日期（YYYY-MM-DD） |
| weather | String | 是 | 气象情况 |
| projectDynamics | String | 是 | 工程动态 |
| supervisionWork | String | 是 | 监理工作情况 |
| safetyWork | String | 是 | 安全监理工作情况 |
| recorderName | String | 否 | 记录人姓名 |
| recorderDate | String | 否 | 记录日期（YYYY-MM-DD） |
| reviewerName | String | 否 | 审核人姓名 |
| reviewerDate | String | 否 | 审核日期（YYYY-MM-DD） |

### 请求示例

```javascript
wx.request({
  url: 'https://your-domain.com/api/supervision-logs',
  method: 'POST',
  header: {
    'Authorization': 'Bearer ' + wx.getStorageSync('token')
  },
  data: {
    projectId: 1,
    workId: 1,
    logDate: '2024-10-21',
    weather: '晴 16-24℃ 南风2级',
    projectDynamics: '今日完成主体结构第三层混凝土浇筑...',
    supervisionWork: '1. 检查模板支撑系统...',
    safetyWork: '1. 检查高处作业防护措施...',
    recorderName: '张三',
    recorderDate: '2024-10-21',
    reviewerName: '李建国',
    reviewerDate: '2024-10-22'
  },
  success(res) {
    console.log('保存成功:', res.data)
  }
})
```

### 响应数据

```json
{
  "code": 0,
  "message": "保存成功",
  "data": {
    "id": 1
  },
  "timestamp": 1699200000000
}
```

---

## 4. 编辑监理日志

**接口说明**：更新指定监理日志的信息

**请求地址**：`PUT /api/supervision-logs/:id`

**是否需要认证**：是

### 请求参数

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| id | Number | 是 | 日志ID（路径参数） |
| logDate | String | 否 | 日志日期 |
| weather | String | 否 | 气象情况 |
| projectDynamics | String | 否 | 工程动态 |
| supervisionWork | String | 否 | 监理工作情况 |
| safetyWork | String | 否 | 安全监理工作情况 |
| recorderName | String | 否 | 记录人姓名 |
| recorderDate | String | 否 | 记录日期 |
| reviewerName | String | 否 | 审核人姓名 |
| reviewerDate | String | 否 | 审核日期 |

### 请求示例

```javascript
wx.request({
  url: 'https://your-domain.com/api/supervision-logs/1',
  method: 'PUT',
  header: {
    'Authorization': 'Bearer ' + wx.getStorageSync('token')
  },
  data: {
    projectDynamics: '更新后的工程动态内容'
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

## 5. 删除监理日志

**接口说明**：删除指定监理日志及其附件

**请求地址**：`DELETE /api/supervision-logs/:id`

**是否需要认证**：是

### 请求参数

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| id | Number | 是 | 日志ID（路径参数） |

### 请求示例

```javascript
wx.request({
  url: 'https://your-domain.com/api/supervision-logs/1',
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

## 6. 导出监理日志（Word）

**接口说明**：将监理日志导出为Word文档

**请求地址**：`GET /api/supervision-logs/:id/export`

**是否需要认证**：是

### 请求参数

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| id | Number | 是 | 日志ID（路径参数） |

### 请求示例

```javascript
wx.request({
  url: 'https://your-domain.com/api/supervision-logs/1/export',
  method: 'GET',
  header: {
    'Authorization': 'Bearer ' + wx.getStorageSync('token')
  },
  responseType: 'arraybuffer',
  success(res) {
    // 保存文件到本地
    const fs = wx.getFileSystemManager()
    const filePath = `${wx.env.USER_DATA_PATH}/监理日志_2024-10-21.docx`
    fs.writeFile({
      filePath: filePath,
      data: res.data,
      encoding: 'binary',
      success() {
        wx.openDocument({
          filePath: filePath,
          fileType: 'docx'
        })
      }
    })
  }
})
```

### 响应数据

返回Word文档二进制流

---

## 错误码说明

| 错误码 | 说明 |
|--------|------|
| 0 | 成功 |
| 400 | 参数错误/该工程在此日期已有日志 |
| 401 | 未授权/Token无效 |
| 404 | 日志不存在/项目不存在/工程不存在 |
| 500 | 服务器错误 |

