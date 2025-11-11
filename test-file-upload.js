const axios = require('axios')
const FormData = require('form-data')
const fs = require('fs')
const path = require('path')

// 云托管自定义域名
const BASE_URL = 'https://api.yimengpl.com'

// 颜色输出函数
function log(message, color = 'reset') {
  const colors = {
    reset: '\x1b[0m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m'
  }
  console.log(`${colors[color]}${message}${colors.reset}`)
}

function separator(title = '') {
  log('\n' + '='.repeat(60), 'cyan')
  if (title) {
    log(title, 'cyan')
    log('='.repeat(60), 'cyan')
  }
}

/**
 * 测试登录获取token
 */
async function testLogin() {
  separator('1. 测试登录')
  
  try {
    const response = await axios.post(`${BASE_URL}/api/auth/wechat-login`, {
      code: 'test_wechat_code_888888'
    })
    
    if (response.data.code === 0) {
      log('✓ 登录成功', 'green')
      log(`  Token: ${response.data.data.token.substring(0, 50)}...`, 'blue')
      log(`  用户ID: ${response.data.data.userInfo.id}`, 'blue')
      log(`  用户名: ${response.data.data.userInfo.nickname}`, 'blue')
      return response.data.data.token
    } else {
      log(`✗ 登录失败: ${response.data.message}`, 'red')
      return null
    }
  } catch (error) {
    log(`✗ 登录错误: ${error.message}`, 'red')
    if (error.response) {
      log(`  响应数据: ${JSON.stringify(error.response.data, null, 2)}`, 'yellow')
    }
    return null
  }
}

/**
 * 创建测试文件
 */
function createTestFile() {
  const testContent = '这是一个测试文件，用于测试文件上传功能。\n文件上传时间：' + new Date().toISOString()
  const testFilePath = path.join(__dirname, 'test-upload-file.txt')
  
  fs.writeFileSync(testFilePath, testContent, 'utf8')
  log(`✓ 创建测试文件: ${testFilePath}`, 'green')
  log(`  文件大小: ${fs.statSync(testFilePath).size} 字节`, 'blue')
  
  return testFilePath
}

/**
 * 测试文件上传到豆包
 */
async function testFileUpload(token) {
  separator('2. 测试文件上传到豆包')
  
  try {
    // 创建测试文件
    const testFilePath = createTestFile()
    const fileBuffer = fs.readFileSync(testFilePath)
    
    // 创建FormData
    const form = new FormData()
    form.append('file', fileBuffer, {
      filename: 'test-upload-file.txt',
      contentType: 'text/plain'
    })
    form.append('fileName', '测试文件.txt')
    form.append('fileType', 'document')
    
    log('开始上传文件到豆包...', 'yellow')
    log(`  文件名: 测试文件.txt`, 'blue')
    log(`  文件大小: ${fileBuffer.length} 字节`, 'blue')
    log(`  文件类型: document`, 'blue')
    
    // 上传文件
    const response = await axios.post(
      `${BASE_URL}/api/file-upload/doubao`,
      form,
      {
        headers: {
          ...form.getHeaders(),
          'Authorization': `Bearer ${token}`
        },
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
        timeout: 60000 // 60秒超时
      }
    )
    
    if (response.data.code === 0) {
      log('✓ 文件上传成功', 'green')
      log('\n返回数据:', 'cyan')
      console.log(JSON.stringify(response.data, null, 2))
      
      return response.data.data
    } else {
      log(`✗ 文件上传失败: ${response.data.message}`, 'red')
      log(`  响应数据: ${JSON.stringify(response.data, null, 2)}`, 'yellow')
      return null
    }
  } catch (error) {
    log(`✗ 文件上传错误: ${error.message}`, 'red')
    if (error.response) {
      log(`  状态码: ${error.response.status}`, 'yellow')
      log(`  响应数据: ${JSON.stringify(error.response.data, null, 2)}`, 'yellow')
    }
    if (error.config) {
      log(`  请求URL: ${error.config.url}`, 'yellow')
    }
    return null
  }
}

/**
 * 检查服务器日志中的豆包返回数据
 * 通过查看上传接口的详细日志来了解豆包返回的完整数据
 */
