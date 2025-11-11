/**
 * 测试PDF文件上传到豆包
 * 使用方法: node test/test-file-upload-pdf.js
 */

const axios = require('axios')
const FormData = require('form-data')
const fs = require('fs')
const path = require('path')

// 配置
const CONFIG = {
  baseURL: process.env.TEST_BASE_URL || 'http://localhost:80',
  testOpenid: 'test_openid_001'
}

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
}

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`)
}

function section(title) {
  console.log('\n' + '='.repeat(60))
  log(title, 'bright')
  console.log('='.repeat(60))
}

function info(message) {
  log(`ℹ️  ${message}`, 'cyan')
}

function success(message) {
  log(`✅ ${message}`, 'green')
}

function error(message) {
  log(`❌ ${message}`, 'red')
}

function warning(message) {
  log(`⚠️  ${message}`, 'yellow')
}

// 创建axios实例
const client = axios.create({
  baseURL: CONFIG.baseURL,
  timeout: 60000
})

let token = null

/**
 * 步骤1：登录获取token
 */
async function testLogin() {
  section('步骤1：用户登录')
  
  try {
    info(`尝试使用测试用户登录: ${CONFIG.testOpenid}`)
    
    const response = await client.post('/api/auth/test-login', {
      openid: CONFIG.testOpenid
    })
    
    if (response.data.code === 0) {
      token = response.data.data.token
      const userId = response.data.data.userInfo.id
      
      success('登录成功')
      info(`Token: ${token.substring(0, 30)}...`)
      info(`用户ID: ${userId}`)
      info(`用户昵称: ${response.data.data.userInfo.nickname}`)
      
      // 更新请求头
      client.defaults.headers['Authorization'] = `Bearer ${token}`
      
      return true
    } else {
      error(`登录失败: ${response.data.message}`)
      return false
    }
  } catch (err) {
    error(`登录请求失败: ${err.message}`)
    if (err.response) {
      error(`响应状态: ${err.response.status}`)
      error(`响应数据: ${JSON.stringify(err.response.data, null, 2)}`)
    }
    return false
  }
}

/**
 * 创建一个简单的PDF文件
 */
function createTestPDF() {
  const testContent = '这是一个测试PDF文件，用于测试豆包文件上传功能。\n时间: ' + new Date().toISOString()
  
  // 创建一个简单的PDF文件（最小PDF格式）
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
  
  return pdfContent
}

/**
 * 步骤2：上传PDF文件到豆包
 */
async function testPDFUpload() {
  section('步骤2：上传PDF文件到豆包')
  
  if (!token) {
    error('未获取到token，无法继续测试')
    return null
  }
  
  try {
    // 创建测试PDF文件
    const testFileName = 'test-doubao-upload.pdf'
    const testFilePath = path.join(__dirname, testFileName)
    const pdfBuffer = createTestPDF()
    
    // 写入测试文件
    fs.writeFileSync(testFilePath, pdfBuffer)
    info(`创建测试PDF文件: ${testFileName}`)
    info(`文件大小: ${pdfBuffer.length} 字节`)
    
    // 创建FormData
    const form = new FormData()
    form.append('file', pdfBuffer, {
      filename: testFileName,
      contentType: 'application/pdf'
    })
    form.append('fileType', 'document')
    
    info('开始上传PDF文件到豆包...')
    
    // 上传文件
    const response = await client.post('/api/file-upload/doubao', form, {
      headers: {
        ...form.getHeaders(),
        'Authorization': `Bearer ${token}`
      },
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
      timeout: 60000
    })
    
    // 清理测试文件
    if (fs.existsSync(testFilePath)) {
      fs.unlinkSync(testFilePath)
    }
    
    if (response.data.code === 0) {
      success('文件上传成功')
      
      const data = response.data.data
      console.log('\n📋 返回数据:')
      console.log(JSON.stringify(data, null, 2))
      
      console.log('\n📊 数据详情:')
      info(`文件ID: ${data.fileId}`)
      info(`文件URL: ${data.fileUrl}`)
      info(`文件名: ${data.fileName}`)
      info(`文件类型: ${data.fileType}`)
      info(`文件大小: ${data.fileSize} 字节`)
      info(`上传时间: ${data.uploadTime}`)
      
      // 检查是否有豆包文件ID
      console.log('\n')
      if (data.doubaoFileId) {
        success(`✅ 豆包文件ID: ${data.doubaoFileId}`)
        success('✅ 豆包上传成功！')
      } else {
        warning('⚠️  未获取到豆包文件ID（可能豆包上传失败）')
      }
      
      return data
    } else {
      error(`文件上传失败: ${response.data.message}`)
      console.log('\n响应数据:', JSON.stringify(response.data, null, 2))
      return null
    }
  } catch (err) {
    error(`文件上传请求失败: ${err.message}`)
    if (err.response) {
      error(`响应状态: ${err.response.status}`)
      error(`响应数据: ${JSON.stringify(err.response.data, null, 2)}`)
    }
    return null
  }
}

/**
 * 主测试函数
 */
async function runTests() {
  console.log('\n')
  log('🧪 PDF文件上传到豆包测试', 'bright')
  log(`测试环境: ${CONFIG.baseURL}`, 'cyan')
  log(`开始时间: ${new Date().toLocaleString()}`, 'cyan')
  
  try {
    // 步骤1：登录
    const loginSuccess = await testLogin()
    if (!loginSuccess) {
      error('\n登录失败，测试终止')
      process.exit(1)
    }
    
    // 步骤2：上传PDF文件
    const fileData = await testPDFUpload()
    if (fileData) {
      console.log('\n')
      if (fileData.doubaoFileId) {
        success('✅ 测试完成 - 豆包上传成功！')
      } else {
        warning('⚠️  测试完成 - 但未获取到豆包文件ID')
      }
    } else {
      error('文件上传测试失败')
    }
    
    console.log('\n')
    log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'cyan')
    success('测试完成')
    log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'cyan')
    
  } catch (error) {
    console.error('\n')
    error('测试过程中发生错误:')
    console.error(error)
    process.exit(1)
  }
}

// 运行测试
if (require.main === module) {
  runTests().catch(error => {
    console.error('测试执行失败:', error)
    process.exit(1)
  })
}

module.exports = { runTests }

