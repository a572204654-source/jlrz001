# 更新日志

## [v1.1.0] - 2024-11-08

### 修改

#### 天气API返回格式优化

**修改内容**：
- 优化天气接口的返回数据格式，使其更适合直接在监理日志中使用

**影响接口**：
- `GET /api/weather/current` - 获取当前气象信息
- `GET /api/v1/weather/current` - 获取当前气象信息（v1版本）

**修改前格式**：
```json
{
  "weather": "晴，16-24℃"
}
```

**修改后格式**：
```json
{
  "weather": "天气 晴 · 气温: 16-24 · 风向: 南风 · 风力: 2"
}
```

**新格式说明**：
- 更加详细的气象信息展示
- 格式：`天气 {天气状况} · 气温: {最低温}-{最高温} · 风向: {风向} · 风力: {风力等级}`
- 便于在监理日志等场景直接使用
- 保留所有原有字段（weatherText、temperature、humidity等），便于前端自定义展示

**兼容性**：
- ✅ 向后兼容：所有原有字段保持不变
- ✅ 只是优化了 `weather` 字段的格式
- ✅ 不影响现有功能，只需更新前端显示即可

**示例**：
```javascript
// 小程序调用示例
wx.request({
  url: 'https://your-domain.com/api/weather/current',
  data: {
    latitude: 31.23,
    longitude: 121.47
  },
  success(res) {
    // 直接使用 weather 字段
    console.log(res.data.data.weather)
    // 输出：天气 雨 · 气温: 25-31 · 风向: 东 · 风力: 4
  }
})
```

---

## [v1.0.0] - 2024-11-06

### 新增

- 初始版本发布
- 用户认证系统（JWT）
- 微信小程序登录对接
- 文章管理功能
- 天气查询接口
- 和风天气API集成
- Docker部署支持
- 云托管适配

