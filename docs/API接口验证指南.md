# API接口验证指南

## 概述

本文档提供了验证云部署后所有API接口是否正常工作的完整指南。

## 快速验证

### 方法1: 使用自动化测试脚本

我们提供了一个完整的自动化测试脚本，可以一键验证所有接口。

#### 1. 设置测试地址

```bash
# Windows PowerShell
$env:API_BASE_URL="https://your-cloud-url.com"

# Linux/Mac
export API_BASE_URL="https://your-cloud-url.com"
```

#### 2. 运行测试

```bash
npm run test:api
```

#### 3. 查看结果

测试脚本会自动测试以下内容：
- ✅ 基础服务（健康检查、环境诊断）
- ✅ 天气API
- ✅ 公开接口（项目、工程、日志列表）
- ✅ 权限保护
- ✅ 错误处理

### 方法2: 手动验证关键接口

如果你想手动验证，可以使用浏览器或Postman测试以下关键接口。

## 关键接口清单

### 1. 健康检查 ⭐⭐⭐

**最重要！必须首先验证！**

```
GET https://your-cloud-url.com/health
```

**期望响应:**
```json
{
  "status": "ok",
  "timestamp": 1699200000000,
  "service": "express-miniapp"
}
```

✅ **验证要点:**
- status 必须是 "ok"
- 响应时间 < 2秒

---

### 2. 环境诊断 ⭐⭐⭐

**检查数据库和环境配置是否正确**

```
GET https://your-cloud-url.com/diagnose
```

**期望响应:**
```json
{
  "timestamp": 1699200000000,
  "environment": {
    "NODE_ENV": "production",
    "CLOUDBASE_ENV": "your-env"
  },
  "database": {
    "host": "内网地址",
    "port": 3306,
    "database": "数据库名"
  },
  "diagnosis": {
    "isProduction": true,
    "shouldUseInternal": true,
    "hasInternalConfig": true,
    "isLocalhost": false,
    "warning": null
  }
}
```

✅ **验证要点:**
- `diagnosis.warning` 必须是 `null`
- `database.host` 不能是 `localhost` 或 `127.0.0.1`
- `diagnosis.isLocalhost` 必须是 `false`

❌ **常见问题:**
如果看到警告 "❌ 数据库地址是本地地址"，说明环境变量配置错误！

---

### 3. API根路径 ⭐⭐

```
GET https://your-cloud-url.com/api
```

**期望响应:**
```json
{
  "name": "CloudBase 监理日志小程序 API",
  "version": "1.0.0",
  "modules": {
    "auth": "认证模块",
    "user": "用户模块",
    "project": "项目模块",
    ...
  }
}
```

---

### 4. 天气API ⭐⭐

#### 简单天气查询

```
GET https://your-cloud-url.com/api/weather/simple?latitude=39.9042&longitude=116.4074
```

**期望响应:**
```json
{
  "code": 0,
  "message": "获取天气成功",
  "data": {
    "weather": "晴",
    "temperature": 20,
    "city": "北京市"
  }
}
```

#### 详细天气查询

```
GET https://your-cloud-url.com/api/weather/current?latitude=39.9042&longitude=116.4074
```

---

### 5. 用户统计 ⭐

```
GET https://your-cloud-url.com/api/user/stats
```

**期望响应:**
```json
{
  "code": 0,
  "message": "获取统计数据成功",
  "data": {
    "userCount": 10,
    "activeUserCount": 5
  }
}
```

---

### 6. 项目列表 ⭐⭐

```
GET https://your-cloud-url.com/api/projects?page=1&pageSize=10
```

**期望响应:**
```json
{
  "code": 0,
  "message": "获取项目列表成功",
  "data": {
    "list": [...],
    "pagination": {
      "page": 1,
      "pageSize": 10,
      "total": 100
    }
  }
}
```

---

### 7. 工程列表 ⭐⭐

```
GET https://your-cloud-url.com/api/works?page=1&pageSize=10
```

---

### 8. 监理日志列表 ⭐⭐

```
GET https://your-cloud-url.com/api/supervision-logs?page=1&pageSize=10
```

---

### 9. 权限保护验证 ⭐⭐⭐

**测试未登录时是否能创建资源（应该被拒绝）**

```
POST https://your-cloud-url.com/api/projects
Content-Type: application/json

{
  "name": "测试项目",
  "description": "测试"
}
```

**期望响应:**
```json
{
  "code": 401,
  "message": "未登录或token无效"
}
```

✅ **验证要点:**
- 必须返回 401 错误
- 不能成功创建资源

---

### 10. 404错误处理 ⭐

```
GET https://your-cloud-url.com/api/nonexistent-endpoint
```

**期望响应:**
```json
{
  "code": 404,
  "message": "接口不存在"
}
```

---

## 完整测试流程

### 使用浏览器测试

1. **打开浏览器**，访问以下URL（替换为你的云部署地址）：

```
https://your-cloud-url.com/health
https://your-cloud-url.com/diagnose
https://your-cloud-url.com/api
https://your-cloud-url.com/api/weather/simple?latitude=39.9042&longitude=116.4074
https://your-cloud-url.com/api/projects?page=1&pageSize=10
```

