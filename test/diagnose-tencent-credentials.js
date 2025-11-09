/**
 * 诊断腾讯云凭证问题
 * 详细检查SecretKey和签名生成过程
 */

require('dotenv').config()
const crypto = require('crypto')

console.log('\n🔍 腾讯云凭证诊断工具\n')
console.log('='.repeat(50))

// 1. 检查环境变量
console.log('\n[1] 环境变量检查:')
const secretId = process.env.TENCENT_SECRET_ID
const secretKey = process.env.TENCENT_SECRET_KEY
const appId = process.env.TENCENT_APP_ID
const region = process.env.TENCENT_REGION

console.log(`  SecretId: ${secretId ? secretId.substring(0, 15) + '...' : '❌ 未设置'}`)
console.log(`  SecretId长度: ${secretId ? secretId.length : 0} 字符`)
console.log(`  SecretKey: ${secretKey ? secretKey.substring(0, 15) + '...' : '❌ 未设置'}`)
console.log(`  SecretKey长度: ${secretKey ? secretKey.length : 0} 字符`)
console.log(`  AppId: ${appId || '❌ 未设置'}`)
console.log(`  Region: ${region || '❌ 未设置'}`)

if (!secretId || !secretKey) {
  console.error('\n❌ 凭证未配置')
  process.exit(1)
}

// 2. 检查SecretKey格式
console.log('\n[2] SecretKey格式检查:')
console.log(`  长度: ${secretKey.length} 字符`)
console.log(`  是否包含空格: ${secretKey.includes(' ') ? '❌ 是' : '✅ 否'}`)
console.log(`  是否包含换行: ${secretKey.includes('\n') ? '❌ 是' : '✅ 否'}`)
console.log(`  是否包含制表符: ${secretKey.includes('\t') ? '❌ 是' : '✅ 否'}`)
console.log(`  前10个字符: ${secretKey.substring(0, 10)}`)
console.log(`  后10个字符: ${secretKey.substring(secretKey.length - 10)}`)

// 检查字符类型
const hasOnlyAlphanumeric = /^[A-Za-z0-9]+$/.test(secretKey)
console.log(`  仅包含字母数字: ${hasOnlyAlphanumeric ? '✅ 是' : '❌ 否'}`)

if (secretKey.length < 30) {
  console.log('\n⚠️  警告: SecretKey长度可能过短（通常应为40个字符）')
}

// 3. 测试签名生成
console.log('\n[3] 签名生成测试:')
try {
  const host = 'asr.tencentcloudapi.com'
  const service = 'asr'
  const timestamp = Math.floor(Date.now() / 1000)
  const date = new Date(timestamp * 1000).toISOString().split('T')[0]
  
  const testPayload = {
    ProjectId: 0,
    SubServiceType: 2,
    EngineModelType: '16k_zh',
    VoiceFormat: 1,
    UsrAudioKey: 'test',
    Data: Buffer.from('test').toString('base64'),
    DataLen: 4
  }
  
  // 生成规范请求串
  const httpRequestMethod = 'POST'
  const canonicalUri = '/'
  const canonicalQueryString = ''
  const canonicalHeaders = `content-type:application/json; charset=utf-8\nhost:${host}\n`
  const signedHeaders = 'content-type;host'
  const hashedRequestPayload = crypto
    .createHash('sha256')
    .update(JSON.stringify(testPayload))
    .digest('hex')
  
  const canonicalRequest = [
    httpRequestMethod,
    canonicalUri,
    canonicalQueryString,
    canonicalHeaders,
    signedHeaders,
    hashedRequestPayload
  ].join('\n')
  
  console.log('  规范请求串长度:', canonicalRequest.length)
  
  // 拼接待签名字符串
  const credentialScope = `${date}/${service}/tc3_request`
  const hashedCanonicalRequest = crypto
    .createHash('sha256')
    .update(canonicalRequest)
    .digest('hex')
  
  const stringToSign = [
    'TC3-HMAC-SHA256',
    timestamp,
    credentialScope,
    hashedCanonicalRequest
  ].join('\n')
  
  console.log('  待签名字符串长度:', stringToSign.length)
  
  // 计算签名
  const kDate = crypto
    .createHmac('sha256', `TC3${secretKey}`)
    .update(date)
    .digest()
  
  const kService = crypto
    .createHmac('sha256', kDate)
    .update(service)
    .digest()
  
  const kSigning = crypto
    .createHmac('sha256', kService)
    .update('tc3_request')
    .digest()
  
  const signature = crypto
    .createHmac('sha256', kSigning)
    .update(stringToSign)
    .digest('hex')
  
  console.log('  ✅ 签名生成成功')
  console.log(`  签名值: ${signature.substring(0, 20)}...`)
  
  // 生成Authorization
  const authorization = [
    `TC3-HMAC-SHA256 Credential=${secretId}/${credentialScope}`,
    `SignedHeaders=${signedHeaders}`,
    `Signature=${signature}`
  ].join(', ')
  
  console.log(`  Authorization: ${authorization.substring(0, 80)}...`)
  
} catch (error) {
  console.error('  ❌ 签名生成失败:', error.message)
}

// 4. 建议
console.log('\n[4] 诊断建议:')
console.log('  1. 确认SecretKey是否完整（通常应为40个字符）')
console.log('  2. 检查腾讯云控制台中的密钥是否有效')
console.log('  3. 确认密钥有"语音识别（ASR）"服务权限')
console.log('  4. 如果SecretKey长度不足，可能需要重新创建密钥')
console.log('  5. 检查密钥是否已过期或被禁用')

console.log('\n' + '='.repeat(50))
console.log('✅ 诊断完成\n')

