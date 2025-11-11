# AI对话API文档

## 1. 创建新会话

**接口说明**：创建一个新的AI对话会话

**请求地址**：`POST /api/ai-chat/session`

**是否需要认证**：是

### 请求参数

无

### 请求示例

```javascript
wx.request({
  url: 'https://your-domain.com/api/ai-chat/session',
  method: 'POST',
  header: {
    'Authorization': 'Bearer ' + wx.getStorageSync('token')
  },
  success(res) {
    console.log('会话创建成功:', res.data)
    // 保存sessionId用于后续对话
    const sessionId = res.data.data.sessionId
  }
})
```

### 响应数据

```json
{
  "code": 0,
  "message": "操作成功",
  "data": {
    "sessionId": "session_1699200000000_abc12345"
  },
  "timestamp": 1699200000000
}
```

---

## 2. 发送消息

**接口说明**：向AI发送消息并获取回复

**请求地址**：`POST /api/ai-chat/send`

**是否需要认证**：是

### 请求参数

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| sessionId | String | 是 | 会话ID |
| content | String | 是 | 消息内容 |

### 请求示例

```javascript
wx.request({
  url: 'https://your-domain.com/api/ai-chat/send',
  method: 'POST',
  header: {
    'Authorization': 'Bearer ' + wx.getStorageSync('token')
  },
  data: {
    sessionId: 'session_1699200000000_abc12345',
    content: '帮我优化今天的监理日志内容'
  },
  success(res) {
    console.log('AI回复:', res.data.data.aiReply)
  }
})
```

### 响应数据

```json
{
  "code": 0,
  "message": "操作成功",
  "data": {
    "sessionId": "session_1699200000000_abc12345",
    "messageId": 123,
    "aiReply": "好的，我来帮您优化监理日志内容。请提供您今天记录的具体内容，我会从专业角度为您完善..."
  },
  "timestamp": 1699200000000
}
```

### 响应字段说明

| 字段名 | 类型 | 说明 |
|--------|------|------|
| sessionId | String | 会话ID |
| messageId | Number | 消息ID |
| aiReply | String | AI的回复内容 |

---

## 3. 获取对话历史

**接口说明**：获取指定会话的对话历史记录

**请求地址**：`GET /api/ai-chat/history`

**是否需要认证**：是

### 请求参数

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| sessionId | String | 是 | 会话ID |
| page | Number | 否 | 页码，默认1 |
| pageSize | Number | 否 | 每页数量，默认50 |

### 请求示例

```javascript
wx.request({
  url: 'https://your-domain.com/api/ai-chat/history',
  method: 'GET',
  header: {
    'Authorization': 'Bearer ' + wx.getStorageSync('token')
  },
  data: {
    sessionId: 'session_1699200000000_abc12345',
    page: 1,
    pageSize: 50
  },
  success(res) {
    console.log('对话历史:', res.data)
  }
})
```

### 响应数据

```json
{
  "code": 0,
  "message": "操作成功",
  "data": {
    "sessionId": "session_1699200000000_abc12345",
    "total": 10,
    "list": [
      {
        "id": 1,
        "messageType": "user",
        "content": "帮我优化今天的监理日志内容",
        "createdAt": "2024-10-21T10:00:00.000Z"
      },
      {
        "id": 2,
        "messageType": "ai",
        "content": "好的，我来帮您优化监理日志内容...",
        "createdAt": "2024-10-21T10:00:05.000Z"
      }
    ]
  },
  "timestamp": 1699200000000
}
```

### 响应字段说明

| 字段名 | 类型 | 说明 |
|--------|------|------|
| messageType | String | 消息类型：user-用户消息, ai-AI回复 |
| content | String | 消息内容 |
| createdAt | String | 创建时间 |

---

## 4. 获取会话列表

**接口说明**：获取当前用户的所有AI对话会话列表

**请求地址**：`GET /api/ai-chat/sessions`

**是否需要认证**：是

### 请求参数

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| page | Number | 否 | 页码，默认1 |
| pageSize | Number | 否 | 每页数量，默认20 |

### 请求示例

