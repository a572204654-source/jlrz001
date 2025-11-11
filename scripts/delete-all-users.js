/**
 * 删除数据库中所有用户数据
 * 使用方法: node scripts/delete-all-users.js
 */

require('dotenv').config()
const mysql = require('mysql2/promise')

// 数据库连接配置
const dbConfig = {
  host: process.env.DB_HOST || 'sh-cynosdbmysql-grp-goudlu7k.sql.tencentcdb.com',
  port: parseInt(process.env.DB_PORT || '22087'),
  user: process.env.DB_USER || 'a572204654',
  password: process.env.DB_PASSWORD || '572204654aA',
  database: process.env.DB_NAME || 'jlzr1101-5g9kplxza13a780d',
  charset: 'utf8mb4'
}

// 用户相关的表
const userTables = [
  'users',
  'sys_user',
  'sys_user-preview',
  'login_logs' // 登录日志也包含用户数据
]

async function deleteAllUsers() {
  let connection

  try {
    console.log('==================================')
    console.log('开始删除所有用户数据...')
    console.log('==================================')
    console.log(`数据库地址: ${dbConfig.host}:${dbConfig.port}`)
    console.log(`数据库名称: ${dbConfig.database}`)
    console.log(`用户: ${dbConfig.user}`)
    console.log('==================================\n')

    // 连接数据库
    connection = await mysql.createConnection(dbConfig)
    console.log('✓ 数据库连接成功\n')

    // 检查表是否存在并获取数据量
    console.log('1. 检查用户相关表...')
    const existingTables = []
    for (const tableName of userTables) {
      try {
        const [rows] = await connection.query(
          `SELECT COUNT(*) as count FROM \`${tableName}\``
        )
        const count = rows[0].count
        existingTables.push({ name: tableName, count })
        console.log(`   ✓ ${tableName} - 找到 ${count} 条数据`)
      } catch (error) {
        if (error.code === 'ER_NO_SUCH_TABLE') {
          console.log(`   ⚠ ${tableName} - 表不存在，跳过`)
        } else {
          throw error
        }
      }
    }
    console.log('')

    if (existingTables.length === 0) {
      console.log('⚠ 没有找到用户相关的表')
      return
    }

    // 显示将要删除的数据量
    const totalCount = existingTables.reduce((sum, table) => sum + table.count, 0)
    if (totalCount === 0) {
      console.log('✓ 所有用户表已经是空的，无需删除')
      return
    }

    console.log(`⚠ 警告: 即将删除 ${totalCount} 条用户数据`)
    console.log('⚠ 此操作不可恢复，请确认是否继续\n')

    // 禁用外键检查
    console.log('2. 禁用外键检查...')
    await connection.query('SET FOREIGN_KEY_CHECKS = 0')
    console.log('✓ 外键检查已禁用\n')

    // 删除所有用户数据
    console.log('3. 开始删除用户数据...')
    let successCount = 0
    let deletedCount = 0
    let errorCount = 0

    for (const table of existingTables) {
      const tableName = table.name
      try {
        // 使用 DELETE 删除数据（保留表结构）
        const [result] = await connection.query(`DELETE FROM \`${tableName}\``)
        const affectedRows = result.affectedRows
        console.log(`   ✓ ${tableName} - 已删除 ${affectedRows} 条数据`)
        deletedCount += affectedRows
        successCount++

        // 重置 AUTO_INCREMENT
        try {
          await connection.query(`ALTER TABLE \`${tableName}\` AUTO_INCREMENT = 1`)
        } catch (alterError) {
          // 如果表没有 AUTO_INCREMENT，忽略错误
        }
      } catch (error) {
        console.error(`   ✗ ${tableName} - 删除失败: ${error.message}`)
        errorCount++
      }
    }

    console.log('')

    // 重新启用外键检查
    console.log('4. 重新启用外键检查...')
    await connection.query('SET FOREIGN_KEY_CHECKS = 1')
    console.log('✓ 外键检查已启用\n')

    // 显示结果
    console.log('==================================')
    console.log('删除完成！')
    console.log('==================================')
    console.log(`成功处理: ${successCount} 个表`)
    console.log(`删除数据: ${deletedCount} 条`)
    if (errorCount > 0) {
      console.log(`失败: ${errorCount} 个表`)
    }
    console.log('==================================\n')

    // 验证删除结果
    console.log('5. 验证删除结果...')
    let remainingCount = 0
    for (const table of existingTables) {
      const tableName = table.name
      try {
        const [rows] = await connection.query(
          `SELECT COUNT(*) as count FROM \`${tableName}\``
        )
        const count = rows[0].count
        if (count > 0) {
          console.log(`   ⚠ ${tableName} - 仍有 ${count} 条数据`)
          remainingCount += count
        } else {
          console.log(`   ✓ ${tableName} - 已清空`)
        }
      } catch (error) {
        console.log(`   ⚠ ${tableName} - 验证失败: ${error.message}`)
      }
    }

    if (remainingCount === 0) {
      console.log('\n✓ 所有用户数据已完全删除')
    } else {
      console.log(`\n⚠ 仍有 ${remainingCount} 条数据未删除`)
    }

  } catch (error) {
    console.error('\n✗ 删除失败:', error.message)
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
  deleteAllUsers()
    .then(() => {
      console.log('\n脚本执行完成')
      process.exit(0)
    })
    .catch((error) => {
      console.error('\n脚本执行失败:', error)
      process.exit(1)
    })
}

module.exports = { deleteAllUsers }

