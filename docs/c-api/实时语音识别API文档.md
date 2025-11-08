# 实时语音识别API文档

> **说明**: 本文档基于项目实际代码生成，所有接口均已实现并可用

## 📋 目录

- [1. 一句话识别](#1-一句话识别)
- [2. WebSocket流式识别](#2-websocket流式识别)
- [3. 获取识别历史](#3-获取识别历史)
- [4. 删除识别记录](#4-删除识别记录)
- [5. 获取统计信息](#5-获取统计信息)
- [数据结构说明](#数据结构说明)
- [错误码说明](#错误码说明)

---

## 基础信息

**Base URL**: `https://your-domain.com/api/realtime-voice`

**认证方式**: JWT Token（需要登录）

**Content-Type**: `multipart/form-data`（文件上传） 或 `application/json`

---

## 1. 一句话识别

### 接口说明

快速识别60秒以内的短语音，适用于简短的语音输入场景。

### 请求信息

- **接口地址**: `POST /api/realtime-voice/recognize`
- **是否需要认证**: ✅ 是
- **Content-Type**: `multipart/form-data`

### 请求参数

| 参数名 | 类型 | 必填 | 说明 | 默认值 |
|-------|------|------|------|--------|
| audio | File | ✅ 是 | 音频文件 | - |
| engineType | String | ❌ 否 | 识别引擎类型 | 16k_zh |
| filterDirty | Int | ❌ 否 | 过滤脏词(0/1) | 0 |
| filterModal | Int | ❌ 否 | 过滤语气词(0/1) | 0 |
| convertNumMode | Int | ❌ 否 | 数字转换(0/1) | 1 |
| wordInfo | Int | ❌ 否 | 词级别信息(0/1/2) | 2 |

**engineType 可选值**:
- `16k_zh`: 16kHz中文（推荐）
- `8k_zh`: 8kHz中文
- `16k_en`: 16kHz英文

**音频格式支持**:
- PCM (推荐)
- WAV
- MP3

**文件大小限制**: 10MB

### 请求示例

#### 小程序端调用

```javascript
// 录音完成后上传识别
wx.stopRecord({
  success: (res) => {
    const tempFilePath = res.tempFilePath
    
    wx.uploadFile({
      url: 'https://your-domain.com/api/realtime-voice/recognize',
      filePath: tempFilePath,
      name: 'audio',
      header: {
        'token': wx.getStorageSync('token')
      },
      formData: {
        engineType: '16k_zh',
        convertNumMode: 1
      },
      success: (res) => {
        const data = JSON.parse(res.data)
        console.log('识别结果:', data.data.text)
      }
    })
  }
})
```

#### 使用RecorderManager（推荐）

```javascript
// 初始化录音管理器
const recorderManager = wx.getRecorderManager()

// 开始录音
recorderManager.start({
  duration: 60000,      // 60秒
  sampleRate: 16000,    // 16kHz
  numberOfChannels: 1,  // 单声道
  format: 'mp3'         // 格式
})

// 停止录音并上传
recorderManager.onStop((res) => {
  const { tempFilePath } = res
  
  wx.uploadFile({
    url: 'https://your-domain.com/api/realtime-voice/recognize',
    filePath: tempFilePath,
    name: 'audio',
    header: {
      'token': wx.getStorageSync('token')
    },
    formData: {
      engineType: '16k_zh',
      convertNumMode: 1,
      filterModal: 1
    },
    success: (uploadRes) => {
      const result = JSON.parse(uploadRes.data)
      if (result.code === 0) {
        console.log('识别文本:', result.data.text)
        console.log('音频时长:', result.data.audioTime)
      }
    }
  })
})
```

### 响应数据

#### 成功响应

```json
{
  "code": 0,
  "message": "识别成功",
  "data": {
    "id": 123,
    "text": "今天天气晴朗，施工进展顺利",
    "audioTime": 3000,
    "requestId": "abc-123-def"
  },
  "timestamp": 1699200000000
}
```

#### 响应字段说明

| 字段名 | 类型 | 说明 |
|-------|------|------|
| code | Int | 状态码，0表示成功 |
| message | String | 提示消息 |
| data.id | Int | 识别记录ID |
| data.text | String | 识别的文本内容 |
| data.audioTime | Int | 音频时长（毫秒） |
| data.requestId | String | 请求ID（用于追踪） |
| timestamp | Long | 响应时间戳 |

#### 错误响应

```json
{
  "code": 400,
  "message": "请上传音频文件",
  "data": null,
  "timestamp": 1699200000000
}
```

### 使用场景

✅ 监理日志快速填写  
✅ 现场记录语音输入  
✅ 短语音备注  
✅ 表单语音填写

---

## 2. WebSocket流式识别

### 接口说明

实时流式语音识别，支持边录音边识别，适用于长时间语音输入和实时反馈场景。

### 连接信息

- **接口地址**: `wss://your-domain.com/api/realtime-voice/stream`
- **协议**: WebSocket
- **是否需要认证**: ✅ 是

### 消息格式

所有消息均为JSON格式字符串。

### 客户端消息类型

#### 2.1 初始化消息 (start)

建立连接后首先发送初始化消息。

```json
{
  "type": "start",
  "userId": 123,
  "token": "your_jwt_token",
  "engineType": "16k_zh",
  "voiceFormat": 1,
  "needvad": 1,
  "filterDirty": 0,
  "filterModal": 0,
  "convertNumMode": 1,
  "wordInfo": 2,
  "vadSilenceTime": 200
}
```

**参数说明**:

| 参数名 | 类型 | 必填 | 说明 | 默认值 |
|-------|------|------|------|--------|
| type | String | ✅ | 消息类型，固定为"start" | - |
| userId | Int | ✅ | 用户ID | - |
| token | String | ✅ | JWT Token | - |
| engineType | String | ❌ | 识别引擎 | 16k_zh |
| voiceFormat | Int | ❌ | 音频格式(1:pcm 4:wav 6:mp3) | 1 |
| needvad | Int | ❌ | 是否启用VAD(0/1) | 1 |
| filterDirty | Int | ❌ | 过滤脏词(0/1) | 0 |
| filterModal | Int | ❌ | 过滤语气词(0/1) | 0 |
| convertNumMode | Int | ❌ | 数字转换(0/1) | 1 |
| wordInfo | Int | ❌ | 词级别信息(0/1/2) | 2 |
| vadSilenceTime | Int | ❌ | VAD静音时间(ms) | 200 |

#### 2.2 音频数据消息 (audio)

持续发送音频数据帧。

```json
{
  "type": "audio",
  "data": "base64_encoded_audio_data",
  "isEnd": false
}
```

**参数说明**:

| 参数名 | 类型 | 必填 | 说明 |
|-------|------|------|------|
| type | String | ✅ | 消息类型，固定为"audio" |
| data | String | ✅ | Base64编码的音频数据 |
| isEnd | Boolean | ✅ | 是否为最后一帧 |

#### 2.3 停止识别消息 (stop)

主动停止识别。

```json
{
  "type": "stop"
}
```

### 服务器消息类型

#### 2.4 就绪消息 (ready)

服务器连接就绪通知。

```json
{
  "type": "ready",
  "message": "识别服务已就绪"
}
```

#### 2.5 识别结果消息 (result)

实时返回识别结果（中间结果和最终结果）。

```json
{
  "type": "result",
  "voiceId": "1699200000_abc123",
  "text": "今天天气晴朗",
  "isFinal": false,
  "wordList": [
    {
      "word": "今天",
      "start_time": 0,
      "end_time": 500
    },
    {
      "word": "天气",
      "start_time": 500,
      "end_time": 1000
    }
  ]
}
```

**字段说明**:

| 字段名 | 类型 | 说明 |
|-------|------|------|
| type | String | 消息类型 |
| voiceId | String | 语音ID（唯一标识） |
| text | String | 识别的文本 |
| isFinal | Boolean | 是否为最终结果 |
| wordList | Array | 词级别信息数组 |
| wordList[].word | String | 词语 |
| wordList[].start_time | Int | 开始时间(ms) |
| wordList[].end_time | Int | 结束时间(ms) |

#### 2.6 停止确认消息 (stopped)

识别停止确认。

```json
{
  "type": "stopped",
  "message": "识别已停止",
  "logId": 123,
  "text": "今天天气晴朗，施工进展顺利",
  "audioSize": 102400,
  "duration": 5000
}
```

#### 2.7 错误消息 (error)

识别过程中的错误。

```json
{
  "type": "error",
  "message": "识别失败：音频格式不支持"
}
```

### 完整使用示例

```javascript
// ========== 1. 建立WebSocket连接 ==========
const socketTask = wx.connectSocket({
  url: 'wss://your-domain.com/api/realtime-voice/stream'
})

let recognizedText = '' // 存储识别结果

// ========== 2. 连接打开 ==========
socketTask.onOpen(() => {
  console.log('WebSocket已连接')
  
  // 发送初始化消息
  socketTask.send({
    data: JSON.stringify({
      type: 'start',
      userId: wx.getStorageSync('userId'),
      token: wx.getStorageSync('token'),
      engineType: '16k_zh',
      voiceFormat: 1,
      needvad: 1,
      convertNumMode: 1,
      filterModal: 1
    })
  })
})

// ========== 3. 接收服务器消息 ==========
socketTask.onMessage((res) => {
  const message = JSON.parse(res.data)
  
  switch (message.type) {
    case 'ready':
      console.log('识别服务就绪，可以开始录音')
      // 开始录音
      startRecording()
      break
      
    case 'result':
      // 实时显示识别结果
      recognizedText = message.text
      console.log('识别结果:', message.text)
      
      // 更新页面显示
      that.setData({
        recognizedText: message.text
      })
      break
      
    case 'stopped':
      console.log('识别已停止')
      console.log('最终结果:', message.text)
      // 保存识别记录ID
      const logId = message.logId
      break
      
    case 'error':
      console.error('识别错误:', message.message)
      wx.showToast({
        title: message.message,
        icon: 'none'
      })
      break
  }
})

// ========== 4. 录音配置 ==========
const recorderManager = wx.getRecorderManager()

function startRecording() {
  recorderManager.start({
    duration: 60000,       // 60秒
    sampleRate: 16000,     // 16kHz（重要！）
    numberOfChannels: 1,   // 单声道
    encodeBitRate: 48000,
    format: 'pcm',         // PCM格式（实时识别推荐）
    frameSize: 10          // 10KB一帧
  })
}

// ========== 5. 发送音频帧 ==========
recorderManager.onFrameRecorded((res) => {
  const { frameBuffer } = res
  const base64 = wx.arrayBufferToBase64(frameBuffer)
  
  // 发送音频数据
  socketTask.send({
    data: JSON.stringify({
      type: 'audio',
      data: base64,
      isEnd: false
    })
  })
})

// ========== 6. 停止录音 ==========
function stopRecording() {
  recorderManager.stop()
  
  // 发送停止消息
  socketTask.send({
    data: JSON.stringify({
      type: 'stop'
    })
  })
}

// ========== 7. 录音停止回调 ==========
recorderManager.onStop((res) => {
  console.log('录音已停止')
})

// ========== 8. 关闭连接 ==========
function closeConnection() {
  socketTask.close()
}

// ========== 9. 错误处理 ==========
socketTask.onError((err) => {
  console.error('WebSocket错误:', err)
  wx.showToast({
    title: '连接失败',
    icon: 'none'
  })
})

socketTask.onClose(() => {
  console.log('WebSocket已关闭')
})
```

### 流程图

```
小程序                           服务器
  │                               │
  │──── 1. 建立WebSocket连接 ────►│
  │                               │
  │◄──── 2. 连接成功 ──────────────│
  │                               │
  │──── 3. 发送start消息 ─────────►│
  │                               │
  │◄──── 4. 返回ready消息 ─────────│
  │                               │
  │──── 5. 开始录音 ────────────────│
  │                               │
  │──── 6. 持续发送audio消息 ──────►│
  │◄──── 7. 返回result消息 ────────│ (多次)
  │                               │
  │──── 8. 发送stop消息 ──────────►│
  │◄──── 9. 返回stopped消息 ───────│
  │                               │
  │──── 10. 关闭连接 ──────────────│
```

### 注意事项

1. **音频格式**
   - 推荐使用PCM格式，采样率16kHz
   - 必须是单声道
   - 帧大小建议10KB

2. **网络要求**
   - 必须使用WSS（HTTPS）协议
   - 小程序需要配置合法域名

3. **连接管理**
   - 及时关闭不用的连接
   - 处理断线重连
   - 添加心跳机制

4. **性能优化**
   - 不要发送过大的音频帧
   - 控制发送频率
   - 及时释放资源

---

## 3. 获取识别历史

### 接口说明

获取当前用户的语音识别历史记录，支持分页查询。

### 请求信息

- **接口地址**: `GET /api/realtime-voice/history`
- **是否需要认证**: ✅ 是

### 请求参数

| 参数名 | 类型 | 必填 | 说明 | 默认值 |
|-------|------|------|------|--------|
| page | Int | ❌ | 页码 | 1 |
| pageSize | Int | ❌ | 每页数量 | 20 |

### 请求示例

```javascript
wx.request({
  url: 'https://your-domain.com/api/realtime-voice/history',
  method: 'GET',
  header: {
    'token': wx.getStorageSync('token')
  },
  data: {
    page: 1,
    pageSize: 20
  },
  success: (res) => {
    console.log('历史记录:', res.data.data.list)
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
        "id": 123,
        "audioSize": 102400,
        "recognizedText": "今天天气晴朗，施工进展顺利",
        "audioTime": 3000,
        "recognitionType": "realtime",
        "createdAt": "2025-11-08T10:30:00.000Z"
      },
      {
        "id": 122,
        "audioSize": 204800,
        "recognizedText": "安全检查无异常",
        "audioTime": 5000,
        "recognitionType": "stream",
        "createdAt": "2025-11-08T09:15:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "pageSize": 20,
      "total": 150
    }
  },
  "timestamp": 1699200000000
}
```

### 响应字段说明

| 字段名 | 类型 | 说明 |
|-------|------|------|
| list | Array | 历史记录列表 |
| list[].id | Int | 记录ID |
| list[].audioSize | Int | 音频大小（字节） |
| list[].recognizedText | String | 识别文本 |
| list[].audioTime | Int | 音频时长（毫秒） |
| list[].recognitionType | String | 识别类型(realtime/stream) |
| list[].createdAt | String | 创建时间 |
| pagination.page | Int | 当前页码 |
| pagination.pageSize | Int | 每页数量 |
| pagination.total | Int | 总记录数 |

---

## 4. 删除识别记录

### 接口说明

删除指定的识别历史记录（只能删除自己的记录）。

### 请求信息

- **接口地址**: `DELETE /api/realtime-voice/history/:id`
- **是否需要认证**: ✅ 是

### 请求参数

| 参数名 | 类型 | 必填 | 说明 |
|-------|------|------|------|
| id | Int | ✅ | 记录ID（URL路径参数） |

### 请求示例

```javascript
wx.request({
  url: 'https://your-domain.com/api/realtime-voice/history/123',
  method: 'DELETE',
  header: {
    'token': wx.getStorageSync('token')
  },
  success: (res) => {
    if (res.data.code === 0) {
      wx.showToast({
        title: '删除成功'
      })
    }
  }
})
```

### 响应数据

#### 成功响应

```json
{
  "code": 0,
  "message": "删除成功",
  "data": null,
  "timestamp": 1699200000000
}
```

#### 错误响应

```json
{
  "code": 400,
  "message": "记录不存在",
  "data": null,
  "timestamp": 1699200000000
}
```

---

## 5. 获取统计信息

### 接口说明

获取当前用户的语音识别使用统计信息。

### 请求信息

- **接口地址**: `GET /api/realtime-voice/stats`
- **是否需要认证**: ✅ 是

### 请求示例

```javascript
wx.request({
  url: 'https://your-domain.com/api/realtime-voice/stats',
  method: 'GET',
  header: {
    'token': wx.getStorageSync('token')
  },
  success: (res) => {
    console.log('统计信息:', res.data.data)
  }
})
```

### 响应数据

```json
{
  "code": 0,
  "message": "操作成功",
  "data": {
    "totalCount": 500,
    "totalAudioSize": 10485760,
    "totalAudioTime": 150000,
    "todayCount": 20,
    "weekCount": 100,
    "monthCount": 300
  },
  "timestamp": 1699200000000
}
```

### 响应字段说明

| 字段名 | 类型 | 说明 |
|-------|------|------|
| totalCount | Int | 总识别次数 |
| totalAudioSize | Int | 总音频大小（字节） |
| totalAudioTime | Int | 总音频时长（毫秒） |
| todayCount | Int | 今日识别次数 |
| weekCount | Int | 本周识别次数 |
| monthCount | Int | 本月识别次数 |

---

## 数据结构说明

### 识别记录对象

```typescript
interface RecognitionLog {
  id: number                    // 记录ID
  audioSize: number             // 音频大小（字节）
  recognizedText: string        // 识别文本
  audioTime: number             // 音频时长（毫秒）
  recognitionType: string       // 识别类型(realtime/stream)
  createdAt: string             // 创建时间(ISO8601格式)
}
```

### 词级别信息对象

```typescript
interface WordInfo {
  word: string                  // 词语
  start_time: number           // 开始时间（毫秒）
  end_time: number             // 结束时间（毫秒）
}
```

---

## 错误码说明

| 错误码 | 说明 | 解决方案 |
|--------|------|----------|
| 0 | 成功 | - |
| 400 | 参数错误 | 检查请求参数 |
| 401 | 未授权 | 请先登录 |
| 403 | 无权限 | 无权操作该资源 |
| 404 | 资源不存在 | 记录不存在 |
| 500 | 服务器错误 | 联系技术支持 |

### 常见错误示例

```json
{
  "code": 400,
  "message": "请上传音频文件",
  "data": null,
  "timestamp": 1699200000000
}
```

```json
{
  "code": 401,
  "message": "未授权，请先登录",
  "data": null,
  "timestamp": 1699200000000
}
```

```json
{
  "code": 500,
  "message": "语音识别失败",
  "data": null,
  "timestamp": 1699200000000
}
```

---

## 最佳实践

### 1. 音频配置推荐

```javascript
// 一句话识别（短语音）
recorderManager.start({
  duration: 60000,
  sampleRate: 16000,
  numberOfChannels: 1,
  format: 'mp3'
})

// WebSocket流式识别（长语音）
recorderManager.start({
  duration: 60000,
  sampleRate: 16000,
  numberOfChannels: 1,
  format: 'pcm',        // 使用PCM
  frameSize: 10         // 10KB一帧
})
```

### 2. 错误处理

```javascript
wx.uploadFile({
  url: 'https://your-domain.com/api/realtime-voice/recognize',
  filePath: tempFilePath,
  name: 'audio',
  header: {
    'token': wx.getStorageSync('token')
  },
  success: (res) => {
    const data = JSON.parse(res.data)
    if (data.code === 0) {
      // 成功
      console.log(data.data.text)
    } else {
      // 失败
      wx.showToast({
        title: data.message,
        icon: 'none'
      })
    }
  },
  fail: (err) => {
    console.error('上传失败:', err)
    wx.showToast({
      title: '上传失败',
      icon: 'none'
    })
  }
})
```

### 3. 资源清理

```javascript
// 页面卸载时清理
onUnload() {
  if (this.recorderManager) {
    this.recorderManager.stop()
  }
  
  if (this.socketTask) {
    this.socketTask.close()
  }
}
```

---

## 常见问题

### Q1: WebSocket连接失败？

**解决方案**:
1. 检查URL是否正确（wss://）
2. 检查Token是否有效
3. 在小程序管理后台配置合法域名

### Q2: 识别结果不准确？

**优化建议**:
1. 使用16kHz采样率
2. 在安静环境录音
3. 启用VAD和语气词过滤
4. 靠近麦克风说话

### Q3: 音频上传失败？

**检查项**:
1. 文件大小是否超过10MB
2. 音频格式是否支持
3. Token是否有效
4. 网络连接是否正常

---

**文档版本**: v1.0.0  
**最后更新**: 2025-11-08  
**基于代码**: `routes/realtime-voice.js`, `utils/voiceRecognition.js`

