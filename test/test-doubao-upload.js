/**
 * 直接测试豆包文件上传API
 * 用于调试豆包上传问题
 */

const axios = require('axios')
const FormData = require('form-data')
const fs = require('fs')
const path = require('path')
require('dotenv').config()

const config = {
  apiKey: process.env.DOUBAO_API_KEY,
  endpointId: process.env.DOUBAO_ENDPOINT_ID,
  apiUrl: process.env.DOUBAO_API_URL || 'https://ark.cn-beijing.volces.com/api/v3'
}

console.log('='.repeat(60))
console.log('🧪 豆包文件上传API测试')
console.log('='.repeat(60))
console.log(`API URL: ${config.apiUrl}/files`)
console.log(`API Key: ${config.apiKey ? config.apiKey.substring(0, 20) + '...' : '(未配置)'}`)
console.log(`Endpoint ID: ${config.endpointId || '(未配置)'}`)
console.log('='.repeat(60))
console.log()

// 检查配置
if (!config.apiKey) {
  console.error('❌ 错误: DOUBAO_API_KEY 未配置')
  process.exit(1)
}

// 创建测试文件 - 使用PDF格式（豆包API可能不支持text/plain）
const testContent = '这是一个测试文件，用于测试豆包文件上传功能。\n时间: ' + new Date().toISOString()
const testFileName = 'test-doubao-upload.pdf'
const testFilePath = path.join(__dirname, testFileName)

// 创建一个简单的PDF文件（最小PDF格式）
// 注意：这是一个非常简单的PDF，仅用于测试
const pdfContent = Buffer.from(`%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj
2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj
3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
/Contents 4 0 R
/Resources <<
/Font <<
/F1 <<
/Type /Font
/Subtype /Type1
/BaseFont /Helvetica
>>
>>
>>
>>
endobj
4 0 obj
<<
/Length 44
>>
stream
BT
/F1 12 Tf
100 700 Td
(${testContent}) Tj
ET
endstream
endobj
xref
0 5
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000306 00000 n 
trailer
<<
/Size 5
/Root 1 0 R
>>
startxref
390
%%EOF`)

fs.writeFileSync(testFilePath, pdfContent)
console.log(`✅ 创建测试文件: ${testFileName}`)
console.log(`   文件大小: ${fs.statSync(testFilePath).size} 字节`)
console.log()

// 读取文件
const fileBuffer = fs.readFileSync(testFilePath)

// 创建FormData
const form = new FormData()
form.append('file', fileBuffer, {
  filename: testFileName,
  contentType: 'application/pdf'
})
// 豆包API要求必须指定purpose参数，值为user_data
form.append('purpose', 'user_data')

console.log('📤 开始上传文件到豆包...')
console.log()

// 发送请求
axios.post(
  `${config.apiUrl}/files`,
  form,
  {
    headers: {
      ...form.getHeaders(),
      'Authorization': `Bearer ${config.apiKey}`
    },
    maxContentLength: Infinity,
    maxBodyLength: Infinity,
    timeout: 60000
  }
)
  .then(response => {
    console.log('✅ 上传成功！')
    console.log()
    console.log('📋 响应状态码:', response.status)
    console.log('📋 响应头:')
    console.log(JSON.stringify(response.headers, null, 2))
    console.log()
    console.log('📋 响应数据:')
    console.log(JSON.stringify(response.data, null, 2))
    console.log()
    
    // 尝试解析文件ID
    const fileId = response.data?.id || response.data?.fileId || response.data?.file_id
    const fileUrl = response.data?.url || response.data?.fileUrl || response.data?.file_url
    
    if (fileId) {
      console.log(`✅ 文件ID: ${fileId}`)
    } else {
      console.log('⚠️  未找到文件ID字段')
    }
    
    if (fileUrl) {
      console.log(`✅ 文件URL: ${fileUrl}`)
    } else {
      console.log('ℹ️  豆包未返回文件URL')
    }
    
    // 清理测试文件
    if (fs.existsSync(testFilePath)) {
      fs.unlinkSync(testFilePath)
    }
    
    console.log()
    console.log('='.repeat(60))
    console.log('✅ 测试完成')
    console.log('='.repeat(60))
  })
  .catch(error => {
    console.error('❌ 上传失败！')
    console.error()
    
    if (error.response) {
      // 服务器返回了错误响应
      console.error('📋 错误状态码:', error.response.status)
      console.error('📋 错误响应头:')
      console.error(JSON.stringify(error.response.headers, null, 2))
      console.error()
      console.error('📋 错误响应数据:')
      console.error(JSON.stringify(error.response.data, null, 2))
    } else if (error.request) {
      // 请求已发送但没有收到响应
      console.error('📋 请求已发送，但未收到响应')
      console.error('📋 请求详情:', error.request)
    } else {
      // 请求配置错误
      console.error('📋 请求配置错误:', error.message)
    }
    
    console.error()
    console.error('📋 完整错误信息:')
    console.error(error)
    
    // 清理测试文件
    if (fs.existsSync(testFilePath)) {
      fs.unlinkSync(testFilePath)
    }
    
    console.error()
    console.error('='.repeat(60))
    console.error('❌ 测试失败')
    console.error('='.repeat(60))
    
    process.exit(1)
  })