```javascript
wx.request({
  url: 'https://your-domain.com/api/ai-chat/sessions',
  method: 'GET',
  header: {
    'Authorization': 'Bearer ' + wx.getStorageSync('token')
  },
  data: {
    page: 1,
    pageSize: 20
  },
  success(res) {
    console.log('会话列表:', res.data)
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
    "list": [
      {
        "sessionId": "session_1699200000000_abc12345",
        "messageCount": 10,
        "lastMessageTime": "2024-10-21T10:00:00.000Z",
        "lastUserMessage": "帮我优化今天的监理日志内容"
      }
    ]
  },
  "timestamp": 1699200000000
}
```

### 响应字段说明

| 字段名 | 类型 | 说明 |
|--------|------|------|
| sessionId | String | 会话ID |
| messageCount | Number | 消息数量 |
| lastMessageTime | String | 最后消息时间 |
| lastUserMessage | String | 最后一条用户消息 |

---

## 5. 删除会话

**接口说明**：删除指定会话及其所有消息记录

**请求地址**：`DELETE /api/ai-chat/session/:sessionId`

**是否需要认证**：是

### 请求参数

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| sessionId | String | 是 | 会话ID（路径参数） |

### 请求示例

```javascript
wx.request({
  url: 'https://your-domain.com/api/ai-chat/session/session_1699200000000_abc12345',
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
| 400 | 参数错误 |
| 401 | 未授权/Token无效 |
| 500 | 服务器错误/AI服务异常 |

## AI服务降级说明

当豆包AI服务不可用时，系统会自动进行服务降级，返回友好的错误提示信息：

| 错误类型 | 提示信息 |
|---------|---------|
| 配置未完成 | 抱歉，AI对话服务尚未配置完成。请联系管理员配置豆包AI相关参数。 |
| 响应超时 | 抱歉，AI服务响应超时，请稍后再试。如果问题持续存在，请联系技术支持。 |
| 认证失败 | 抱歉，AI服务认证失败。请联系管理员检查API密钥配置。 |
| 请求频繁 | 抱歉，AI服务请求过于频繁，请稍后再试。 |
| 服务异常 | 抱歉，AI服务暂时不可用，请稍后再试。 |
| 网络错误 | 抱歉，无法连接到AI服务。请检查网络连接或稍后再试。 |
| 通用错误 | 抱歉，AI服务暂时遇到了一些问题。请稍后再试，或联系技术支持寻求帮助。 |

### 降级响应示例

```json
{
  "code": 0,
  "message": "操作成功",
  "data": {
    "sessionId": "session_1699200000000_abc12345",
    "messageId": 123,
    "aiReply": "抱歉，AI服务暂时不可用，请稍后再试。"
  },
  "timestamp": 1699200000000
}
```

**注意**：
- 即使AI服务不可用，接口仍然返回 `code: 0`，表示请求处理成功
- 用户消息已正常保存到数据库
- `aiReply` 字段包含友好的错误提示信息
- 前端应根据 `aiReply` 内容判断是否为降级响应，并给予相应的UI提示

---

## 注意事项

1. **会话管理**：
   - 每次开始新对话前建议创建新会话
   - 会话ID用于关联整个对话上下文
   - 定期清理不再需要的会话记录

2. **对话上下文**：
   - AI会自动记住同一会话中的历史对话
   - 上下文保留最近10轮对话
   - 切换会话时上下文会重置

3. **内容限制**：
   - 单次消息内容建议不超过2000字
   - 过长内容可能影响AI响应质量

4. **API提供商**：
   - 当前使用豆包AI（Doubao）作为AI服务提供商
   - 如API调用失败，系统会自动降级并返回友好的错误提示
   - 服务降级不影响用户消息的保存

5. **环境配置**：
   - 需要在环境变量中配置以下参数：
     - `DOUBAO_API_KEY`: 豆包AI的API密钥
     - `DOUBAO_ENDPOINT_ID`: 推理接入点ID
     - `DOUBAO_API_URL`: API地址（可选，默认为北京节点）
   - 配置方法请参考项目README文档

6. **性能优化**：
   - API调用超时时间为5秒，避免长时间等待
   - 对话上下文限制为最近10轮，控制token消耗
   - 建议在前端实现请求防抖，避免频繁调用

