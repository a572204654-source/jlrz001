# 云托管服务连接状态报告

**生成时间：** 2025-11-07  
**环境：** cloud1-5gtce4ym5a28e1b9

---

## ✅ 连接状态：成功

### 📊 环境信息

| 项目 | 信息 |
|------|------|
| **环境名称** | cloud1 |
| **环境ID** | cloud1-5gtce4ym5a28e1b9 |
| **套餐版本** | 个人版 |
| **环境状态** | ✅ 正常 |
| **创建时间** | 2025-04-02 20:03:51 |
| **来源** | 小程序 |

---

## 🚀 服务状态

| 项目 | 信息 |
|------|------|
| **服务名称** | supervision-log-api |
| **服务状态** | ✅ 正常运行 |
| **创建时间** | 2025-11-06 22:04:08 |
| **最后更新** | 2025-11-07 14:42:34 |

---

## 📦 版本信息

| 版本名称 | 状态 | 流量分配 | 创建时间 | 更新时间 |
|---------|------|---------|---------|---------|
| **supervision-log-api-015** | ✅ 正常 | **100%** | 2025-11-07 14:41:20 | 2025-11-07 14:42:30 |
| supervision-log-api-014 | ✅ 正常 | 0% | 2025-11-07 13:45:05 | 2025-11-07 15:02:36 |

**当前生产版本：** supervision-log-api-015

---

## 🌐 访问地址

### 主域名（推荐）
```
https://api.yimengpl.com
```

### 云托管默认域名
```
https://supervision-log-api-6g6ajfvk9ecc2a25-1319002931.ap-shanghai.service.tcloudbase.com
```

### 测试接口
```bash
# 健康检查
curl https://api.yimengpl.com/health

# API根路径
curl https://api.yimengpl.com/api

# 登录接口
curl -X POST https://api.yimengpl.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"code":"微信登录code"}'
```

---

## 🔧 管理命令

### 1. 查看服务列表
```bash
tcb run:deprecated list --envId cloud1-5gtce4ym5a28e1b9
```

### 2. 查看版本列表
```bash
tcb run:deprecated version list \
  --envId cloud1-5gtce4ym5a28e1b9 \
  --serviceName supervision-log-api
```

### 3. 创建新版本（部署更新）
```bash
tcb run:deprecated version create \
  --envId cloud1-5gtce4ym5a28e1b9 \
  --serviceName supervision-log-api
```

### 4. 修改流量分配
```bash
tcb run:deprecated version modify \
  --envId cloud1-5gtce4ym5a28e1b9 \
  --serviceName supervision-log-api
```

### 5. 删除旧版本
```bash
# 删除 supervision-log-api-014 （当前0%流量）
tcb run:deprecated version delete \
  --envId cloud1-5gtce4ym5a28e1b9 \
  --serviceName supervision-log-api \
  --versionName supervision-log-api-014
```

---

## 📋 Web控制台地址

### 环境总览
```
https://console.cloud.tencent.com/tcb/env/index?envId=cloud1-5gtce4ym5a28e1b9
```

### 云托管服务列表
```
https://console.cloud.tencent.com/tcb/service/index?envId=cloud1-5gtce4ym5a28e1b9
```

### 服务详情（日志/监控）
```
https://console.cloud.tencent.com/tcb/service/detail/cloud1-5gtce4ym5a28e1b9/supervision-log-api
```

### 环境变量配置
```
在服务详情页 → 配置管理 → 环境变量
```

---

## ✅ 环境变量检查清单

当前云托管平台已配置的环境变量：

- [x] `NODE_ENV` = production
- [x] `CLOUDBASE_ENV` = production
- [x] `CLOUDBASE_ENV_ID` = (留空)
- [x] `DB_HOST_INTERNAL` = 10.27.100.151
- [x] `DB_PORT_INTERNAL` = 3306
- [x] `DB_HOST_EXTERNAL` = sh-cynosdbmysql-grp-goudlu7k.sql.tencentcdb.com
- [x] `DB_PORT_EXTERNAL` = 22087
- [x] `DB_USER` = a572204654
- [x] `DB_PASSWORD` = 572204654aA
- [x] `DB_NAME` = jlzr1101-5g9kplxza13a780d
- [x] `WECHAT_APPID` = wxbd778f929f40d8c2
- [x] `WECHAT_APPSECRET` = d2408b2a5907c6ade1bd17b2f75f0e65
- [x] `JWT_SECRET` = supervision-log-jwt-secret-XyZ9@2024!Abc
- [x] `DOUBAO_API_KEY` = af1085bd-3749-4303-bbd3-efcb287194fa
- [x] `DOUBAO_ENDPOINT_ID` = ep-20251106172018-dglqw
- [x] `DOUBAO_API_URL` = https://ark.cn-beijing.volces.com/api/v3
- [x] `QWEATHER_API_KEY` = d7eb9f449c434e7f8a8cc32aab171128
- [x] `SERVICE_NAME` = express
- [x] `SERVICE_DOMAIN` = https://api.yimengpl.com
- [x] `PORT` = 80

