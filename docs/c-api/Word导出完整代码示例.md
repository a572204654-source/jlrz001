# Word导出完整代码示例

## 📋 文档说明

本文档提供监理日志Word导出功能的完整代码实现，包括路由、工具方法、数据库查询等所有相关代码。所有代码均来自实际生产环境，可直接使用。

---

## 📂 文件结构

```
项目根目录/
├── routes/
│   └── supervision-log.js          # 监理日志路由（包含导出接口）
├── utils/
│   ├── wordGenerator.js            # Word生成工具
│   └── response.js                 # 统一响应格式工具
├── middleware/
│   └── auth.js                     # JWT认证中间件
├── config/
│   └── database.js                 # 数据库配置
└── app.js                          # 应用入口（注册路由）
```

---

## 1. 路由文件

### routes/supervision-log.js

```javascript
const express = require('express')
const router = express.Router()
const { success, badRequest, serverError, notFound } = require('../utils/response')
const { query } = require('../config/database')
const { authenticate } = require('../middleware/auth')

/**
 * 导出监理日志（Word）
 * GET /api/supervision-logs/:id/export
 * 
 * 功能说明:
 * - 查询监理日志详情（包含关联的项目、工程、用户信息）
 * - 调用Word生成工具创建文档
 * - 设置正确的响应头
 * - 返回Word文档二进制流
 * 
 * 认证要求:
 * - 需要JWT Token认证
 * 
 * URL参数:
 * - id: 监理日志ID
 * 
 * 响应:
 * - 成功: Word文档二进制流
 * - 失败: JSON错误消息
 */
router.get('/:id/export', authenticate, async (req, res) => {
  try {
    const { id } = req.params

    // ========== 步骤1: 查询监理日志详情 ==========
    // 使用LEFT JOIN关联查询，获取完整数据
    const logs = await query(
      `SELECT 
        sl.*,
        p.project_name,
        p.project_code,
        p.organization,
        p.chief_engineer,
        p.start_date as project_start_date,
        p.end_date as project_end_date,
        w.work_name,
        w.work_code,
        w.unit_work,
        u.nickname as user_name
       FROM supervision_logs sl
       LEFT JOIN projects p ON sl.project_id = p.id
       LEFT JOIN works w ON sl.work_id = w.id
       LEFT JOIN users u ON sl.user_id = u.id
       WHERE sl.id = ?`,
      [id]
    )

    // 检查日志是否存在
    if (logs.length === 0) {
      return notFound(res, '监理日志不存在')
    }

    const logData = logs[0]

    // ========== 步骤2: 查询附件信息（可选） ==========
    const attachments = await query(
      `SELECT 
        file_name,
        file_type,
        file_size
       FROM attachments
       WHERE related_type = 'log' AND related_id = ?
       ORDER BY created_at ASC`,
      [id]
    )

    // 添加附件信息到日志数据
    logData.attachments = attachments

    // ========== 步骤3: 生成Word文档 ==========
    const { generateSupervisionLogWord } = require('../utils/wordGenerator')
    const wordBuffer = await generateSupervisionLogWord(logData)

    // ========== 步骤4: 格式化文件名 ==========
    // 使用日志日期作为文件名的一部分
    const dateStr = logData.log_date ? 
      new Date(logData.log_date).toISOString().split('T')[0] : 
      new Date().toISOString().split('T')[0]
    
    const fileName = `监理日志_${dateStr}.docx`

    // ========== 步骤5: 设置响应头并返回 ==========
    // Content-Type: Word文档MIME类型
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')
    
    // Content-Disposition: 附件下载，指定文件名
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(fileName)}"`)
    
    // Content-Length: 文件大小
    res.setHeader('Content-Length', wordBuffer.length)

    // 返回文件流
    res.send(wordBuffer)

  } catch (error) {
    console.error('导出监理日志错误:', error)
    
    // 在开发环境返回详细错误信息，生产环境返回通用消息
    const errorMessage = process.env.NODE_ENV === 'development' 
      ? `导出失败: ${error.message}`
      : '导出失败'
    
    return serverError(res, errorMessage)
  }
})

