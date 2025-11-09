/**
 * 检查语音识别相关数据库表是否存在
 */

require('dotenv').config()
const mysql = require('mysql2/promise')

// 数据库配置（使用用户提供的连接信息）
const dbConfig = {
  host: process.env.DB_HOST || 'sh-cynosdbmysql-grp-goudlu7k.sql.tencentcdb.com',
  port: parseInt(process.env.DB_PORT || '22087'),
  user: process.env.DB_USER || 'a572204654',
  password: process.env.DB_PASSWORD || '572204654aA',
  database: process.env.DB_NAME || 'express_miniapp'
}

async function checkTables() {
  let connection
  
  try {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('📊 检查语音识别数据库表')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
    
    // 连接数据库
    console.log('🔌 连接数据库...')
    console.log(`   地址: ${dbConfig.host}:${dbConfig.port}`)
    console.log(`   数据库: ${dbConfig.database}`)
    console.log(`   用户: ${dbConfig.user}\n`)
    
    connection = await mysql.createConnection(dbConfig)
    console.log('✅ 数据库连接成功!\n')
    
    // 检查表是否存在
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('📋 检查数据库表')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
    
    const tables = [
      'voice_recognition_logs',
      'voice_recognition_tasks',
      'supervision_log_voices'
    ]
    
    const tableStatus = {}
    
    for (const tableName of tables) {
      const [rows] = await connection.query(
        `SHOW TABLES LIKE ?`,
        [tableName]
      )
      
      if (rows.length > 0) {
        console.log(`✅ ${tableName} 表存在`)
        tableStatus[tableName] = true
        
        // 查看表结构
        const [columns] = await connection.query(
          `DESCRIBE ${tableName}`
        )
        console.log(`   字段数: ${columns.length}`)
        console.log(`   字段列表: ${columns.map(c => c.Field).join(', ')}\n`)
      } else {
        console.log(`❌ ${tableName} 表不存在\n`)
        tableStatus[tableName] = false
      }
    }
    
    // 如果 voice_recognition_logs 表存在，查看数据统计
    if (tableStatus['voice_recognition_logs']) {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      console.log('📊 数据统计')
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
      
      try {
        const [countResult] = await connection.query(
          'SELECT COUNT(*) as total FROM voice_recognition_logs'
        )
        console.log(`总记录数: ${countResult[0].total}`)
        
        const [typeStats] = await connection.query(
          `SELECT recognition_type, COUNT(*) as count 
           FROM voice_recognition_logs 
           GROUP BY recognition_type`
        )
        
        if (typeStats.length > 0) {
          console.log('\n按类型统计:')
          typeStats.forEach(stat => {
            console.log(`  ${stat.recognition_type}: ${stat.count} 条`)
          })
        }
        
        const [recentLogs] = await connection.query(
          `SELECT id, user_id, recognized_text, recognition_type, created_at 
           FROM voice_recognition_logs 
           ORDER BY created_at DESC 
           LIMIT 5`
        )
        
        if (recentLogs.length > 0) {
          console.log('\n最近5条记录:')
          recentLogs.forEach((log, index) => {
            console.log(`  ${index + 1}. ID: ${log.id}, 用户: ${log.user_id}, 类型: ${log.recognition_type}`)
            console.log(`     时间: ${log.created_at}`)
            if (log.recognized_text) {
              const text = log.recognized_text.length > 50 
                ? log.recognized_text.substring(0, 50) + '...' 
                : log.recognized_text
              console.log(`     内容: ${text}`)
            }
          })
        }
      } catch (error) {
        console.log('⚠️  查询数据统计时出错:', error.message)
      }
    }
    
    // 总结
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('📝 检查结果总结')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
    
    const missingTables = tables.filter(t => !tableStatus[t])
    
    if (missingTables.length === 0) {
      console.log('✅ 所有表都存在！')
    } else {
      console.log('❌ 缺失的表:')
      missingTables.forEach(table => {
        console.log(`   - ${table}`)
      })
      console.log('\n💡 解决方案:')
      console.log('   请执行以下SQL脚本创建缺失的表:')
      console.log('   scripts/init-voice-recognition-tables.sql')
      console.log('\n   或使用以下命令:')
      console.log(`   mysql -h ${dbConfig.host} -P ${dbConfig.port} -u ${dbConfig.user} -p ${dbConfig.database} < scripts/init-voice-recognition-tables.sql`)
    }
    
    await connection.end()
    console.log('\n✅ 检查完成!')
    
  } catch (error) {
    console.error('\n❌ 检查失败:', error.message)
    if (error.code) {
      console.error(`   错误代码: ${error.code}`)
    }
    if (connection) {
      await connection.end()
    }
    process.exit(1)
  }
}

// 运行检查
checkTables()

