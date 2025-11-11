# 文件上传API文档

## 概述

本文档描述文件上传功能的API接口，支持云托管流式上传直传豆包AI服务。文件上传后，AI可以读取文件内容进行分析和处理。

**云托管自定义域名**: `https://api.yimengpl.com`

---

## 1. 上传文件到豆包（流式上传）

**接口说明**：将文件上传到云托管，通过流式上传方式直传豆包AI服务

**请求地址**：`POST /api/file-upload/doubao`

**是否需要认证**：是

### 请求参数

#### FormData参数

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| file | File | 是 | 文件对象（multipart/form-data） |
| fileName | String | 否 | 文件名（默认使用原文件名） |
| fileType | String | 否 | 文件类型：image/document/video（默认document） |
| fileSize | Number | 否 | 文件大小（字节） |

### 请求示例

```javascript
// 前端使用 uni.uploadFile
uni.uploadFile({
  url: 'https://api.yimengpl.com/api/file-upload/doubao',
  filePath: '/path/to/file.pdf',
  name: 'file',
  formData: {
    fileName: '监理日志.pdf',
    fileType: 'document',
    fileSize: 1024000
  },
  header: {
    'Authorization': 'Bearer ' + token
  },
  success(res) {
    const data = JSON.parse(res.data)
    console.log('上传成功:', data.data)
  }
})
```

### 响应数据

```json
{
  "code": 200,
  "message": "上传成功",
  "data": {
    "fileId": "file_1699200000000_abc12345",
    "fileUrl": "https://example.com/files/file_1699200000000_abc12345.pdf",
    "fileName": "监理日志.pdf",
    "fileType": "document",
    "fileSize": 1024000,
    "uploadTime": "2024-10-21T10:00:00.000Z"
  },
  "timestamp": 1699200000000
}
```

### 响应字段说明

| 字段名 | 类型 | 说明 |
|--------|------|------|
| fileId | String | 文件唯一标识ID |
| fileUrl | String | 文件访问URL |
| fileName | String | 文件名 |
| fileType | String | 文件类型：image/document/video |
| fileSize | Number | 文件大小（字节） |
| uploadTime | String | 上传时间（ISO 8601格式） |

---

## 2. AI对话发送消息（支持文件）

**接口说明**：向AI发送消息，支持携带文件，AI可以读取文件内容

**请求地址**：`POST /api/ai-chat/send`

**是否需要认证**：是

### 请求参数

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| sessionId | String | 是 | 会话ID |
| content | String | 否 | 消息内容（如果只有文件，可以为空） |
| files | Array | 否 | 文件列表，格式见下方 |

#### files数组元素格式

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| fileId | String | 是 | 文件ID（通过上传接口获取） |
| fileUrl | String | 是 | 文件URL |
| fileName | String | 是 | 文件名 |
| fileType | String | 是 | 文件类型：image/document/video |

### 请求示例

```javascript
// 发送纯文本消息
wx.request({
  url: 'https://api.yimengpl.com/api/ai-chat/send',
  method: 'POST',
  header: {
    'Authorization': 'Bearer ' + token,
    'Content-Type': 'application/json'
  },
  data: {
    sessionId: 'session_1699200000000_abc12345',
    content: '请帮我分析这个文件'
  }
})

// 发送带文件的消息
wx.request({
  url: 'https://api.yimengpl.com/api/ai-chat/send',
  method: 'POST',
  header: {
    'Authorization': 'Bearer ' + token,
    'Content-Type': 'application/json'
  },
  data: {
    sessionId: 'session_1699200000000_abc12345',
    content: '请帮我分析这个监理日志文件',
    files: [
      {
        fileId: 'file_1699200000000_abc12345',
        fileUrl: 'https://example.com/files/file_1699200000000_abc12345.pdf',
        fileName: '监理日志.pdf',
        fileType: 'document'
      }
    ]
  }
})

// 只发送文件（无文本内容）
wx.request({
  url: 'https://api.yimengpl.com/api/ai-chat/send',
  method: 'POST',
  header: {
    'Authorization': 'Bearer ' + token,
    'Content-Type': 'application/json'
  },
  data: {
    sessionId: 'session_1699200000000_abc12345',
    content: '',
    files: [
      {
        fileId: 'file_1699200000000_abc12345',
        fileUrl: 'https://example.com/files/file_1699200000000_abc12345.pdf',
        fileName: '监理日志.pdf',
        fileType: 'document'
      }
    ]
  }
})
```

### 响应数据

```json
{
  "code": 200,
  "message": "操作成功",
  "data": {
    "sessionId": "session_1699200000000_abc12345",
    "messageId": 123,
    "aiReply": "我已经分析了您上传的监理日志文件。根据文件内容，我发现了以下要点：\n\n1. 工程进度正常...\n2. 安全措施到位...\n\n建议：..."
  },
  "timestamp": 1699200000000
}
```

### 响应字段说明