module.exports = router
```

**关键点说明**:

1. **数据库查询**
   - 使用LEFT JOIN确保即使关联数据不存在也能查询到日志
   - 使用别名避免字段名冲突
   - 查询所有需要的字段

2. **文件命名**
   - 使用日志日期作为文件名
   - 使用encodeURIComponent编码中文文件名

3. **响应头设置**
   - Content-Type必须设置为Word MIME类型
   - Content-Disposition设置为attachment触发下载
   - Content-Length告知客户端文件大小

4. **错误处理**
   - 区分开发环境和生产环境
   - 记录详细错误日志
   - 返回合适的HTTP状态码

---

## 2. Word生成工具

### utils/wordGenerator.js

完整代码见前面的文档，这里提供核心框架：

```javascript
const { 
  Document, 
  Packer, 
  Paragraph, 
  Table, 
  TableCell, 
  TableRow, 
  WidthType, 
  AlignmentType, 
  VerticalAlign, 
  BorderStyle, 
  TextRun, 
  PageBreak 
} = require('docx')

/**
 * 生成监理日志Word文档
 * @param {Object} logData - 监理日志数据
 * @returns {Promise<Buffer>} Word文档Buffer
 */
async function generateSupervisionLogWord(logData) {
  try {
    // ========== 创建Document对象 ==========
    const doc = new Document({
      sections: [{
        properties: {
          page: {
            margin: {
              top: 1440,    // 1英寸
              right: 720,   // 0.5英寸
              bottom: 1440, // 1英寸
              left: 720     // 0.5英寸
            }
          }
        },
        children: [
          // ========== 第一页：封面页 ==========
          
          // 1. 顶部标题
          new Paragraph({
            alignment: AlignmentType.LEFT,
            spacing: { after: 100 },
            children: [
              new TextRun({
                text: '附录 11-5 表        ',
                size: 24,
                font: '宋体'
              }),
              new TextRun({
                text: '                    监理日志',
                size: 24,
                font: '宋体',
                bold: true
              })
            ]
          }),

          // 2. 项目信息表格
          createProjectInfoTable(logData),

          // 3. 监理机构信息表格
          createOrganizationTable(logData),

          // 4. 分页符
          new Paragraph({
            children: [new PageBreak()]
          }),

          // ========== 第二页：内容页 ==========
          
          // 1. 页面标题
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 0, line: 240 },
            children: [
              new TextRun({
                text: '监理日志',
                size: 24,
                font: '宋体',
                bold: true
              })
            ]
          }),

          // 2. 基本信息表格
          createBasicInfoTable(logData),

          // 3. 零间距段落（连接表格）
          new Paragraph({
            spacing: { before: 0, after: 0, line: 1 },
            children: []
          }),

          // 4. 内容表格
          createContentTable(logData),

          // 5. 零间距段落（连接表格）
          new Paragraph({
            spacing: { before: 0, after: 0, line: 1 },
            children: []
          }),

          // 6. 签字栏表格
          createSignatureTable(logData)
        ]
      }]
    })

    // ========== 生成Buffer并返回 ==========
    const buffer = await Packer.toBuffer(doc)
    return buffer

  } catch (error) {
    console.error('生成Word文档错误:', error)
    throw error
  }
}

/**
 * 创建项目信息表格
 */
function createProjectInfoTable(logData) {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
      bottom: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
      left: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
      right: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
      insideVertical: { style: BorderStyle.SINGLE, size: 1, color: '000000' }
    },
    rows: [
      // 项目名称行
      new TableRow({
        height: { value: 400, rule: 'atLeast' },
        children: [
          new TableCell({
            width: { size: 25, type: WidthType.PERCENTAGE },
            verticalAlign: VerticalAlign.CENTER,
            children: [createCenteredParagraph('项目名称')]
          }),
          new TableCell({
            width: { size: 75, type: WidthType.PERCENTAGE },
            verticalAlign: VerticalAlign.CENTER,
            columnSpan: 3,
            children: [createCenteredParagraph(logData.projectName || logData.project_name || '')]
          })
        ]
      }),
      
      // 项目编号行
      new TableRow({
        height: { value: 400, rule: 'atLeast' },
        children: [
          new TableCell({
            width: { size: 25, type: WidthType.PERCENTAGE },
            verticalAlign: VerticalAlign.CENTER,
            children: [createCenteredParagraph('项目编号')]
          }),
          new TableCell({
            width: { size: 75, type: WidthType.PERCENTAGE },
            verticalAlign: VerticalAlign.CENTER,
            columnSpan: 3,
            children: [createCenteredParagraph(logData.projectCode || logData.project_code || '')]
          })
        ]
      }),
      
      // ... 其他行
    ]
  })
}

/**
 * 辅助方法：创建居中段落
 */
function createCenteredParagraph(text, bold = false) {
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    children: [
      new TextRun({
        text: text,
        size: 24,
        bold: bold,
        font: '宋体'
      })
    ]
  })
}

