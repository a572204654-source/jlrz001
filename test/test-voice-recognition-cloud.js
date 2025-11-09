/**
 * 云托管语音识别功能测试脚本
 * 
 * 使用方法：
 * 1. 确保云托管服务已部署：https://api.yimengpl.com
 * 2. 运行测试：node test/test-voice-recognition-cloud.js
 */

const https = require('https')
const http = require('http')
const fs = require('fs')
const FormData = require('form-data')

// 配置
const config = {
  baseUrl: 'api.yimengpl.com',
  protocol: 'https',
  testCode: 'test_wechat_code_' + Date.now(),
  // 使用测试用户进行测试
  testOpenid: 'test_openid_888888'
}

/**
 * HTTP/HTTPS 请求封装
 */
function request(options) {
  return new Promise((resolve, reject) => {
    const client = (options.protocol === 'https' || options.protocol === 'https:') ? https : http
    
    // 移除protocol字段，因为https.request不需要它
    const requestOptions = { ...options }
    delete requestOptions.protocol
    
    const req = client.request(requestOptions, (res) => {
      let data = ''

      res.on('data', (chunk) => {
        data += chunk
      })

      res.on('end', () => {
        try {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: data ? JSON.parse(data) : {}
          })
        } catch (err) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: data
          })
        }
      })
    })

    req.on('error', (err) => {
      reject(err)
    })

    if (options.body) {
      req.write(options.body)
    }

    req.end()
  })
}

/**
 * 测试1：健康检查
 */
async function testHealthCheck() {
  console.log('\n🧪 测试1: 健康检查')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

  try {
    const response = await request({
      protocol: config.protocol,
      hostname: config.baseUrl,
      path: '/health',
      method: 'GET'
    })

    if (response.statusCode === 200) {
      console.log('✅ 健康检查通过')
      console.log('   状态码:', response.statusCode)
      console.log('   响应:', JSON.stringify(response.data, null, 2))
      return true
    } else {
      throw new Error(`HTTP 状态码错误: ${response.statusCode}`)
    }
  } catch (error) {
    console.log('❌ 健康检查失败:', error.message)
    return false
  }
}

/**
 * 测试2：登录获取Token
 */
async function testLogin() {
  console.log('\n🧪 测试2: 登录获取Token')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

  // 先尝试测试登录接口
  try {
    console.log('   尝试使用测试登录接口...')
    const testResponse = await request({
      protocol: config.protocol,
      hostname: config.baseUrl,
      path: '/api/auth/test-login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        openid: config.testOpenid
      })
    })

    if (testResponse.statusCode === 200 && testResponse.data.code === 0) {
      console.log('✅ 测试登录成功')
      console.log('   Token:', testResponse.data.data.token.substring(0, 30) + '...')
      console.log('   用户ID:', testResponse.data.data.userInfo?.id)
      console.log('   昵称:', testResponse.data.data.userInfo?.nickname)
      return testResponse.data.data.token
    }
  } catch (error) {
    console.log('   测试登录失败，尝试微信登录（使用测试code）...')
  }

  // 如果测试登录失败，尝试微信登录
  try {
    const response = await request({
    protocol: config.protocol,
    hostname: config.baseUrl,
    path: '/api/auth/login',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      code: config.testCode
    })
  })

    if (response.statusCode !== 200) {
      const errorMsg = response.data?.message || response.data || '未知错误'
      throw new Error(`HTTP 状态码错误: ${response.statusCode}, 响应: ${JSON.stringify(errorMsg)}`)
    }

    if (response.data.code !== 0) {
      throw new Error(`响应错误: ${response.data.message || '未知错误'}`)
    }

    if (!response.data.data || !response.data.data.token) {
      throw new Error('未返回 token')
    }

    console.log('✅ 微信登录成功')
    console.log('   Token:', response.data.data.token.substring(0, 30) + '...')
    console.log('   用户ID:', response.data.data.userInfo?.id)
    console.log('   昵称:', response.data.data.userInfo?.nickname)

    return response.data.data.token
  } catch (error) {
    console.log('❌ 登录失败:', error.message)
    console.log('   提示: 如果测试登录失败，请确保：')
    console.log('   1. 数据库中已存在测试用户（openid: ' + config.testOpenid + '）')
    console.log('   2. 或者使用真实的微信code进行登录')
    console.log('   3. 可以运行: node scripts/insert-test-user.js 创建测试用户')
    return null
  }
}

/**
 * 测试3：语音识别（一句话识别）
 */
