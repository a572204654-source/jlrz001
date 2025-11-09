/**
 * 检查 users 表的实际结构
 */

const { query } = require('../config/database')

async function checkTableStructure() {
  try {
    const columns = await query(
      "SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT, COLUMN_COMMENT FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' ORDER BY ORDINAL_POSITION"
    )
    
    console.log('users 表结构:')
    console.log('='.repeat(80))
    columns.forEach(col => {
      console.log(`${col.COLUMN_NAME.padEnd(20)} ${col.DATA_TYPE.padEnd(15)} ${col.IS_NULLABLE === 'YES' ? 'NULL' : 'NOT NULL'.padEnd(8)} ${col.COLUMN_DEFAULT || ''}`)
    })
    console.log('='.repeat(80))
    
    return columns
  } catch (error) {
    console.error('查询失败:', error.message)
    throw error
  }
}

if (require.main === module) {
  checkTableStructure()
    .then(() => {
      process.exit(0)
    })
    .catch((error) => {
      console.error('执行失败:', error)
      process.exit(1)
    })
}

module.exports = { checkTableStructure }
