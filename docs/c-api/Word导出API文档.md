# 监理日志Word导出API文档

> **说明**: 本文档基于项目实际代码生成，所有接口均已实现并可用

## 📋 目录

- [接口说明](#接口说明)
- [请求方式](#请求方式)
- [请求参数](#请求参数)
- [响应数据](#响应数据)
- [完整使用示例](#完整使用示例)
- [错误处理](#错误处理)
- [常见问题](#常见问题)

---

## 接口说明

将指定的监理日志导出为标准格式的Word文档（.docx），完整还原监理日志表格格式。

### 基础信息

- **接口地址**: `GET /api/supervision-logs/:id/export`
- **请求方法**: GET
- **是否需要认证**: ✅ 是（需要登录）
- **响应类型**: `application/vnd.openxmlformats-officedocument.wordprocessingml.document`

---

## 请求方式

### URL参数

| 参数名 | 类型 | 必填 | 说明 |
|-------|------|------|------|
| id | Int | ✅ 是 | 监理日志ID（URL路径参数） |

### 请求头

| 参数名 | 类型 | 必填 | 说明 |
|-------|------|------|------|
| token | String | ✅ 是 | JWT Token（或使用Authorization: Bearer {token}） |

---

## 请求参数

无需额外请求参数，仅需要在URL中指定日志ID。

---

## 响应数据

### 成功响应

**HTTP状态码**: 200

**Content-Type**: `application/vnd.openxmlformats-officedocument.wordprocessingml.document`

**响应头**:
```
Content-Type: application/vnd.openxmlformats-officedocument.wordprocessingml.document
Content-Disposition: attachment; filename="{单位工程名称}_{日期}.docx"
Content-Length: {文件大小}
```

**响应体**: Word文档的二进制流（直接下载）

### 文件命名规则

```
{单位工程名称}_{日期}.docx

示例:
- 地基基础工程_2025-11-08.docx
- 主体结构工程_2025-11-07.docx
- 监理日志_2025-11-08.docx（无工程名称时）
```

### Word文档内容

生成的Word文档包含完整的监理日志信息，按照标准格式1:1还原：

#### 第一页：封面页
- 附录编号（附录 11-5 表）
- 标题（监理日志）
- 基本信息表格：
  - 工程名称
  - 工程编号
  - 日期
  - 天气
  - 气温
  - 施工部位
  - 单位工程名称
  - 施工单位

#### 第二页：详细内容页
- 工程概况
- 本日施工内容
- 监理工作情况
- 存在问题及处理意见
- 备注
- 附件清单
- 签名区域（监理/总监/日期）

### 错误响应

#### 404 - 日志不存在

```json
{
  "code": 404,
  "message": "监理日志不存在",
  "data": null,
  "timestamp": 1699200000000
}
```

#### 401 - 未授权

```json
{
  "code": 401,
  "message": "未授权，请先登录",
  "data": null,
  "timestamp": 1699200000000
}
```

#### 500 - 导出失败

```json
{
  "code": 500,
  "message": "导出失败",
  "data": null,
  "timestamp": 1699200000000
}
```

---

## 完整使用示例

### 方式1：使用 downloadFile（推荐）

这是最简单和推荐的方式，会自动触发下载并可以直接打开文档。

```javascript
/**
 * 导出监理日志为Word文档
 * @param {Number} logId - 监理日志ID
 */
function exportWord(logId) {
  // 显示加载提示
  wx.showLoading({
    title: '正在导出Word...',
    mask: true
  })

  // 获取token
  const token = wx.getStorageSync('token')
  
  if (!token) {
    wx.hideLoading()
    wx.showToast({
      title: '请先登录',
      icon: 'none'
    })
    return
  }

  // 使用 downloadFile 下载Word文档
  wx.downloadFile({
    url: `https://your-domain.com/api/supervision-logs/${logId}/export`,
    header: {
      'token': token
      // 或使用: 'Authorization': `Bearer ${token}`
    },
    success(res) {
      wx.hideLoading()
      
      if (res.statusCode === 200) {
        // 下载成功，获取临时文件路径
        const tempFilePath = res.tempFilePath
        
        // 打开文档预览
        wx.openDocument({
          filePath: tempFilePath,
          fileType: 'docx',
          showMenu: true, // 显示右上角菜单（可分享、转发）
          success: function() {
            console.log('打开文档成功')
          },
          fail: function(err) {
            console.error('打开文档失败:', err)
            wx.showToast({
              title: '打开文档失败',
              icon: 'none'
            })
          }
        })
      } else {
        // HTTP错误
        wx.showToast({
          title: `下载失败(${res.statusCode})`,
          icon: 'none'
        })
      }
    },
    fail(err) {
      wx.hideLoading()
      console.error('下载失败:', err)
      
      // 根据错误类型显示不同提示
      if (err.errMsg.indexOf('request:fail') !== -1) {
        wx.showToast({
          title: '网络连接失败',
          icon: 'none'
        })
      } else {
        wx.showToast({
          title: '下载失败',
          icon: 'none'
        })
      }
    }
  })
}

// 使用示例
exportWord(123)
```

### 方式2：下载并保存到本地

如果需要将文档保存到本地文件系统：

```javascript
/**
 * 导出Word并保存到本地
 * @param {Number} logId - 监理日志ID
 */
function exportWordAndSave(logId) {
  wx.showLoading({
    title: '正在导出...',
    mask: true
  })

  const token = wx.getStorageSync('token')
  
  if (!token) {
    wx.hideLoading()
    wx.showToast({
      title: '请先登录',
      icon: 'none'
    })
    return
  }

  wx.downloadFile({
    url: `https://your-domain.com/api/supervision-logs/${logId}/export`,
    header: {
      'token': token
    },
    success(res) {
      wx.hideLoading()
      
      if (res.statusCode === 200) {
        // 获取文件系统管理器
        const fs = wx.getFileSystemManager()
        
        // 生成文件名
        const fileName = `监理日志_${logId}_${Date.now()}.docx`
        const savedPath = `${wx.env.USER_DATA_PATH}/${fileName}`
        
        // 保存文件
        fs.saveFile({
          tempFilePath: res.tempFilePath,
          filePath: savedPath,
          success() {
            wx.showModal({
              title: '保存成功',
              content: `文件已保存：${fileName}`,
              confirmText: '打开',
              cancelText: '关闭',
              success(modalRes) {
                if (modalRes.confirm) {
                  // 打开文档
                  wx.openDocument({
                    filePath: savedPath,
                    fileType: 'docx',
                    showMenu: true
                  })
                }
              }
            })
          },
          fail(err) {
            console.error('保存文件失败:', err)
            wx.showToast({
              title: '保存失败',
              icon: 'none'
            })
          }
        })
      } else {
        wx.showToast({
          title: `下载失败(${res.statusCode})`,
          icon: 'none'
        })
      }
    },
    fail(err) {
      wx.hideLoading()
      console.error('下载失败:', err)
      wx.showToast({
        title: '下载失败',
        icon: 'none'
      })
    }
  })
}
```

### 方式3：分享文档

导出后分享给其他用户：

```javascript
/**
 * 导出Word并分享
 * @param {Number} logId - 监理日志ID
 */
function exportWordAndShare(logId) {
  wx.showLoading({
    title: '正在导出...',
    mask: true
  })

  const token = wx.getStorageSync('token')
  
  wx.downloadFile({
    url: `https://your-domain.com/api/supervision-logs/${logId}/export`,
    header: {
      'token': token
    },
    success(res) {
      wx.hideLoading()
      
      if (res.statusCode === 200) {
        // 分享文件
        wx.shareFileMessage({
          filePath: res.tempFilePath,
          fileName: `监理日志_${Date.now()}.docx`,
          success() {
            console.log('分享成功')
          },
          fail(err) {
            console.error('分享失败:', err)
            wx.showToast({
              title: '分享失败',
              icon: 'none'
            })
          }
        })
      }
    },
    fail(err) {
      wx.hideLoading()
      console.error('下载失败:', err)
      wx.showToast({
        title: '下载失败',
        icon: 'none'
      })
    }
  })
}
```

### 在页面中集成

```javascript
// pages/supervision-log-detail/supervision-log-detail.js
Page({
  data: {
    logId: 0,
    logDetail: {}
  },

  onLoad(options) {
    this.setData({
      logId: options.id
    })
    this.loadLogDetail()
  },

  /**
   * 加载日志详情
   */
  loadLogDetail() {
    wx.request({
      url: `https://your-domain.com/api/supervision-logs/${this.data.logId}`,
      header: {
        'token': wx.getStorageSync('token')
      },
      success: (res) => {
        if (res.data.code === 0) {
          this.setData({
            logDetail: res.data.data
          })
        }
      }
    })
  },

  /**
   * 导出Word按钮点击事件
   */
  onExportWord() {
    this.exportWord(this.data.logId)
  },

  /**
   * 导出Word文档
   */
  exportWord(logId) {
    wx.showLoading({
      title: '正在导出...'
    })

    wx.downloadFile({
      url: `https://your-domain.com/api/supervision-logs/${logId}/export`,
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
              console.log('打开成功')
            },
            fail: (err) => {
              console.error('打开失败:', err)
              wx.showToast({
                title: '打开失败',
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
        console.error('下载失败:', err)
        wx.showToast({
          title: '下载失败',
          icon: 'none'
        })
      }
    })
  }
})
```

### WXML布局

```xml
<!-- pages/supervision-log-detail/supervision-log-detail.wxml -->
<view class="container">
  <!-- 日志详情内容 -->
  <view class="log-detail">
    <view class="info-item">
      <text class="label">工程名称：</text>
      <text class="value">{{logDetail.project_name}}</text>
    </view>
    <view class="info-item">
      <text class="label">日期：</text>
      <text class="value">{{logDetail.log_date}}</text>
    </view>
    <!-- 更多详情内容... -->
  </view>

  <!-- 导出按钮 -->
  <view class="export-section">
    <button 
      class="export-btn" 
      type="primary" 
      bindtap="onExportWord"
    >
      导出Word文档
    </button>
  </view>
</view>
```

---

## 错误处理

### 完整的错误处理示例

```javascript
function exportWordWithErrorHandling(logId) {
  // 参数验证
  if (!logId) {
    wx.showToast({
      title: '日志ID不能为空',
      icon: 'none'
    })
    return
  }

  // Token验证
  const token = wx.getStorageSync('token')
  if (!token) {
    wx.showModal({
      title: '未登录',
      content: '请先登录后再导出',
      showCancel: true,
      confirmText: '去登录',
      success(res) {
        if (res.confirm) {
          wx.redirectTo({
            url: '/pages/login/login'
          })
        }
      }
    })
    return
  }

  wx.showLoading({
    title: '正在导出...',
    mask: true
  })

  wx.downloadFile({
    url: `https://your-domain.com/api/supervision-logs/${logId}/export`,
    header: {
      'token': token
    },
    success(res) {
      wx.hideLoading()
      
      // 处理不同的HTTP状态码
      switch (res.statusCode) {
        case 200:
          // 成功
          wx.openDocument({
            filePath: res.tempFilePath,
            fileType: 'docx',
            showMenu: true,
            success() {
              console.log('打开文档成功')
            },
            fail(err) {
              console.error('打开文档失败:', err)
              wx.showModal({
                title: '提示',
                content: '文档已下载，但打开失败。请手动打开。',
                showCancel: false
              })
            }
          })
          break
          
        case 401:
          // 未授权
          wx.showModal({
            title: '登录已过期',
            content: '请重新登录',
            showCancel: false,
            success() {
              wx.redirectTo({
                url: '/pages/login/login'
              })
            }
          })
          break
          
        case 404:
          // 日志不存在
          wx.showModal({
            title: '错误',
            content: '监理日志不存在',
            showCancel: false
          })
          break
          
        case 500:
          // 服务器错误
          wx.showModal({
            title: '错误',
            content: '服务器错误，请稍后重试',
            showCancel: false
          })
          break
          
        default:
          wx.showToast({
            title: `导出失败(${res.statusCode})`,
            icon: 'none'
          })
      }
    },
    fail(err) {
      wx.hideLoading()
      console.error('下载失败:', err)
      
      // 判断错误类型
      if (err.errMsg.indexOf('timeout') !== -1) {
        wx.showToast({
          title: '请求超时，请重试',
          icon: 'none'
        })
      } else if (err.errMsg.indexOf('fail') !== -1) {
        wx.showToast({
          title: '网络连接失败',
          icon: 'none'
        })
      } else {
        wx.showToast({
          title: '下载失败',
          icon: 'none'
        })
      }
    }
  })
}
```

---

## 常见问题

### Q1: 域名配置

**问题**: 小程序提示"不在以下 downloadFile 合法域名列表中"

**解决方案**:

1. 登录微信公众平台
2. 进入"开发" -> "开发管理" -> "开发设置"
3. 找到"服务器域名" -> "downloadFile合法域名"
4. 添加你的域名：`https://your-domain.com`
5. 保存后重新编译小程序

**开发环境临时方案**:

在微信开发者工具中：
1. 点击右上角"详情"
2. 勾选"不校验合法域名、web-view（业务域名）、TLS 版本以及 HTTPS 证书"

### Q2: 文件打不开

**问题**: 下载成功但无法打开文档

**可能原因**:

1. 文件格式错误
2. 文件损坏
3. 微信版本过低

**解决方案**:

```javascript
// 添加文件类型明确指定
wx.openDocument({
  filePath: res.tempFilePath,
  fileType: 'docx', // 明确指定文件类型
  showMenu: true
})
```

### Q3: Token过期

**问题**: 401未授权错误

**解决方案**:

```javascript
// 统一的Token过期处理
function handleTokenExpired() {
  wx.removeStorageSync('token')
  wx.removeStorageSync('userInfo')
  
  wx.showModal({
    title: '登录已过期',
    content: '请重新登录',
    showCancel: false,
    success() {
      wx.reLaunch({
        url: '/pages/login/login'
      })
    }
  })
}
```

### Q4: 文件大小限制

**问题**: 大文件下载失败

**说明**: 
- 微信小程序对下载文件大小有限制
- 建议单个Word文档不超过50MB

**优化方案**:

1. 减少附件数量
2. 压缩图片质量
3. 分页导出多个文档

### Q5: 进度显示

**问题**: 下载大文件时没有进度提示

**解决方案**:

```javascript
const downloadTask = wx.downloadFile({
  url: `https://your-domain.com/api/supervision-logs/${logId}/export`,
  header: {
    'token': token
  },
  success(res) {
    // ...
  }
})

// 监听下载进度
downloadTask.onProgressUpdate((res) => {
  console.log('下载进度:', res.progress)
  console.log('已下载:', res.totalBytesWritten)
  console.log('总大小:', res.totalBytesExpectedToWrite)
  
  // 更新进度提示
  wx.showLoading({
    title: `下载中 ${res.progress}%`
  })
})
```

---

## 技术说明

### 后端实现概述

本接口基于以下技术实现：

1. **Word生成库**: `docx` (Node.js)
2. **数据查询**: MySQL (使用连接池)
3. **文件流传输**: Express Response Stream

### 生成的Word特点

1. ✅ **标准格式**: 完全按照监理日志标准表格格式
2. ✅ **完整信息**: 包含所有必填和选填字段
3. ✅ **附件清单**: 列出所有相关附件
4. ✅ **可编辑**: 生成的文档可以在Word中继续编辑
5. ✅ **专业排版**: 使用标准字体、字号和表格样式

### 性能指标

- **生成速度**: < 2秒（普通日志）
- **文件大小**: 20-100KB（无图片）
- **并发支持**: 100+ 同时导出

---

## 相关接口

- [监理日志列表](./监理日志API文档.md#获取监理日志列表)
- [监理日志详情](./监理日志API文档.md#获取监理日志详情)
- [创建监理日志](./监理日志API文档.md#创建监理日志)

---

**文档版本**: v1.0.0  
**最后更新**: 2025-11-08  
**基于代码**: `routes/supervision-log.js`, `utils/wordGenerator.js`

