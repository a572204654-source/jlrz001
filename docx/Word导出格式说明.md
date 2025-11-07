# 监理日志Word导出格式说明

## 更新日期
2024-11-07

## 功能概述
监理日志Word导出功能已按照标准监理日志格式进行1:1还原，生成符合工程监理规范的专业文档。

## 格式特点

### 1. 文档结构
- **标题**：监理日志（居中，22pt，宋体，加粗）
- **主表格**：包含所有监理日志信息的统一表格
- **签名区**：记录人和审核人签名栏

### 2. 表格布局

#### 第一部分：基本信息
| 字段 | 说明 | 样式 |
|------|------|------|
| 单位工程名称 | 工程名称 | 左对齐，12pt |
| 单位工程编号 | 工程编号 | 左对齐，12pt |
| 日期 | 日志日期（格式：YYYY年MM月DD日） | 左对齐，12pt |
| 气象 | 天气情况 | 左对齐，12pt |

#### 第二部分：内容区域
三个主要内容区域，每个区域包含：
- **标题列**（竖排）：宽度6%，居中，加粗
- **内容列**：宽度94%，带缩进，1.5倍行距

1. **工程动态**
   - 记录当日工程施工情况
   - 最小高度：2000 twips

2. **监理工作情况**
   - 记录监理工作内容
   - 最小高度：2000 twips

3. **安全监理工作情况**
   - 记录安全监理检查情况
   - 最小高度：2000 twips

#### 第三部分：签名区
| 记录人 | 姓名 | 年 月 日 | 审核人 | 姓名 | 年 月 日 |
|-------|------|---------|--------|------|----------|
| 6列布局 | 居中对齐 | 12pt宋体 |

### 3. 技术实现

#### 使用的库
- **docx**: 专业的Word文档生成库
- 版本: ^9.0.0

#### 主要特性
✅ 完整的表格边框控制  
✅ 单元格合并支持  
✅ 竖排文字（TextDirection.BOTTOM_TO_TOP_LEFT_TO_RIGHT）  
✅ 精确的列宽控制（百分比）  
✅ 行高控制（最小高度）  
✅ 垂直居中对齐  
✅ 段落缩进和行距  
✅ 字体和字号完全控制  

## API 接口

### 导出监理日志

#### 请求
```
GET /api/supervision-logs/:id/export
GET /api/v1/supervision-logs/:id/export
```

#### 请求头
```
Authorization: Bearer {token}
```
或
```
token: {token}
```

#### 参数
- `id`: 监理日志ID（路径参数）

#### 响应
- **Content-Type**: `application/vnd.openxmlformats-officedocument.wordprocessingml.document`
- **Content-Disposition**: `attachment; filename="监理日志_2024-11-07.docx"`
- **响应体**: Word文档二进制流

#### 示例（使用axios）
```javascript
const axios = require('axios')
const fs = require('fs')

async function exportLog(logId, token) {
  const response = await axios({
    url: `http://localhost/api/supervision-logs/${logId}/export`,
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`
    },
    responseType: 'arraybuffer'
  })
  
  fs.writeFileSync('监理日志.docx', response.data)
  console.log('导出成功！')
}
```

## 小程序调用示例

### 使用方法

```javascript
// 在小程序中调用导出接口
wx.downloadFile({
  url: `${API_BASE_URL}/api/supervision-logs/${logId}/export`,
  header: {
    'token': wx.getStorageSync('token')
  },
  success(res) {
    if (res.statusCode === 200) {
      // 获取临时文件路径
      const filePath = res.tempFilePath
      
      // 打开文档
      wx.openDocument({
        filePath: filePath,
        fileType: 'docx',
        success: function() {
          console.log('打开文档成功')
        },
        fail: function(err) {
          console.error('打开文档失败', err)
          wx.showToast({
            title: '打开文档失败',
            icon: 'none'
          })
        }
      })
    }
  },
  fail(err) {
    console.error('下载失败', err)
    wx.showToast({
      title: '导出失败',
      icon: 'none'
    })
  }
})
```

### 完整示例（带加载提示）

```javascript
// pages/log-detail/index.js

// 导出Word文档
exportWord() {
  const logId = this.data.logId
  
  wx.showLoading({
    title: '正在导出...',
    mask: true
  })
  
  wx.downloadFile({
    url: `${app.globalData.apiBaseUrl}/api/supervision-logs/${logId}/export`,
    header: {
      'token': wx.getStorageSync('token')
    },
    success: (res) => {
      wx.hideLoading()
      
      if (res.statusCode === 200) {
        wx.openDocument({
          filePath: res.tempFilePath,
          fileType: 'docx',
          showMenu: true,
          success: () => {
            wx.showToast({
              title: '导出成功',
              icon: 'success'
            })
          },
          fail: (err) => {
            console.error('打开文档失败', err)
            wx.showToast({
              title: '打开文档失败',
              icon: 'none'
            })
          }
        })
      } else {
        wx.showToast({
          title: '导出失败',
          icon: 'none'
        })
      }
    },
    fail: (err) => {
      wx.hideLoading()
      console.error('下载失败', err)
      wx.showToast({
        title: '网络错误',
        icon: 'none'
      })
    }
  })
}
```