**总计：** 20个环境变量，全部已配置 ✅

---

## 📊 数据库连接状态

### 云托管环境（生产）
- **使用地址：** 内网地址 `10.27.100.151:3306`
- **连接方式：** 通过VPC内网直连
- **优势：** 速度快、无需公网带宽、更安全

### 本地开发环境
- **使用地址：** 外网地址 `sh-cynosdbmysql-grp-goudlu7k.sql.tencentcdb.com:22087`
- **连接方式：** 公网连接
- **状态：** 已开启外网访问 ✅

### 自动切换逻辑
代码根据 `NODE_ENV` 环境变量自动选择：
- `production` → 内网地址（云托管）
- `development` → 外网地址（本地开发）

---

## 🔍 下一步操作建议

### 1. 查看实时日志
访问控制台 → 服务详情 → 日志查询，检查：
- 数据库连接是否成功
- 是否有错误日志
- 启动信息是否正常

### 2. 测试接口可用性
```bash
# 健康检查
curl https://api.yimengpl.com/health

# 应该返回类似：
{
  "code": 0,
  "message": "服务正常",
  "data": {
    "status": "ok",
    "database": "connected",
    "timestamp": 1699xxxxx
  }
}
```

### 3. 清理旧版本
当前有2个版本，旧版本（014）流量为0%，可以删除以节省资源：
```bash
tcb run:deprecated version delete \
  --envId cloud1-5gtce4ym5a28e1b9 \
  --serviceName supervision-log-api \
  --versionName supervision-log-api-014
```

### 4. 配置域名SSL证书
如果自定义域名 `api.yimengpl.com` 需要HTTPS，确保：
- SSL证书已配置
- 域名解析正确
- CDN加速已开启（可选）

### 5. 监控告警设置
在控制台设置监控告警：
- CPU使用率 > 80%
- 内存使用率 > 80%
- 请求错误率 > 5%
- 响应时间 > 3s

---

## 📞 问题排查

### 如果服务无法访问

1. **检查服务状态**
   ```bash
   tcb run:deprecated version list --envId cloud1-5gtce4ym5a28e1b9 --serviceName supervision-log-api
   ```

2. **查看日志**
   - 访问控制台查看实时日志
   - 查找错误信息

3. **检查环境变量**
   - 确认所有必需的环境变量都已配置
   - 特别检查数据库相关配置

4. **测试数据库连接**
   - 检查数据库内网地址是否正确
   - 确认数据库用户名密码正确
   - 查看数据库是否有连接限制

### 常见问题

**Q: 为什么访问域名返回错误？**  
A: 可能需要配置域名解析和SSL证书，或者服务正在启动中。

**Q: 如何查看详细的错误信息？**  
A: 访问控制台的日志查询功能，可以看到完整的错误堆栈。

**Q: 如何更新代码？**  
A: 推送代码到Git仓库后，在控制台点击"新建版本"，选择最新的Git提交即可。

**Q: 数据库连接失败怎么办？**  
A: 
1. 检查数据库内网地址是否正确
2. 确认环境变量配置正确
3. 查看数据库是否允许从云托管VPC访问

---

## 📚 相关文档

- [云托管官方文档](https://cloud.tencent.com/document/product/1243)
- [CloudBase CLI文档](https://docs.cloudbase.net/cli/intro.html)
- [项目部署文档](./DEPLOY.md)
- [项目配置文档](./部署配置完成.md)
- [双数据库配置](./DUAL_DATABASE_CONFIG.md)

---

**更新时间：** 2025-11-07  
**状态：** ✅ 所有服务正常运行