async function checkDoubaoResponse() {
  separator('3. 检查豆包返回数据')
  
  log('提示：豆包返回的完整数据会在服务器日志中显示', 'yellow')
  log('请查看云托管控制台的日志输出，查找以下信息：', 'yellow')
  log('  - "开始上传文件到豆包: ..."', 'blue')
  log('  - "文件上传到豆包成功，豆包文件ID: ..."', 'blue')
  log('  - "豆包返回文件URL: ..." (如果有)', 'blue')
  log('  - 如果上传失败，会显示 "上传到豆包失败: ..."', 'blue')
  log('\n代码位置: routes/file-upload.js 第 71-88 行', 'cyan')
}

/**
 * 获取文件列表
 */
async function getFileList(token) {
  separator('4. 获取文件列表')
  
  try {
    const response = await axios.get(
      `${BASE_URL}/api/file-upload/list`,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    )
    
    if (response.data.code === 0) {
      log('✓ 获取文件列表成功', 'green')
      log(`  总数: ${response.data.data.total}`, 'blue')
      log(`  当前页: ${response.data.data.page}`, 'blue')
      log(`  每页数量: ${response.data.data.pageSize}`, 'blue')
      log(`  文件列表:`, 'blue')
      
      if (response.data.data.list && response.data.data.list.length > 0) {
        response.data.data.list.forEach((file, index) => {
          log(`\n  文件 ${index + 1}:`, 'cyan')
          log(`    fileId: ${file.fileId}`, 'blue')
          log(`    fileName: ${file.fileName}`, 'blue')
          log(`    fileType: ${file.fileType}`, 'blue')
          log(`    fileSize: ${file.fileSize} 字节`, 'blue')
          log(`    fileUrl: ${file.fileUrl}`, 'blue')
          log(`    doubaoFileId: ${file.doubaoFileId || '(空)'}`, 'blue')
          log(`    uploadTime: ${file.uploadTime}`, 'blue')
        })
      } else {
        log('  (暂无文件)', 'yellow')
      }
      
      return response.data.data
    } else {
      log(`✗ 获取文件列表失败: ${response.data.message}`, 'red')
      return null
    }
  } catch (error) {
    log(`✗ 获取文件列表错误: ${error.message}`, 'red')
    if (error.response) {
      log(`  响应数据: ${JSON.stringify(error.response.data, null, 2)}`, 'yellow')
    }
    return null
  }
}

/**
 * 增强版：直接查看豆包API返回的原始数据
 * 修改代码以打印完整的豆包响应
 */
async function showDoubaoResponseDetails() {
  separator('5. 豆包API响应详情')
  
  log('要查看豆包返回的完整原始数据，需要修改代码：', 'yellow')
  log('\n在 routes/file-upload.js 的 uploadToDoubao 函数中，', 'cyan')
  log('第 155-164 行添加以下代码：', 'cyan')
  log('\n  console.log("豆包API完整响应:", JSON.stringify(response.data, null, 2))', 'blue')
  log('\n然后重新部署到云托管，再次运行测试即可看到完整数据。', 'yellow')
}

/**
 * 主测试函数
 */
async function main() {
  separator('文件上传功能测试 - 检查豆包返回数据')
  log(`测试服务器: ${BASE_URL}`, 'cyan')
  log(`测试时间: ${new Date().toISOString()}`, 'cyan')
  
  try {
    // 1. 登录获取token
    const token = await testLogin()
    if (!token) {
      log('\n✗ 登录失败，无法继续测试', 'red')
      return
    }
    
    // 等待一下
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // 2. 上传文件
    const uploadResult = await testFileUpload(token)
    
    // 等待一下
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // 3. 获取文件列表
    await getFileList(token)
    
    // 4. 检查豆包返回数据说明
    await checkDoubaoResponse()
    
    // 5. 显示如何查看完整响应
    await showDoubaoResponseDetails()
    
    separator('测试完成')
    log('\n提示：', 'yellow')
    log('1. 查看云托管控制台的日志，可以看到豆包上传的详细信息', 'blue')
    log('2. 如果需要查看豆包API的完整原始响应，请修改代码添加日志', 'blue')
    log('3. 文件已保存到数据库和本地存储', 'blue')
    
  } catch (error) {
    log(`\n✗ 测试过程出错: ${error.message}`, 'red')
    console.error(error)
  }
}

// 运行测试
main().catch(console.error)

