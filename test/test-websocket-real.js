/**
 * 测试腾讯云 WebSocket 实时语音识别连接
 * 验证配置和连接是否正常
 */

require('dotenv').config()
const config = require('../config')
const WebSocket = require('ws')

console.log('\n🔍 腾讯云 WebSocket 实时语音识别连接测试\n')
console.log('='.repeat(60))

// 检查配置
const secretId = config.tencentCloud.secretId
const secretKey = config.tencentCloud.secretKey
const appId = config.tencentCloud.appId
const region = config.tencentCloud.region || 'ap-guangzhou'

console.log(`SecretId: ${secretId ? secretId.substring(0, 20) + '...' : '❌ 未配置'}`)
console.log(`SecretKey: ${secretKey ? '已配置 (长度: ' + secretKey.length + ')' : '❌ 未配置'}`)
console.log(`AppId: ${appId || '❌ 未配置'}`)
console.log(`Region: ${region}`)

if (!secretId || !secretKey || !appId) {
  console.log('\n❌ 配置不完整，无法测试')
  process.exit(1)
}

// 生成 WebSocket 签名
function generateWebSocketSignature(timestamp) {
  const crypto = require('crypto')
  const signStr = `${secretId}${timestamp}`
  const signature = crypto
    .createHmac('sha1', secretKey)
    .update(signStr)
    .digest('base64')
  return signature
}

// 构建 WebSocket URL
const timestamp = Math.floor(Date.now() / 1000)
const signature = generateWebSocketSignature(timestamp)
const wsHost = 'asr.cloud.tencent.com'
const wsPath = '/asr/v2/'

const wsUrl = `wss://${wsHost}${wsPath}${appId}` +
  `?engine_model_type=16k_zh` +
  `&voice_format=1` +
  `&needvad=1` +
  `&filter_dirty=0` +
  `&filter_modal=0` +
  `&filter_punc=0` +
  `&convert_num_mode=1` +
  `&word_info=0` +
  `&secretid=${secretId}` +
  `&timestamp=${timestamp}` +
  `&expired=${timestamp + 86400}` +
  `&nonce=${Math.floor(Math.random() * 1000000)}` +
  `&signature=${encodeURIComponent(signature)}`

console.log('\n📋 WebSocket 连接信息:')
console.log(`Host: ${wsHost}`)
console.log(`Path: ${wsPath}${appId}`)
console.log(`URL: ${wsUrl.replace(/signature=.*/, 'signature=***')}`)

console.log('\n🔌 正在连接 WebSocket...\n')

let connectionSuccess = false
let errorMessage = null

const ws = new WebSocket(wsUrl)

ws.on('open', () => {
  console.log('✅ WebSocket 连接成功！')
  connectionSuccess = true
  
  // 发送测试消息（开始识别）
  // 注意：实际使用时需要发送真实的音频数据（base64编码）
  // 这里只测试连接和消息格式
  const voiceId = 'test_' + Date.now()
  const testMessage = {
    voice_id: voiceId,
    end: 0,
    seq: 0,
    voice_format: 1,
    data: '' // 空数据仅用于测试连接，实际需要base64编码的音频数据
  }
  
  console.log('\n📤 发送测试消息（格式验证）...')
  console.log('消息格式:', JSON.stringify(testMessage, null, 2))
  ws.send(JSON.stringify(testMessage))
  
  // 3秒后关闭连接
  setTimeout(() => {
    console.log('\n🔌 关闭连接...')
    ws.close()
    process.exit(0)
  }, 3000)
})

ws.on('message', (data) => {
  try {
    const message = JSON.parse(data.toString())
    console.log('\n📥 收到服务器消息:')
    console.log(JSON.stringify(message, null, 2))
    
    if (message.code !== undefined && message.code !== 0) {
      console.log(`\n⚠️  服务器返回错误码: ${message.code}`)
      if (message.message) {
        console.log(`   错误信息: ${message.message}`)
      }
    }
  } catch (error) {
    console.log('\n📥 收到消息（非JSON）:', data.toString())
  }
})

ws.on('error', (error) => {
  console.log('\n❌ WebSocket 连接错误:')
  console.log(`   错误类型: ${error.name || 'Unknown'}`)
  console.log(`   错误信息: ${error.message || error}`)
  errorMessage = error.message || error.toString()
  
  // 常见错误提示
  if (error.message && error.message.includes('401')) {
    console.log('\n💡 提示: 401 错误通常表示签名验证失败')
    console.log('   请检查:')
    console.log('   1. SecretId 和 SecretKey 是否正确')
    console.log('   2. SecretKey 是否完整（可能需要重新创建密钥）')
    console.log('   3. 时间戳是否在有效范围内')
  } else if (error.message && error.message.includes('403')) {
    console.log('\n💡 提示: 403 错误通常表示权限不足')
    console.log('   请检查:')
    console.log('   1. 密钥是否有"语音识别（ASR）"服务权限')
    console.log('   2. AppId 是否正确')
  } else if (error.message && error.message.includes('certificate')) {
    console.log('\n💡 提示: 证书验证错误，可能是网络问题')
  }
  
  setTimeout(() => process.exit(1), 1000)
})

ws.on('close', (code, reason) => {
  console.log(`\n🔌 WebSocket 连接已关闭`)
  console.log(`   关闭码: ${code}`)
  if (reason) {
    console.log(`   关闭原因: ${reason.toString()}`)
  }
  
  if (connectionSuccess) {
    console.log('\n✅ 测试完成：连接成功，配置正确')
  } else {
    console.log('\n❌ 测试失败：无法建立连接')
    if (errorMessage) {
      console.log(`   错误: ${errorMessage}`)
    }
  }
  
  setTimeout(() => process.exit(connectionSuccess ? 0 : 1), 500)
})

// 10秒超时
setTimeout(() => {
  if (!connectionSuccess) {
    console.log('\n⏱️  连接超时（10秒）')
    ws.close()
    process.exit(1)
  }
}, 10000)

