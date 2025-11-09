const express = require('express')
const router = express.Router()
const multer = require('multer')
const { success, badRequest, serverError } = require('../utils/response')
const { query } = require('../config/database')
const { authenticate } = require('../middleware/auth')
const { getVoiceRecognitionService } = require('../utils/voiceRecognition')
const { verifyToken } = require('../utils/jwt')

// 配置文件上传（使用内存存储）
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 限制10MB
  }
})

/**
 * 实时语音识别（上传音频文件）
 * POST /api/realtime-voice/recognize
 * 
 * 使用实时语音识别接口（WebSocket流式）识别上传的音频文件
 * 将音频文件分块发送到实时识别服务，模拟实时流
 * 
 * 请求参数:
 * - audio: 音频文件（multipart/form-data）
 * - engineType: 识别引擎类型（可选，默认16k_zh）
 * - voiceFormat: 音频格式（可选，1:pcm 4:wav 6:mp3）
 * - needvad: 是否需要VAD（可选，0或1，默认1）
 * - filterDirty: 是否过滤脏词（可选，0或1）
 * - filterModal: 是否过滤语气词（可选，0或1）
 * - filterPunc: 是否过滤标点（可选，0或1）
 * - convertNumMode: 是否转换数字（可选，0或1）
 * - wordInfo: 词级别时间戳（可选，0-2，默认2）
 * - vadSilenceTime: VAD静音检测时间(ms)（可选，默认200）
 */
router.post('/recognize', authenticate, upload.single('audio'), async (req, res) => {
  try {
    const userId = req.userId

    if (!req.file) {
      return badRequest(res, '请上传音频文件')
    }

    const audioBuffer = req.file.buffer
    const audioSize = req.file.size

    console.log('收到实时语音识别请求:', {
      userId,
      fileName: req.file.originalname,
      size: audioSize
    })

    // 获取识别选项
    const options = {
      engineType: req.body.engineType || '16k_zh',
      voiceFormat: parseInt(req.body.voiceFormat) || 1,
      needvad: parseInt(req.body.needvad) !== undefined ? parseInt(req.body.needvad) : 1,
      filterDirty: parseInt(req.body.filterDirty) || 0,
      filterModal: parseInt(req.body.filterModal) || 0,
      filterPunc: parseInt(req.body.filterPunc) || 0,
      convertNumMode: parseInt(req.body.convertNumMode) || 1,
      wordInfo: parseInt(req.body.wordInfo) || 2,
      vadSilenceTime: parseInt(req.body.vadSilenceTime) || 200
    }

    const voiceService = getVoiceRecognitionService()
    const result = await voiceService.recognizeFileWithRealtime(audioBuffer, options)

    // 保存识别记录
    const insertResult = await query(
      `INSERT INTO voice_recognition_logs 
        (user_id, audio_size, recognized_text, audio_time, recognition_type, options, created_at) 
       VALUES (?, ?, ?, ?, ?, ?, NOW())`,
      [userId, audioSize, result.text || '', result.audioTime || 0, 'realtime', JSON.stringify(options)]
    )

    return success(res, {
      id: insertResult.insertId,
      text: result.text,
      audioTime: result.audioTime,
      wordList: result.wordList || []
    }, '识别成功')

  } catch (error) {
    console.error('实时语音识别错误:', error)
    return serverError(res, error.message || '语音识别失败')
  }
})

/**
 * 初始化 Socket.IO 实时语音识别
 * 在 app.js 中调用此函数来设置 Socket.IO 事件处理
 */