2. **检查响应格式**：
   - 所有响应都应该是JSON格式
   - 包含 `code`、`message`、`data` 字段
   - `code: 0` 表示成功

### 使用Postman测试

1. **导入集合**：创建一个新的Collection
2. **设置环境变量**：
   - `baseUrl`: 你的云部署地址
3. **添加请求**：按照上面的接口清单添加请求
4. **批量运行**：使用Collection Runner批量测试

### 使用curl测试

```bash
# 健康检查
curl https://your-cloud-url.com/health

# 环境诊断
curl https://your-cloud-url.com/diagnose

# API信息
curl https://your-cloud-url.com/api

# 天气查询
curl "https://your-cloud-url.com/api/weather/simple?latitude=39.9042&longitude=116.4074"

# 项目列表
curl "https://your-cloud-url.com/api/projects?page=1&pageSize=10"
```

---

## 常见问题排查

### 问题1: 健康检查失败

**症状**: `/health` 接口无法访问

**可能原因**:
- 服务未启动
- 端口配置错误
- 防火墙阻止

**解决方案**:
1. 检查云托管服务状态
2. 查看服务日志
3. 确认端口映射正确（容器80端口）

---

### 问题2: 数据库连接失败

**症状**: `/diagnose` 显示警告或数据库操作失败

**可能原因**:
- 环境变量配置错误
- 使用了localhost地址
- 数据库未授权

**解决方案**:
1. 检查环境变量：
   ```
   DB_HOST_INTERNAL=内网地址
   DB_PORT_INTERNAL=3306
   DB_USER=用户名
   DB_PASSWORD=密码
   DB_NAME=数据库名
   ```
2. 确认 `NODE_ENV=production`
3. 使用数据库内网地址，不要用外网地址

---

### 问题3: 天气API失败

**症状**: 天气查询返回错误

**可能原因**:
- 和风天气API配置错误
- API密钥无效
- 网络访问受限

**解决方案**:
1. 检查环境变量：
   ```
   QWEATHER_KEY=你的和风天气密钥
   ```
2. 确认密钥有效且未过期
3. 检查云托管是否允许外网访问

---

### 问题4: 所有接口返回404

**症状**: 除了 `/health` 其他接口都404

**可能原因**:
- 路由未正确注册
- 代码部署不完整

**解决方案**:
1. 检查 `app.js` 中的路由注册
2. 重新构建和部署
3. 查看服务启动日志

---

### 问题5: 权限保护失效

**症状**: 未登录可以创建资源

**可能原因**:
- 认证中间件未生效
- JWT配置错误

**解决方案**:
1. 检查路由是否使用了 `authenticate` 中间件
2. 确认 `JWT_SECRET` 已配置
3. 查看最近的权限修复提交

---

## 性能基准

正常情况下，接口响应时间应该在以下范围内：

| 接口类型 | 响应时间 |
|---------|---------|
| 健康检查 | < 100ms |
| 简单查询 | < 500ms |
| 列表查询 | < 1s |
| 详情查询 | < 500ms |
| 创建操作 | < 1s |
| 复杂查询 | < 2s |

如果响应时间明显超过这些值，可能存在性能问题。

---

## 监控建议

### 持续监控

建议设置以下监控：

1. **健康检查监控**：每分钟检查一次 `/health`
2. **错误率监控**：监控5xx错误率
3. **响应时间监控**：监控P95响应时间
4. **数据库连接监控**：监控连接池状态

### 告警设置

建议设置以下告警：

- 健康检查失败
- 错误率 > 5%
- 响应时间 > 3秒
- 数据库连接失败

---

## 小程序端验证

### 真机测试

1. **打开小程序开发者工具**
2. **切换到真机调试模式**
3. **测试以下功能**：
   - 登录
   - 查看项目列表
   - 创建监理日志
   - 上传附件
   - AI助手对话
   - 导出Word文档

### 网络请求检查

在小程序开发者工具中：
1. 打开 **调试器** → **Network**
2. 查看所有API请求
3. 确认：
   - 请求URL正确
   - 响应状态200
   - 响应格式正确

---

## 验证清单

使用以下清单确保所有功能正常：

### 基础服务
- [ ] 健康检查正常
- [ ] 环境诊断无警告
- [ ] API根路径可访问

### 公开接口
- [ ] 天气查询正常
- [ ] 用户统计正常
- [ ] 项目列表正常
- [ ] 工程列表正常
- [ ] 监理日志列表正常

### 权限保护
- [ ] 未登录无法创建资源
- [ ] 未登录无法修改资源
- [ ] 未登录无法删除资源

### 错误处理
- [ ] 404错误正确返回
- [ ] 参数错误正确提示
- [ ] 服务器错误正确处理

### 特殊功能
- [ ] 实时语音识别可用
- [ ] 文件上传正常
- [ ] Word导出正常
- [ ] AI对话正常

---

## 总结

完成以上验证后，你的云部署API应该已经完全正常工作了！

**关键验证点**：
1. ✅ `/health` 返回 ok
2. ✅ `/diagnose` 无警告
3. ✅ 数据库连接正常
4. ✅ 权限保护生效
5. ✅ 小程序可以正常使用

如果遇到问题，请参考"常见问题排查"部分，或查看服务日志进行排查。

---

**最后更新**: 2024-11-08
**文档版本**: v1.0.0

