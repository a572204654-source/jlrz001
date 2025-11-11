/**
 * 清理数据库所有测试数据，保留表结构
 * 使用方法: node scripts/clear-all-data.js
 */

require('dotenv').config()
const mysql = require('mysql2/promise')

// 数据库连接配置
// 优先使用 DB_HOST/DB_PORT，如果没有则使用 DB_HOST_EXTERNAL/DB_PORT_EXTERNAL（本地开发）
const dbConfig = {
  host: process.env.DB_HOST || process.env.DB_HOST_EXTERNAL || 'sh-cynosdbmysql-grp-goudlu7k.sql.tencentcdb.com',
  port: parseInt(process.env.DB_PORT || process.env.DB_PORT_EXTERNAL || '22087'),
  user: process.env.DB_USER || 'a572204654',
  password: process.env.DB_PASSWORD || '572204654aA',
  database: process.env.DB_NAME || 'jlzr1101-5g9kplxza13a780d',
  charset: 'utf8mb4'
}

async function clearAllData() {
  let connection

  try {
    console.log('==================================')
    console.log('开始清理数据库测试数据...')
    console.log('==================================')
    console.log(`数据库地址: ${dbConfig.host}:${dbConfig.port}`)
    console.log(`数据库名称: ${dbConfig.database}`)
    console.log(`用户: ${dbConfig.user}`)
    console.log('==================================\n')

    // 连接数据库
    connection = await mysql.createConnection(dbConfig)
    console.log('✓ 数据库连接成功\n')

    // 获取所有表名
    console.log('1. 查询所有表...')
    const [tables] = await connection.query(`
      SELECT TABLE_NAME 
      FROM information_schema.TABLES 
      WHERE TABLE_SCHEMA = ? 
      AND TABLE_TYPE = 'BASE TABLE'
      ORDER BY TABLE_NAME
    `, [dbConfig.database])

    if (tables.length === 0) {
      console.log('⚠ 数据库中没有表')
      return
    }

    console.log(`✓ 找到 ${tables.length} 个表:`)
    tables.forEach((table, index) => {
      console.log(`   ${index + 1}. ${table.TABLE_NAME}`)
    })
    console.log('')

    // 确认操作
    console.log('⚠ 警告: 即将删除所有表的数据，表结构将保留')
    console.log('⚠ 此操作不可恢复，请确认是否继续\n')

    // 禁用外键检查
    console.log('2. 禁用外键检查...')
    await connection.query('SET FOREIGN_KEY_CHECKS = 0')
    console.log('✓ 外键检查已禁用\n')

    // 清空所有表的数据
    console.log('3. 开始清空表数据...')
    let successCount = 0
    let errorCount = 0

    for (const table of tables) {
      const tableName = table.TABLE_NAME
      try {
        // 使用 TRUNCATE 清空表（更快，且重置 AUTO_INCREMENT）
        await connection.query(`TRUNCATE TABLE \`${tableName}\``)
        console.log(`   ✓ ${tableName} - 已清空`)
        successCount++
      } catch (error) {
        // 如果 TRUNCATE 失败（可能因为外键约束），尝试使用 DELETE
        try {
          await connection.query(`DELETE FROM \`${tableName}\``)
          // 重置 AUTO_INCREMENT
          await connection.query(`ALTER TABLE \`${tableName}\` AUTO_INCREMENT = 1`)
          console.log(`   ✓ ${tableName} - 已清空 (使用 DELETE)`)
          successCount++
        } catch (deleteError) {
          console.error(`   ✗ ${tableName} - 清空失败: ${deleteError.message}`)
          errorCount++
        }
      }
    }

    console.log('')

    // 重新启用外键检查
    console.log('4. 重新启用外键检查...')
    await connection.query('SET FOREIGN_KEY_CHECKS = 1')
    console.log('✓ 外键检查已启用\n')

    // 显示结果
    console.log('==================================')
    console.log('清理完成！')
    console.log('==================================')
    console.log(`成功清空: ${successCount} 个表`)
    if (errorCount > 0) {
      console.log(`失败: ${errorCount} 个表`)
    }
    console.log('==================================\n')

    // 验证清理结果
    console.log('5. 验证清理结果...')
    let totalRows = 0
    for (const table of tables) {
      const tableName = table.TABLE_NAME
      const [rows] = await connection.query(`SELECT COUNT(*) as count FROM \`${tableName}\``)
      const count = rows[0].count
      if (count > 0) {
        console.log(`   ⚠ ${tableName} - 仍有 ${count} 条数据`)
        totalRows += count
      } else {
        console.log(`   ✓ ${tableName} - 已清空`)
      }
    }

    if (totalRows === 0) {
      console.log('\n✓ 所有表数据已完全清空')
    } else {
      console.log(`\n⚠ 仍有 ${totalRows} 条数据未清空`)
    }

  } catch (error) {
    console.error('\n✗ 清理失败:', error.message)
    console.error(error)
    process.exit(1)
  } finally {
    if (connection) {
      await connection.end()
      console.log('\n✓ 数据库连接已关闭')
    }
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  clearAllData()
    .then(() => {
      console.log('\n脚本执行完成')
      process.exit(0)
    })
    .catch((error) => {
      console.error('\n脚本执行失败:', error)
      process.exit(1)
    })
}

module.exports = { clearAllData }




