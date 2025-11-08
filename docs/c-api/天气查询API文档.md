# 天气查询API文档

> **说明**: 本文档基于项目实际代码生成，所有接口均已实现并可用

## 📋 目录

- [1. 获取当前气象信息](#1-获取当前气象信息)
- [2. 获取实时天气](#2-获取实时天气)
- [3. 获取逐天天气预报](#3-获取逐天天气预报)
- [4. 获取逐小时天气预报](#4-获取逐小时天气预报)
- [5. 获取天气生活指数](#5-获取天气生活指数)
- [6. 获取空气质量](#6-获取空气质量)
- [7. 城市搜索](#7-城市搜索)
- [8. 获取天气预警](#8-获取天气预警)
- [9. 获取综合天气信息](#9-获取综合天气信息)
- [错误码说明](#错误码说明)
- [常见问题](#常见问题)

---

## 基础信息

**Base URL**: 
- V1版本（监理日志专用）: `https://your-domain.com/api/v1/weather`
- 通用版本（和风天气）: `https://your-domain.com/api/weather`

**认证方式**: 
- V1版本: ✅ 需要JWT Token
- 通用版本: ❌ 不需要认证

---

## 1. 获取当前气象信息

### 接口说明

获取指定经纬度位置的当前气象信息，专为监理日志设计，返回格式化的天气字符串。

### 请求信息

- **接口地址**: `GET /api/v1/weather/current`
- **是否需要认证**: ✅ 是
- **适用场景**: 监理日志填写

### 请求参数

| 参数名 | 类型 | 必填 | 说明 | 示例 |
|-------|------|------|------|------|
| latitude | Number | ✅ | 纬度（-90到90） | 39.92 |
| longitude | Number | ✅ | 经度（-180到180） | 116.41 |

### 请求示例

```javascript
// 1. 先获取用户位置
wx.getLocation({
  type: 'gcj02',
  success: (location) => {
    // 2. 调用天气接口
    wx.request({
      url: 'https://your-domain.com/api/v1/weather/current',
      method: 'GET',
      header: {
        'token': wx.getStorageSync('token')
      },
      data: {
        latitude: location.latitude,
        longitude: location.longitude
      },
      success: (res) => {
        if (res.data.code === 0) {
          console.log('气象信息:', res.data.data.weather)
          
          // 直接应用到监理日志表单
          this.setData({
            'formData.weather': res.data.data.weather
          })
        }
      }
    })
  }
})
```

### 响应数据

```json
{
  "code": 0,
  "message": "操作成功",
  "data": {
    "weather": "晴，16-24℃",
    "weatherText": "晴",
    "temperature": 20,
    "temperatureMin": 16,
    "temperatureMax": 24,
    "humidity": 65,
    "windDirection": "南风",
    "windScale": "2",
    "updateTime": "2025-11-08T10:00:00.000Z"
  },
  "timestamp": 1699200000000
}
```

### 响应字段说明

| 字段名 | 类型 | 说明 |
|-------|------|------|
| weather | String | **格式化气象字符串**（可直接用于监理日志） |
| weatherText | String | 天气描述（晴、多云、阴、小雨等） |
| temperature | Number | 当前温度（℃） |
| temperatureMin | Number | 最低温度（℃） |
| temperatureMax | Number | 最高温度（℃） |
| humidity | Number | 湿度（%） |
| windDirection | String | 风向 |
| windScale | String | 风力等级 |
| updateTime | String | 更新时间（ISO8601格式） |

### 特点说明

1. **智能缓存**: 5分钟内相同位置共享缓存，减少API调用
2. **自动降级**: API失败时自动使用模拟数据
3. **格式化输出**: `weather`字段可直接填入监理日志
4. **快速响应**: 平均响应时间 < 500ms

---

## 2. 获取实时天气

### 接口说明

获取指定位置的实时天气详细数据（和风天气标准接口）。

### 请求信息

- **接口地址**: `GET /api/weather/now`
- **是否需要认证**: ❌ 否

### 请求参数

| 参数名 | 类型 | 必填 | 说明 | 示例 |
|-------|------|------|------|------|
| location | String | ✅ | 位置参数 | "116.41,39.92" 或 "101010100" |

**location 参数支持**:
- 经纬度格式：`"经度,纬度"` 如 `"116.41,39.92"`
- 城市ID：如 `"101010100"`（北京）

### 请求示例

```javascript
wx.request({
  url: 'https://your-domain.com/api/weather/now',
  method: 'GET',
  data: {
    location: '116.41,39.92'
  },
  success: (res) => {
    if (res.data.code === 0) {
      const weather = res.data.data.data
      console.log('温度:', weather.temp)
      console.log('天气:', weather.text)
      console.log('湿度:', weather.humidity)
    }
  }
})
```

### 响应数据

```json
{
  "code": 0,
  "message": "获取实时天气成功",
  "data": {
    "success": true,
    "data": {
      "obsTime": "2025-11-08T12:00+08:00",
      "temp": "15",
      "feelsLike": "14",
      "icon": "100",
      "text": "晴",
      "wind360": "0",
      "windDir": "北风",
      "windScale": "1",
      "windSpeed": "3",
      "humidity": "45",
      "precip": "0.0",
      "pressure": "1020",
      "vis": "10",
      "cloud": "10",
      "dew": "2"
    },
    "updateTime": "2025-11-08T12:00+08:00",
    "fxLink": "https://www.qweather.com/..."
  },
  "timestamp": 1699430400000
}
```

### 响应字段说明

| 字段名 | 类型 | 说明 |
|-------|------|------|
| obsTime | String | 观测时间 |
| temp | String | 温度（℃） |
| feelsLike | String | 体感温度（℃） |
| icon | String | 天气图标代码 |
| text | String | 天气描述 |
| wind360 | String | 风向360度 |
| windDir | String | 风向 |
| windScale | String | 风力等级 |
| windSpeed | String | 风速（km/h） |
| humidity | String | 相对湿度（%） |
| precip | String | 降水量（mm） |
| pressure | String | 气压（hPa） |
| vis | String | 能见度（km） |
| cloud | String | 云量（%） |
| dew | String | 露点温度（℃） |

---

## 3. 获取逐天天气预报

### 接口说明

获取未来3-30天的天气预报。

### 请求信息

- **接口地址**: `GET /api/weather/daily`
- **是否需要认证**: ❌ 否

### 请求参数

| 参数名 | 类型 | 必填 | 说明 | 默认值 |
|-------|------|------|------|--------|
| location | String | ✅ | 位置参数 | - |
| days | Int | ❌ | 预报天数(3/7/10/15/30) | 7 |

### 请求示例

```javascript
// 获取7天天气预报
wx.request({
  url: 'https://your-domain.com/api/weather/daily',
  method: 'GET',
  data: {
    location: '116.41,39.92',
    days: 7
  },
  success: (res) => {
    if (res.data.code === 0) {
      const forecast = res.data.data.data
      forecast.forEach(day => {
        console.log(`${day.fxDate}: ${day.textDay}, ${day.tempMin}-${day.tempMax}℃`)
      })
    }
  }
})
```

### 响应数据

```json
{
  "code": 0,
  "message": "获取天气预报成功",
  "data": {
    "success": true,
    "data": [
      {
        "fxDate": "2025-11-08",
        "sunrise": "06:45",
        "sunset": "17:30",
        "moonrise": "15:20",
        "moonset": "03:10",
        "moonPhase": "盈凸月",
        "tempMax": "24",
        "tempMin": "16",
        "iconDay": "100",
        "textDay": "晴",
        "iconNight": "150",
        "textNight": "晴",
        "wind360Day": "180",
        "windDirDay": "南风",
        "windScaleDay": "1-2",
        "windSpeedDay": "10",
        "wind360Night": "180",
        "windDirNight": "南风",
        "windScaleNight": "1-2",
        "windSpeedNight": "8",
        "humidity": "65",
        "precip": "0.0",
        "pressure": "1020",
        "vis": "10",
        "cloud": "20",
        "uvIndex": "5"
      }
    ],
    "updateTime": "2025-11-08T12:00+08:00",
    "fxLink": "https://www.qweather.com/..."
  },
  "timestamp": 1699430400000
}
```

---

## 4. 获取逐小时天气预报

### 接口说明

获取未来24/72/168小时的逐小时天气预报。

### 请求信息

- **接口地址**: `GET /api/weather/hourly`
- **是否需要认证**: ❌ 否

### 请求参数

| 参数名 | 类型 | 必填 | 说明 | 默认值 |
|-------|------|------|------|--------|
| location | String | ✅ | 位置参数 | - |
| hours | Int | ❌ | 预报小时数(24/72/168) | 24 |

### 请求示例

```javascript
// 获取24小时预报
wx.request({
  url: 'https://your-domain.com/api/weather/hourly',
  method: 'GET',
  data: {
    location: '116.41,39.92',
    hours: 24
  },
  success: (res) => {
    if (res.data.code === 0) {
      const hourly = res.data.data.data
      hourly.forEach(hour => {
        console.log(`${hour.fxTime}: ${hour.text}, ${hour.temp}℃`)
      })
    }
  }
})
```

### 响应数据

```json
{
  "code": 0,
  "message": "获取逐小时天气成功",
  "data": {
    "success": true,
    "data": [
      {
        "fxTime": "2025-11-08T13:00+08:00",
        "temp": "20",
        "icon": "100",
        "text": "晴",
        "wind360": "180",
        "windDir": "南风",
        "windScale": "1",
        "windSpeed": "10",
        "humidity": "60",
        "pop": "0",
        "precip": "0.0",
        "pressure": "1020",
        "cloud": "10",
        "dew": "10"
      }
    ]
  }
}
```

---

## 5. 获取天气生活指数

### 接口说明

获取运动、洗车、穿衣等生活指数。

### 请求信息

- **接口地址**: `GET /api/weather/indices`
- **是否需要认证**: ❌ 否

### 请求参数

| 参数名 | 类型 | 必填 | 说明 | 默认值 |
|-------|------|------|------|--------|
| location | String | ✅ | 位置参数 | - |
| type | String | ❌ | 指数类型 | 0(全部) |

**type 参数说明**:

| 值 | 说明 | 值 | 说明 |
|----|------|----|------|
| 0 | 全部指数 | 9 | 感冒指数 |
| 1 | 运动指数 | 10 | 空气污染扩散 |
| 2 | 洗车指数 | 11 | 空调开启 |
| 3 | 穿衣指数 | 12 | 太阳镜 |
| 4 | 钓鱼指数 | 13 | 化妆指数 |
| 5 | 紫外线指数 | 14 | 晾晒指数 |
| 6 | 旅游指数 | 15 | 交通指数 |
| 7 | 花粉过敏 | 16 | 防晒指数 |
| 8 | 舒适度 | | |

### 请求示例

```javascript
// 获取全部生活指数
wx.request({
  url: 'https://your-domain.com/api/weather/indices',
  method: 'GET',
  data: {
    location: '116.41,39.92',
    type: '0'
  },
  success: (res) => {
    if (res.data.code === 0) {
      const indices = res.data.data.data
      indices.forEach(index => {
        console.log(`${index.name}: ${index.category} - ${index.text}`)
      })
    }
  }
})
```

### 响应数据

```json
{
  "code": 0,
  "message": "获取生活指数成功",
  "data": {
    "success": true,
    "data": [
      {
        "date": "2025-11-08",
        "type": "1",
        "name": "运动指数",
        "level": "2",
        "category": "较适宜",
        "text": "天气较好，较适宜进行各种运动"
      },
      {
        "date": "2025-11-08",
        "type": "2",
        "name": "洗车指数",
        "level": "1",
        "category": "适宜",
        "text": "天气较好，适宜洗车"
      }
    ]
  }
}
```

---

## 6. 获取空气质量

### 接口说明

获取实时空气质量数据（AQI、PM2.5等）。

### 请求信息

- **接口地址**: `GET /api/weather/air`
- **是否需要认证**: ❌ 否

### 请求参数

| 参数名 | 类型 | 必填 | 说明 |
|-------|------|------|------|
| location | String | ✅ | 位置参数 |

### 请求示例

```javascript
wx.request({
  url: 'https://your-domain.com/api/weather/air',
  method: 'GET',
  data: {
    location: '116.41,39.92'
  },
  success: (res) => {
    if (res.data.code === 0) {
      const air = res.data.data.data
      console.log(`AQI: ${air.aqi}, ${air.category}`)
      console.log(`PM2.5: ${air.pm2p5}`)
    }
  }
})
```

### 响应数据

```json
{
  "code": 0,
  "message": "获取空气质量成功",
  "data": {
    "success": true,
    "data": {
      "pubTime": "2025-11-08T12:00+08:00",
      "aqi": "50",
      "level": "1",
      "category": "优",
      "primary": "NA",
      "pm10": "30",
      "pm2p5": "20",
      "no2": "25",
      "so2": "5",
      "co": "0.3",
      "o3": "80"
    }
  }
}
```

---

## 7. 城市搜索

### 接口说明

根据城市名称或关键词搜索城市，获取城市ID和经纬度。

### 请求信息

- **接口地址**: `GET /api/weather/city/search`
- **是否需要认证**: ❌ 否

### 请求参数

| 参数名 | 类型 | 必填 | 说明 |
|-------|------|------|------|
| location | String | ✅ | 城市名称或关键词 |

### 请求示例

```javascript
// 搜索北京
wx.request({
  url: 'https://your-domain.com/api/weather/city/search',
  method: 'GET',
  data: {
    location: '北京'
  },
  success: (res) => {
    if (res.data.code === 0) {
      const cities = res.data.data.data
      cities.forEach(city => {
        console.log(`${city.name} - ID: ${city.id}, 位置: ${city.lon},${city.lat}`)
      })
    }
  }
})
```

### 响应数据

```json
{
  "code": 0,
  "message": "城市搜索成功",
  "data": {
    "success": true,
    "data": [
      {
        "name": "北京",
        "id": "101010100",
        "lat": "39.90",
        "lon": "116.41",
        "adm2": "北京",
        "adm1": "北京",
        "country": "中国",
        "tz": "Asia/Shanghai",
        "utcOffset": "+08:00",
        "isDst": "0",
        "type": "city",
        "rank": "10",
        "fxLink": "https://www.qweather.com/..."
      }
    ]
  }
}
```

---

## 8. 获取天气预警

### 接口说明

获取指定位置的天气预警信息（台风、暴雨等）。

### 请求信息

- **接口地址**: `GET /api/weather/warning`
- **是否需要认证**: ❌ 否

### 请求参数

| 参数名 | 类型 | 必填 | 说明 |
|-------|------|------|------|
| location | String | ✅ | 位置参数（建议使用城市ID） |

### 请求示例

```javascript
wx.request({
  url: 'https://your-domain.com/api/weather/warning',
  method: 'GET',
  data: {
    location: '101010100'
  },
  success: (res) => {
    if (res.data.code === 0) {
      const warnings = res.data.data.data
      if (warnings.length > 0) {
        warnings.forEach(warning => {
          console.log(`预警: ${warning.title}`)
          console.log(`级别: ${warning.level}`)
        })
      } else {
        console.log('暂无预警')
      }
    }
  }
})
```

### 响应数据

```json
{
  "code": 0,
  "message": "获取天气预警成功",
  "data": {
    "success": true,
    "data": [
      {
        "id": "10101010020251108120000",
        "sender": "北京市气象台",
        "pubTime": "2025-11-08T12:00+08:00",
        "title": "北京市气象台发布大风蓝色预警",
        "startTime": "2025-11-08T12:00+08:00",
        "endTime": "2025-11-08T20:00+08:00",
        "status": "active",
        "level": "蓝色",
        "type": "1006",
        "typeName": "大风",
        "text": "预计今天下午到夜间，本市有4级左右偏北风...",
        "related": ""
      }
    ]
  }
}
```

---

## 9. 获取综合天气信息

### 接口说明

一次性获取实时天气、预报、空气质量、预警等全部信息。

### 请求信息

- **接口地址**: `GET /api/weather/comprehensive`
- **是否需要认证**: ❌ 否

### 请求参数

| 参数名 | 类型 | 必填 | 说明 |
|-------|------|------|------|
| location | String | ✅ | 位置参数 |

### 请求示例

```javascript
wx.request({
  url: 'https://your-domain.com/api/weather/comprehensive',
  method: 'GET',
  data: {
    location: '116.41,39.92'
  },
  success: (res) => {
    if (res.data.code === 0) {
      const weather = res.data.data
      console.log('实时:', weather.now)
      console.log('预报:', weather.daily)
      console.log('空气:', weather.air)
      console.log('预警:', weather.warning)
    }
  }
})
```

### 响应数据

```json
{
  "code": 0,
  "message": "获取综合天气信息成功",
  "data": {
    "success": true,
    "now": { /* 实时天气数据 */ },
    "daily": { /* 7天预报数据 */ },
    "hourly": { /* 24小时预报数据 */ },
    "air": { /* 空气质量数据 */ },
    "warning": { /* 天气预警数据 */ }
  }
}
```

---

## 错误码说明

| 错误码 | 说明 | 解决方案 |
|--------|------|----------|
| 0 | 成功 | - |
| 400 | 参数错误 | 检查请求参数 |
| 401 | 未授权 | 请先登录（V1接口） |
| 500 | 服务器错误 | 重试或联系技术支持 |

### 常见错误示例

```json
{
  "code": 400,
  "message": "经纬度参数不能为空",
  "data": null,
  "timestamp": 1699200000000
}
```

```json
{
  "code": 400,
  "message": "缺少位置参数",
  "data": null,
  "timestamp": 1699200000000
}
```

---

## 常见问题

### Q1: 如何获取用户位置？

**解决方案**:

```javascript
wx.getLocation({
  type: 'gcj02', // 使用gcj02坐标系
  success: (res) => {
    const latitude = res.latitude
    const longitude = res.longitude
    console.log('位置:', latitude, longitude)
    
    // 调用天气接口
    this.getWeather(latitude, longitude)
  },
  fail: (err) => {
    console.error('获取位置失败:', err)
    wx.showModal({
      title: '提示',
      content: '需要获取您的位置信息才能查询天气，请授权',
      success: (res) => {
        if (res.confirm) {
          wx.openSetting()
        }
      }
    })
  }
})
```

### Q2: V1接口和通用接口的区别？

**区别说明**:

| 特性 | V1接口 | 通用接口 |
|-----|--------|---------|
| 认证 | 需要Token | 不需要 |
| 缓存 | 5分钟缓存 | 无缓存 |
| 格式 | 格式化输出 | 原始数据 |
| 降级 | 自动模拟数据 | 直接报错 |
| 场景 | 监理日志专用 | 通用场景 |

**选择建议**:
- 监理日志填写 → 使用V1接口
- 天气展示、详细数据 → 使用通用接口

### Q3: 如何处理位置授权？

**完整流程**:

```javascript
// 1. 检查授权
wx.getSetting({
  success: (res) => {
    if (res.authSetting['scope.userLocation']) {
      // 已授权，直接获取位置
      this.getLocation()
    } else {
      // 未授权，请求授权
      wx.authorize({
        scope: 'scope.userLocation',
        success: () => {
          this.getLocation()
        },
        fail: () => {
          // 拒绝授权，引导打开设置
          wx.showModal({
            title: '授权提示',
            content: '需要位置权限才能获取天气信息',
            confirmText: '去设置',
            success: (res) => {
              if (res.confirm) {
                wx.openSetting()
              }
            }
          })
        }
      })
    }
  }
})
```

### Q4: 如何优化请求性能？

**优化方案**:

1. **使用V1缓存接口**
```javascript
// V1接口自带5分钟缓存
wx.request({
  url: 'https://your-domain.com/api/v1/weather/current',
  // ...
})
```

2. **本地缓存**
```javascript
// 保存到本地缓存
wx.setStorageSync('weather_data', weatherData)
wx.setStorageSync('weather_time', Date.now())

// 读取缓存
const cachedData = wx.getStorageSync('weather_data')
const cachedTime = wx.getStorageSync('weather_time')
const now = Date.now()

// 5分钟内使用缓存
if (cachedData && (now - cachedTime < 5 * 60 * 1000)) {
  this.setData({ weather: cachedData })
} else {
  this.fetchWeather()
}
```

3. **请求合并**
```javascript
// 使用综合接口一次获取全部数据
wx.request({
  url: 'https://your-domain.com/api/weather/comprehensive',
  data: { location: '116.41,39.92' }
})
```

### Q5: 坐标系转换问题

**说明**:

- 微信小程序使用 **GCJ-02** 坐标系（火星坐标）
- 和风天气支持 GCJ-02 坐标，可以直接使用
- 无需坐标转换

```javascript
wx.getLocation({
  type: 'gcj02', // 重要！指定gcj02
  success: (res) => {
    // 直接使用，无需转换
    const location = `${res.longitude},${res.latitude}`
  }
})
```

---

## 使用建议

### 1. 监理日志场景

```javascript
// 推荐使用V1接口
Page({
  data: {
    formData: {
      weather: ''
    }
  },

  /**
   * 获取天气信息
   */
  async getWeatherInfo() {
    wx.showLoading({ title: '获取天气...' })

    try {
      // 1. 获取位置
      const location = await this.getLocation()
      
      // 2. 获取天气
      const res = await this.requestWeather(location)
      
      // 3. 填入表单
      this.setData({
        'formData.weather': res.data.data.weather
      })
      
      wx.hideLoading()
      wx.showToast({ title: '获取成功' })
      
    } catch (err) {
      wx.hideLoading()
      wx.showToast({
        title: '获取天气失败',
        icon: 'none'
      })
    }
  },

  getLocation() {
    return new Promise((resolve, reject) => {
      wx.getLocation({
        type: 'gcj02',
        success: resolve,
        fail: reject
      })
    })
  },

  requestWeather(location) {
    return new Promise((resolve, reject) => {
      wx.request({
        url: 'https://your-domain.com/api/v1/weather/current',
        header: {
          'token': wx.getStorageSync('token')
        },
        data: {
          latitude: location.latitude,
          longitude: location.longitude
        },
        success: resolve,
        fail: reject
      })
    })
  }
})
```

### 2. 天气展示页面

```javascript
// 推荐使用综合接口
Page({
  data: {
    weatherInfo: null
  },

  onLoad() {
    this.loadWeather()
  },

  async loadWeather() {
    try {
      const location = await this.getLocation()
      
      const res = await new Promise((resolve, reject) => {
        wx.request({
          url: 'https://your-domain.com/api/weather/comprehensive',
          data: {
            location: `${location.longitude},${location.latitude}`
          },
          success: resolve,
          fail: reject
        })
      })

      if (res.data.code === 0) {
        this.setData({
          weatherInfo: res.data.data
        })
      }
    } catch (err) {
      console.error('获取天气失败:', err)
    }
  }
})
```

---

**文档版本**: v1.0.0  
**最后更新**: 2025-11-08  
**基于代码**: `routes/weather.js`, `routes/v1/weather.js`