function initSocketIO(io) {
  console.log('正在初始化 Socket.IO 实时语音识别服务...')

  // 创建命名空间
  const voiceNamespace = io.of('/realtime-voice')

  voiceNamespace.on('connection', (socket) => {
    console.log('Socket.IO 客户端已连接:', socket.id)

    let recognition = null
    let userId = null
    let voiceLogId = null
    let recognizedText = ''
    let audioSize = 0
    let startTime = Date.now()

    // 监听客户端的 'start' 事件
    socket.on('start', async (data) => {
      try {
        console.log('收到 start 事件:', data)

        // 验证 token
        const token = data.token
        if (!token) {
          socket.emit('error', { message: '缺少认证信息' })
          socket.disconnect()
          return
        }

        // 验证并解析 token
        try {
          const decoded = verifyToken(token)
          userId = decoded.userId
        } catch (err) {
          console.error('Token 验证失败:', err)
          socket.emit('error', { message: 'Token 无效或已过期' })
          socket.disconnect()
          return
        }

        // 获取识别选项
        const options = {
          engineType: data.engineType || '16k_zh',
          voiceFormat: data.voiceFormat || 1,
          needvad: data.needvad !== undefined ? data.needvad : 1,
          filterDirty: data.filterDirty || 0,
          filterModal: data.filterModal || 0,
          convertNumMode: data.convertNumMode || 1,
          wordInfo: data.wordInfo || 2,
          vadSilenceTime: data.vadSilenceTime || 200
        }

        console.log('开始实时识别，用户ID:', userId, '选项:', options)

        // 创建实时识别连接
        const voiceService = getVoiceRecognitionService()
        
        recognition = voiceService.createRealtimeRecognition(
          options,
          // 识别结果回调
          (result) => {
            console.log('识别结果:', result)
            recognizedText = result.text

            // 发送识别结果到客户端
            socket.emit('result', {
              voiceId: result.voiceId,
              text: result.text,
              isFinal: result.isFinal,
              wordList: result.wordList
            })

            // 如果是最终结果，保存到数据库
            if (result.isFinal && userId) {
              saveRecognitionLog(userId, recognizedText, audioSize, options)
                .then(id => {
                  voiceLogId = id
                  console.log('识别记录已保存，ID:', id)
                })
                .catch(err => {
                  console.error('保存识别记录错误:', err)
                })
            }
          },
          // 错误回调
          (error) => {
            console.error('识别错误:', error)
            socket.emit('error', {
              message: error.message || '识别失败'
            })
          }
        )

        // 发送就绪消息
        socket.emit('ready', {
          message: '识别服务已就绪'
        })

      } catch (error) {
        console.error('处理 start 事件错误:', error)
        socket.emit('error', {
          message: error.message || '初始化失败'
        })
      }
    })

    // 监听客户端的 'audio' 事件
    socket.on('audio', async (data) => {
      try {
        if (!recognition) {
          socket.emit('error', { message: '识别服务未初始化' })
          return
        }

        // 解码Base64音频数据
        const audioData = Buffer.from(data.data, 'base64')
        audioSize += audioData.length

        // 发送到腾讯云（等待连接建立）
        await recognition.send(audioData, data.isEnd || false)

        // 如果是最后一帧，发送完成消息
        if (data.isEnd) {
          console.log('音频发送完成，总大小:', audioSize)
        }
      } catch (error) {
        console.error('处理 audio 事件错误:', error)
        socket.emit('error', {
          message: error.message || '处理音频失败'
        })
      }
    })

    // 监听客户端的 'stop' 事件
    socket.on('stop', () => {
      try {
        if (recognition) {
          recognition.close()
          recognition = null
        }

        socket.emit('stopped', {
          message: '识别已停止',
          logId: voiceLogId,
          text: recognizedText,
          audioSize: audioSize,
          duration: Date.now() - startTime
        })
      } catch (error) {
        console.error('处理 stop 事件错误:', error)
        socket.emit('error', {
          message: error.message || '停止失败'
        })
      }
    })

    // 监听断开连接
    socket.on('disconnect', () => {
      console.log('Socket.IO 客户端已断开:', socket.id)
      if (recognition) {
        recognition.close()
        recognition = null
      }
    })
  })

  console.log('Socket.IO 实时语音识别服务初始化完成')
}

/**
 * 保存识别记录到数据库
 */
async function saveRecognitionLog(userId, text, audioSize, options) {
  try {
    const result = await query(
      `INSERT INTO voice_recognition_logs 
        (user_id, audio_size, recognized_text, recognition_type, options, created_at) 
       VALUES (?, ?, ?, ?, ?, NOW())`,
      [userId, audioSize, text, 'stream', JSON.stringify(options)]
    )
    return result.insertId
  } catch (error) {
    console.error('保存识别记录错误:', error)
    throw error
  }
}

