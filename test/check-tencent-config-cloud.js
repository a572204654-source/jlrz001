/**
 * 检查云托管环境中的腾讯云配置
 * 用于诊断环境变量问题
 */

const https = require('https')

const CLOUD_URL = process.env.API_BASE_URL || 'https://api.yimengpl.com'

console.log('\n🔍 云托管腾讯云配置检查\n')
console.log('='.repeat(50))
console.log(`\n📋 检查地址: ${CLOUD_URL}/diagnose\n`)

https.get(`${CLOUD_URL}/diagnose`, (res) => {
  let data = ''
  
  res.on('data', (chunk) => {
    data += chunk
  })
  
  res.on('end', () => {
    try {
      const result = JSON.parse(data)
      
      console.log('📋 环境变量检查:')
      console.log(`   TENCENT_SECRET_ID: ${result.tencentCloud.hasSecretId ? '✅ 已配置' : '❌ 未设置'}`)
      console.log(`   TENCENT_SECRET_KEY: ${result.tencentCloud.hasSecretKey ? '✅ 已配置' : '❌ 未设置'}`)
      console.log(`   TENCENT_APP_ID: ${result.tencentCloud.hasAppId ? '✅ 已配置' : '❌ 未设置'}`)
      
      console.log('\n📋 配置值预览:')
      console.log(`   SecretId: ${result.tencentCloud.secretIdPrefix}`)
      console.log(`   SecretKey: ${result.tencentCloud.secretKeyPrefix}`)
      console.log(`   AppId: ${result.tencentCloud.appId}`)
      console.log(`   Region: ${result.tencentCloud.region}`)
      
      console.log('\n✅ 配置检查完成\n')
      
      if (!result.tencentCloud.hasSecretId || !result.tencentCloud.hasSecretKey) {
        console.log('⚠️  警告: SecretId 或 SecretKey 未正确配置')
        console.log('   请检查:')
        console.log('   1. 云托管平台环境变量是否已设置')
        console.log('   2. 环境变量名称是否正确:')
        console.log('      - TENCENT_SECRET_ID')
        console.log('      - TENCENT_SECRET_KEY')
        console.log('   3. 服务是否已重启使环境变量生效')
        console.log('   4. SecretKey 是否完整（通常比 SecretId 长很多）')
        process.exit(1)
      } else {
        console.log('✅ 配置已正确加载')
        console.log('\n💡 提示:')
        console.log('   如果语音识别仍然失败，请检查:')
        console.log('   1. SecretKey 的值是否正确（完整复制，不要有空格）')
        console.log('   2. 密钥是否有"语音识别（ASR）"服务权限')
        console.log('   3. 密钥是否已启用')
        process.exit(0)
      }
    } catch (error) {
      console.error('❌ 解析响应失败:', error.message)
      console.error('原始响应:', data)
      process.exit(1)
    }
  })
}).on('error', (error) => {
  console.error('❌ 请求失败:', error.message)
  process.exit(1)
})

