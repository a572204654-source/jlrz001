# C端API文档目录

> **说明**: 本目录包含所有C端（小程序端）API的完整文档，所有文档基于项目实际代码生成，接口均已实现并可用。

---

## 📚 文档列表

### 1. 语音识别功能

#### [实时语音识别API文档.md](./实时语音识别API文档.md) ⭐

**完整的实时语音识别系统文档**

- ✅ 一句话识别（HTTP上传）
- ✅ WebSocket流式识别（实时边说边转）
- ✅ 识别历史记录管理
- ✅ 统计信息查询
- ✅ 完整的小程序示例代码

**适用场景**:
- 监理日志语音输入
- 现场记录语音转文字
- 会议实时记录
- 任何需要语音转文字的场景

**技术亮点**:
- WebSocket双向通信
- 实时流式识别
- 毫秒级延迟
- 智能处理（数字转换、脏词过滤等）

---

### 2. Word文档导出

#### [Word导出API文档.md](./Word导出API文档.md) ⭐

**监理日志Word导出完整文档**

- ✅ 一键导出监理日志为Word文档
- ✅ 标准格式1:1还原
- ✅ 多种使用方式（直接打开、保存、分享）
- ✅ 完整的错误处理
- ✅ 详细的小程序集成示例

**适用场景**:
- 监理日志导出
- 文档归档
- 资料分享
- 离线查看

**文档特点**:
- 完整的封面页和内容页
- 包含所有附件清单
- 支持中文文件名
- 可在Word中继续编辑

#### [Word导出完整代码示例.md](./Word导出完整代码示例.md)

后端Word生成工具的完整代码示例（供参考）。

#### [Word生成工具文档.md](./Word生成工具文档.md)

Word生成工具类的详细技术文档（供参考）。

#### [监理日志Word导出API文档.md](./监理日志Word导出API文档.md)

旧版Word导出API文档（已包含在新文档中）。

---

### 3. 天气查询功能

#### [天气查询API文档.md](./天气查询API文档.md) ⭐

**完整的天气查询系统文档**

- ✅ 获取当前气象信息（监理日志专用）
- ✅ 实时天气查询
- ✅ 逐天天气预报（3/7/10/15/30天）
- ✅ 逐小时天气预报（24/72/168小时）
- ✅ 天气生活指数
- ✅ 空气质量查询
- ✅ 城市搜索
- ✅ 天气预警
- ✅ 综合天气信息

**适用场景**:
- 监理日志自动填写天气
- 天气展示页面
- 施工计划参考
- 安全提醒

**技术特点**:
- 智能缓存（5分钟）
- 自动降级（API失败时使用模拟数据）
- 格式化输出（可直接填入表单）
- 支持多种数据源

---

## 🚀 快速开始

### 1. 认证说明

大部分接口需要JWT Token认证：

```javascript
// 获取Token
const token = wx.getStorageSync('token')

// 使用Token
wx.request({
  url: 'https://your-domain.com/api/...',
  header: {
    'token': token
    // 或使用: 'Authorization': `Bearer ${token}`
  }
})
```

### 2. 基础URL

```
生产环境: https://your-domain.com
开发环境: http://localhost:80
```

### 3. 响应格式

所有接口统一返回格式：

```json
{
  "code": 0,              // 0表示成功，其他表示错误
  "message": "操作成功",   // 提示消息
  "data": {},             // 响应数据
  "timestamp": 1699200000000  // 时间戳
}
```

---

## 📋 接口速查

### 实时语音识别

| 接口 | 方法 | 路径 | 说明 |
|-----|------|------|------|
| 一句话识别 | POST | `/api/realtime-voice/recognize` | 上传音频文件快速识别 |
| 流式识别 | WS | `/api/realtime-voice/stream` | WebSocket实时识别 |
| 识别历史 | GET | `/api/realtime-voice/history` | 获取历史记录 |
| 删除记录 | DELETE | `/api/realtime-voice/history/:id` | 删除指定记录 |
| 统计信息 | GET | `/api/realtime-voice/stats` | 获取使用统计 |

### Word文档导出

| 接口 | 方法 | 路径 | 说明 |
|-----|------|------|------|
| 导出Word | GET | `/api/supervision-logs/:id/export` | 导出监理日志为Word |

### 天气查询

| 接口 | 方法 | 路径 | 说明 |
|-----|------|------|------|
| 当前气象 | GET | `/api/v1/weather/current` | 监理日志专用（需认证） |
| 实时天气 | GET | `/api/weather/now` | 实时天气详细数据 |
| 逐天预报 | GET | `/api/weather/daily` | 3-30天预报 |
| 逐小时预报 | GET | `/api/weather/hourly` | 24-168小时预报 |
| 生活指数 | GET | `/api/weather/indices` | 运动、洗车等指数 |
| 空气质量 | GET | `/api/weather/air` | AQI、PM2.5等 |
| 城市搜索 | GET | `/api/weather/city/search` | 搜索城市ID |
| 天气预警 | GET | `/api/weather/warning` | 预警信息 |
| 综合信息 | GET | `/api/weather/comprehensive` | 一次获取全部数据 |

---

## 💡 使用示例