async function testVoiceRecognition(token) {
  console.log('\n🧪 测试3: 语音识别（一句话识别）')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

  if (!token) {
    console.log('❌ 测试跳过: 未获取到 token')
    return false
  }

  try {
    // 创建模拟音频数据（PCM格式，16kHz，单声道）
    // 这里创建一个简单的测试音频Buffer
    const testAudioData = Buffer.alloc(16000) // 1秒的音频数据（16kHz采样率）
    testAudioData.fill(0) // 填充为静音

    // 使用 FormData 上传文件
    const FormData = require('form-data')
    const form = new FormData()
    form.append('audio', testAudioData, {
      filename: 'test.pcm',
      contentType: 'audio/pcm'
    })
    form.append('engineType', '16k_zh')
    form.append('filterDirty', '0')
    form.append('filterModal', '0')
    form.append('convertNumMode', '1')
    form.append('wordInfo', '2')

    const response = await new Promise((resolve, reject) => {
      const options = {
        hostname: config.baseUrl,
        path: '/api/realtime-voice-socketio/recognize',
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          ...form.getHeaders()
        }
      }

      const req = https.request(options, (res) => {
        let data = ''
        res.on('data', (chunk) => {
          data += chunk
        })
        res.on('end', () => {
          try {
            resolve({
              statusCode: res.statusCode,
              data: data ? JSON.parse(data) : {}
            })
          } catch (err) {
            resolve({
              statusCode: res.statusCode,
              data: data
            })
          }
        })
      })

      req.on('error', (err) => {
        reject(err)
      })

      form.pipe(req)
    })

    if (response.statusCode === 200 && response.data.code === 0) {
      console.log('✅ 语音识别成功')
      console.log('   识别文本:', response.data.data?.text || '(空)')
      console.log('   音频时长:', response.data.data?.audioTime || 0, '秒')
      console.log('   记录ID:', response.data.data?.id)
      return true
    } else {
      throw new Error(`识别失败: ${response.data.message || '未知错误'}`)
    }
  } catch (error) {
    console.log('❌ 语音识别失败:', error.message)
    if (error.response) {
      console.log('   响应:', JSON.stringify(error.response.data, null, 2))
    }
    return false
  }
}

/**
 * 测试4：获取识别历史记录
 */
async function testGetHistory(token) {
  console.log('\n🧪 测试4: 获取识别历史记录')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

  if (!token) {
    console.log('❌ 测试跳过: 未获取到 token')
    return false
  }

  try {
    const response = await request({
      protocol: config.protocol,
      hostname: config.baseUrl,
      path: '/api/realtime-voice-socketio/history?page=1&pageSize=10',
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })

    console.log('   响应状态码:', response.statusCode)
    console.log('   响应数据:', JSON.stringify(response.data, null, 2))
    
    if (response.statusCode === 200 && response.data.code === 0) {
      console.log('✅ 获取历史记录成功')
      const list = response.data.data?.list || []
      console.log('   记录数量:', list.length)
      console.log('   总数:', response.data.data?.pagination?.total || 0)
      if (list.length > 0) {
        console.log('   最新记录:')
        console.log('     - ID:', list[0].id)
        console.log('     - 文本:', list[0].recognizedText?.substring(0, 50) || '(空)')
        console.log('     - 时间:', list[0].createdAt)
      }
      return true
    } else {
      throw new Error(`获取失败: ${response.data.message || '未知错误'}`)
    }
  } catch (error) {
    console.log('❌ 获取历史记录失败:', error.message)
    if (error.response) {
      console.log('   响应数据:', JSON.stringify(error.response.data, null, 2))
    }
    return false
  }
}

/**
 * 测试5：获取识别统计信息
 */
async function testGetStats(token) {
  console.log('\n🧪 测试5: 获取识别统计信息')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

  if (!token) {
    console.log('❌ 测试跳过: 未获取到 token')
    return false
  }

  try {
    const response = await request({
      protocol: config.protocol,
      hostname: config.baseUrl,
      path: '/api/realtime-voice-socketio/stats',
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })

    if (response.statusCode === 200 && response.data.code === 0) {
      console.log('✅ 获取统计信息成功')
      const stats = response.data.data || {}
      console.log('   总识别次数:', stats.totalCount || 0)
      console.log('   总音频大小:', (stats.totalAudioSize || 0) / 1024, 'KB')
      console.log('   总音频时长:', stats.totalAudioTime || 0, '秒')
      return true
    } else {
      throw new Error(`获取失败: ${response.data.message || '未知错误'}`)
    }
  } catch (error) {
    console.log('❌ 获取统计信息失败:', error.message)
    if (error.response) {
      console.log('   响应数据:', JSON.stringify(error.response.data, null, 2))
    }
    return false
  }
}

/**
 * 主函数
 */
async function main() {
  console.log('\n╔═══════════════════════════════════════════════════════════╗')
  console.log('║         云托管语音识别功能测试                           ║')
  console.log('╚═══════════════════════════════════════════════════════════╝')

  console.log('\n📋 测试配置:')
  console.log('   服务地址:', `${config.protocol}://${config.baseUrl}`)
  console.log('   测试Code:', config.testCode)

  // 运行测试
  const healthOk = await testHealthCheck()
  if (!healthOk) {
    console.log('\n⚠️  健康检查失败，请确认服务是否正常运行')
    return
  }

  const token = await testLogin()
  if (!token) {
    console.log('\n⚠️  登录失败，无法继续测试需要认证的接口')
    return
  }

  await testVoiceRecognition(token)
  await testGetHistory(token)
  await testGetStats(token)

  // 测试总结
  console.log('\n╔═══════════════════════════════════════════════════════════╗')
  console.log('║         测试完成                                          ║')
  console.log('╚═══════════════════════════════════════════════════════════╝')

  console.log('\n📝 测试说明:')
  console.log('   1. 如果所有测试都通过，说明语音识别功能正常')
  console.log('   2. 如果语音识别失败，可能是：')
  console.log('      - 腾讯云语音识别服务未配置')
  console.log('      - 音频格式不正确（需要PCM格式）')
  console.log('      - 网络连接问题')
  console.log('   3. 建议使用真实音频文件进行测试')
  console.log('   4. 查看完整文档: docs/VOICE_RECOGNITION.md')
  console.log('')
}

// 运行测试
main().catch((error) => {
  console.error('\n❌ 测试脚本执行失败:', error)
  process.exit(1)
})

