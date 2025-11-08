/**
 * 交互式API验证工具
 * 引导用户一步步验证云部署的API接口
 */

const axios = require('axios')
const readline = require('readline')

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

let BASE_URL = ''
const testResults = []

/**
 * 询问问题
 */
function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve)
  })
}

/**
 * 打印分隔线
 */
function printLine(char = '=') {
  console.log(char.repeat(60))
}

/**
 * 打印标题
 */
function printTitle(title) {
  console.log('')
  printLine()
  console.log(title)
  printLine()
}

/**
 * 测试接口
 */
async function testEndpoint(name, url, validator) {
  console.log(`\n🧪 测试: ${name}`)
  console.log(`📍 URL: ${BASE_URL}${url}`)
  
  try {
    const response = await axios.get(`${BASE_URL}${url}`, { timeout: 10000 })
    
    // 显示响应
    console.log(`✅ 响应状态: ${response.status}`)
    
    // 自定义验证
    if (validator) {
      const result = validator(response.data)
      if (result.success) {
        console.log(`✅ 验证通过: ${result.message}`)
        testResults.push({ name, status: 'passed', message: result.message })
        return true
      } else {
        console.log(`❌ 验证失败: ${result.message}`)
        testResults.push({ name, status: 'failed', message: result.message })
        return false
      }
    } else {
      testResults.push({ name, status: 'passed', message: '请求成功' })
      return true
    }
  } catch (error) {
    console.log(`❌ 请求失败: ${error.message}`)
    if (error.response) {
      console.log(`   状态码: ${error.response.status}`)
      console.log(`   响应: ${JSON.stringify(error.response.data)}`)
    }
    testResults.push({ name, status: 'failed', message: error.message })
    return false
  }
}

/**
 * 显示JSON数据
 */
function showJson(data, maxLength = 200) {
  const json = JSON.stringify(data, null, 2)
  if (json.length > maxLength) {
    console.log(json.substring(0, maxLength) + '...')
  } else {
    console.log(json)
  }
}

/**
 * 主流程
 */
