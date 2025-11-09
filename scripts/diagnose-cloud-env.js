/**
 * 云托管环境诊断脚本
 * 用于检查环境变量配置、数据库连接、腾讯云配置等
 */

require('dotenv').config()
const axios = require('axios')
const { query } = require('../config/database')
const config = require('../config')

// 云托管服务地址（从环境变量或命令行参数获取）
const CLOUD_SERVICE_URL = process.argv[2] || process.env.CLOUD_SERVICE_URL || 'http://localhost:80'

console.log('='.repeat(60))
console.log('云托管环境诊断工具')
console.log('='.repeat(60))
console.log(`服务地址: ${CLOUD_SERVICE_URL}\n`)

// 诊断结果
const diagnosis = {
  localEnv: {},
  cloudService: {},
  issues: [],
  recommendations: []
}

/**
 * 检查本地环境变量
 */
function checkLocalEnvironment() {
  console.log('📋 检查本地环境变量配置...')
  
  const requiredVars = {
    // 优先检查标准环境变量名（腾讯云云托管推荐）
    'TENCENTCLOUD_SECRET_ID': '腾讯云 SecretId（标准）',
    'TENCENTCLOUD_SECRET_KEY': '腾讯云 SecretKey（标准）',
    // 也检查旧变量名（向后兼容）
    'TENCENT_SECRET_ID': '腾讯云 SecretId（兼容）',
    'TENCENT_SECRET_KEY': '腾讯云 SecretKey（兼容）',
    'TENCENT_APP_ID': '腾讯云 AppId',
    'DB_USER': '数据库用户名',
    'DB_PASSWORD': '数据库密码',
    'DB_NAME': '数据库名称',
    'JWT_SECRET': 'JWT密钥'
  }

  const optionalVars = {
    'DB_HOST_INTERNAL': '数据库内网地址（生产环境）',
    'DB_PORT_INTERNAL': '数据库内网端口（生产环境）',
    'DB_HOST_EXTERNAL': '数据库外网地址（开发环境）',
    'DB_PORT_EXTERNAL': '数据库外网端口（开发环境）',
    'TENCENT_REGION': '腾讯云区域（默认：ap-guangzhou）'
  }

  diagnosis.localEnv.required = {}
  diagnosis.localEnv.optional = {}
  diagnosis.localEnv.missing = []

  // 检查腾讯云密钥（优先使用标准变量名）
  const hasStandardSecretId = !!process.env.TENCENTCLOUD_SECRET_ID
  const hasStandardSecretKey = !!process.env.TENCENTCLOUD_SECRET_KEY
  const hasCompatSecretId = !!process.env.TENCENT_SECRET_ID
  const hasCompatSecretKey = !!process.env.TENCENT_SECRET_KEY

  // 检查 SecretId
  if (hasStandardSecretId) {
    diagnosis.localEnv.required['TENCENTCLOUD_SECRET_ID'] = {
      description: '腾讯云 SecretId（标准）',
      hasValue: true,
      valuePrefix: `${process.env.TENCENTCLOUD_SECRET_ID.substring(0, 6)}...`
    }
  } else if (hasCompatSecretId) {
    diagnosis.localEnv.required['TENCENT_SECRET_ID'] = {
      description: '腾讯云 SecretId（兼容）',
      hasValue: true,
      valuePrefix: `${process.env.TENCENT_SECRET_ID.substring(0, 6)}...`
    }
    diagnosis.issues.push('⚠️ 建议使用标准环境变量名 TENCENTCLOUD_SECRET_ID 替代 TENCENT_SECRET_ID')
  } else {
    diagnosis.localEnv.missing.push('TENCENTCLOUD_SECRET_ID')
    diagnosis.issues.push('❌ 缺少必需环境变量: TENCENTCLOUD_SECRET_ID 或 TENCENT_SECRET_ID (腾讯云 SecretId)')
  }

  // 检查 SecretKey
  if (hasStandardSecretKey) {
    diagnosis.localEnv.required['TENCENTCLOUD_SECRET_KEY'] = {
      description: '腾讯云 SecretKey（标准）',
      hasValue: true,
      valuePrefix: `${process.env.TENCENTCLOUD_SECRET_KEY.substring(0, 6)}...`
    }
  } else if (hasCompatSecretKey) {
    diagnosis.localEnv.required['TENCENT_SECRET_KEY'] = {
      description: '腾讯云 SecretKey（兼容）',
      hasValue: true,
      valuePrefix: `${process.env.TENCENT_SECRET_KEY.substring(0, 6)}...`
    }
    diagnosis.issues.push('⚠️ 建议使用标准环境变量名 TENCENTCLOUD_SECRET_KEY 替代 TENCENT_SECRET_KEY')
  } else {
    diagnosis.localEnv.missing.push('TENCENTCLOUD_SECRET_KEY')
    diagnosis.issues.push('❌ 缺少必需环境变量: TENCENTCLOUD_SECRET_KEY 或 TENCENT_SECRET_KEY (腾讯云 SecretKey)')
  }

  // 检查其他必需变量
  const otherRequiredVars = {
    'TENCENT_APP_ID': '腾讯云 AppId',
    'DB_USER': '数据库用户名',
    'DB_PASSWORD': '数据库密码',
    'DB_NAME': '数据库名称',
    'JWT_SECRET': 'JWT密钥'
  }

  for (const [key, desc] of Object.entries(otherRequiredVars)) {
    const value = process.env[key]
    if (value) {
      diagnosis.localEnv.required[key] = {
        description: desc,
        hasValue: true,
        valuePrefix: key.includes('SECRET') || key.includes('PASSWORD') 
          ? `${value.substring(0, 6)}...` 
          : value
      }
    } else {
      diagnosis.localEnv.required[key] = {
        description: desc,
        hasValue: false
      }
      diagnosis.localEnv.missing.push(key)
      diagnosis.issues.push(`❌ 缺少必需环境变量: ${key} (${desc})`)
    }
  }

  // 检查可选变量
  for (const [key, desc] of Object.entries(optionalVars)) {
    const value = process.env[key]
    diagnosis.localEnv.optional[key] = {
      description: desc,
      hasValue: !!value,
      value: value || '(未设置)'
    }
  }

  // 检查 NODE_ENV
  diagnosis.localEnv.NODE_ENV = process.env.NODE_ENV || 'development'
  console.log(`  环境模式: ${diagnosis.localEnv.NODE_ENV}`)
  
  if (diagnosis.localEnv.missing.length > 0) {
    console.log(`  ⚠️  缺少 ${diagnosis.localEnv.missing.length} 个必需环境变量`)
  } else {
    console.log('  ✅ 所有必需环境变量已配置')
  }
  console.log()
}

