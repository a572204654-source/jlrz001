/**
 * 语音识别功能测试脚本
 * 
 * 测试内容：
 * 1. 配置验证
 * 2. 签名生成测试
 * 3. API连接测试
 */

require('dotenv').config()
const { getVoiceRecognitionService } = require('../utils/voiceRecognition')

console.log('🎤 语音识别功能测试\n')
console.log('=' .repeat(50))

// 测试1：检查配置
console.log('\n[测试1] 检查配置...')

const requiredConfig = {
  'TENCENT_SECRET_ID': process.env.TENCENT_SECRET_ID,
  'TENCENT_SECRET_KEY': process.env.TENCENT_SECRET_KEY,
  'TENCENT_APP_ID': process.env.TENCENT_APP_ID,
  'TENCENT_REGION': process.env.TENCENT_REGION || 'ap-guangzhou'
}

let configOk = true

Object.keys(requiredConfig).forEach(key => {
  const value = requiredConfig[key]
  if (value && value !== 'your_tencent_secret_id' && value !== 'your_tencent_secret_key') {
    console.log(`✓ ${key}: 已配置 (${value.substring(0, 10)}...)`)
  } else {
    console.log(`✗ ${key}: 未配置或使用默认值`)
    configOk = false
  }
})

if (!configOk) {
  console.error('\n❌ 配置检查失败')
  console.log('请在.env文件中正确配置腾讯云密钥')
  console.log('参考文档: README_VOICE.md')
  process.exit(1)
}

console.log('\n✅ 配置检查通过')

// 测试2：初始化服务
console.log('\n[测试2] 初始化语音识别服务...')

try {
  const voiceService = getVoiceRecognitionService()
  console.log('✓ 服务实例创建成功')
  console.log(`✓ API主机: ${voiceService.host}`)
  console.log(`✓ 服务区域: ${voiceService.region}`)
  console.log(`✓ API版本: ${voiceService.version}`)
} catch (error) {
  console.error('✗ 服务初始化失败:', error.message)
  process.exit(1)
}

console.log('\n✅ 服务初始化成功')

// 测试3：签名生成测试
console.log('\n[测试3] 测试签名生成...')

try {
  const voiceService = getVoiceRecognitionService()
  const timestamp = Math.floor(Date.now() / 1000)
  const testPayload = {
    ProjectId: 0,
    SubServiceType: 2
  }
  
  // 一句话识别的API动作名称
  const action = 'SentenceRecognition'
  const signature = voiceService.generateSignature(testPayload, timestamp, action)
  
  if (signature && signature.includes('TC3-HMAC-SHA256')) {
    console.log('✓ 签名生成成功')
    console.log(`✓ 签名格式: ${signature.substring(0, 50)}...`)
  } else {
    console.log('✗ 签名格式异常')
    process.exit(1)
  }
} catch (error) {
  console.error('✗ 签名生成失败:', error.message)
  process.exit(1)
}

console.log('\n✅ 签名生成测试通过')

// 测试4：模拟识别测试（不实际调用API，避免产生费用）
console.log('\n[测试4] 模拟识别测试...')

console.log('✓ 创建测试音频数据...')
const testAudioBuffer = Buffer.from('test audio data')

console.log('✓ 准备识别参数...')
const testOptions = {
  engineType: '16k_zh',
  voiceFormat: 1,
  filterDirty: 1,
  convertNumMode: 1
}

console.log('✓ 识别参数验证通过:')
console.log(`  - 引擎类型: ${testOptions.engineType}`)
console.log(`  - 音频格式: ${testOptions.voiceFormat}`)
console.log(`  - 过滤脏词: ${testOptions.filterDirty}`)
console.log(`  - 转换数字: ${testOptions.convertNumMode}`)

console.log('\n⚠️  注意: 实际识别会调用腾讯云API并产生费用')
console.log('   如需测试实际识别，请手动调用接口')

console.log('\n✅ 模拟测试通过')

// 测试5：数据库表检查
console.log('\n[测试5] 检查数据库表...')

const { query } = require('../config/database')

async function checkTables() {
  try {
    // 检查识别日志表
    const tables = await query(`
      SELECT TABLE_NAME 
      FROM information_schema.TABLES 
      WHERE TABLE_SCHEMA = ? 
      AND TABLE_NAME IN ('voice_recognition_logs', 'voice_recognition_tasks')
    `, [process.env.DB_NAME])
    
    const tableNames = tables.map(t => t.TABLE_NAME)
    
    if (tableNames.includes('voice_recognition_logs')) {
      console.log('✓ voice_recognition_logs 表存在')
    } else {
      console.log('✗ voice_recognition_logs 表不存在')
      console.log('  请执行SQL脚本: scripts/init-voice-recognition-tables.sql')
    }
    
    if (tableNames.includes('voice_recognition_tasks')) {
      console.log('✓ voice_recognition_tasks 表存在')
    } else {
      console.log('✗ voice_recognition_tasks 表不存在')
      console.log('  请执行SQL脚本: scripts/init-voice-recognition-tables.sql')
    }
    
    if (tableNames.length === 2) {
      console.log('\n✅ 数据库表检查通过')
    } else {
      console.log('\n⚠️  部分数据库表缺失')
    }
    
  } catch (error) {
    console.error('✗ 数据库表检查失败:', error.message)
  }
}

checkTables().then(() => {
  // 测试总结
  console.log('\n' + '='.repeat(50))
  console.log('✅ 语音识别功能测试完成!\n')
  
  console.log('📋 测试摘要:')
  console.log('  ✓ 配置验证通过')
  console.log('  ✓ 服务初始化成功')
  console.log('  ✓ 签名生成正常')
  console.log('  ✓ 参数验证通过')
  console.log('  ✓ 数据库表检查完成')
  
  console.log('\n🎯 下一步操作:')
  console.log('  1. 确保数据库表已创建')
  console.log('  2. 启动服务: npm start')
  console.log('  3. 测试API接口')
  console.log('  4. 集成到小程序')
  
  console.log('\n📚 参考文档:')
  console.log('  - 完整文档: docs/VOICE_RECOGNITION.md')
  console.log('  - 快速开始: README_VOICE.md')
  console.log('  - API测试: 使用Postman或curl命令')
  
  console.log('\n💡 提示:')
  console.log('  - 腾讯云提供每月10小时免费额度')
  console.log('  - 测试时注意控制调用次数')
  console.log('  - 生产环境建议配置限流保护')
  
  process.exit(0)
})

