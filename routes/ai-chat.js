const express = require('express')
const router = express.Router()
const { success, badRequest, serverError } = require('../utils/response')
const { query } = require('../config/database')
const { authenticate } = require('../middleware/auth')
const { randomString } = require('../utils/crypto')
const { chatWithContext } = require('../utils/doubao')

/**
 * 创建新会话
 * POST /api/ai-chat/session
 */
router.post('/session', authenticate, async (req, res) => {
  try {
    // 生成会话ID
    const sessionId = 'session_' + Date.now() + '_' + randomString(8)

    // 可以选择性地在数据库中记录会话创建
    // 目前仅返回会话ID
    
    return success(res, { sessionId })

  } catch (error) {
    console.error('创建会话错误:', error)
    return serverError(res, '创建会话失败')
  }
})

/**
 * 发送消息
 * POST /api/ai-chat/send
 * 
 * 请求参数:
 * - sessionId: 会话ID（必填）
 * - content: 消息内容（可选，如果只有文件可以为空）
 * - files: 文件列表（可选），格式：[{fileId, fileUrl, fileName, fileType}]
 */
router.post('/send', authenticate, async (req, res) => {
  try {
    const userId = req.userId
    const { sessionId, content, files } = req.body

    // 参数验证
    if (!sessionId) {
      return badRequest(res, '会话ID不能为空')
    }
    if (!content && (!files || files.length === 0)) {
      return badRequest(res, '消息内容或文件至少需要提供一个')
    }

    // 验证文件是否存在并获取豆包文件ID
    let doubaoFileIds = []
    if (files && files.length > 0) {
      for (const file of files) {
        if (!file.fileId) {
          return badRequest(res, '文件ID不能为空')
        }

        // 查询文件记录
        const fileRecords = await query(
          'SELECT doubao_file_id, file_name FROM file_uploads WHERE file_id = ? AND user_id = ?',
          [file.fileId, userId]
        )

        if (fileRecords.length === 0) {
          return badRequest(res, `文件不存在：${file.fileName || file.fileId}`)
        }

        const fileRecord = fileRecords[0]
        if (!fileRecord.doubao_file_id) {
          return badRequest(res, `文件尚未上传到豆包，请重新上传：${fileRecord.file_name}`)
        }

        doubaoFileIds.push(fileRecord.doubao_file_id)
      }
    }

    // 构建消息内容（如果有文件，添加文件说明）
    let messageContent = content || ''
    if (files && files.length > 0) {
      const fileNames = files.map(f => f.fileName || f.fileId).join('、')
      if (messageContent) {
        messageContent += `\n\n附件：${fileNames}`
      } else {
        messageContent = `请分析以下文件：${fileNames}`
      }
    }

    // 保存用户消息（包含文件信息）
    const userMessageResult = await query(
      `INSERT INTO ai_chat_logs 
        (user_id, session_id, message_type, content, api_provider) 
       VALUES (?, ?, 'user', ?, 'doubao')`,
      [userId, sessionId, messageContent]
    )

    // 获取对话历史（最近10条消息作为上下文）
    const historyMessages = await query(
      `SELECT message_type, content 
       FROM ai_chat_logs
       WHERE user_id = ? AND session_id = ?
       ORDER BY created_at DESC
       LIMIT 10`,
      [userId, sessionId]
    )

    // 构建对话上下文（时间倒序，需要翻转）
    const conversationHistory = historyMessages
      .reverse()
      .filter(msg => msg.message_type === 'user' || msg.message_type === 'ai')
      .map(msg => ({
        role: msg.message_type === 'user' ? 'user' : 'assistant',
        content: msg.content
      }))

    // 调用豆包AI API获取回复（传递文件ID）
    const aiReply = await chatWithContext(
      conversationHistory, 
      messageContent, 
      {}, 
      doubaoFileIds
    )

    // 保存AI回复
    const aiMessageResult = await query(
      `INSERT INTO ai_chat_logs 
        (user_id, session_id, message_type, content, api_provider) 
       VALUES (?, ?, 'ai', ?, 'doubao')`,
      [userId, sessionId, aiReply]
    )

    return success(res, {
      sessionId,
      messageId: aiMessageResult.insertId,
      aiReply
    })

  } catch (error) {
    console.error('发送消息错误:', error)
    return serverError(res, '发送消息失败')
  }
})