/**
 * 检查本地数据库连接
 */
async function checkLocalDatabase() {
  console.log('🗄️  检查本地数据库连接...')
  
  try {
    const result = await query('SELECT 1 as test')
    console.log('  ✅ 数据库连接成功')
    diagnosis.localEnv.database = { connected: true }
    
  } catch (error) {
    console.log(`  ❌ 数据库连接失败: ${error.message}`)
    diagnosis.localEnv.database = { connected: false, error: error.message }
    diagnosis.issues.push(`❌ 数据库连接失败: ${error.message}`)
  }
  console.log()
}


/**
 * 检查云托管服务健康状态
 */
async function checkCloudServiceHealth() {
  console.log('🌐 检查云托管服务健康状态...')
  
  try {
    const response = await axios.get(`${CLOUD_SERVICE_URL}/health`, {
      timeout: 5000
    })
    
    if (response.data && response.data.status === 'ok') {
      console.log('  ✅ 服务健康检查通过')
      diagnosis.cloudService.health = { status: 'ok', timestamp: response.data.timestamp }
    } else {
      console.log('  ⚠️  服务响应异常')
      diagnosis.cloudService.health = { status: 'unknown', data: response.data }
    }
  } catch (error) {
    console.log(`  ❌ 无法连接到服务: ${error.message}`)
    diagnosis.cloudService.health = { 
      status: 'error', 
      error: error.message 
    }
    diagnosis.issues.push(`❌ 无法连接到云托管服务: ${error.message}`)
    diagnosis.recommendations.push('请检查服务地址是否正确，服务是否正在运行')
  }
  console.log()
}

