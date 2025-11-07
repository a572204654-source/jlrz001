/**
 * 数据库连接测试脚本
 * 用于测试内外网地址配置是否正确
 */

require('dotenv').config()
const mysql = require('mysql2/promise')

// 测试连接函数
async function testConnection(name, config) {
  console.log(`\n测试 ${name} 连接...`)
  console.log(`地址: ${config.host}:${config.port}`)
  console.log(`数据库: ${config.database}`)
  
  try {
    const connection = await mysql.createConnection({
      host: config.host,
      port: config.port,
      user: config.user,
      password: config.password,
      database: config.database,
      connectTimeout: 5000
    })
    
    await connection.ping()
    console.log(`✅ ${name} 连接成功！`)
    
    // 查询数据库版本
    const [rows] = await connection.execute('SELECT VERSION() as version')
    console.log(`数据库版本: ${rows[0].version}`)
    
    await connection.end()
    return true
  } catch (error) {
    console.error(`❌ ${name} 连接失败:`, error.message)
    return false
  }
}

async function main() {
  console.log('==================================')
  console.log('数据库连接测试工具')
  console.log('==================================')
  console.log(`当前环境: ${process.env.NODE_ENV || 'development'}`)
  
  const baseConfig = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  }
  
  // 测试内网地址
  if (process.env.DB_HOST_INTERNAL && process.env.DB_PORT_INTERNAL) {
    const internalConfig = {
      ...baseConfig,
      host: process.env.DB_HOST_INTERNAL,
      port: parseInt(process.env.DB_PORT_INTERNAL)
    }
    await testConnection('内网地址', internalConfig)
  } else {
    console.log('\n⚠️  未配置内网地址')
  }
  
  // 测试外网地址
  if (process.env.DB_HOST_EXTERNAL && process.env.DB_PORT_EXTERNAL) {
    const externalConfig = {
      ...baseConfig,
      host: process.env.DB_HOST_EXTERNAL,
      port: parseInt(process.env.DB_PORT_EXTERNAL)
    }
    await testConnection('外网地址', externalConfig)
  } else {
    console.log('\n⚠️  未配置外网地址')
  }
  
  console.log('\n==================================')
  console.log('当前环境将使用的地址:')
  const currentHost = process.env.NODE_ENV === 'production' 
    ? (process.env.DB_HOST_INTERNAL || '未设置')
    : (process.env.DB_HOST_EXTERNAL || '未设置')
  const currentPort = process.env.NODE_ENV === 'production'
    ? (process.env.DB_PORT_INTERNAL || '未设置')
    : (process.env.DB_PORT_EXTERNAL || '未设置')
  console.log(`${currentHost}:${currentPort}`)
  console.log('==================================')
}

main().catch(console.error)

