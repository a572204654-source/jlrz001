/**
 * 插入测试用户脚本
 * 用于快速创建测试用户，方便测试登录功能
 */

const { query } = require('../config/database')

async function insertTestUser() {
  try {
    console.log('开始插入测试用户...')

    // 检查用户是否已存在
    const existingUsers = await query(
      'SELECT * FROM users WHERE openid = ?',
      ['test_openid_888888']
    )

    if (existingUsers.length > 0) {
      console.log('⚠️  测试用户已存在，ID:', existingUsers[0].id)
      console.log('用户信息:', {
        id: existingUsers[0].id,
        openid: existingUsers[0].openid,
        nickname: existingUsers[0].nickname
      })
      return existingUsers[0]
    }

    // 插入新用户（根据实际表结构，unionid、avatar、organization 都是 NOT NULL，需要提供默认值）
    const result = await query(
      'INSERT INTO users (openid, unionid, nickname, avatar, organization) VALUES (?, ?, ?, ?, ?)',
      ['test_openid_888888', '', '测试用户', '', '']
    )

    console.log('✅ 测试用户插入成功！')
    console.log('用户ID:', result.insertId)
    console.log('OpenID: test_openid_888888')
    console.log('昵称: 测试用户')

    // 查询刚插入的用户
    const users = await query(
      'SELECT * FROM users WHERE id = ?',
      [result.insertId]
    )

    return users[0]
  } catch (error) {
    console.error('❌ 插入测试用户失败:', error.message)
    
    // 如果是唯一键冲突，说明用户已存在
    if (error.code === 'ER_DUP_ENTRY') {
      console.log('⚠️  用户已存在，尝试查询...')
      const users = await query(
        'SELECT * FROM users WHERE openid = ?',
        ['test_openid_888888']
      )
      if (users.length > 0) {
        console.log('✅ 找到已存在的用户:', users[0])
        return users[0]
      }
    }
    
    throw error
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  insertTestUser()
    .then((user) => {
      console.log('\n测试用户信息:')
      console.log(JSON.stringify(user, null, 2))
      console.log('\n✅ 完成！')
      process.exit(0)
    })
    .catch((error) => {
      console.error('\n❌ 执行失败:', error)
      process.exit(1)
    })
}

module.exports = { insertTestUser }