| 字段名 | 类型 | 说明 |
|--------|------|------|
| sessionId | String | 会话ID |
| messageId | Number | 消息ID |
| aiReply | String | AI的回复内容（已包含对文件的分析） |

---

## 后端实现要求

### 1. 文件上传接口实现

#### 接口路径
```
POST /api/file-upload/doubao
```

#### 实现要点

1. **接收文件上传**
   - 使用 `multipart/form-data` 格式接收文件
   - 文件字段名为 `file`
   - 同时接收 `fileName`、`fileType`、`fileSize` 等元数据

2. **文件存储**
   - 将文件存储到云存储（如腾讯云COS、阿里云OSS等）
   - 生成唯一的 `fileId`
   - 返回文件的访问URL

3. **流式上传到豆包**
   - 使用豆包AI的文件上传API
   - 支持流式上传，避免大文件占用过多内存
   - 获取豆包返回的文件ID或URL

4. **数据库记录**
   - 保存文件信息到数据库
   - 记录：fileId, fileUrl, fileName, fileType, fileSize, uploadTime, userId

#### 代码示例（Node.js/Express）

```javascript
const multer = require('multer')
const upload = multer({ storage: multer.memoryStorage() })

// 上传文件到豆包
router.post('/api/file-upload/doubao', authenticate, upload.single('file'), async (req, res) => {
  try {
    const { fileName, fileType, fileSize } = req.body
    const file = req.file
    
    if (!file) {
      return res.status(400).json({
        code: 400,
        message: '文件不能为空'
      })
    }
    
    // 1. 上传到云存储
    const cloudFileUrl = await uploadToCloudStorage(file.buffer, fileName)
    
    // 2. 流式上传到豆包
    const doubaoFileId = await uploadToDoubao(file.buffer, fileName)
    
    // 3. 生成文件ID
    const fileId = `file_${Date.now()}_${generateRandomString()}`
    
    // 4. 保存到数据库
    await db.files.create({
      fileId,
      fileUrl: cloudFileUrl,
      fileName: fileName || file.originalname,
      fileType: fileType || 'document',
      fileSize: fileSize || file.size,
      doubaoFileId,
      userId: req.user.id,
      uploadTime: new Date()
    })
    
    res.json({
      code: 200,
      message: '上传成功',
      data: {
        fileId,
        fileUrl: cloudFileUrl,
        fileName: fileName || file.originalname,
        fileType: fileType || 'document',
        fileSize: fileSize || file.size,
        uploadTime: new Date().toISOString()
      }
    })
  } catch (error) {
    console.error('文件上传失败:', error)
    res.status(500).json({
      code: 500,
      message: '文件上传失败：' + error.message
    })
  }
})

// 流式上传到豆包
async function uploadToDoubao(fileBuffer, fileName) {
  const FormData = require('form-data')
  const axios = require('axios')
  
  const form = new FormData()
  form.append('file', fileBuffer, fileName)
  
  const response = await axios.post('https://ark.cn-beijing.volces.com/api/v3/files', form, {
    headers: {
      ...form.getHeaders(),
      'Authorization': `Bearer ${DOUBAO_API_KEY}`
    },
    maxContentLength: Infinity,
    maxBodyLength: Infinity
  })
  
  return response.data.id // 返回豆包的文件ID
}
```

### 2. AI对话接口增强

#### 接口路径
```
POST /api/ai-chat/send
```

#### 实现要点

1. **接收文件参数**
   - `files` 数组包含文件信息
   - 验证文件是否存在（通过fileId查询数据库）

2. **调用豆包AI**
   - 如果包含文件，将文件ID传递给豆包API
   - 豆包会自动读取文件内容
   - 将文件内容与用户消息一起发送给AI

3. **返回AI回复**
   - AI回复中应包含对文件的分析结果

#### 代码示例（Node.js/Express）

