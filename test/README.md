# API接口验证工具

本目录包含用于验证云部署API接口的测试工具。

## 工具列表

### 1. 快速验证 (quick-verify.js) ⭐ 推荐

**用途**: 快速检查关键接口是否正常

**使用方法**:

```bash
# 方法1: 直接传入URL
node test/quick-verify.js https://your-cloud-url.com

# 方法2: 使用环境变量
export API_BASE_URL="https://your-cloud-url.com"
node test/quick-verify.js

# Windows PowerShell
$env:API_BASE_URL="https://your-cloud-url.com"
node test/quick-verify.js
```

**测试内容**:
- ✅ 服务健康状态
- ✅ 环境配置
- ✅ API基础接口
- ✅ 天气API
- ✅ 业务接口（项目、工程、日志）
- ✅ 权限保护

**输出示例**:
```
🚀 快速API验证
============================================================
📍 测试地址: https://your-cloud-url.com

1️⃣  健康检查
✅ 服务健康状态

2️⃣  环境诊断
✅ 环境配置正常

3️⃣  API基础接口
✅ API根路径

4️⃣  天气API
✅ 简单天气查询

5️⃣  业务接口
✅ 项目列表
✅ 工程列表
✅ 监理日志列表

6️⃣  权限保护
✅ 权限保护正常

============================================================
🎉 所有关键接口验证通过！
============================================================
```

---

### 2. 完整验证 (api-verification.js)

**用途**: 完整的API接口测试套件

**使用方法**:

```bash
# 使用npm脚本
npm run verify-api

# 或直接运行
export API_BASE_URL="https://your-cloud-url.com"
node test/api-verification.js
```

**测试内容**:
- 基础服务测试（健康检查、环境诊断、API根路径）
- 天气API测试（简单查询、详细查询）
- 公开接口测试（用户统计、项目/工程/日志列表）
- 详情接口测试（项目/工程/日志详情）
- 权限和错误处理测试
- 特殊功能测试（实时语音识别）

**输出示例**:
```
============================================================
🚀 开始API接口验证
============================================================
📍 测试地址: https://your-cloud-url.com
⏰ 开始时间: 2024-11-08 10:00:00

============================================================
📦 基础服务测试
============================================================

🧪 测试: 健康检查
✅ 通过
   服务正常运行

🧪 测试: 环境诊断
✅ 通过
   环境配置正常

...

============================================================
📊 测试结果汇总
============================================================
总测试数: 15
✅ 通过: 15
❌ 失败: 0
📈 通过率: 100.00%
```

---

## 快速开始

### 第一次验证

1. **确保已安装依赖**:
   ```bash
   npm install
   ```

2. **运行快速验证**:
   ```bash
   node test/quick-verify.js https://your-cloud-url.com
   ```

3. **查看结果**:
   - 如果所有项都显示 ✅，说明部署成功！
   - 如果有 ❌，请查看错误信息并参考文档排查

### 定期验证

建议在以下情况下运行验证：
- ✅ 每次代码部署后
- ✅ 修改环境变量后
- ✅ 数据库迁移后
- ✅ 发现问题时

---

## 验证失败排查

### 问题1: 健康检查失败

```
❌ 服务健康状态 - 错误: connect ECONNREFUSED
```

**原因**: 服务未启动或URL错误

**解决**:
1. 检查URL是否正确
2. 确认服务已启动
3. 检查防火墙设置

---

### 问题2: 环境配置异常

```
❌ 环境配置异常: 数据库地址是本地地址，连接会失败！
```

**原因**: 数据库环境变量配置错误

**解决**:
1. 检查云托管环境变量
2. 确认使用内网地址而非localhost
3. 重启服务使配置生效

---

### 问题3: 天气API失败

```
❌ 简单天气查询 - 错误: Request failed with status code 500
```

**原因**: 和风天气API配置错误

**解决**:
1. 检查 `QWEATHER_KEY` 环境变量
2. 确认密钥有效
3. 检查网络访问权限

---

### 问题4: 权限保护失效

```
❌ 权限保护失效（未登录可以创建资源）
```

**原因**: 认证中间件未生效

**解决**:
1. 检查路由是否使用了 `authenticate` 中间件
2. 确认 `JWT_SECRET` 已配置
3. 查看最近的代码提交