/**
 * 获取识别历史记录
 * GET /api/realtime-voice/history
 */
router.get('/history', authenticate, async (req, res) => {
  try {
    const userId = req.userId
    const page = parseInt(req.query.page) || 1
    const pageSize = parseInt(req.query.pageSize) || 20
    const offset = (page - 1) * pageSize

    // 确保参数是整数类型
    const limitValue = Math.max(1, Math.floor(Number(pageSize))) || 20
    const offsetValue = Math.max(0, Math.floor(Number(offset)))

    // 查询识别历史
    // 使用 LIMIT offset, count 格式，可能更兼容某些 MySQL 版本
    const logs = await query(
      `SELECT 
        id,
        audio_size,
        recognized_text,
        audio_time,
        recognition_type,
        created_at
       FROM voice_recognition_logs
       WHERE user_id = ?
       ORDER BY created_at DESC
       LIMIT ?, ?`,
      [userId, offsetValue, limitValue]
    )

    // 查询总数
    const countResults = await query(
      'SELECT COUNT(*) as total FROM voice_recognition_logs WHERE user_id = ?',
      [userId]
    )

    const countResult = countResults && countResults.length > 0 ? countResults[0] : { total: 0 }

    return success(res, {
      list: logs.map(log => ({
        id: log.id,
        audioSize: log.audio_size,
        recognizedText: log.recognized_text,
        audioTime: log.audio_time,
        recognitionType: log.recognition_type,
        createdAt: log.created_at
      })),
      pagination: {
        page,
        pageSize,
        total: countResult.total || 0
      }
    })

  } catch (error) {
    console.error('获取识别历史错误:', error)
    console.error('错误详情:', {
      message: error.message,
      sqlMessage: error.sqlMessage,
      sqlState: error.sqlState,
      sql: error.sql,
      userId: req.userId,
      page: req.query.page,
      pageSize: req.query.pageSize
    })
    return serverError(res, '获取历史记录失败：' + (error.sqlMessage || error.message))
  }
})

/**
 * 删除识别记录
 * DELETE /api/realtime-voice/history/:id
 */
router.delete('/history/:id', authenticate, async (req, res) => {
  try {
    const userId = req.userId
    const { id } = req.params

    // 查询记录是否存在且属于当前用户
    const logs = await query(
      'SELECT id FROM voice_recognition_logs WHERE id = ? AND user_id = ?',
      [id, userId]
    )

    if (logs.length === 0) {
      return badRequest(res, '记录不存在')
    }

    // 删除记录
    await query('DELETE FROM voice_recognition_logs WHERE id = ?', [id])

    return success(res, null, '删除成功')

  } catch (error) {
    console.error('删除识别记录错误:', error)
    return serverError(res, '删除失败')
  }
})

/**
 * 获取识别统计信息
 * GET /api/realtime-voice/stats
 */
router.get('/stats', authenticate, async (req, res) => {
  try {
    const userId = req.userId

    // 查询统计信息
    const [stats] = await query(
      `SELECT 
        COUNT(*) as totalCount,
        SUM(audio_size) as totalAudioSize,
        SUM(audio_time) as totalAudioTime,
        COUNT(CASE WHEN DATE(created_at) = CURDATE() THEN 1 END) as todayCount,
        COUNT(CASE WHEN YEARWEEK(created_at) = YEARWEEK(NOW()) THEN 1 END) as weekCount,
        COUNT(CASE WHEN YEAR(created_at) = YEAR(NOW()) AND MONTH(created_at) = MONTH(NOW()) THEN 1 END) as monthCount
       FROM voice_recognition_logs
       WHERE user_id = ?`,
      [userId]
    )

    return success(res, {
      totalCount: stats.totalCount || 0,
      totalAudioSize: stats.totalAudioSize || 0,
      totalAudioTime: stats.totalAudioTime || 0,
      todayCount: stats.todayCount || 0,
      weekCount: stats.weekCount || 0,
      monthCount: stats.monthCount || 0
    })

  } catch (error) {
    console.error('获取识别统计错误:', error)
    return serverError(res, '获取统计信息失败')
  }
})

// 导出路由和初始化函数
module.exports = {
  router,
  initSocketIO
}