### 示例1: 监理日志快速填写

```javascript
Page({
  data: {
    formData: {
      weather: '',
      content: ''
    }
  },

  /**
   * 一键获取天气
   */
  async getWeather() {
    wx.showLoading({ title: '获取中...' })

    try {
      // 1. 获取位置
      const location = await new Promise((resolve, reject) => {
        wx.getLocation({
          type: 'gcj02',
          success: resolve,
          fail: reject
        })
      })

      // 2. 获取天气
      const res = await new Promise((resolve, reject) => {
        wx.request({
          url: 'https://your-domain.com/api/v1/weather/current',
          header: { 'token': wx.getStorageSync('token') },
          data: {
            latitude: location.latitude,
            longitude: location.longitude
          },
          success: resolve,
          fail: reject
        })
      })

      // 3. 填入表单
      if (res.data.code === 0) {
        this.setData({
          'formData.weather': res.data.data.weather
        })
        wx.showToast({ title: '获取成功' })
      }

    } catch (err) {
      wx.showToast({
        title: '获取失败',
        icon: 'none'
      })
    } finally {
      wx.hideLoading()
    }
  },

  /**
   * 语音输入工程内容
   */
  voiceInput() {
    const recorderManager = wx.getRecorderManager()

    // 开始录音
    recorderManager.start({
      duration: 60000,
      sampleRate: 16000,
      format: 'mp3'
    })

    // 停止录音并识别
    recorderManager.onStop((res) => {
      wx.uploadFile({
        url: 'https://your-domain.com/api/realtime-voice/recognize',
        filePath: res.tempFilePath,
        name: 'audio',
        header: {
          'token': wx.getStorageSync('token')
        },
        formData: {
          convertNumMode: 1,
          filterModal: 1
        },
        success: (uploadRes) => {
          const result = JSON.parse(uploadRes.data)
          if (result.code === 0) {
            // 填入表单
            this.setData({
              'formData.content': result.data.text
            })
          }
        }
      })
    })
  },

  /**
   * 导出Word文档
   */
  exportWord() {
    const logId = this.data.logId

    wx.downloadFile({
      url: `https://your-domain.com/api/supervision-logs/${logId}/export`,
      header: {
        'token': wx.getStorageSync('token')
      },
      success: (res) => {
        if (res.statusCode === 200) {
          wx.openDocument({
            filePath: res.tempFilePath,
            fileType: 'docx',
            showMenu: true
          })
        }
      }
    })
  }
})
```

---

## 🔧 开发工具

### 小程序配置

在 `app.json` 中配置：

```json
{
  "permission": {
    "scope.record": {
      "desc": "需要使用您的录音权限进行语音识别"
    },
    "scope.userLocation": {
      "desc": "需要获取您的位置信息以查询天气"
    }
  }
}
```

### 域名配置

在微信公众平台配置合法域名：

```
request合法域名:
- https://your-domain.com

uploadFile合法域名:
- https://your-domain.com

downloadFile合法域名:
- https://your-domain.com
```

### 开发环境设置

微信开发者工具 → 详情 → 本地设置：

- ☑️ 不校验合法域名、web-view（业务域名）、TLS 版本以及 HTTPS 证书
- ☑️ 启用调试

---

## ❓ 常见问题

### Q1: 如何处理Token过期？

```javascript
// 统一的错误处理
function handleResponse(res) {
  if (res.data.code === 401) {
    wx.showModal({
      title: '登录已过期',
      content: '请重新登录',
      showCancel: false,
      success: () => {
        wx.removeStorageSync('token')
        wx.reLaunch({
          url: '/pages/login/login'
        })
      }
    })
    return false
  }
  return true
}
```

### Q2: 如何优化请求性能？

1. **使用缓存**
2. **请求合并**（使用综合接口）
3. **预加载数据**
4. **使用防抖/节流**

### Q3: 域名配置问题？

开发环境可以在"详情"中勾选"不校验合法域名"，生产环境必须在微信公众平台配置。

---

## 📞 技术支持

- **接口问题**: 查看对应的详细文档
- **集成问题**: 参考文档中的完整示例
- **Bug反馈**: 联系后端开发团队

---

## 📄 文档信息

- **版本**: v1.0.0
- **最后更新**: 2025-11-08
- **维护**: 开发团队
- **基于代码**: 
  - `routes/realtime-voice.js`
  - `routes/supervision-log.js`
  - `routes/weather.js`
  - `routes/v1/weather.js`
  - `utils/voiceRecognition.js`
  - `utils/wordGenerator.js`

---

## 🎯 功能矩阵

| 功能 | HTTP | WebSocket | 认证 | 缓存 | 降级 |
|-----|:----:|:---------:|:----:|:----:|:----:|
| 一句话识别 | ✅ | ❌ | ✅ | ❌ | ❌ |
| 流式识别 | ❌ | ✅ | ✅ | ❌ | ❌ |
| Word导出 | ✅ | ❌ | ✅ | ❌ | ❌ |
| V1天气 | ✅ | ❌ | ✅ | ✅ | ✅ |
| 通用天气 | ✅ | ❌ | ❌ | ❌ | ❌ |

---

**🎉 祝开发愉快！**

