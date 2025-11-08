/**
 * AI对话错误处理测试
 * 测试不同错误场景下的降级响应
 */

const { callDoubaoAPI } = require('../utils/doubao')

// 测试用例
const testCases = [
  {
    name: '正常调用（可能失败）',
    messages: [{ role: 'user', content: '你好' }],
    expected: '应返回AI回复或降级提示'
  }
]

// 运行测试
async function runTests() {
  console.log('============================================')
  console.log('AI对话错误处理测试')
  console.log('============================================\n')
  
  for (const testCase of testCases) {
    console.log(`\n📝 测试用例: ${testCase.name}`)
    console.log(`预期结果: ${testCase.expected}\n`)
    
    try {
      const startTime = Date.now()
      const result = await callDoubaoAPI(testCase.messages, { timeout: 5000 })
      const duration = Date.now() - startTime
      
      console.log('✅ 测试通过')
      console.log(`响应时间: ${duration}ms`)
      console.log(`响应内容: ${result}`)
      
      // 判断是否为降级响应
      if (result.includes('抱歉')) {
        console.log('📢 这是一个降级响应（AI服务不可用）')
      } else {
        console.log('🎉 这是正常的AI响应')
      }
      
    } catch (error) {
      console.log('❌ 测试失败')
      console.log(`错误信息: ${error.message}`)
    }
    
    console.log('\n' + '='.repeat(50))
  }
  
  console.log('\n\n📊 测试总结')
  console.log('============================================')
  console.log('✅ 所有测试用例已执行完成')
  console.log('\n说明：')
  console.log('- 如果AI服务配置正确且可用，将返回正常的AI回复')
  console.log('- 如果AI服务不可用，将返回友好的降级提示')
  console.log('- 降级提示以"抱歉"开头，简洁明了')
  console.log('============================================\n')
}

// 执行测试
console.log('\n开始测试...\n')
runTests().catch(error => {
  console.error('测试执行失败:', error)
  process.exit(1)
})




