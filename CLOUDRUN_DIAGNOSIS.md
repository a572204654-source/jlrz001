# 云托管服务诊断报告

**诊断时间：** 2025-11-07 19:45  
**环境ID：** cloud1-5gtce4ym5a28e1b9  
**服务名：** supervision-log-api

---

## 🔴 当前状态：无法访问

### 错误详情

#### 错误1：自定义域名访问
```bash
$ curl https://api.yimengpl.com/health
```
**错误信息：**
```json
{
  "code": "MISSING_CREDENTIALS",
  "message": "Credentials missing. For more information, please refer to https://docs.cloudbase.net/error-code/service",
  "requestId": "a1b23984-0071-4d97-b68e-3daba6680ab9"
}
```

#### 错误2：默认域名访问
```bash
$ curl https://supervision-log-api-6g6ajfvk9ecc2a25-1319002931.ap-shanghai.service.tcloudbase.com/health
```
**错误信息：**
```json
{
  "code": "INVALID_ENV",
  "message": "Env invalid. For more information, please refer to https://docs.cloudbase.net/error-code/service",
  "requestId": "86f557ce-b57d-4bcf-a69a-20c69a7bb06c"
}
```

---

## 📊 服务状态检查

### ✅ CLI连接正常
```bash
$ tcb run:deprecated list --envId cloud1-5gtce4ym5a28e1b9
```
- 环境连接：✅ 成功
- 服务列表：✅ 可获取

### ✅ 版本状态正常
```bash
$ tcb run:deprecated version list --envId cloud1-5gtce4ym5a28e1b9 --serviceName supervision-log-api
```

| 版本名称 | 状态 | 流量 | 创建时间 | 更新时间 |
|---------|------|------|---------|---------|
| supervision-log-api-015 | ✅ 正常 | **100%** | 2025-11-07 14:41:20 | 2025-11-07 14:42:30 |
| supervision-log-api-014 | ✅ 正常 | 0% | 2025-11-07 13:45:05 | 2025-11-07 15:02:36 |

---

## 🔍 问题分析

### 问题1：MISSING_CREDENTIALS（自定义域名）

**含义：** 缺少访问凭证

**可能原因：**
1. 自定义域名 `api.yimengpl.com` 配置了CloudBase HTTP鉴权
2. 域名绑定时未设置"跳过鉴权"
3. 安全规则要求所有HTTP请求携带凭证

### 问题2：INVALID_ENV（默认域名）

**含义：** 环境无效

**可能原因：**
1. 服务内部配置的 `CLOUDBASE_ENV_ID` 环境变量为空或错误
2. 服务尚未完全启动
3. CloudBase服务与HTTP服务的环境映射问题

---

## ✅ 解决方案

### 方案1：检查并修复环境变量（推荐）

**问题：** 环境变量 `CLOUDBASE_ENV_ID` 可能配置不正确

**当前配置：**
```env
CLOUDBASE_ENV_ID=
```

**应该修改为：**
```env
CLOUDBASE_ENV_ID=cloud1-5gtce4ym5a28e1b9
```

**操作步骤：**

1. 访问云托管控制台
   ```
   https://console.cloud.tencent.com/tcb/service/detail/cloud1-5gtce4ym5a28e1b9/supervision-log-api
   ```

2. 点击「配置管理」→「环境变量」

3. 找到 `CLOUDBASE_ENV_ID` 变量

4. 修改值为：`cloud1-5gtce4ym5a28e1b9`

5. 点击「保存」，等待重启生效（约1-2分钟）

---

### 方案2：关闭HTTP访问鉴权

**操作步骤：**

1. 在服务详情页，点击「访问配置」

2. 找到「HTTP访问服务」设置

3. **选项A：** 关闭「路径访问服务」的鉴权要求

4. **选项B：** 添加公网访问路径 `/*`，设置为「跳过鉴权」

5. 保存配置

---

### 方案3：配置自定义域名跳过鉴权

**操作步骤：**