---

## 浏览器验证

如果你不想使用命令行，也可以直接在浏览器中访问以下URL：

### 必须验证的接口

1. **健康检查**:
   ```
   https://your-cloud-url.com/health
   ```
   期望看到: `{"status":"ok",...}`

2. **环境诊断**:
   ```
   https://your-cloud-url.com/diagnose
   ```
   期望看到: `diagnosis.warning` 为 `null`

3. **API信息**:
   ```
   https://your-cloud-url.com/api
   ```
   期望看到: API模块列表

4. **项目列表**:
   ```
   https://your-cloud-url.com/api/projects?page=1&pageSize=10
   ```
   期望看到: `{"code":0,"message":"获取项目列表成功",...}`

---

## Postman集合

你也可以导入以下Postman集合进行测试：

### 创建集合

1. 打开Postman
2. 创建新的Collection: "CloudBase API验证"
3. 添加环境变量:
   - `baseUrl`: 你的云部署地址

### 添加请求

#### 1. 健康检查
- Method: GET
- URL: `{{baseUrl}}/health`
- Tests:
  ```javascript
  pm.test("Status is ok", function () {
      pm.response.to.have.status(200);
      pm.expect(pm.response.json().status).to.eql("ok");
  });
  ```

#### 2. 环境诊断
- Method: GET
- URL: `{{baseUrl}}/diagnose`
- Tests:
  ```javascript
  pm.test("No warnings", function () {
      pm.response.to.have.status(200);
      pm.expect(pm.response.json().diagnosis.warning).to.be.null;
  });
  ```

#### 3. 项目列表
- Method: GET
- URL: `{{baseUrl}}/api/projects?page=1&pageSize=10`
- Tests:
  ```javascript
  pm.test("Response format is correct", function () {
      pm.response.to.have.status(200);
      var jsonData = pm.response.json();
      pm.expect(jsonData.code).to.eql(0);
      pm.expect(jsonData.data).to.have.property('list');
      pm.expect(jsonData.data).to.have.property('pagination');
  });
  ```

---

## CI/CD集成

可以将验证脚本集成到CI/CD流程中：

### GitHub Actions示例

```yaml
name: API Verification

on:
  push:
    branches: [ master ]

jobs:
  verify:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '14'
      - run: npm install
      - run: npm run verify-api
        env:
          API_BASE_URL: ${{ secrets.API_BASE_URL }}
```

---

## 监控建议

### 定时监控

使用cron或云监控服务定时运行验证：

```bash
# 每5分钟检查一次
*/5 * * * * cd /path/to/project && node test/quick-verify.js >> /var/log/api-verify.log 2>&1
```

### 告警设置

当验证失败时发送告警：

```bash
#!/bin/bash
node test/quick-verify.js https://your-cloud-url.com
if [ $? -ne 0 ]; then
  # 发送告警（邮件、短信、webhook等）
  echo "API验证失败！" | mail -s "告警" admin@example.com
fi
```

---

## 其他测试工具

### 1. 语音识别测试
```bash
npm run test-voice
```

### 2. 数据库连接测试
```bash
npm run test-db
```

### 3. 完整功能验证
```bash
npm run verify
```

---

## 相关文档

- [API接口验证指南](../docs/API接口验证指南.md) - 详细的验证指南
- [权限修复总结](../docs/权限修复总结.md) - 权限相关问题
- [AI对话优化修复总结](../docs/AI对话优化修复总结.md) - AI功能相关

---

## 常见问题

### Q: 本地开发如何测试？

A: 本地开发时，不需要设置 `API_BASE_URL`，脚本会自动使用 `http://localhost`：

```bash
# 启动本地服务
npm run dev

# 在另一个终端运行验证
node test/quick-verify.js
```

### Q: 如何测试特定接口？

A: 使用 curl 或 Postman 单独测试：

```bash
curl https://your-cloud-url.com/api/projects
```

### Q: 验证通过但小程序无法使用？

A: 可能的原因：
1. 小程序域名白名单未配置
2. HTTPS证书问题
3. 网络环境限制

请检查小程序开发者工具的Network面板查看具体错误。

---

**最后更新**: 2024-11-08

