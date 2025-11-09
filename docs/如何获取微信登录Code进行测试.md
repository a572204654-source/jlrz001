# 如何获取微信登录 Code 进行测试

本文档介绍如何在小程序中获取真实的微信登录 code，用于测试后端登录接口。

## 方法一：在小程序中直接获取（推荐）

### 1. 在小程序页面中添加测试代码

在小程序的任意页面（如 `pages/index/index.js`）中添加以下代码：

```javascript
Page({
  data: {
    loginCode: '',
    showCode: false
  },

  // 获取微信登录 code
  async getWechatCode() {
    wx.showLoading({ title: '获取中...' })
    
    try {
      // 调用 wx.login 获取 code
      const res = await new Promise((resolve, reject) => {
        wx.login({
          success: resolve,
          fail: reject
        })
      })

      if (res.code) {
        this.setData({
          loginCode: res.code,
          showCode: true
        })
        
        wx.hideLoading()
        wx.showModal({
          title: '获取成功',
          content: `Code: ${res.code}\n\n已复制到剪贴板，可直接用于测试`,
          showCancel: false,
          success: () => {
            // 复制到剪贴板
            wx.setClipboardData({
              data: res.code,
              success: () => {
                wx.showToast({
                  title: '已复制',
                  icon: 'success'
                })
              }
            })
          }
        })
      } else {
        wx.hideLoading()
        wx.showToast({
          title: '获取失败',
          icon: 'none'
        })
      }
    } catch (error) {
      wx.hideLoading()
      console.error('获取 code 失败:', error)
      wx.showToast({
        title: '获取失败',
        icon: 'none'
      })
    }
  }
})
```

### 2. 在页面 WXML 中添加按钮

在对应的 `pages/index/index.wxml` 文件中添加：

```xml
<view class="container">
  <button type="primary" bindtap="getWechatCode">获取微信登录 Code</button>
  
  <view wx:if="{{showCode}}" class="code-display">
    <text class="label">Code:</text>
    <text class="code">{{loginCode}}</text>
    <button size="mini" bindtap="copyCode">复制</button>
  </view>
</view>
```

### 3. 使用方法

1. 在微信开发者工具中打开小程序
2. 点击"获取微信登录 Code"按钮
3. 在弹出的对话框中可以看到 code
4. code 会自动复制到剪贴板
5. 使用 Postman 或其他工具测试登录接口时，直接粘贴这个 code

## 方法二：使用小程序控制台

### 1. 在小程序代码中临时添加

在 `app.js` 的 `onLaunch` 方法中添加：

```javascript
App({
  onLaunch() {
    // 临时测试：获取 code 并打印到控制台
    wx.login({
      success: (res) => {
        if (res.code) {
          console.log('微信登录 Code:', res.code)
          console.log('请复制上面的 code 用于测试')
        }
      }
    })
  }
})
```

### 2. 查看控制台输出

1. 在微信开发者工具中运行小程序
2. 打开"调试器" -> "Console" 标签
3. 可以看到打印的 code
4. 复制 code 用于测试

## 方法三：创建专门的测试页面

### 1. 创建测试页面

创建 `pages/test-login/test-login.js`：

```javascript
Page({
  data: {
    code: '',
    codeHistory: []
  },

  onLoad() {
    this.getCode()
  },

  // 获取 code
  getCode() {
    wx.login({
      success: (res) => {
        if (res.code) {
          this.setData({
            code: res.code
          })
          
          // 保存到历史记录
          const history = wx.getStorageSync('codeHistory') || []
          history.unshift({
            code: res.code,
            time: new Date().toLocaleString()
          })
          if (history.length > 10) {
            history.pop()
          }
          wx.setStorageSync('codeHistory', history)
          this.setData({
            codeHistory: history
          })
        }
      }
    })
  },

  // 复制 code
  copyCode() {
    wx.setClipboardData({
      data: this.data.code,
      success: () => {
        wx.showToast({
          title: '已复制',
          icon: 'success'
        })
      }
    })
  },

  // 刷新 code
  refreshCode() {
    this.getCode()
  }
})
```

### 2. 创建测试页面 WXML

