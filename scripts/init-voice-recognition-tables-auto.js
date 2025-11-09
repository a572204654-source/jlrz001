/**
 * 自动初始化语音识别数据库表
 * 读取SQL文件并执行创建表语句
 */

require('dotenv').config()
const mysql = require('mysql2/promise')
const fs = require('fs')
const path = require('path')

// 数据库配置
const dbConfig = {
  host: process.env.DB_HOST || 'sh-cynosdbmysql-grp-goudlu7k.sql.tencentcdb.com',
  port: parseInt(process.env.DB_PORT || '22087'),
  user: process.env.DB_USER || 'a572204654',
  password: process.env.DB_PASSWORD || '572204654aA',
  database: process.env.DB_NAME || 'express_miniapp'
}

async function initTables() {
  let connection
  
  try {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('🚀 初始化语音识别数据库表')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
    
    // 连接数据库
    console.log('🔌 连接数据库...')
    console.log(`   地址: ${dbConfig.host}:${dbConfig.port}`)
    console.log(`   数据库: ${dbConfig.database}`)
    console.log(`   用户: ${dbConfig.user}\n`)
    
    connection = await mysql.createConnection(dbConfig)
    console.log('✅ 数据库连接成功!\n')
    
    // 读取SQL文件
    const sqlFile = path.join(__dirname, 'init-voice-recognition-tables.sql')
    
    if (!fs.existsSync(sqlFile)) {
      throw new Error(`SQL文件不存在: ${sqlFile}`)
    }
    
    console.log('📄 读取SQL文件...')
    const sqlContent = fs.readFileSync(sqlFile, 'utf8')
    console.log('✅ SQL文件读取成功\n')
    
    // 解析SQL语句（按分号分割，过滤注释和空行）
    // 先移除单行注释和多行注释
    let cleanedSql = sqlContent
      .replace(/--.*$/gm, '') // 移除单行注释
      .replace(/\/\*[\s\S]*?\*\//g, '') // 移除多行注释
      .trim()
    
    // 按分号分割SQL语句
    const sqlStatements = cleanedSql
      .split(';')
      .map(s => s.trim())
      .filter(s => {
        // 过滤空语句
        if (!s || s.length < 10) return false
        // 只保留CREATE TABLE语句
        if (!s.toUpperCase().includes('CREATE TABLE')) return false
        return true
      })
    
    console.log(`📋 找到 ${sqlStatements.length} 条SQL语句\n`)
    
    // 执行SQL语句
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('⚙️  执行SQL语句')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
    
    let successCount = 0
    let skipCount = 0
    
    for (let i = 0; i < sqlStatements.length; i++) {
      const sql = sqlStatements[i]
      
      if (!sql || sql.length < 10) {
        skipCount++
        continue
      }
      
      try {
        // 提取表名用于显示
        const tableMatch = sql.match(/CREATE TABLE.*?`(\w+)`/i)
        const tableName = tableMatch ? tableMatch[1] : `语句${i + 1}`
        
        console.log(`[${i + 1}/${sqlStatements.length}] 创建表: ${tableName}...`)
        
        await connection.query(sql)
        
        console.log(`✅ ${tableName} 表创建成功\n`)
        successCount++
        
      } catch (error) {
        // 如果表已存在，忽略错误
        if (error.code === 'ER_TABLE_EXISTS_ERROR' || error.message.includes('already exists')) {
          console.log(`⚠️  表已存在，跳过\n`)
          skipCount++
        } else {
          console.error(`❌ 创建失败: ${error.message}\n`)
          throw error
        }
      }
    }
    
    // 验证表是否创建成功
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('🔍 验证表创建结果')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
    
    const requiredTables = [
      'voice_recognition_logs',
      'voice_recognition_tasks',
      'supervision_log_voices'
    ]
    
    const existingTables = []
    
    for (const tableName of requiredTables) {
      const [rows] = await connection.query(
        `SHOW TABLES LIKE ?`,
        [tableName]
      )
      
      if (rows.length > 0) {
        console.log(`✅ ${tableName} 表存在`)
        existingTables.push(tableName)
        
        // 查看表结构
        const [columns] = await connection.query(`DESCRIBE ${tableName}`)
        console.log(`   字段数: ${columns.length}`)
      } else {
        console.log(`❌ ${tableName} 表不存在`)
      }
    }
    
    // 总结
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('📝 初始化结果总结')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
    
    console.log(`成功执行: ${successCount} 条SQL语句`)
    console.log(`跳过: ${skipCount} 条SQL语句`)
    console.log(`已创建表: ${existingTables.length}/${requiredTables.length}`)
    
    if (existingTables.length === requiredTables.length) {
      console.log('\n✅ 所有表创建成功！')
    } else {
      const missing = requiredTables.filter(t => !existingTables.includes(t))
      console.log(`\n⚠️  缺失的表: ${missing.join(', ')}`)
    }
    
    await connection.end()
    console.log('\n✅ 初始化完成!')
    
  } catch (error) {
    console.error('\n❌ 初始化失败:', error.message)
    if (error.code) {
      console.error(`   错误代码: ${error.code}`)
    }
    if (error.sql) {
      console.error(`   SQL: ${error.sql.substring(0, 100)}...`)
    }
    if (connection) {
      await connection.end()
    }
    process.exit(1)
  }
}

// 运行初始化
initTables()