/**
 * 辅助方法：格式化日期
 */
function formatDate(date) {
  if (!date) return ''
  
  const d = new Date(date)
  if (isNaN(d.getTime())) return ''
  
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  
  return `${year}年${month}月${day}日`
}

module.exports = {
  generateSupervisionLogWord
}
```

---

## 3. 响应工具

### utils/response.js

```javascript
/**
 * 统一响应格式工具
 */

/**
 * 成功响应
 * @param {Object} res - Express响应对象
 * @param {*} data - 响应数据
 * @param {string} message - 响应消息
 */
function success(res, data = null, message = '操作成功') {
  return res.json({
    code: 0,
    message,
    data,
    timestamp: Date.now()
  })
}

/**
 * 失败响应
 * @param {Object} res - Express响应对象
 * @param {string} message - 错误消息
 * @param {number} code - 错误码
 * @param {number} statusCode - HTTP状态码
 */
function error(res, message = '操作失败', code = -1, statusCode = 200) {
  return res.status(statusCode).json({
    code,
    message,
    data: null,
    timestamp: Date.now()
  })
}

/**
 * 参数错误（400）
 */
function badRequest(res, message = '参数错误') {
  return error(res, message, 400, 400)
}

/**
 * 未授权（401）
 */
function unauthorized(res, message = '未授权，请先登录') {
  return error(res, message, 401, 401)
}

/**
 * 禁止访问（403）
 */
function forbidden(res, message = '无权限访问') {
  return error(res, message, 403, 403)
}

/**
 * 未找到（404）
 */
function notFound(res, message = '资源不存在') {
  return error(res, message, 404, 404)
}

/**
 * 服务器错误（500）
 */
function serverError(res, message = '服务器错误') {
  return error(res, message, 500, 500)
}

module.exports = {
  success,
  error,
  badRequest,
  unauthorized,
  forbidden,
  notFound,
  serverError
}
```

---

## 4. 认证中间件

### middleware/auth.js

```javascript
const { verifyToken } = require('../utils/jwt')
const { unauthorized } = require('../utils/response')
const { query } = require('../config/database')

/**
 * JWT认证中间件
 * 
 * 功能:
 * - 从请求头获取Token
 * - 验证Token有效性
 * - 查询用户信息
 * - 将用户信息挂载到req对象
 * 
 * Token传递方式:
 * 1. Authorization: Bearer {token}
 * 2. token: {token}
 */
async function authenticate(req, res, next) {
  try {
    // ========== 步骤1: 获取Token ==========
    const token = req.headers.authorization?.replace('Bearer ', '') || req.headers.token

    if (!token) {
      return unauthorized(res, '请提供认证Token')
    }

    // ========== 步骤2: 验证Token ==========
    const decoded = verifyToken(token)
    
    // ========== 步骤3: 查询用户信息 ==========
    const users = await query(
      'SELECT id, openid, nickname, avatar, organization FROM users WHERE id = ?',
      [decoded.userId]
    )

    if (!users || users.length === 0) {
      return unauthorized(res, '用户不存在')
    }

    const user = users[0]

    // ========== 步骤4: 挂载用户信息 ==========
    req.user = user
    req.userId = user.id

    next()
    
  } catch (error) {
    console.error('认证错误:', error.message)
    return unauthorized(res, error.message || '认证失败')
  }
}

/**
 * 可选认证中间件（不强制要求登录）
 */
async function optionalAuth(req, res, next) {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '') || req.headers.token

    if (token) {
      const decoded = verifyToken(token)
      const users = await query(
        'SELECT id, openid, nickname, avatar, organization FROM users WHERE id = ?',
        [decoded.userId]
      )

      if (users && users.length > 0) {
        req.user = users[0]
        req.userId = users[0].id
      }
    }

    next()
  } catch (error) {
    // 可选认证失败不阻止请求
    next()
  }
}

module.exports = {
  authenticate,
  optionalAuth
}
```

---

## 5. 数据库配置

### config/database.js

```javascript
const mysql = require('mysql2/promise')
const config = require('./index')

// 输出数据库连接配置信息（隐藏密码）
console.log('==================================')
console.log('数据库连接配置:')
console.log(`环境: ${process.env.NODE_ENV || 'development'}`)
console.log(`地址: ${config.database.host}:${config.database.port}`)
console.log(`数据库: ${config.database.database}`)
console.log(`用户: ${config.database.user}`)
console.log('==================================')

