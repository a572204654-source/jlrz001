/**
 * 测试监理日志导出API
 */

const axios = require('axios')
const fs = require('fs')
const path = require('path')

// 配置
const config = {
  baseURL: 'http://localhost',  // 根据实际情况修改
  token: ''  // 需要先登录获取token
}

async function testExportAPI() {
  try {
    console.log('测试说明：')
    console.log('1. 确保服务器已启动（npm start）')
    console.log('2. 确保数据库中有监理日志数据')
    console.log('3. 需要有效的登录token')
    console.log('')
    
    // 这里只是示例代码，实际使用需要真实的token和日志ID
    console.log('API调用示例：')
    console.log('GET /api/supervision-logs/:id/export')
    console.log('或')
    console.log('GET /api/v1/supervision-logs/:id/export')
    console.log('')
    console.log('请求头：')
    console.log('Authorization: Bearer {token}')
    console.log('或')
    console.log('token: {token}')
    console.log('')
    console.log('响应：')
    console.log('Content-Type: application/vnd.openxmlformats-officedocument.wordprocessingml.document')
    console.log('Content-Disposition: attachment; filename="监理日志_2024-11-07.docx"')
    console.log('')
    console.log('✓ 使用说明已输出')
    
  } catch (error) {
    console.error('错误:', error.message)
  }
}

testExportAPI()