### WXML 按钮示例

```xml
<view class="action-buttons">
  <button class="export-btn" bindtap="exportWord">
    <text class="icon">📄</text>
    <text>导出Word</text>
  </button>
</view>
```

### WXSS 样式示例

```css
.action-buttons {
  padding: 20rpx 30rpx;
  display: flex;
  justify-content: center;
}

.export-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 10rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20rpx 40rpx;
  box-shadow: 0 4rpx 12rpx rgba(102, 126, 234, 0.3);
}

.export-btn .icon {
  margin-right: 10rpx;
  font-size: 36rpx;
}
```

## 数据格式要求

### 输入数据结构
```javascript
{
  work_name: '工程名称',           // 必填
  work_code: '工程编号',           // 必填
  log_date: Date,                  // 日志日期，必填
  weather: '天气情况',             // 选填
  project_dynamics: '工程动态内容', // 选填
  supervision_work: '监理工作内容', // 选填
  safety_work: '安全监理工作内容',  // 选填
  recorder_name: '记录人姓名',      // 选填
  reviewer_name: '审核人姓名'       // 选填
}
```

### 字段说明

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| work_name | String | 是 | 单位工程名称 |
| work_code | String | 是 | 单位工程编号 |
| log_date | Date/String | 是 | 日志日期，格式化为"YYYY年MM月DD日" |
| weather | String | 否 | 气象情况，如"晴，15-25℃" |
| project_dynamics | String | 否 | 工程动态详细内容，支持换行 |
| supervision_work | String | 否 | 监理工作情况详细内容，支持换行 |
| safety_work | String | 否 | 安全监理工作情况详细内容，支持换行 |
| recorder_name | String | 否 | 记录人姓名 |
| reviewer_name | String | 否 | 审核人姓名 |

## 测试

### 本地测试
运行测试脚本生成示例Word文档：

```bash
node scripts/test-word-export.js
```

生成的文档保存在项目根目录：`test-监理日志.docx`

### API测试
1. 启动服务器：`npm start`
2. 使用Postman或Apifox测试导出接口
3. 设置响应类型为 `binary`

## 注意事项

### 1. 文件大小
- 空白模板：约8-10KB
- 带内容：根据内容长度，一般10-50KB

### 2. 浏览器下载
如果在Web端下载，需要正确设置响应头：
```javascript
res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')
res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(fileName)}"`)
```

### 3. 中文文件名
文件名需要使用 `encodeURIComponent()` 进行编码，确保中文正常显示。

### 4. 换行符
内容中的换行符（`\n`）会被正确处理，生成多个段落。

### 5. 特殊字符
内容中的特殊字符会被自动转义，无需手动处理。

## 升级说明

### 从旧版本升级
如果您的项目使用的是旧版本的 `officegen` 实现，请按以下步骤升级：

1. **安装新依赖**
```bash
npm install docx --save
```

2. **替换文件**
直接替换 `utils/wordGenerator.js` 文件

3. **测试验证**
```bash
node scripts/test-word-export.js
```

4. **无需修改API**
导出接口代码无需修改，完全兼容

### 版本对比

| 项目 | 旧版本(officegen) | 新版本(docx) |
|------|------------------|-------------|
| 表格控制 | 有限 | 完全控制 |
| 竖排文字 | 不支持 | ✅ 支持 |
| 单元格合并 | 有限 | ✅ 完全支持 |
| 文件大小 | 较大 | 较小 |
| 格式还原度 | 70% | 95%+ |
| 兼容性 | 一般 | 优秀 |

## 技术支持

如果遇到问题，请检查：

1. ✅ 是否正确安装了 `docx` 依赖
2. ✅ 数据格式是否正确
3. ✅ 日期字段是否为有效日期
4. ✅ 是否有正确的认证token
5. ✅ 服务器是否正常运行

## 开发者信息

- **实现文件**: `utils/wordGenerator.js`
- **路由文件**: `routes/supervision-log.js`, `routes/v1/supervision-log.js`
- **依赖库**: `docx@^9.0.0`
- **测试脚本**: `scripts/test-word-export.js`

---

**最后更新**: 2024-11-07  
**版本**: v2.0.0  
**状态**: ✅ 已完成1:1格式还原