// 创建数据库连接池
const pool = mysql.createPool(config.database)

/**
 * 测试数据库连接
 */
async function testConnection() {
  try {
    const connection = await pool.getConnection()
    console.log('✓ 数据库连接成功')
    connection.release()
    return true
  } catch (error) {
    console.error('✗ 数据库连接失败:', error.message)
    return false
  }
}

/**
 * 执行查询
 * @param {string} sql - SQL语句
 * @param {Array} params - 参数数组
 * @returns {Promise<Array>} 查询结果
 */
async function query(sql, params) {
  try {
    const [rows] = await pool.execute(sql, params)
    return rows
  } catch (error) {
    console.error('数据库查询错误:', error)
    throw error
  }
}

/**
 * 执行事务
 * @param {Function} callback - 事务回调函数
 * @returns {Promise<*>} 事务结果
 */
async function transaction(callback) {
  const connection = await pool.getConnection()
  try {
    await connection.beginTransaction()
    const result = await callback(connection)
    await connection.commit()
    return result
  } catch (error) {
    await connection.rollback()
    throw error
  } finally {
    connection.release()
  }
}

module.exports = {
  pool,
  query,
  transaction,
  testConnection
}
```

---

## 6. 应用入口

### app.js

```javascript
const express = require('express')
const app = express()

// ========== 中间件配置 ==========
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// ========== 注册路由 ==========
const supervisionLogRouter = require('./routes/supervision-log')
app.use('/api/supervision-logs', supervisionLogRouter)

// ========== 错误处理 ==========
app.use((err, req, res, next) => {
  console.error('全局错误:', err)
  res.status(500).json({
    code: 500,
    message: '服务器内部错误',
    data: null,
    timestamp: Date.now()
  })
})

module.exports = app
```

---

## 7. 小程序端调用示例

### pages/log-detail/index.js

```javascript
Page({
  data: {
    logId: 0,
    logInfo: {}
  },

  onLoad(options) {
    this.setData({
      logId: options.id
    })
    this.loadLogInfo()
  },

  /**
   * 导出Word文档
   */
  async exportWord() {
    const { logId } = this.data

    wx.showLoading({
      title: '正在导出...',
      mask: true
    })

    try {
      // ========== 步骤1: 调用导出接口 ==========
      const res = await wx.request({
        url: `${app.globalData.apiUrl}/api/supervision-logs/${logId}/export`,
        method: 'GET',
        header: {
          'Authorization': 'Bearer ' + wx.getStorageSync('token')
        },
        responseType: 'arraybuffer'  // 重要：必须设置为arraybuffer
      })

      wx.hideLoading()

      // ========== 步骤2: 检查响应 ==========
      if (res.statusCode !== 200) {
        // 处理错误响应
        const decoder = new TextDecoder('utf-8')
        const errorText = decoder.decode(new Uint8Array(res.data))
        const errorData = JSON.parse(errorText)
        
        wx.showToast({
          title: errorData.message || '导出失败',
          icon: 'none'
        })
        return
      }

      // ========== 步骤3: 保存文件 ==========
      const fs = wx.getFileSystemManager()
      const fileName = `监理日志_${new Date().getTime()}.docx`
      const filePath = `${wx.env.USER_DATA_PATH}/${fileName}`

      fs.writeFile({
        filePath: filePath,
        data: res.data,
        encoding: 'binary',
        success: () => {
          console.log('文件保存成功:', filePath)

          // ========== 步骤4: 打开文件 ==========
          wx.openDocument({
            filePath: filePath,
            fileType: 'docx',
            showMenu: true,
            success: () => {
              wx.showToast({
                title: '导出成功',
                icon: 'success'
              })
            },
            fail: (err) => {
              console.error('打开文件失败:', err)
              wx.showToast({
                title: '无法打开文件',
                icon: 'none'
              })
            }
          })
        },
        fail: (err) => {
          console.error('保存文件失败:', err)
          wx.showToast({
            title: '保存失败',
            icon: 'none'
          })
        }
      })

    } catch (error) {
      wx.hideLoading()
      console.error('导出Word错误:', error)
      wx.showToast({
        title: '导出失败',
        icon: 'none'
      })
    }
  },

  /**
   * 分享Word文档
   */
  async shareWord() {
    // 类似导出，但使用wx.shareFileMessage分享
    // ...
  }
})
```

### pages/log-detail/index.wxml

```xml
<view class="container">
  <view class="log-content">
    <!-- 日志详情展示 -->
  </view>

  <view class="action-buttons">
    <button class="btn-export" bindtap="exportWord">
      导出Word
    </button>
    <button class="btn-share" bindtap="shareWord">
      分享Word
    </button>
  </view>