/**
 * 检查云托管服务配置
 */
async function checkCloudServiceConfig() {
  console.log('⚙️  检查云托管服务配置...')
  
  try {
    const response = await axios.get(`${CLOUD_SERVICE_URL}/diagnose`, {
      timeout: 5000
    })
    
    if (response.data) {
      diagnosis.cloudService.config = response.data
      
      // 检查环境变量
      const env = response.data.environment || {}
      console.log(`  环境模式: ${env.NODE_ENV || '(未设置)'}`)
      
      // 检查数据库配置
      const db = response.data.database || {}
      console.log(`  数据库地址: ${db.host || '(未设置)'}:${db.port || '(未设置)'}`)
      console.log(`  数据库名称: ${db.database || '(未设置)'}`)
      
      if (db.warning) {
        console.log(`  ⚠️  ${db.warning}`)
        diagnosis.issues.push(`⚠️  ${db.warning}`)
      }
      
      // 检查诊断信息
      const diag = response.data.diagnosis || {}
      if (diag.warning) {
        console.log(`  ⚠️  ${diag.warning}`)
        diagnosis.issues.push(`⚠️  ${diag.warning}`)
      }
      
    } else {
      console.log('  ⚠️  无法获取配置信息')
    }
  } catch (error) {
    console.log(`  ❌ 无法获取配置信息: ${error.message}`)
    diagnosis.issues.push(`❌ 无法获取云托管服务配置: ${error.message}`)
  }
  console.log()
}

/**
 * 测试云托管服务登录
 */
async function testCloudServiceLogin() {
  console.log('🔐 测试云托管服务登录...')
  
  try {
    // 使用测试账号登录（需要先有一个测试用户）
    const response = await axios.post(`${CLOUD_SERVICE_URL}/api/auth/login`, {
      code: 'test_code_for_diagnosis'
    }, {
      timeout: 5000
    })
    
    if (response.data && response.data.code === 0) {
      console.log('  ✅ 登录接口正常')
      diagnosis.cloudService.login = { status: 'ok' }
    } else {
      console.log('  ⚠️  登录接口返回异常')
      diagnosis.cloudService.login = { status: 'error', data: response.data }
    }
  } catch (error) {
    if (error.response && error.response.status === 400) {
      console.log('  ✅ 登录接口正常（返回预期的参数错误）')
      diagnosis.cloudService.login = { status: 'ok', note: '接口正常，需要有效的code' }
    } else {
      console.log(`  ⚠️  登录接口测试失败: ${error.message}`)
      diagnosis.cloudService.login = { status: 'error', error: error.message }
    }
  }
  console.log()
}

/**
 * 生成诊断报告
 */
function generateReport() {
  console.log('='.repeat(60))
  console.log('诊断报告')
  console.log('='.repeat(60))
  
  if (diagnosis.issues.length === 0) {
    console.log('✅ 未发现明显问题')
  } else {
    console.log(`\n发现 ${diagnosis.issues.length} 个问题:\n`)
    diagnosis.issues.forEach((issue, index) => {
      console.log(`${index + 1}. ${issue}`)
    })
  }
  
  if (diagnosis.recommendations.length > 0) {
    console.log(`\n💡 建议:\n`)
    diagnosis.recommendations.forEach((rec, index) => {
      console.log(`${index + 1}. ${rec}`)
    })
  }
  
  console.log('\n' + '='.repeat(60))
  console.log('诊断完成')
  console.log('='.repeat(60))
}

/**
 * 主函数
 */
async function main() {
  try {
    // 1. 检查本地环境变量
    checkLocalEnvironment()
    
    // 2. 检查本地数据库连接
    await checkLocalDatabase()
    
    // 3. 检查云托管服务健康状态
    await checkCloudServiceHealth()
    
    // 5. 如果服务可访问，检查配置
    if (diagnosis.cloudService.health && diagnosis.cloudService.health.status === 'ok') {
      await checkCloudServiceConfig()
      await testCloudServiceLogin()
    }
    
    // 6. 生成报告
    generateReport()
    
    // 退出进程
    process.exit(0)
  } catch (error) {
    console.error('诊断过程出错:', error)
    process.exit(1)
  }
}

// 运行诊断
main()

