# 云托管部署配置检查清单

## 问题诊断结果

根据诊断脚本的检查结果，发现以下问题：

### ❌ 当前问题

1. **腾讯云密钥未配置**
   - 云托管服务中缺少 `TENCENTCLOUD_SECRET_ID`（标准）或 `TENCENT_SECRET_ID`（兼容）
   - 云托管服务中缺少 `TENCENTCLOUD_SECRET_KEY`（标准）或 `TENCENT_SECRET_KEY`（兼容）
   - 云托管服务中缺少 `TENCENT_APP_ID`

### ✅ 已正常配置

- 数据库连接配置正常
- 服务健康检查通过
- 数据库表结构完整

---

## 必需的环境变量配置

### 腾讯云语音识别配置

在云托管环境变量中配置以下变量：

```bash
# 腾讯云密钥（必需，使用标准环境变量名）
TENCENTCLOUD_SECRET_ID=你的SecretId
TENCENTCLOUD_SECRET_KEY=你的SecretKey
TENCENT_APP_ID=你的AppId

# 腾讯云区域（可选，默认：ap-guangzhou）
TENCENT_REGION=ap-guangzhou
```

> **重要**：必须使用标准环境变量名 `TENCENTCLOUD_SECRET_ID` 和 `TENCENTCLOUD_SECRET_KEY`（腾讯云云托管推荐）。代码也支持旧变量名 `TENCENT_SECRET_ID` 和 `TENCENT_SECRET_KEY` 作为向后兼容，但建议使用标准名称。

### 数据库配置

```bash
# 数据库内网配置（生产环境使用）
DB_HOST_INTERNAL=10.27.100.151
DB_PORT_INTERNAL=3306
DB_USER=数据库用户名
DB_PASSWORD=数据库密码
DB_NAME=数据库名称
```

### 其他必需配置

```bash
# 环境标识
NODE_ENV=production

# JWT密钥（必须修改为强密码）
JWT_SECRET=你的JWT密钥

# 微信小程序配置（如果使用）
WECHAT_APPID=你的AppID
WECHAT_APPSECRET=你的AppSecret
```

---

## 配置步骤

### 1. 在腾讯云控制台配置环境变量

1. 登录 [腾讯云 CloudBase 控制台](https://console.cloud.tencent.com/tcb)
2. 进入你的云托管服务
3. 找到 **环境变量** 或 **配置管理** 选项
4. 添加以下环境变量：

| 变量名 | 值 | 说明 |
|--------|-----|------|
| `TENCENTCLOUD_SECRET_ID` | 你的SecretId | 腾讯云API密钥ID（标准变量名，推荐） |
| `TENCENTCLOUD_SECRET_KEY` | 你的SecretKey | 腾讯云API密钥Key（标准变量名，推荐） |
| `TENCENT_APP_ID` | 你的AppId | 腾讯云应用ID |
| `TENCENT_REGION` | `ap-guangzhou` | 腾讯云区域（可选） |
| `NODE_ENV` | `production` | 环境标识 |

> **注意**：`TENCENTCLOUD_SECRET_ID` 和 `TENCENTCLOUD_SECRET_KEY` 是腾讯云云托管的标准环境变量名。代码也支持 `TENCENT_SECRET_ID` 和 `TENCENT_SECRET_KEY` 作为兼容，但建议使用标准名称。
| `DB_HOST_INTERNAL` | `10.27.100.151` | 数据库内网地址 |
| `DB_PORT_INTERNAL` | `3306` | 数据库内网端口 |
| `DB_USER` | 你的数据库用户名 | 数据库用户名 |
| `DB_PASSWORD` | 你的数据库密码 | 数据库密码 |
| `DB_NAME` | `jlzr1101-5g9kplxza13a780d` | 数据库名称 |
| `JWT_SECRET` | 你的JWT密钥 | JWT签名密钥 |

### 2. 重启服务

配置环境变量后，需要重启云托管服务使配置生效。

### 3. 验证配置

运行诊断脚本验证配置：

```bash
# 使用云托管服务地址运行诊断
node scripts/diagnose-cloud-env.js https://api.yimengpl.com
```

预期结果：
- ✅ 所有必需环境变量已配置
- ✅ 腾讯云密钥已配置
- ✅ 服务健康检查通过

---

## 如何获取腾讯云密钥

### 1. 获取 SecretId 和 SecretKey

1. 登录 [腾讯云控制台](https://console.cloud.tencent.com/)
2. 进入 [访问管理](https://console.cloud.tencent.com/cam/capi)
3. 点击 **API密钥管理**
4. 创建或查看你的 API 密钥
5. 复制 `SecretId` 和 `SecretKey`

⚠️ **安全提示**：
- 不要将密钥提交到代码仓库
- 定期轮换密钥
- 使用子账号密钥，并授予最小权限

### 2. 获取 AppId

1. 登录 [腾讯云控制台](https://console.cloud.tencent.com/)
2. 进入 [账号信息](https://console.cloud.tencent.com/developer)
3. 查看 **账号信息** 中的 **APPID**

---

## 测试语音识别功能

配置完成后，运行测试脚本验证功能：

```bash
node test/test-voice-recognition-cloud.js
```

预期结果：
- ✅ 健康检查通过
- ✅ 登录获取Token成功
- ✅ 语音识别成功
- ✅ 获取历史记录成功
- ✅ 获取统计信息成功

---

## 常见问题排查

### 问题1：签名验证错误

**错误信息**：`The provided credentials could not be validated. Please check your signature is correct.`

**可能原因**：
1. `TENCENT_SECRET_ID` 或 `TENCENT_SECRET_KEY` 配置错误
2. 环境变量未正确加载
3. 服务未重启，配置未生效

**解决方法**：
1. 检查环境变量是否正确配置
2. 确认密钥没有多余的空格或换行符
3. 重启云托管服务
4. 运行诊断脚本验证配置

### 问题2：数据库连接失败

**错误信息**：`数据库连接失败`

**可能原因**：
1. 数据库内网地址配置错误
2. 数据库用户名或密码错误
3. 数据库防火墙未开放内网访问

**解决方法**：
1. 检查 `DB_HOST_INTERNAL` 和 `DB_PORT_INTERNAL` 配置
2. 确认数据库用户名和密码正确
3. 检查数据库安全组设置，确保允许内网访问

### 问题3：服务无法访问

**错误信息**：`无法连接到服务`

**可能原因**：
1. 服务地址错误
2. 服务未启动
3. 网络问题

**解决方法**：
1. 检查服务地址是否正确
2. 确认服务正在运行
3. 检查网络连接

---

## 配置验证清单

在部署到生产环境前，请确认：

- [ ] 所有必需的环境变量已配置
- [ ] 腾讯云密钥已配置且正确
- [ ] 数据库连接配置正确
- [ ] JWT密钥已修改为强密码
- [ ] 服务已重启，配置已生效
- [ ] 诊断脚本检查通过
- [ ] 功能测试通过

---

## 相关文档

- [语音识别功能文档](./VOICE_RECOGNITION.md)
- [API接口文档](./API.md)
- [部署文档](./DEPLOYMENT.md)

---

**最后更新**：2024-11-06