</view>
```

---

## 8. 测试脚本

### test-word-export.js

```javascript
const axios = require('axios')
const fs = require('fs')

/**
 * 测试Word导出功能
 */
async function testWordExport() {
  console.log('========================================')
  console.log('  测试Word导出功能')
  console.log('========================================\n')

  const baseURL = 'http://localhost:80'
  let token = ''
  let logId = 0

  try {
    // ========== 步骤1: 登录获取Token ==========
    console.log('1️⃣ 用户登录...')
    const loginRes = await axios.post(`${baseURL}/api/auth/mock-login`, {
      openid: 'test_openid_001'
    })
    token = loginRes.data.data.token
    console.log('✅ 登录成功\n')

    // ========== 步骤2: 创建测试日志 ==========
    console.log('2️⃣ 创建测试日志...')
    const createRes = await axios.post(
      `${baseURL}/api/supervision-logs`,
      {
        projectId: 1,
        workId: 1,
        logDate: '2024-11-08',
        weather: '晴，温度15-25℃',
        projectDynamics: '测试工程动态',
        supervisionWork: '测试监理工作',
        safetyWork: '测试安全工作',
        recorderName: '测试记录人',
        recorderDate: '2024-11-08',
        reviewerName: '测试审核人',
        reviewerDate: '2024-11-09'
      },
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    )
    logId = createRes.data.data.id
    console.log(`✅ 日志创建成功，ID: ${logId}\n`)

    // ========== 步骤3: 导出Word ==========
    console.log('3️⃣ 导出Word文档...')
    const exportRes = await axios.get(
      `${baseURL}/api/supervision-logs/${logId}/export`,
      {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'arraybuffer'  // 重要
      }
    )

    // 保存文件
    const fileName = `test-output/监理日志_测试_${Date.now()}.docx`
    fs.writeFileSync(fileName, exportRes.data)
    console.log(`✅ Word导出成功`)
    console.log(`文件路径: ${fileName}`)
    console.log(`文件大小: ${exportRes.data.length} 字节\n`)

    // ========== 步骤4: 清理测试数据 ==========
    console.log('4️⃣ 清理测试数据...')
    await axios.delete(
      `${baseURL}/api/supervision-logs/${logId}`,
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    )
    console.log('✅ 清理完成\n')

    console.log('========================================')
    console.log('  ✅ 测试全部通过')
    console.log('========================================')

  } catch (error) {
    console.error('❌ 测试失败:', error.response?.data || error.message)
    process.exit(1)
  }
}

// 运行测试
testWordExport()
```

---

## 9. package.json 依赖

```json
{
  "name": "supervision-log-api",
  "version": "1.0.0",
  "dependencies": {
    "express": "^4.18.0",
    "mysql2": "^3.0.0",
    "jsonwebtoken": "^9.0.0",
    "dotenv": "^16.0.0",
    "docx": "^8.0.0"
  },
  "devDependencies": {
    "axios": "^1.0.0"
  }
}
```

---

## 10. 环境变量配置

### .env

```bash
# 数据库配置
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=express_miniapp

# JWT配置
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRES_IN=7d

# 微信小程序配置
WECHAT_APPID=your_appid
WECHAT_APPSECRET=your_appsecret

# 服务配置
PORT=80
NODE_ENV=development
```

---

## 📝 总结

以上代码提供了监理日志Word导出功能的完整实现，包括：

### ✅ 已包含的功能
1. **路由处理**: 接收请求、查询数据、生成Word、返回响应
2. **Word生成**: 创建符合规范的Word文档
3. **数据库查询**: 关联查询获取完整数据
4. **认证授权**: JWT Token验证
5. **错误处理**: 统一的错误响应格式
6. **小程序调用**: 完整的客户端实现示例
7. **测试脚本**: 自动化测试脚本

### 🚀 快速开始

```bash
# 1. 安装依赖
npm install

# 2. 配置环境变量
cp .env.example .env
# 修改.env中的配置

# 3. 初始化数据库
node scripts/init-db.js

# 4. 启动服务
npm start

# 5. 测试导出功能
node test-word-export.js
```

### 📚 相关文档
- [监理日志Word导出API文档](./监理日志Word导出API文档.md)
- [Word生成工具文档](./Word生成工具文档.md)

---

**文档结束**





