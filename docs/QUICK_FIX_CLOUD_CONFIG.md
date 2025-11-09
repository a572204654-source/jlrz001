# 云托管配置快速修复指南

## 🚨 当前问题

**云托管服务中腾讯云密钥未配置**，导致语音识别功能失败。

## ✅ 快速修复步骤

### 步骤1：获取腾讯云密钥

1. 登录 [腾讯云控制台](https://console.cloud.tencent.com/)
2. 进入 [API密钥管理](https://console.cloud.tencent.com/cam/capi)
3. 复制以下信息：
   - `SecretId`
   - `SecretKey`
   - `AppId`（在 [账号信息](https://console.cloud.tencent.com/developer) 中查看）

### 步骤2：在云托管控制台配置环境变量

1. 登录 [CloudBase 控制台](https://console.cloud.tencent.com/tcb)
2. 进入你的云托管服务
3. 找到 **环境变量** 配置页面
4. 添加以下环境变量：

```
TENCENTCLOUD_SECRET_ID=你的SecretId
TENCENTCLOUD_SECRET_KEY=你的SecretKey
TENCENT_APP_ID=你的AppId
TENCENT_REGION=ap-guangzhou
```

> **注意**：必须使用标准环境变量名 `TENCENTCLOUD_SECRET_ID` 和 `TENCENTCLOUD_SECRET_KEY`（腾讯云云托管推荐）。代码也支持旧变量名 `TENCENT_SECRET_ID` 和 `TENCENT_SECRET_KEY` 作为兼容，但建议使用标准名称。

### 步骤3：重启服务

配置完成后，重启云托管服务使配置生效。

### 步骤4：验证配置

运行诊断脚本验证：

```bash
node scripts/diagnose-cloud-env.js https://api.yimengpl.com
```

如果看到以下输出，说明配置成功：

```
✅ 腾讯云密钥已配置
✅ 服务健康检查通过
```

### 步骤5：测试功能

运行测试脚本验证语音识别功能：

```bash
node test/test-voice-recognition-cloud.js
```

---

## 📋 完整环境变量列表

如果还有其他配置问题，请确保以下环境变量都已配置：

### 必需配置

```bash
# 腾讯云配置（使用标准环境变量名）
TENCENTCLOUD_SECRET_ID=你的SecretId
TENCENTCLOUD_SECRET_KEY=你的SecretKey
TENCENT_APP_ID=你的AppId

# 数据库配置
DB_HOST_INTERNAL=10.27.100.151
DB_PORT_INTERNAL=3306
DB_USER=你的数据库用户名
DB_PASSWORD=你的数据库密码
DB_NAME=jlzr1101-5g9kplxza13a780d

# 环境标识
NODE_ENV=production

# JWT密钥
JWT_SECRET=你的JWT密钥
```

### 可选配置

```bash
# 腾讯云区域（默认：ap-guangzhou）
TENCENT_REGION=ap-guangzhou

# 微信小程序配置（如果使用）
WECHAT_APPID=你的AppID
WECHAT_APPSECRET=你的AppSecret
```

---

## 🔍 诊断工具

使用诊断工具检查配置：

```bash
# 检查本地配置
node scripts/diagnose-cloud-env.js

# 检查云托管配置
node scripts/diagnose-cloud-env.js https://api.yimengpl.com
```

---

## ❓ 常见问题

### Q: 配置后仍然报错？

A: 确保：
1. 环境变量名称完全正确（区分大小写）
2. 密钥值没有多余的空格或换行符
3. 服务已重启
4. 使用诊断脚本验证配置

### Q: 如何确认密钥是否正确？

A: 运行诊断脚本，如果看到 "✅ 腾讯云密钥已配置" 和 "✅ 签名生成功能正常"，说明配置正确。

### Q: 密钥在哪里获取？

A: 
- SecretId 和 SecretKey: [API密钥管理](https://console.cloud.tencent.com/cam/capi)
- AppId: [账号信息](https://console.cloud.tencent.com/developer)

---

**需要帮助？** 查看详细文档：[云托管部署配置检查清单](./CLOUD_DEPLOYMENT_CHECKLIST.md)