创建 `pages/test-login/test-login.wxml`：

```xml
<view class="container">
  <view class="section">
    <text class="title">当前 Code</text>
    <view class="code-box">
      <text class="code">{{code}}</text>
    </view>
    <view class="actions">
      <button type="primary" bindtap="copyCode">复制 Code</button>
      <button bindtap="refreshCode">刷新 Code</button>
    </view>
  </view>

  <view class="section">
    <text class="title">历史记录</text>
    <view class="history-list">
      <view class="history-item" wx:for="{{codeHistory}}" wx:key="index">
        <text class="time">{{item.time}}</text>
        <text class="code">{{item.code}}</text>
      </view>
    </view>
  </view>
</view>
```

### 3. 在 app.json 中注册页面

```json
{
  "pages": [
    "pages/test-login/test-login"
  ]
}
```

## 使用 Code 测试登录接口

### 1. 使用 Postman 测试

**请求方式**: POST  
**URL**: `http://localhost:3000/api/v1/auth/wechat-login`  
**Headers**:
```
Content-Type: application/json
```

**Body** (JSON):
```json
{
  "code": "你从小程序获取的code"
}
```

### 2. 使用 curl 测试

```bash
curl -X POST http://localhost:3000/api/v1/auth/wechat-login \
  -H "Content-Type: application/json" \
  -d '{"code":"你从小程序获取的code"}'
```

### 3. 使用小程序代码测试

```javascript
const api = require('../../utils/api')

// 测试登录
async function testLogin() {
  try {
    // 先获取 code
    const loginRes = await new Promise((resolve, reject) => {
      wx.login({
        success: resolve,
        fail: reject
      })
    })

    if (loginRes.code) {
      console.log('获取到的 code:', loginRes.code)
      
      // 调用登录接口
      const result = await api.auth.wechatLogin(loginRes.code)
      console.log('登录结果:', result)
    }
  } catch (error) {
    console.error('测试失败:', error)
  }
}
```

## 注意事项

### 1. Code 有效期

- 微信登录 code **只能使用一次**
- code 的有效期为 **5 分钟**
- 每次调用 `wx.login()` 都会获取新的 code

### 2. 测试环境 vs 生产环境

- **开发环境**: 可以使用测试 code（以 `test_wechat_code_` 开头）
- **生产环境**: 必须使用真实的微信 code

### 3. 测试用户

如果使用测试 code `test_wechat_code_xxx`，系统会自动创建或使用测试用户：
- OpenID: `test_openid_888888`
- 昵称: 自动生成

你也可以手动插入测试用户（参考 `scripts/insert-test-user.js`）。

### 4. 调试技巧

- 在微信开发者工具的"调试器" -> "Network" 中可以看到所有网络请求
- 在"Console" 中可以查看打印的 code 和登录结果
- 使用 `wx.showModal` 显示 code，方便复制

## 快速测试脚本

你也可以创建一个快速测试脚本 `scripts/test-login.js`：

```javascript
/**
 * 测试登录接口
 * 需要先在小程序中获取真实的 code，然后替换下面的 CODE 变量
 */

const axios = require('axios')

const CODE = '请替换为从小程序获取的真实code'
const BASE_URL = 'http://localhost:3000'

async function testLogin() {
  try {
    console.log('测试登录接口...')
    console.log('Code:', CODE)
    
    const response = await axios.post(`${BASE_URL}/api/v1/auth/wechat-login`, {
      code: CODE
    })
    
    console.log('✅ 登录成功:')
    console.log(JSON.stringify(response.data, null, 2))
  } catch (error) {
    console.error('❌ 登录失败:')
    if (error.response) {
      console.error('状态码:', error.response.status)
      console.error('响应数据:', error.response.data)
    } else {
      console.error('错误信息:', error.message)
    }
  }
}

testLogin()
```

## 总结

推荐使用方法一（在小程序中直接获取），因为：
1. 操作简单，一键获取
2. 自动复制到剪贴板
3. 可以随时刷新获取新的 code
4. 不需要修改太多代码

记住：**每次测试都需要获取新的 code**，因为每个 code 只能使用一次！

