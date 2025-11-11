/**
 * 测试文件上传功能 - 检查豆包返回数据
 * 使用方法: node test/test-file-upload.js
 */

const axios = require('axios')
const FormData = require('form-data')
const fs = require('fs')
const path = require('path')

// 配置
const CONFIG = {
  baseURL: 'https://api.yimengpl.com',
  testOpenid: 'test_openid_001' // 测试用户openid
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
      warning('提示: 请确保数据库中存在测试用户')
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
 * 步骤2：上传文件到豆包
 */
async function testFileUpload() {
  section('步骤2：上传文件到豆包')
  
  if (!token) {
    error('未获取到token，无法继续测试')
    return null
  }
  
  try {
    // 创建一个测试文件
    const testFileName = 'test-file.txt'
    const testFileContent = '这是一个测试文件，用于测试文件上传功能。\n时间: ' + new Date().toISOString()
    const testFilePath = path.join(__dirname, testFileName)
    
    // 写入测试文件
    fs.writeFileSync(testFilePath, testFileContent, 'utf8')
    info(`创建测试文件: ${testFileName}`)
    
    // 创建FormData
    const form = new FormData()
    form.append('file', fs.createReadStream(testFilePath), {
      filename: testFileName,
      contentType: 'text/plain'
    })
    form.append('fileType', 'document')
    
    info('开始上传文件到豆包...')
    info(`文件大小: ${fs.statSync(testFilePath).size} 字节`)
    
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
    if (err.request) {
      error('请求详情:', JSON.stringify(err.request, null, 2))
    }
    return null
  }
}

/**
 * 步骤3：查询文件列表
 */
async function testFileList() {
  section('步骤3：查询文件列表')
  
  if (!token) {
    error('未获取到token，无法继续测试')
    return
  }
  
  try {
    const response = await client.get('/api/file-upload/list', {
      headers: {
        'Authorization': `Bearer ${token}`
      },
      params: {
        page: 1,
        pageSize: 10
      }
    })
    
    if (response.data.code === 0) {
      success('获取文件列表成功')
      
      const data = response.data.data
      info(`总数: ${data.total}`)
      info(`当前页: ${data.page}`)
      info(`每页数量: ${data.pageSize}`)
      info(`文件数量: ${data.list.length}`)
      
      if (data.list.length > 0) {
        console.log('\n📋 文件列表:')
        data.list.forEach((file, index) => {
          console.log(`\n文件 ${index + 1}:`)
          console.log(`  文件ID: ${file.fileId}`)
          console.log(`  文件名: ${file.fileName}`)
          console.log(`  文件类型: ${file.fileType}`)
          console.log(`  文件大小: ${file.fileSize} 字节`)
          console.log(`  文件URL: ${file.fileUrl}`)
          console.log(`  豆包文件ID: ${file.doubaoFileId || '(无)'}`)
          console.log(`  上传时间: ${file.uploadTime}`)
        })
      } else {
        warning('文件列表为空')
      }
    } else {
      error(`获取文件列表失败: ${response.data.message}`)
    }
  } catch (err) {
    error(`获取文件列表请求失败: ${err.message}`)
    if (err.response) {
      error(`响应状态: ${err.response.status}`)
      error(`响应数据: ${JSON.stringify(err.response.data, null, 2)}`)
    }
  }
}

/**
 * 步骤4：检查服务器日志中的豆包返回数据
 * 注意：这个步骤需要查看服务器日志，这里只是提示
 */
function checkDoubaoResponse() {
  section('步骤4：检查豆包返回数据')
  
  info('豆包返回的数据会在服务器日志中显示')
  info('请查看服务器日志，查找以下信息:')
  console.log('\n  1. "开始上传文件到豆包: ..."')
  console.log('  2. "文件上传到豆包成功，豆包文件ID: ..."')
  console.log('  3. "豆包返回文件URL: ..." (如果有)')
  console.log('\n  如果上传失败，会显示:')
  console.log('  "上传到豆包失败: ..."')
  
  warning('\n提示: 豆包的完整响应数据在代码中已记录')
  info('查看 routes/file-upload.js 中的 uploadToDoubao 函数')
  info('查看 utils/doubao.js 中的相关代码')
  
  console.log('\n📝 豆包API响应格式检查:')
  console.log('  代码中会尝试从以下字段获取文件ID:')
  console.log('    - response.data.id')
  console.log('    - response.data.fileId')
  console.log('    - response.data.file_id')
  console.log('\n  代码中会尝试从以下字段获取文件URL:')
  console.log('    - response.data.url')
  console.log('    - response.data.fileUrl')
  console.log('    - response.data.file_url')
}

/**
 * 主测试函数
 */
async function runTests() {
  console.log('\n')
  log('🧪 文件上传功能测试 - 检查豆包返回数据', 'bright')
  log(`测试环境: ${CONFIG.baseURL}`, 'cyan')
  log(`开始时间: ${new Date().toLocaleString()}`, 'cyan')
  
  try {
    // 步骤1：登录
    const loginSuccess = await testLogin()
    if (!loginSuccess) {
      error('\n登录失败，测试终止')
      process.exit(1)
    }
    
    // 步骤2：上传文件
    const fileData = await testFileUpload()
    if (fileData) {
      console.log('\n')
      success('文件上传测试完成')
      
      // 检查是否有豆包文件ID
      if (fileData.doubaoFileId) {
        success(`豆包文件ID: ${fileData.doubaoFileId}`)
      } else {
        warning('未获取到豆包文件ID（可能豆包上传失败）')
      }
      
      // 检查文件URL
      if (fileData.fileUrl) {
        if (fileData.fileUrl.includes('doubao') || fileData.fileUrl.includes('volces')) {
          success(`使用豆包URL: ${fileData.fileUrl}`)
        } else {
          info(`使用本地存储URL: ${fileData.fileUrl}`)
        }
      }
    } else {
      error('文件上传测试失败')
    }
    
    // 步骤3：查询文件列表
    await testFileList()
    
    // 步骤4：检查豆包返回数据说明
    checkDoubaoResponse()
    
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

