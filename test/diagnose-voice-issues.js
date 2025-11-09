/**
 * 语音识别问题诊断脚本
 * 用于排查云托管环境中的语音识别问题
 */

require('dotenv').config()
const https = require('https')
const { query } = require('../config/database')

const config = {
  baseUrl: process.env.API_BASE_URL || 'api.yimengpl.com',
  protocol: 'https'
}

/**
 * HTTP/HTTPS 请求封装
 */
function request(options) {
  return new Promise((resolve, reject) => {
    const client = (options.protocol === 'https' || options.protocol === 'https:') ? https : require('http')
    
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
 * 诊断1：检查数据库表
 */
async function diagnoseDatabase() {
  console.log('\n📊 诊断1: 检查数据库表')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  
  try {
    // 检查表是否存在
    const tables = await query(`
      SELECT TABLE_NAME 
      FROM information_schema.TABLES 
      WHERE TABLE_SCHEMA = ? 
      AND TABLE_NAME = 'voice_recognition_logs'
    `, [process.env.DB_NAME || 'express_miniapp'])
    
    if (tables.length > 0) {
      console.log('✅ voice_recognition_logs 表存在')
      
      // 检查表结构
      const columns = await query('DESCRIBE voice_recognition_logs')
      console.log('   字段数:', columns.length)
      console.log('   字段列表:', columns.map(c => c.Field).join(', '))
      
      // 检查数据
      const [countResult] = await query('SELECT COUNT(*) as total FROM voice_recognition_logs')
      console.log('   记录数:', countResult.total)
      
      return true
    } else {
      console.log('❌ voice_recognition_logs 表不存在')
      console.log('   请执行SQL脚本: scripts/init-voice-recognition-tables.sql')
      return false
    }
  } catch (error) {
    console.error('❌ 数据库检查失败:', error.message)
    console.error('   错误详情:', error)
    return false
  }
}

/**
 * 诊断2：检查腾讯云配置
 */
async function diagnoseTencentCloud() {
  console.log('\n☁️  诊断2: 检查腾讯云配置')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  
  const secretId = process.env.TENCENT_SECRET_ID
  const secretKey = process.env.TENCENT_SECRET_KEY
  const region = process.env.TENCENT_REGION || 'ap-shanghai'
  
  if (!secretId) {
    console.log('❌ TENCENT_SECRET_ID 未配置')
    return false
  } else {
    console.log('✅ TENCENT_SECRET_ID 已配置:', secretId.substring(0, 8) + '...')
  }
  
  if (!secretKey) {
    console.log('❌ TENCENT_SECRET_KEY 未配置')
    return false
  } else {
    console.log('✅ TENCENT_SECRET_KEY 已配置')
  }
  
  console.log('✅ 区域配置:', region)
  
  return true
}

/**
 * 诊断3：测试API接口
 */
async function diagnoseAPI() {
  console.log('\n🌐 诊断3: 测试API接口')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  
  try {
    // 测试健康检查
    console.log('测试健康检查接口...')
    const healthResponse = await request({
      protocol: config.protocol,
      hostname: config.baseUrl,
      path: '/health',
      method: 'GET'
    })
    
    if (healthResponse.statusCode === 200) {
      console.log('✅ 健康检查通过')
    } else {
      console.log('❌ 健康检查失败，状态码:', healthResponse.statusCode)
      return false
    }
    
    // 测试登录获取Token
    console.log('\n测试登录接口...')
    const loginResponse = await request({
      protocol: config.protocol,
      hostname: config.baseUrl,
      path: '/api/auth/test-login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        code: 'test_code_' + Date.now()
      })
    })
    
    if (loginResponse.statusCode === 200 && loginResponse.data.code === 0) {
      console.log('✅ 登录成功')
      const token = loginResponse.data.data.token
      
      // 测试历史记录接口
      console.log('\n测试历史记录接口...')
      const historyResponse = await request({
        protocol: config.protocol,
        hostname: config.baseUrl,
        path: '/api/voice-recognition/history',
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'token': token
        }
      })
      
      console.log('   状态码:', historyResponse.statusCode)
      console.log('   响应:', JSON.stringify(historyResponse.data, null, 2))
      
      if (historyResponse.statusCode === 200 && historyResponse.data.code === 0) {
        console.log('✅ 历史记录接口正常')
        return true
      } else {
        console.log('❌ 历史记录接口失败')
        if (historyResponse.data.message) {
          console.log('   错误信息:', historyResponse.data.message)
        }
        return false
      }
    } else {
      console.log('❌ 登录失败')
      return false
    }
  } catch (error) {
    console.error('❌ API测试失败:', error.message)
    return false
  }
}

