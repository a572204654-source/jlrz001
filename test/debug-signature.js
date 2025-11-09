/**
 * 详细调试签名生成过程
 * 对比官方文档示例
 */

require('dotenv').config()
const crypto = require('crypto')

const secretId = process.env.TENCENT_SECRET_ID
const secretKey = process.env.TENCENT_SECRET_KEY
const region = process.env.TENCENT_REGION || 'ap-guangzhou'
const service = 'asr'
const host = 'asr.tencentcloudapi.com'
const version = '2019-06-14'
const action = 'SentenceRecognition'

// 测试payload
const payload = {
  ProjectId: 0,
  SubServiceType: 2,
  EngineModelType: '16k_zh',
  VoiceFormat: 1,
  UsrAudioKey: 'test',
  Data: Buffer.from('test').toString('base64'),
  DataLen: 4
}

const timestamp = Math.floor(Date.now() / 1000)
const date = new Date(timestamp * 1000).toISOString().split('T')[0]

console.log('\n🔍 签名生成详细调试\n')
console.log('='.repeat(60))
console.log(`SecretId: ${secretId.substring(0, 20)}...`)
console.log(`SecretKey: ${secretKey.substring(0, 20)}... (长度: ${secretKey.length})`)
console.log(`Action: ${action}`)
console.log(`Timestamp: ${timestamp}`)
console.log(`Date: ${date}`)
console.log('='.repeat(60))

// 1. 拼接规范请求串
console.log('\n[1] 拼接规范请求串:')
const httpRequestMethod = 'POST'
const canonicalUri = '/'
const canonicalQueryString = ''

// 构建规范请求头（按字母顺序排序）
const headers = {
  'content-type': 'application/json; charset=utf-8',
  'host': host,
  'x-tc-action': action.toLowerCase(),
  'x-tc-region': region.toLowerCase(),
  'x-tc-timestamp': timestamp.toString(),
  'x-tc-version': version
}

console.log('\n请求头:')
Object.keys(headers).sort().forEach(key => {
  console.log(`  ${key}: ${headers[key]}`)
})

const sortedHeaderKeys = Object.keys(headers).sort()
const canonicalHeaders = sortedHeaderKeys
  .map(key => `${key}:${headers[key]}`)
  .join('\n') + '\n'

const signedHeaders = sortedHeaderKeys.join(';')
console.log(`\nSignedHeaders: ${signedHeaders}`)

console.log('\n规范请求头 (CanonicalHeaders):')
console.log(canonicalHeaders)

// 计算请求体哈希
const requestPayload = JSON.stringify(payload)
const hashedRequestPayload = crypto
  .createHash('sha256')
  .update(requestPayload)
  .digest('hex')

console.log(`\n请求体哈希: ${hashedRequestPayload}`)

const canonicalRequest = [
  httpRequestMethod,
  canonicalUri,
  canonicalQueryString,
  canonicalHeaders,
  signedHeaders,
  hashedRequestPayload
].join('\n')

console.log('\n规范请求串 (CanonicalRequest):')
console.log('─'.repeat(60))
console.log(canonicalRequest)
console.log('─'.repeat(60))

// 2. 拼接待签名字符串
console.log('\n[2] 拼接待签名字符串:')
const credentialScope = `${date}/${service}/tc3_request`
const hashedCanonicalRequest = crypto
  .createHash('sha256')
  .update(canonicalRequest)
  .digest('hex')

console.log(`CredentialScope: ${credentialScope}`)
console.log(`HashedCanonicalRequest: ${hashedCanonicalRequest}`)

const stringToSign = [
  'TC3-HMAC-SHA256',
  timestamp.toString(),
  credentialScope,
  hashedCanonicalRequest
].join('\n')

console.log('\n待签名字符串 (StringToSign):')
console.log('─'.repeat(60))
console.log(stringToSign)
console.log('─'.repeat(60))

// 3. 计算签名
console.log('\n[3] 计算签名:')
const kDate = crypto
  .createHmac('sha256', `TC3${secretKey}`)
  .update(date)
  .digest()

console.log(`kDate (前20字节): ${kDate.toString('hex').substring(0, 40)}...`)

const kService = crypto
  .createHmac('sha256', kDate)
  .update(service)
  .digest()

console.log(`kService (前20字节): ${kService.toString('hex').substring(0, 40)}...`)

const kSigning = crypto
  .createHmac('sha256', kService)
  .update('tc3_request')
  .digest()

console.log(`kSigning (前20字节): ${kSigning.toString('hex').substring(0, 40)}...`)

const signature = crypto
  .createHmac('sha256', kSigning)
  .update(stringToSign)
  .digest('hex')

console.log(`\n最终签名: ${signature}`)

// 4. 拼接Authorization
console.log('\n[4] 拼接Authorization:')
const authorization = [
  `TC3-HMAC-SHA256 Credential=${secretId}/${credentialScope}`,
  `SignedHeaders=${signedHeaders}`,
  `Signature=${signature}`
].join(', ')

console.log(authorization)

// 5. 生成完整的curl命令（用于对比测试）
console.log('\n[5] 生成的curl命令:')
const curlCommand = `curl -X POST https://${host} \\
  -H "Authorization: ${authorization}" \\
  -H "Content-Type: application/json; charset=utf-8" \\
  -H "Host: ${host}" \\
  -H "X-TC-Action: ${action}" \\
  -H "X-TC-Version: ${version}" \\
  -H "X-TC-Timestamp: ${timestamp}" \\
  -H "X-TC-Region: ${region}" \\
  -d '${requestPayload}'`

console.log(curlCommand)

console.log('\n' + '='.repeat(60))
console.log('✅ 签名生成完成\n')