1. 在服务详情页，点击「域名管理」

2. 找到自定义域名 `api.yimengpl.com`

3. 编辑域名配置

4. 启用「跳过鉴权」或「公网访问」

5. 保存配置

---

### 方案4：暂时使用路径前缀访问

如果服务配置了特定的路径前缀，可以尝试：

```bash
# 方式1：带envId的路径
curl https://api.yimengpl.com/cloud1-5gtce4ym5a28e1b9/supervision-log-api/health

# 方式2：带服务名的路径
curl https://api.yimengpl.com/supervision-log-api/health
```

---

## 🎯 推荐操作顺序

### 第1步：修复环境变量（最重要）

1. 登录控制台：
   ```
   https://console.cloud.tencent.com/tcb/service/detail/cloud1-5gtce4ym5a28e1b9/supervision-log-api
   ```

2. 修改环境变量：
   ```
   CLOUDBASE_ENV_ID=cloud1-5gtce4ym5a28e1b9
   ```

3. 保存并等待重启

### 第2步：验证服务

**2分钟后测试：**

```bash
# 测试默认域名
curl https://supervision-log-api-6g6ajfvk9ecc2a25-1319002931.ap-shanghai.service.tcloudbase.com/health

# 期望返回：
{
  "status": "ok",
  "timestamp": 1699200000000,
  "service": "express-miniapp"
}
```

### 第3步：配置自定义域名

如果默认域名测试成功，但自定义域名仍失败：

1. 进入「域名管理」
2. 配置 `api.yimengpl.com` 跳过鉴权
3. 保存配置

### 第4步：完整API测试

所有配置成功后：

```bash
node test-cloudrun-api.js
```

---

## 📖 参考文档

### CloudBase错误码
- [MISSING_CREDENTIALS](https://docs.cloudbase.net/error-code/service#missing-credentials)
- [INVALID_ENV](https://docs.cloudbase.net/error-code/service#invalid-env)

### 云托管配置
- [环境变量配置](https://cloud.tencent.com/document/product/1243/49177)
- [HTTP访问服务](https://cloud.tencent.com/document/product/1243/49178)
- [自定义域名](https://cloud.tencent.com/document/product/1243/49177)

---

## 🔧 控制台链接

### 主要页面
```
服务详情：https://console.cloud.tencent.com/tcb/service/detail/cloud1-5gtce4ym5a28e1b9/supervision-log-api
```

### 配置页面
- 环境变量：服务详情 → 配置管理 → 环境变量
- 访问配置：服务详情 → 访问配置
- 域名管理：服务详情 → 域名管理
- 日志查询：服务详情 → 日志查询

---

## 📝 环境变量配置清单

### 必需修改
```env
# ❌ 当前：空值
CLOUDBASE_ENV_ID=

# ✅ 应该：环境ID
CLOUDBASE_ENV_ID=cloud1-5gtce4ym5a28e1b9
```

### 保持不变
```env
NODE_ENV=production
CLOUDBASE_ENV=production
DB_HOST_INTERNAL=10.27.100.151
DB_PORT_INTERNAL=3306
# ... 其他配置保持不变
```

---

## 🚨 重要提示

1. **修改环境变量后需要重启服务**
   - 云托管会自动重启
   - 等待1-2分钟生效

2. **检查日志**
   - 修改后查看实时日志
   - 确认服务正常启动
   - 查看是否有数据库连接错误

3. **逐步验证**
   - 先测试默认域名
   - 再测试自定义域名
   - 最后运行完整测试

---

## ✅ 下一步

1. **立即执行：** 修改 `CLOUDBASE_ENV_ID` 环境变量
2. **等待重启：** 2分钟后测试健康检查接口
3. **查看日志：** 确认服务正常运行
4. **完整测试：** 运行 `node test-cloudrun-api.js`

---

**更新时间：** 2025-11-07 19:45  
**状态：** 🔴 待修复环境变量配置  
**预计解决时间：** 5分钟