/**
 * 诊断4：检查WebSocket连接
 */
async function diagnoseWebSocket() {
  console.log('\n🔌 诊断4: 检查WebSocket连接配置')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  
  const { getVoiceRecognitionService } = require('../utils/voiceRecognition')
  const WebSocket = require('ws')
  
  try {
    const service = getVoiceRecognitionService()
    
    // 测试创建实时识别连接
    console.log('测试创建WebSocket连接...')
    
    let connectionEstablished = false
    let connectionError = null
    let connectionClosed = false
    
    const recognition = service.createRealtimeRecognition(
      {
        engineType: '16k_zh',
        voiceFormat: 1,
        needvad: 1
      },
      (result) => {
        console.log('收到识别结果:', result)
      },
      (error) => {
        console.error('识别错误:', error)
        connectionError = error
      }
    )
    
    // 等待连接建立
    console.log('等待连接建立...')
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        if (!connectionEstablished) {
          reject(new Error('连接超时（5秒）'))
        }
      }, 5000)
      
      recognition.waitForConnection()
        .then(() => {
          clearTimeout(timeout)
          connectionEstablished = true
          console.log('✅ WebSocket连接已建立')
          console.log('   连接状态:', recognition.getReadyState())
          resolve()
        })
        .catch((error) => {
          clearTimeout(timeout)
          reject(error)
        })
    })
    
    // 关闭连接
    recognition.close()
    
    return true
  } catch (error) {
    console.error('❌ WebSocket连接测试失败:', error.message)
    console.error('   错误详情:', error)
    return false
  }
}

/**
 * 主诊断函数
 */
async function main() {
  console.log('\n╔═══════════════════════════════════════════════════════════╗')
  console.log('║         语音识别问题诊断工具                           ║')
  console.log('╚═══════════════════════════════════════════════════════════╝')
  
  const results = {
    database: false,
    tencentCloud: false,
    api: false,
    websocket: false
  }
  
  // 执行诊断
  results.database = await diagnoseDatabase()
  results.tencentCloud = await diagnoseTencentCloud()
  results.api = await diagnoseAPI()
  results.websocket = await diagnoseWebSocket()
  
  // 输出诊断结果
  console.log('\n╔═══════════════════════════════════════════════════════════╗')
  console.log('║         诊断结果汇总                                     ║')
  console.log('╚═══════════════════════════════════════════════════════════╝')
  
  console.log('\n📊 数据库表检查:', results.database ? '✅ 通过' : '❌ 失败')
  console.log('☁️  腾讯云配置:', results.tencentCloud ? '✅ 通过' : '❌ 失败')
  console.log('🔌 WebSocket配置:', results.websocket ? '✅ 通过' : '❌ 失败')
  console.log('🌐 API接口测试:', results.api ? '✅ 通过' : '❌ 失败')
  
  const allPassed = Object.values(results).every(r => r)
  
  if (allPassed) {
    console.log('\n✅ 所有检查通过！')
  } else {
    console.log('\n⚠️  部分检查未通过，请根据上述信息进行修复')
  }
  
  // 关闭数据库连接
  process.exit(0)
}

// 运行诊断
main().catch(error => {
  console.error('\n❌ 诊断过程出错:', error)
  process.exit(1)
})

