/**
 * 测试腾讯云语音识别API实际调用
 * 使用新的凭证进行真实API调用测试
 */

require('dotenv').config()
const { getVoiceRecognitionService } = require('../utils/voiceRecognition')

async function testApiCall() {
  console.log('\n🧪 腾讯云语音识别API实际调用测试\n')
  console.log('='.repeat(50))

  try {
    const voiceService = getVoiceRecognitionService()
    
    console.log('\n📋 配置信息:')
    console.log(`  SecretId: ${process.env.TENCENT_SECRET_ID.substring(0, 15)}...`)
    console.log(`  SecretKey: ${process.env.TENCENT_SECRET_KEY.substring(0, 15)}...`)
    console.log(`  AppId: ${process.env.TENCENT_APP_ID}`)
    console.log(`  Region: ${process.env.TENCENT_REGION}`)

    console.log('\n🔄 正在调用腾讯云API...')
    console.log('   接口: SentenceRecognition (一句话识别)')
    console.log('   注意: 这将产生实际API调用，可能产生费用\n')

    // 创建一个最小的测试音频数据（PCM格式，16kHz，单声道）
    // 这里创建一个1秒的静音数据（16000字节 = 16kHz采样率 * 1秒 * 2字节/样本）
    const testAudioData = Buffer.alloc(16000)
    testAudioData.fill(0) // 填充为静音

    console.log('   音频数据: 1秒静音 (16000字节)')
    console.log('   识别引擎: 16k_zh\n')

    const result = await voiceService.recognizeFile(testAudioData, {
      engineType: '16k_zh',
      voiceFormat: 1, // PCM格式
      filterDirty: 0,
      filterModal: 0,
      filterPunc: 0,
      convertNumMode: 1,
      wordInfo: 2
    })

    console.log('✅ API调用成功!')
    console.log('\n📊 识别结果:')
    console.log(`   识别文本: ${result.text || '(空，静音音频)'}`)
    console.log(`   音频时长: ${result.audioTime}秒`)
    console.log(`   请求ID: ${result.requestId}`)
    
    console.log('\n✅ 凭证验证通过，API调用正常!')
    return true

  } catch (error) {
    console.error('\n❌ API调用失败!')
    console.error('\n错误信息:')
    console.error(`   ${error.message}`)
    
    if (error.message.includes('credentials could not be validated')) {
      console.error('\n💡 可能的原因:')
      console.error('   1. SecretId 或 SecretKey 不正确')
      console.error('   2. 密钥没有语音识别服务权限')
      console.error('   3. 密钥已过期或被禁用')
      console.error('\n🔧 解决方案:')
      console.error('   1. 检查腾讯云控制台的API密钥是否正确')
      console.error('   2. 确认密钥有"语音识别（ASR）"服务权限')
      console.error('   3. 重新创建密钥并更新.env文件')
    } else if (error.message.includes('signature')) {
      console.error('\n💡 可能的原因:')
      console.error('   签名生成错误，可能是SecretKey不正确')
    } else {
      console.error('\n💡 其他可能的原因:')
      console.error('   1. 网络连接问题')
      console.error('   2. 腾讯云服务异常')
      console.error('   3. 音频格式不正确')
    }
    
    return false
  }
}

// 运行测试
testApiCall().then(success => {
  console.log('\n' + '='.repeat(50))
  if (success) {
    console.log('✅ 测试完成: 凭证有效，API调用成功')
    process.exit(0)
  } else {
    console.log('❌ 测试失败: 请检查凭证配置')
    process.exit(1)
  }
}).catch(error => {
  console.error('\n❌ 测试异常:', error)
  process.exit(1)
})