/**
 * 获取对话历史
 * GET /api/ai-chat/history
 * 
 * 请求参数:
 * - sessionId: 会话ID（必填）
 * - page: 页码，默认1
 * - pageSize: 每页数量，默认50
 */
router.get('/history', authenticate, async (req, res) => {
  try {
    const userId = req.userId
    const sessionId = req.query.sessionId
    const page = parseInt(req.query.page) || 1
    const pageSize = parseInt(req.query.pageSize) || 50
    const offset = (page - 1) * pageSize

    // 参数验证
    if (!sessionId) {
      return badRequest(res, '会话ID不能为空')
    }

    // 查询对话历史
    const messages = await query(
      `SELECT 
        id,
        message_type,
        content,
        created_at
       FROM ai_chat_logs
       WHERE user_id = ? AND session_id = ?
       ORDER BY created_at ASC
       LIMIT ${pageSize} OFFSET ${offset}`,
      [userId, sessionId]
    )

    // 转换为驼峰命名
    const list = messages.map(msg => ({
      id: msg.id,
      messageType: msg.message_type,
      content: msg.content,
      createdAt: msg.created_at
    }))

    // 查询总数
    const [countResult] = await query(
      'SELECT COUNT(*) as total FROM ai_chat_logs WHERE user_id = ? AND session_id = ?',
      [userId, sessionId]
    )

    return success(res, {
      sessionId,
      total: countResult.total,
      list
    })

  } catch (error) {
    console.error('获取对话历史错误:', error)
    return serverError(res, '获取对话历史失败')
  }
})

/**
 * 删除会话
 * DELETE /api/ai-chat/session/:sessionId
 */
router.delete('/session/:sessionId', authenticate, async (req, res) => {
  try {
    const userId = req.userId
    const { sessionId } = req.params

    // 删除会话的所有消息
    await query(
      'DELETE FROM ai_chat_logs WHERE user_id = ? AND session_id = ?',
      [userId, sessionId]
    )

    return success(res, {}, '删除成功')

  } catch (error) {
    console.error('删除会话错误:', error)
    return serverError(res, '删除会话失败')
  }
})

/**
 * 获取用户的会话列表
 * GET /api/ai-chat/sessions
 * 
 * 请求参数:
 * - page: 页码，默认1
 * - pageSize: 每页数量，默认20
 */
router.get('/sessions', authenticate, async (req, res) => {
  try {
    const userId = req.userId
    const page = parseInt(req.query.page) || 1
    const pageSize = parseInt(req.query.pageSize) || 20
    const offset = (page - 1) * pageSize

    // 查询会话列表（按最后消息时间分组）
    const sessions = await query(
      `SELECT 
        session_id,
        COUNT(*) as message_count,
        MAX(created_at) as last_message_time,
        (SELECT content FROM ai_chat_logs 
         WHERE user_id = ? AND session_id = acl.session_id AND message_type = 'user'
         ORDER BY created_at DESC LIMIT 1) as last_user_message
       FROM ai_chat_logs acl
       WHERE user_id = ?
       GROUP BY session_id
       ORDER BY MAX(created_at) DESC
       LIMIT ${pageSize} OFFSET ${offset}`,
      [userId, userId]
    )

    // 转换为驼峰命名
    const list = sessions.map(s => ({
      sessionId: s.session_id,
      messageCount: s.message_count,
      lastMessageTime: s.last_message_time,
      lastUserMessage: s.last_user_message
    }))

    // 查询总数
    const [countResult] = await query(
      `SELECT COUNT(DISTINCT session_id) as total 
       FROM ai_chat_logs 
       WHERE user_id = ?`,
      [userId]
    )

    return success(res, {
      total: countResult.total,
      page,
      pageSize,
      list
    })

  } catch (error) {
    console.error('获取会话列表错误:', error)
    return serverError(res, '获取会话列表失败')
  }
})

module.exports = router

