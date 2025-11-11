# 附件管理API文档

## 1. 上传附件

**接口说明**：上传附件到指定关联对象（监理日志、项目、工程）

**请求地址**：`POST /api/attachments/upload`

**是否需要认证**：是

### 请求参数

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| relatedType | String | 是 | 关联类型：log-监理日志, project-项目, work-工程 |
| relatedId | Number | 是 | 关联ID |
| fileName | String | 是 | 文件名 |
| fileType | String | 是 | 文件类型：image-图片, document-文档, video-视频 |
| fileUrl | String | 是 | 文件URL（云存储地址） |
| fileSize | Number | 否 | 文件大小（字节） |

### 请求示例

```javascript
// 先使用wx.chooseImage或wx.uploadFile上传到云存储
// 然后调用此接口保存附件记录
wx.request({
  url: 'https://your-domain.com/api/attachments/upload',
  method: 'POST',
  header: {
    'Authorization': 'Bearer ' + wx.getStorageSync('token')
  },
  data: {
    relatedType: 'log',
    relatedId: 1,
    fileName: '现场照片1.jpg',
    fileType: 'image',
    fileUrl: 'https://example.com/photo1.jpg',
    fileSize: 1024000
  },
  success(res) {
    console.log('上传成功:', res.data)
  }
})
```

### 响应数据

```json
{
  "code": 0,
  "message": "上传成功",
  "data": {
    "id": 1,
    "fileName": "现场照片1.jpg",
    "fileType": "image",
    "fileUrl": "https://example.com/photo1.jpg",
    "fileSize": 1024000
  },
  "timestamp": 1699200000000
}
```

---

## 2. 获取附件列表

**接口说明**：获取指定关联对象的附件列表

**请求地址**：`GET /api/attachments`

**是否需要认证**：是

### 请求参数

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| relatedType | String | 是 | 关联类型 |
| relatedId | Number | 是 | 关联ID |

### 请求示例

```javascript
wx.request({
  url: 'https://your-domain.com/api/attachments',
  method: 'GET',
  header: {
    'Authorization': 'Bearer ' + wx.getStorageSync('token')
  },
  data: {
    relatedType: 'log',
    relatedId: 1
  },
  success(res) {
    console.log('附件列表:', res.data)
  }
})
```

### 响应数据

```json
{
  "code": 0,
  "message": "操作成功",
  "data": {
    "list": [
      {
        "id": 1,
        "fileName": "现场照片1.jpg",
        "fileType": "image",
        "fileUrl": "https://example.com/photo1.jpg",
        "fileSize": 1024000,
        "createdAt": "2024-10-21T00:00:00.000Z",
        "uploaderName": "张三"
      }
    ]
  },
  "timestamp": 1699200000000
}
```

---

## 3. 获取附件详情

**接口说明**：获取指定附件的详细信息

**请求地址**：`GET /api/attachments/:id`

**是否需要认证**：是

### 请求参数

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| id | Number | 是 | 附件ID（路径参数） |

### 请求示例

```javascript
wx.request({
  url: 'https://your-domain.com/api/attachments/1',
  method: 'GET',
  header: {
    'Authorization': 'Bearer ' + wx.getStorageSync('token')
  },
  success(res) {
    console.log('附件详情:', res.data)
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
    "relatedType": "log",
    "relatedId": 1,
    "fileName": "现场照片1.jpg",
    "fileType": "image",
    "fileUrl": "https://example.com/photo1.jpg",
    "fileSize": 1024000,
    "createdAt": "2024-10-21T00:00:00.000Z",
    "uploaderName": "张三"
  },
  "timestamp": 1699200000000
}
```

---

## 4. 删除附件

**接口说明**：删除指定附件

**请求地址**：`DELETE /api/attachments/:id`

**是否需要认证**：是

### 请求参数

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| id | Number | 是 | 附件ID（路径参数） |

### 请求示例

```javascript
wx.request({
  url: 'https://your-domain.com/api/attachments/1',
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

## 5. 批量删除附件

**接口说明**：批量删除多个附件

**请求地址**：`POST /api/attachments/batch-delete`

**是否需要认证**：是

### 请求参数

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| ids | Array | 是 | 附件ID数组 |

### 请求示例

```javascript
wx.request({
  url: 'https://your-domain.com/api/attachments/batch-delete',
  method: 'POST',
  header: {
    'Authorization': 'Bearer ' + wx.getStorageSync('token')
  },
  data: {
    ids: [1, 2, 3]
  },
  success(res) {
    console.log('批量删除成功:', res.data)
  }
})
```

### 响应数据

```json
{
  "code": 0,
  "message": "批量删除成功",
  "data": {
    "deletedCount": 3
  },
  "timestamp": 1699200000000
}
```

---

## 错误码说明

| 错误码 | 说明 |
|--------|------|
| 0 | 成功 |
| 400 | 参数错误/无效的关联类型 |
| 401 | 未授权/Token无效 |
| 404 | 附件不存在 |
| 500 | 服务器错误 |

---

## 注意事项

1. 文件上传流程：
   - 前端先使用微信小程序API（如`wx.chooseImage`）选择文件
   - 将文件上传到云存储（如腾讯云COS）
   - 获取文件URL后调用本接口保存附件记录

2. 文件类型：
   - image: 图片文件（jpg, png, gif等）
   - document: 文档文件（pdf, doc, docx等）
   - video: 视频文件（mp4, avi等）

3. 文件大小限制：
   - 建议单个文件不超过10MB
   - 具体限制可在系统配置中调整