```javascript
router.post('/api/ai-chat/send', authenticate, async (req, res) => {
  try {
    const { sessionId, content, files } = req.body
    
    if (!sessionId) {
      return res.status(400).json({
        code: 400,
        message: '会话ID不能为空'
      })
    }
    
    // 验证文件是否存在
    if (files && files.length > 0) {
      for (const file of files) {
        const fileRecord = await db.files.findOne({
          where: { fileId: file.fileId, userId: req.user.id }
        })
        
        if (!fileRecord) {
          return res.status(404).json({
            code: 404,
            message: `文件不存在：${file.fileName}`
          })
        }
      }
    }
    
    // 构建消息内容
    let messageContent = content || ''
    
    // 如果有文件，将文件ID传递给豆包
    const fileIds = files ? files.map(f => {
      // 从数据库获取豆包文件ID
      return db.files.findOne({
        where: { fileId: f.fileId }
      }).then(record => record.doubaoFileId)
    }) : []
    
    const resolvedFileIds = await Promise.all(fileIds)
    
    // 调用豆包AI API
    const aiResponse = await callDoubaoAI({
      sessionId,
      content: messageContent,
      fileIds: resolvedFileIds.filter(id => id) // 过滤掉null值
    })
    
    // 保存消息到数据库
    const message = await db.messages.create({
      sessionId,
      userId: req.user.id,
      messageType: 'user',
      content: messageContent,
      files: files ? JSON.stringify(files) : null,
      createdAt: new Date()
    })
    
    const aiMessage = await db.messages.create({
      sessionId,
      userId: req.user.id,
      messageType: 'ai',
      content: aiResponse.content,
      createdAt: new Date()
    })
    
    res.json({
      code: 200,
      message: '操作成功',
      data: {
        sessionId,
        messageId: message.id,
        aiReply: aiResponse.content
      }
    })
  } catch (error) {
    console.error('发送消息失败:', error)
    res.status(500).json({
      code: 500,
      message: '发送消息失败：' + error.message
    })
  }
})

// 调用豆包AI
async function callDoubaoAI({ sessionId, content, fileIds }) {
  const axios = require('axios')
  
  const messages = [
    {
      role: 'user',
      content: content,
      // 如果有文件，添加文件附件
      attachments: fileIds.length > 0 ? fileIds.map(fileId => ({
        type: 'file',
        file_id: fileId
      })) : undefined
    }
  ]
  
  const response = await axios.post(
    'https://ark.cn-beijing.volces.com/api/v3/chat/completions',
    {
      model: 'doubao-pro-4k',
      messages,
      stream: false
    },
    {
      headers: {
        'Authorization': `Bearer ${DOUBAO_API_KEY}`,
        'Content-Type': 'application/json'
      }
    }
  )
  
  return {
    content: response.data.choices[0].message.content
  }
}
```

---

## 支持的文件类型

### 文档类型（document）
- PDF: `.pdf`
- Word: `.doc`, `.docx`
- Excel: `.xls`, `.xlsx`
- PowerPoint: `.ppt`, `.pptx`
- 文本: `.txt`, `.md`

### 图片类型（image）
- JPEG: `.jpg`, `.jpeg`
- PNG: `.png`
- GIF: `.gif`
- WebP: `.webp`

### 视频类型（video）
- MP4: `.mp4`
- AVI: `.avi`
- MOV: `.mov`
- WMV: `.wmv`

---

## 文件大小限制

- **单个文件最大**: 20MB
- **单次上传文件数**: 最多5个
- **建议大小**: 单个文件不超过10MB，以确保上传速度和AI处理效率

---

## 错误码说明

| 错误码 | 说明 |
|--------|------|
| 200 | 成功 |
| 400 | 参数错误/文件格式不支持 |
| 401 | 未授权/Token无效 |
| 404 | 文件不存在 |
| 413 | 文件过大 |
| 500 | 服务器错误/上传失败/AI服务异常 |

---

## 注意事项

1. **文件上传流程**：
   - 前端先选择文件
   - 调用上传接口上传到云存储
   - 后端同时上传到豆包AI
   - 返回文件信息给前端
   - 前端在发送消息时携带文件信息

2. **文件存储**：
   - 文件存储在云存储中，确保可访问性
   - 同时保存豆包的文件ID，用于AI读取

3. **AI文件读取**：
   - 豆包AI会自动读取文件内容
   - 支持多种文件格式的解析
   - 文件内容会作为上下文传递给AI

4. **安全性**：
   - 所有接口都需要Token认证
   - 文件上传需要验证用户权限
   - 文件访问需要权限验证

5. **性能优化**：
   - 使用流式上传，避免大文件占用内存
   - 文件上传和AI调用异步处理
   - 支持文件上传进度回调（可选）

---

## 测试建议

### 功能测试

1. **文件上传测试**
   - 上传各种格式的文件
   - 测试文件大小限制
   - 测试多文件上传
   - 验证文件信息返回

2. **AI文件读取测试**
   - 发送带文件的消息
   - 验证AI是否读取了文件内容
   - 测试AI对文件的分析能力

3. **错误场景测试**
   - 未登录上传：验证401错误
   - 文件过大：验证413错误
   - 文件格式不支持：验证400错误
   - 网络异常：验证错误处理

### 测试代码示例

```javascript
// 测试文件上传
async function testFileUpload() {
  const filePath = '/path/to/test.pdf'
  
  try {
    const result = await uploadFileToDoubao(filePath, {
      fileName: '测试文件.pdf',
      fileType: 'document'
    })
    
    console.log('上传成功:', result)
    return result
  } catch (error) {
    console.error('上传失败:', error)
  }
}

// 测试AI文件读取
async function testAIFileRead() {
  const file = await testFileUpload()
  
  try {
    const response = await sendAIChatMessage({
      sessionId: 'test_session',
      content: '请分析这个文件',
      files: [{
        fileId: file.fileId,
        fileUrl: file.fileUrl,
        fileName: file.fileName,
        fileType: file.fileType
      }]
    })
    
    console.log('AI回复:', response.aiReply)
  } catch (error) {
    console.error('发送失败:', error)
  }
}
```

---

**最后更新**：2024-11-08

