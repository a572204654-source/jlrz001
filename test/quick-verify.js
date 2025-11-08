/**
 * 快速验证脚本
 * 快速检查云部署的关键接口是否正常
 */

const axios = require('axios')

// 从命令行参数或环境变量获取URL
const BASE_URL = process.argv[2] || process.env.API_BASE_URL || 'http://localhost'

console.log('='.repeat(60))
console.log('🚀 快速API验证')
console.log('='.repeat(60))
console.log(`📍 测试地址: ${BASE_URL}`)
console.log('')

let allPassed = true

/**
 * 测试单个接口
 */
async function testEndpoint(name, url, expectedStatus = 200) {
  try {
    const fullUrl = `${BASE_URL}${url}`
    const response = await axios.get(fullUrl, { timeout: 5000 })
    
    if (response.status === expectedStatus) {
      console.log(`✅ ${name}`)
      return true
    } else {
      console.log(`❌ ${name} - 状态码: ${response.status}`)
      allPassed = false
      return false
    }
  } catch (error) {
    console.log(`❌ ${name} - 错误: ${error.message}`)
    allPassed = false
    return false
  }
}

/**
 * 主测试流程
 */
async function runQuickVerify() {
  // 1. 健康检查
  console.log('1️⃣  健康检查')
  await testEndpoint('   服务健康状态', '/health')
  console.log('')

  // 2. 环境诊断
  console.log('2️⃣  环境诊断')
  try {
    const response = await axios.get(`${BASE_URL}/diagnose`, { timeout: 5000 })
    if (response.data.diagnosis?.warning) {
      console.log(`❌ 环境配置异常: ${response.data.diagnosis.warning}`)
      allPassed = false
    } else {
      console.log('✅ 环境配置正常')
    }
  } catch (error) {
    console.log(`❌ 环境诊断失败: ${error.message}`)
    allPassed = false
  }
  console.log('')

  // 3. API基础接口
  console.log('3️⃣  API基础接口')
  await testEndpoint('   API根路径', '/api')
  console.log('')

  // 4. 天气API
  console.log('4️⃣  天气API')
  await testEndpoint('   简单天气查询', '/api/weather/simple?latitude=39.9042&longitude=116.4074')
  console.log('')

  // 5. 业务接口
  console.log('5️⃣  业务接口')
  await testEndpoint('   项目列表', '/api/projects?page=1&pageSize=10')
  await testEndpoint('   工程列表', '/api/works?page=1&pageSize=10')
  await testEndpoint('   监理日志列表', '/api/supervision-logs?page=1&pageSize=10')
  console.log('')

  // 6. 权限保护
  console.log('6️⃣  权限保护')
  try {
    await axios.post(`${BASE_URL}/api/projects`, 
      { name: '测试', description: '测试' },
      { timeout: 5000 }
    )
    console.log('❌ 权限保护失效（未登录可以创建资源）')
    allPassed = false
  } catch (error) {
    if (error.response?.status === 401) {
      console.log('✅ 权限保护正常')
    } else {
      console.log(`⚠️  权限保护异常: ${error.message}`)
    }
  }
  console.log('')

  // 结果汇总
  console.log('='.repeat(60))
  if (allPassed) {
    console.log('🎉 所有关键接口验证通过！')
    console.log('='.repeat(60))
    process.exit(0)
  } else {
    console.log('⚠️  部分接口验证失败，请查看上面的详细信息')
    console.log('='.repeat(60))
    process.exit(1)
  }
}

// 执行验证
runQuickVerify().catch(error => {
  console.error('验证过程异常:', error.message)
  process.exit(1)
})

