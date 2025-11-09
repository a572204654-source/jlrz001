/**
 * 测试腾讯云 WebSocket 连接配置
 * 验证 appId 和签名是否正确
 */

require('dotenv').config()
const config = require('../config')

console.log('\n🔍 WebSocket 连接配置检查\n')
console.log('='.repeat(60))

// 检查配置
const secretId = config.tencentCloud.secretId
const secretKey = config.tencentCloud.secretKey
const appId = config.tencentCloud.appId
const region = config.tencentCloud.region || 'ap-guangzhou'

console.log(`SecretId: ${secretId ? secretId.substring(0, 20) + '...' : '❌ 未配置'}`)
console.log(`SecretKey: ${secretKey ? secretKey.substring(0, 20) + '... (长度: ' + secretKey.length + ')' : '❌ 未配置'}`)
console.log(`AppId: ${appId || '❌ 未配置'}`)
console.log(`Region: ${region}`)

console.log('\n' + '='.repeat(60))

// 检查 appId 格式
if (appId) {
  // appId 通常是数字字符串，长度在 8-12 位之间
  if (!/^\d+$/.test(appId)) {
    console.log('\n⚠️  警告: AppId 格式可能不正确（应为纯数字）')
  } else if (appId.length < 8 || appId.length > 12) {
    console.log(`\n⚠️  警告: AppId 长度异常（当前: ${appId.length}，通常为 8-12 位）`)
  } else {
    console.log('\n✅ AppId 格式正确')
  }
} else {
  console.log('\n❌ 错误: 未配置 AppId')
  console.log('\n📝 如何获取 AppId:')
  console.log('1. 登录腾讯云控制台')
  console.log('2. 访问: https://console.cloud.tencent.com/cam/capi')
  console.log('3. 在 API 密钥管理页面，可以看到 AppId（通常显示在 SecretId 旁边）')
  console.log('4. 或者在语音识别服务页面查看项目 ID')
}

// 检查 SecretKey 长度
if (secretKey) {
  if (secretKey.length !== 40) {
    console.log(`\n⚠️  警告: SecretKey 长度异常（当前: ${secretKey.length}，通常为 40 字符）`)
    console.log('   请确认是否完整复制了 SecretKey')
  } else {
    console.log('\n✅ SecretKey 长度正确')
  }
}

// 生成 WebSocket URL 示例
if (appId && secretId && secretKey) {
  console.log('\n📋 WebSocket 连接 URL 示例:')
  const crypto = require('crypto')
  const timestamp = Math.floor(Date.now() / 1000)
  const signStr = `${secretId}${timestamp}`
  const signature = crypto
    .createHmac('sha1', secretKey)
    .update(signStr)
    .digest('base64')
  
  const wsHost = 'asr.cloud.tencent.com'
  const wsPath = '/asr/v2/'
  
  const wsUrl = `wss://${wsHost}${wsPath}${appId}` +
    `?engine_model_type=16k_zh` +
    `&voice_format=1` +
    `&secretid=${secretId}` +
    `&timestamp=${timestamp}` +
    `&expired=${timestamp + 86400}` +
    `&nonce=${Math.floor(Math.random() * 1000000)}` +
    `&signature=${encodeURIComponent(signature)}`
  
  console.log(`\n${wsUrl.replace(/signature=.*/, 'signature=***')}`)
  
  console.log('\n📝 参数说明:')
  console.log('  - engine_model_type: 识别引擎类型（16k_zh, 8k_zh, 16k_en 等）')
  console.log('  - voice_format: 音频格式（1:pcm, 4:wav, 6:mp3）')
  console.log('  - secretid: 腾讯云 SecretId')
  console.log('  - timestamp: 当前时间戳（秒）')
  console.log('  - expired: 签名过期时间（秒）')
  console.log('  - nonce: 随机数')
  console.log('  - signature: WebSocket 签名（HMAC-SHA1）')
} else {
  console.log('\n❌ 无法生成 WebSocket URL（缺少必要配置）')
}

console.log('\n' + '='.repeat(60))
console.log('✅ 检查完成\n')

