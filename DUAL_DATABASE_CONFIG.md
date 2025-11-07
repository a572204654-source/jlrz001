# 数据库双地址配置完整指南 🚀

## 📋 目录

1. [功能说明](#功能说明)
2. [快速开始](#快速开始)
3. [配置方法](#配置方法)
4. [测试验证](#测试验证)
5. [常见问题](#常见问题)

---

## 功能说明

### 什么是双地址配置？

本项目支持**自动切换数据库内外网地址**，实现：

- ✅ **本地开发**：自动使用外网地址，在本地即可访问数据库
- ✅ **云托管部署**：自动使用内网地址，速度更快、更稳定
- ✅ **零代码修改**：通过环境变量控制，无需修改代码
- ✅ **智能切换**：根据 `NODE_ENV` 自动判断使用哪个地址

### 工作原理

```
NODE_ENV=development → 使用外网地址 → 本地开发
NODE_ENV=production  → 使用内网地址 → 云托管部署
```

---

## 快速开始

### 1. 本地开发配置

#### 修改 `.env` 文件：

```bash
NODE_ENV=development  # 使用外网地址
```

#### 启动项目：

```bash
npm start
```

#### 查看启动日志：

```
==================================
数据库连接配置:
环境: development
地址: sh-cynosdbmysql-grp-goudlu7k.sql.tencentcdb.com:22087
数据库: jlzr1101-5g9kplxza13a780d
用户: a572204654
连接类型: 外网
==================================
```

### 2. 云托管部署配置

#### 方法一：使用配置文本（推荐）

1. 打开云托管平台 → 环境变量设置
2. 选择"**配置文本输入**"
3. 复制 `config/cloudbase-env.txt` 的内容粘贴进去
4. 保存并重启服务

#### 方法二：使用 JSON 输入

1. 打开云托管平台 → 环境变量设置
2. 选择"**JSON 输入**"
3. 复制 `config/cloudbase-env.json` 中的 `配置` 部分
4. 保存并重启服务

#### 方法三：可视化逐个输入

参考下面的环境变量清单，在云托管平台逐个添加。

---

## 配置方法

### 本地 `.env` 文件配置

```bash
# 环境配置（本地开发用 development）
NODE_ENV=development

# 数据库配置 - 内网地址（云托管环境使用）
DB_HOST_INTERNAL=10.27.100.151
DB_PORT_INTERNAL=3306

# 数据库配置 - 外网地址（本地开发使用）
DB_HOST_EXTERNAL=sh-cynosdbmysql-grp-goudlu7k.sql.tencentcdb.com
DB_PORT_EXTERNAL=22087

# 数据库通用配置
DB_USER=a572204654
DB_PASSWORD=572204654aA
DB_NAME=jlzr1101-5g9kplxza13a780d

# 微信小程序配置
WECHAT_APPID=wxbd778f929f40d8c2
WECHAT_APPSECRET=d2408b2a5907c6ade1bd17b2f75f0e65

# JWT密钥
JWT_SECRET=supervision-log-jwt-secret-XyZ9@2024!Abc

# 豆包AI配置
DOUBAO_API_KEY=af1085bd-3749-4303-bbd3-efcb287194fa
DOUBAO_ENDPOINT_ID=ep-20251106172018-dglqw
DOUBAO_API_URL=https://ark.cn-beijing.volces.com/api/v3

# 和风天气配置
QWEATHER_API_KEY=d7eb9f449c434e7f8a8cc32aab171128

# 服务端口
PORT=80
```

### 云托管平台环境变量配置

| 变量名 | 值 | 说明 |
|-------|-----|------|
| `NODE_ENV` | `production` | **必须设置为 production** |
| `DB_HOST_INTERNAL` | `10.27.100.151` | 数据库内网地址 |
| `DB_PORT_INTERNAL` | `3306` | 数据库内网端口 |
| `DB_HOST_EXTERNAL` | `sh-cynosdbmysql-grp-goudlu7k.sql.tencentcdb.com` | 数据库外网地址（备用） |
| `DB_PORT_EXTERNAL` | `22087` | 数据库外网端口（备用） |
| `DB_USER` | `a572204654` | 数据库用户名 |
| `DB_PASSWORD` | `572204654aA` | 数据库密码 |
| `DB_NAME` | `jlzr1101-5g9kplxza13a780d` | 数据库名称 |
| `WECHAT_APPID` | `wxbd778f929f40d8c2` | 微信小程序AppID |
| `WECHAT_APPSECRET` | `d2408b2a5907c6ade1bd17b2f75f0e65` | 微信小程序密钥 |
| `JWT_SECRET` | `supervision-log-jwt-secret-XyZ9@2024!Abc` | JWT密钥 |
| `DOUBAO_API_KEY` | `af1085bd-3749-4303-bbd3-efcb287194fa` | 豆包AI密钥 |
| `DOUBAO_ENDPOINT_ID` | `ep-20251106172018-dglqw` | 豆包推理接入点 |
| `DOUBAO_API_URL` | `https://ark.cn-beijing.volces.com/api/v3` | 豆包API地址 |
| `QWEATHER_API_KEY` | `d7eb9f449c434e7f8a8cc32aab171128` | 和风天气密钥 |
| `PORT` | `80` | 服务端口 |

---

## 测试验证

### 测试数据库连接

运行测试脚本：

```bash
npm run test-db
```

### 测试结果示例（本地开发环境）

```
==================================
数据库连接测试工具
==================================
当前环境: development

测试 内网地址 连接...
地址: 10.27.100.151:3306
数据库: jlzr1101-5g9kplxza13a780d
❌ 内网地址 连接失败: Connection lost: The server closed the connection.

测试 外网地址 连接...
地址: sh-cynosdbmysql-grp-goudlu7k.sql.tencentcdb.com:22087
数据库: jlzr1101-5g9kplxza13a780d
✅ 外网地址 连接成功！
数据库版本: 8.0.30-cynos-3.1.17.001

==================================
当前环境将使用的地址:
sh-cynosdbmysql-grp-goudlu7k.sql.tencentcdb.com:22087
==================================
```

**结果说明**：
- ✅ 外网地址连接成功 - 本地开发正常
- ❌ 内网地址连接失败 - 正常现象（本地无法访问内网）

### 测试结果示例（云托管环境）

在云托管环境中，查看日志应该显示：

```
==================================
数据库连接配置:
环境: production
地址: 10.27.100.151:3306
数据库: jlzr1101-5g9kplxza13a780d
用户: a572204654
连接类型: 内网
==================================
✓ 数据库连接成功
```

---

## 常见问题

### Q1: 本地启动时连接超时？

**原因**：本地环境设置了 `NODE_ENV=production`，尝试连接内网地址

**解决**：修改 `.env` 文件：
```bash
NODE_ENV=development
```

### Q2: 云托管部署后连接失败？

**检查清单**：
1. 确认 `NODE_ENV=production`
2. 确认内网地址和端口正确
3. 确认数据库用户名、密码正确
4. 查看云托管日志确认使用的是内网地址

### Q3: 如何在本地测试使用内网地址？

如果你在内网环境或通过VPN连接：

```bash
NODE_ENV=production npm start
```

### Q4: 数据库名称不一致怎么办？

云托管平台显示的数据库名称应该与 `.env` 中的 `DB_NAME` 一致。

如果不一致，请在云托管平台修改：
```bash
DB_NAME=jlzr1101-5g9kplxza13a780d
```

### Q5: 环境变量修改后没有生效？

1. 重启应用服务
2. 查看启动日志确认使用的地址
3. 清除浏览器缓存重新访问

### Q6: 如何验证当前使用的是哪个地址？

启动应用时会在日志中输出：

```
==================================
数据库连接配置:
环境: development
地址: sh-cynosdbmysql-grp-goudlu7k.sql.tencentcdb.com:22087
数据库: jlzr1101-5g9kplxza13a780d
用户: a572204654
连接类型: 外网
==================================
```

---

## 技术实现

### 自动切换逻辑

在 `config/index.js` 中实现：

```javascript
database: {
  host: process.env.NODE_ENV === 'production' 
    ? (process.env.DB_HOST_INTERNAL || '10.27.100.151')
    : (process.env.DB_HOST_EXTERNAL || 'sh-cynosdbmysql-grp-goudlu7k.sql.tencentcdb.com'),
  port: process.env.NODE_ENV === 'production'
    ? parseInt(process.env.DB_PORT_INTERNAL || '3306')
    : parseInt(process.env.DB_PORT_EXTERNAL || '22087'),
  // ...
}
```

### 连接日志输出

在 `config/database.js` 中添加：

```javascript
console.log('==================================');
console.log('数据库连接配置:');
console.log(`环境: ${process.env.NODE_ENV || 'development'}`);
console.log(`地址: ${config.database.host}:${config.database.port}`);
console.log(`数据库: ${config.database.database}`);
console.log(`用户: ${config.database.user}`);
console.log(`连接类型: ${process.env.NODE_ENV === 'production' ? '内网' : '外网'}`);
console.log('==================================');
```

---

## 相关文件

| 文件 | 说明 |
|------|------|
| `.env` | 本地开发环境变量配置 |
| `config/index.js` | 配置文件（包含自动切换逻辑） |
| `config/database.js` | 数据库连接池配置 |
| `config/cloudbase-env.txt` | 云托管环境变量（文本格式） |
| `config/cloudbase-env.json` | 云托管环境变量（JSON格式） |
| `scripts/test-db-connection.js` | 数据库连接测试脚本 |
| `docx/数据库双地址配置说明.md` | 详细配置说明文档 |

---

## NPM 脚本

| 命令 | 说明 |
|------|------|
| `npm start` | 启动应用 |
| `npm run dev` | 开发模式（自动重启） |
| `npm run test-db` | 测试数据库连接 |

---

## 安全提醒

⚠️ **重要**：
1. 不要将 `.env` 文件提交到代码仓库
2. 数据库密码请妥善保管
3. JWT密钥生产环境务必使用强密码
4. API密钥不要泄露

---

## 优势总结

✅ **开发便捷**：本地开发自动使用外网，无需VPN  
✅ **生产高效**：云托管自动使用内网，速度更快  
✅ **配置简单**：一次配置，自动切换  
✅ **维护方便**：环境变量集中管理  
✅ **安全可靠**：敏感信息不硬编码  

---

**最后更新**：2024-11-07  
**版本**：v1.0.0  
**作者**：监理日志项目团队