async function main() {
  console.clear()
  printTitle('🚀 CloudBase API 交互式验证工具')
  
  console.log('本工具将引导你一步步验证云部署的API接口是否正常工作。')
  console.log('')
  
  // 1. 获取URL
  BASE_URL = await question('请输入你的云部署地址（例如: https://your-app.com）: ')
  BASE_URL = BASE_URL.trim().replace(/\/$/, '') // 移除末尾的斜杠
  
  if (!BASE_URL) {
    console.log('❌ URL不能为空')
    rl.close()
    return
  }
  
  console.log(`\n✅ 将测试地址: ${BASE_URL}`)
  
  const confirm = await question('\n按回车键开始验证，或输入 q 退出: ')
  if (confirm.toLowerCase() === 'q') {
    console.log('已取消')
    rl.close()
    return
  }
  
  // 2. 健康检查
  printTitle('第1步: 健康检查 ⭐⭐⭐')
  console.log('这是最重要的检查，确认服务是否正常运行。')
  
  const healthPassed = await testEndpoint(
    '健康检查',
    '/health',
    (data) => {
      if (data.status === 'ok') {
        return { success: true, message: '服务正常运行' }
      } else {
        return { success: false, message: `服务状态异常: ${data.status}` }
      }
    }
  )
  
  if (!healthPassed) {
    console.log('\n⚠️  健康检查失败！服务可能未正常启动。')
    const continueTest = await question('是否继续测试其他接口？(y/n): ')
    if (continueTest.toLowerCase() !== 'y') {
      rl.close()
      return
    }
  }
  
  await question('\n按回车键继续...')
  
  // 3. 环境诊断
  printTitle('第2步: 环境诊断 ⭐⭐⭐')
  console.log('检查数据库连接和环境变量配置是否正确。')
  
  try {
    const response = await axios.get(`${BASE_URL}/diagnose`, { timeout: 10000 })
    console.log('\n📊 诊断结果:')
    showJson(response.data)
    
    if (response.data.diagnosis?.warning) {
      console.log(`\n❌ 警告: ${response.data.diagnosis.warning}`)
      console.log('\n💡 解决方案:')
      console.log('   1. 检查环境变量配置')
      console.log('   2. 确认使用数据库内网地址')
      console.log('   3. 设置 NODE_ENV=production')
      testResults.push({ name: '环境诊断', status: 'failed', message: response.data.diagnosis.warning })
    } else {
      console.log('\n✅ 环境配置正常')
      testResults.push({ name: '环境诊断', status: 'passed', message: '环境配置正常' })
    }
  } catch (error) {
    console.log(`\n❌ 诊断失败: ${error.message}`)
    testResults.push({ name: '环境诊断', status: 'failed', message: error.message })
  }
  
  await question('\n按回车键继续...')
  
  // 4. API根路径
  printTitle('第3步: API基础接口')
  console.log('检查API路由是否正确注册。')
  
  await testEndpoint(
    'API根路径',
    '/api',
    (data) => {
      if (data.name && data.modules) {
        return { success: true, message: `API: ${data.name}` }
      } else {
        return { success: false, message: 'API信息不完整' }
      }
    }
  )
  
  await question('\n按回车键继续...')
  
  // 5. 天气API
  printTitle('第4步: 天气API测试')
  console.log('测试外部API集成（和风天气）。')
  
  await testEndpoint(
    '天气查询',
    '/api/weather/simple?latitude=39.9042&longitude=116.4074',
    (data) => {
      if (data.code === 0 && data.data) {
        return { success: true, message: `天气: ${data.data.weather || '未知'}` }
      } else {
        return { success: false, message: data.message || '查询失败' }
      }
    }
  )
  
  await question('\n按回车键继续...')
  
  // 6. 业务接口
  printTitle('第5步: 业务接口测试')
  console.log('测试核心业务接口（项目、工程、日志）。')
  
  console.log('\n📋 测试项目列表...')
  const projectPassed = await testEndpoint(
    '项目列表',
    '/api/projects?page=1&pageSize=10',
    (data) => {
      if (data.code === 0 && data.data?.list) {
        return { success: true, message: `共 ${data.data.pagination?.total || 0} 个项目` }
      } else {
        return { success: false, message: data.message || '查询失败' }
      }
    }
  )
  
  console.log('\n📋 测试工程列表...')
  await testEndpoint(
    '工程列表',
    '/api/works?page=1&pageSize=10',
    (data) => {
      if (data.code === 0 && data.data?.list) {
        return { success: true, message: `共 ${data.data.pagination?.total || 0} 个工程` }
      } else {
        return { success: false, message: data.message || '查询失败' }
      }
    }
  )
  
  console.log('\n📋 测试监理日志列表...')
  await testEndpoint(
    '监理日志列表',
    '/api/supervision-logs?page=1&pageSize=10',
    (data) => {
      if (data.code === 0 && data.data?.list) {
        return { success: true, message: `共 ${data.data.pagination?.total || 0} 条日志` }
      } else {
        return { success: false, message: data.message || '查询失败' }
      }
    }
  )
  
  await question('\n按回车键继续...')
  
  // 7. 权限保护
  printTitle('第6步: 权限保护测试 ⭐⭐⭐')
  console.log('测试未登录时是否能创建资源（应该被拒绝）。')
  
  try {
    await axios.post(`${BASE_URL}/api/projects`, 
      { name: '测试项目', description: '测试' },
      { timeout: 10000 }
    )
    console.log('\n❌ 权限保护失效！未登录可以创建资源！')
    console.log('💡 这是一个严重的安全问题，请检查认证中间件。')
    testResults.push({ name: '权限保护', status: 'failed', message: '权限保护失效' })
  } catch (error) {
    if (error.response?.status === 401) {
      console.log('\n✅ 权限保护正常（返回401未授权）')
      testResults.push({ name: '权限保护', status: 'passed', message: '权限保护正常' })
    } else {
      console.log(`\n⚠️  返回了非预期的错误: ${error.message}`)
      testResults.push({ name: '权限保护', status: 'warning', message: error.message })
    }
  }
  
  await question('\n按回车键查看测试报告...')
  
  // 8. 测试报告
  printTitle('📊 测试报告')
  
  const passed = testResults.filter(r => r.status === 'passed').length
  const failed = testResults.filter(r => r.status === 'failed').length
  const total = testResults.length
  
  console.log(`\n总测试数: ${total}`)
  console.log(`✅ 通过: ${passed}`)
  console.log(`❌ 失败: ${failed}`)
  console.log(`📈 通过率: ${((passed / total) * 100).toFixed(2)}%`)
  
  console.log('\n详细结果:')
  testResults.forEach((result, index) => {
    const icon = result.status === 'passed' ? '✅' : result.status === 'failed' ? '❌' : '⚠️'
    console.log(`${index + 1}. ${icon} ${result.name} - ${result.message}`)
  })
  
  // 9. 建议
  printTitle('💡 建议')
  
  if (failed === 0) {
    console.log('🎉 恭喜！所有测试都通过了！')
    console.log('')
    console.log('✅ 你的API已经可以正常使用了。')
    console.log('✅ 可以开始在小程序中测试完整功能。')
    console.log('')
    console.log('下一步:')
    console.log('1. 在小程序开发者工具中配置服务器域名')
    console.log('2. 测试小程序登录功能')
    console.log('3. 测试各项业务功能')
  } else {
    console.log('⚠️  有部分测试失败，建议排查以下问题：')
    console.log('')
    
    const failedTests = testResults.filter(r => r.status === 'failed')
    failedTests.forEach(test => {
      console.log(`❌ ${test.name}:`)
      console.log(`   问题: ${test.message}`)
      
      // 根据失败类型给出建议
      if (test.name.includes('健康检查')) {
        console.log('   建议: 检查服务是否启动，URL是否正确')
      } else if (test.name.includes('环境诊断')) {
        console.log('   建议: 检查环境变量配置，特别是数据库连接')
      } else if (test.name.includes('天气')) {
        console.log('   建议: 检查 QWEATHER_KEY 环境变量')
      } else if (test.name.includes('权限')) {
        console.log('   建议: 检查认证中间件是否正确配置')
      }
      console.log('')
    })
    
    console.log('📖 详细排查指南请参考: docs/API接口验证指南.md')
  }
  
  printLine()
  console.log('感谢使用 CloudBase API 验证工具！')
  printLine()
  
  rl.close()
}

// 运行主流程
main().catch(error => {
  console.error('验证过程异常:', error)
  rl.close()
  process.exit(1)
})

