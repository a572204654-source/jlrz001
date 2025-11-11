# 天气查询API文档

## 1. 获取当前气象信息

**接口说明**：根据经纬度获取当前位置的气象信息

**请求地址**：`GET /api/weather/current`

**是否需要认证**：是

### 请求参数

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| latitude | Number | 是 | 纬度（-90到90） |
| longitude | Number | 是 | 经度（-180到180） |

### 请求示例

```javascript
// 先使用wx.getLocation获取用户位置
wx.getLocation({
  type: 'gcj02',
  success(location) {
    wx.request({
      url: 'https://your-domain.com/api/weather/current',
      method: 'GET',
      header: {
        'Authorization': 'Bearer ' + wx.getStorageSync('token')
      },
      data: {
        latitude: location.latitude,
        longitude: location.longitude
      },
      success(res) {
        console.log('气象信息:', res.data)
        // 可以直接使用weather字段填写到监理日志中
        const weatherText = res.data.data.weather
      }
    })
  }
})
```

### 响应数据

```json
{
  "code": 0,
  "message": "获取气象信息成功",
  "data": {
    "weather": "天气 晴 · 气温: 16-24 · 风向: 南风 · 风力: 2",
    "weatherText": "晴",
    "temperature": 20,
    "temperatureMin": 16,
    "temperatureMax": 24,
    "humidity": 65,
    "windDirection": "南风",
    "windScale": "2",
    "updateTime": "2024-11-08T10:00:00+08:00"
  },
  "timestamp": 1699200000000
}
```

### 响应字段说明

| 字段名 | 类型 | 说明 | 示例 |
|--------|------|------|------|
| weather | String | 完整气象信息字符串（可直接用于监理日志） | "天气 雨 · 气温: 25-31 · 风向: 东 · 风力: 4" |
| weatherText | String | 天气描述（晴、多云、阴、小雨等） | "晴" |
| temperature | Number | 当前温度（℃） | 20 |
| temperatureMin | Number | 最低温度（℃） | 16 |
| temperatureMax | Number | 最高温度（℃） | 24 |
| humidity | Number | 湿度（%） | 65 |
| windDirection | String | 风向 | "南风" |
| windScale | String | 风力等级 | "2" |
| updateTime | String | 更新时间 | "2024-11-08T10:00:00+08:00" |
| isMock | Boolean | 是否为模拟数据（可选字段，仅在使用模拟数据时出现） | true |

---

## 2. 获取气象缓存统计

**接口说明**：获取气象数据缓存使用情况（调试用）

**请求地址**：`GET /api/weather/stats`

**是否需要认证**：是

### 请求参数

无

### 请求示例

```javascript
wx.request({
  url: 'https://your-domain.com/api/weather/stats',
  method: 'GET',
  header: {
    'Authorization': 'Bearer ' + wx.getStorageSync('token')
  },
  success(res) {
    console.log('缓存统计:', res.data)
  }
})
```

### 响应数据

```json
{
  "code": 0,
  "message": "操作成功",
  "data": {
    "cacheSize": 5,
    "stats": {
      "keys": 5,
      "hits": 10,
      "misses": 5,
      "ksize": 0,
      "vsize": 0
    },
    "keys": [
      "weather_31.23_121.45",
      "weather_31.24_121.46"
    ]
  },
  "timestamp": 1699200000000
}
```

---

## 错误码说明

| 错误码 | 说明 |
|--------|------|
| 0 | 成功 |
| 400 | 参数错误/经纬度格式不正确/经纬度超出有效范围 |
| 401 | 未授权/Token无效 |
| 500 | 服务器错误/气象服务异常 |

---

## 注意事项

1. **数据来源**：
   - 优先使用和风天气API（配置了API Key时）
   - API调用失败时自动切换为模拟数据
   - 模拟数据基于纬度生成合理的温度范围

2. **缓存机制**：
   - 气象数据缓存5分钟
   - 相近位置（保留2位小数）共享缓存
   - 减少API调用次数，提高响应速度

3. **使用建议**：
   - 在填写监理日志前调用此接口获取气象信息
   - 直接使用`weather`字段填写到日志的气象情况中
   - 用户也可以手动修改气象信息

4. **配置要求**：
   - 如需使用真实气象数据，需配置`QWEATHER_API_KEY`环境变量
   - 可在和风天气官网申请免费API Key
   - 未配置API Key时自动使用模拟数据

---

## 和风天气API配置

如需使用真实气象数据，请按以下步骤配置：

1. 访问 [和风天气开发平台](https://dev.qweather.com/)
2. 注册账号并创建应用
3. 获取API Key（开发版免费）
4. 在环境变量中配置：
   ```
   QWEATHER_API_KEY=your_api_key_here
   ```

5. 重启服务后即可使用真实气象数据

