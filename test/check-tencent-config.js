/**
 * 检查腾讯云配置是否正确加载
 * 用于诊断环境变量问题
 */

require('dotenv').config()
const config = require('../config')

console.log('\n🔍 腾讯云配置检查\n')
console.log('='.repeat(50))

console.log('\n📋 环境变量读取:')
console.log('  TENCENT_SECRET_ID:', process.env.TENCENT_SECRET_ID ? 
  `${process.env.TENCENT_SECRET_ID.substring(0, 10)}...` : '❌ 未设置')
console.log('  TENCENT_SECRET_KEY:', process.env.TENCENT_SECRET_KEY ? 
  `${process.env.TENCENT_SECRET_KEY.substring(0, 10)}...` : '❌ 未设置')
console.log('  TENCENT_APP_ID:', process.env.TENCENT_APP_ID || '❌ 未设置')
console.log('  TENCENT_REGION:', process.env.TENCENT_REGION || '❌ 未设置')

console.log('\n📋 配置对象读取:')
console.log('  config.tencentCloud.secretId:', config.tencentCloud.secretId ? 
  `${config.tencentCloud.secretId.substring(0, 10)}...` : '❌ 为空')
console.log('  config.tencentCloud.secretKey:', config.tencentCloud.secretKey ? 
  `${config.tencentCloud.secretKey.substring(0, 10)}...` : '❌ 为空')
console.log('  config.tencentCloud.appId:', config.tencentCloud.appId || '❌ 为空')
console.log('  config.tencentCloud.region:', config.tencentCloud.region || '❌ 为空')

console.log('\n✅ 配置检查完成\n')

if (!config.tencentCloud.secretId || !config.tencentCloud.secretKey) {
  console.log('⚠️  警告: SecretId 或 SecretKey 未正确配置')
  console.log('   请检查:')
  console.log('   1. .env 文件是否存在并包含正确的配置')
  console.log('   2. 云托管平台环境变量是否已设置')
  console.log('   3. 服务是否已重启使环境变量生效')
  process.exit(1)
} else {
  console.log('✅ 配置已正确加载')
  process.exit(0)
}

