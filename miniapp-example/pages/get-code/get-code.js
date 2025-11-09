/**
 * 获取微信登录 Code 测试页面
 * 用于快速获取真实的微信登录 code，方便测试后端接口
 */

Page({
  data: {
    code: '',
    codeHistory: [],
    loading: false
  },

  onLoad() {
    // 加载历史记录
    this.loadHistory()
  },

  // 加载历史记录
  loadHistory() {
    try {
      const history = wx.getStorageSync('codeHistory') || []
      this.setData({
        codeHistory: history
      })
    } catch (error) {
      console.error('加载历史记录失败:', error)
    }
  },

  // 获取微信登录 code
  async getCode() {
    if (this.data.loading) {
      return
    }

    this.setData({ loading: true })
    wx.showLoading({ title: '获取中...' })

    try {
      const res = await new Promise((resolve, reject) => {
        wx.login({
          success: resolve,
          fail: reject
        })
      })

      if (res.code) {
        // 保存 code
        this.setData({
          code: res.code
        })

        // 保存到历史记录
        const history = wx.getStorageSync('codeHistory') || []
        history.unshift({
          code: res.code,
          time: new Date().toLocaleString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
          })
        })
        
        // 只保留最近 20 条
        if (history.length > 20) {
          history.pop()
        }
        
        wx.setStorageSync('codeHistory', history)
        this.setData({
          codeHistory: history
        })

        wx.hideLoading()
        
        // 显示 code 并询问是否复制
        wx.showModal({
          title: '获取成功',
          content: `Code: ${res.code}\n\n点击确定复制到剪贴板`,
          showCancel: true,
          confirmText: '复制',
          cancelText: '取消',
          success: (modalRes) => {
            if (modalRes.confirm) {
              this.copyCode()
            }
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
        title: '获取失败: ' + error.errMsg,
        icon: 'none',
        duration: 3000
      })
    } finally {
      this.setData({ loading: false })
    }
  },

  // 复制当前 code
  copyCode() {
    if (!this.data.code) {
      wx.showToast({
        title: '请先获取 code',
        icon: 'none'
      })
      return
    }

    wx.setClipboardData({
      data: this.data.code,
      success: () => {
        wx.showToast({
          title: '已复制到剪贴板',
          icon: 'success'
        })
      },
      fail: () => {
        wx.showToast({
          title: '复制失败',
          icon: 'none'
        })
      }
    })
  },

  // 复制历史记录中的 code
  copyHistoryCode(e) {
    const code = e.currentTarget.dataset.code
    wx.setClipboardData({
      data: code,
      success: () => {
        wx.showToast({
          title: '已复制',
          icon: 'success'
        })
      }
    })
  },

  // 清空历史记录
  clearHistory() {
    wx.showModal({
      title: '确认清空',
      content: '确定要清空历史记录吗？',
      success: (res) => {
        if (res.confirm) {
          wx.removeStorageSync('codeHistory')
          this.setData({
            codeHistory: []
          })
          wx.showToast({
            title: '已清空',
            icon: 'success'
          })
        }
      }
    })
  }
})

