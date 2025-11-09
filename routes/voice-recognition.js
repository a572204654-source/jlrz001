const express = require('express')
const router = express.Router()
const multer = require('multer')
const { success, badRequest, serverError } = require('../utils/response')
const { query } = require('../config/database')
const { authenticate } = require('../middleware/auth')
const { getVoiceRecognitionService } = require('../utils/voiceRecognition')

// 配置文件上传（使用内存存储）
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 限制10MB
  },
  fileFilter: (req, file, cb) => {
    // 允许的音频格式
    const allowedTypes = [
      'audio/wav',
      'audio/mp3',
      'audio/mpeg',
      'audio/m4a',
      'audio/aac',
      'audio/ogg',
      'audio/silk',
      'audio/pcm',
      'application/octet-stream' // 微信小程序上传的格式
    ]
    
    if (allowedTypes.includes(file.mimetype) || file.originalname.match(/\.(wav|mp3|m4a|aac|ogg|silk|pcm)$/i)) {
      cb(null, true)
    } else {
      cb(new Error('不支持的音频格式'))
    }
  }
})

/**
 * 实时语音识别（上传音频文件）
 * POST /api/voice-recognition/realtime
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
router.post('/realtime', authenticate, upload.single('audio'), async (req, res) => {
  try {
    const userId = req.userId

    // 检查是否上传了文件
    if (!req.file) {
      return badRequest(res, '请上传音频文件')
    }

    const audioBuffer = req.file.buffer
    const audioSize = req.file.size

    console.log('收到实时语音识别请求:', {
      userId,
      fileName: req.file.originalname,
      mimeType: req.file.mimetype,
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

    // 调用实时语音识别服务
    const voiceService = getVoiceRecognitionService()
    const result = await voiceService.recognizeFileWithRealtime(audioBuffer, options)

    // 保存识别记录到数据库
    const insertResult = await query(
      `INSERT INTO voice_recognition_logs 
        (user_id, audio_size, recognized_text, audio_time, recognition_type, options, created_at) 
       VALUES (?, ?, ?, ?, ?, ?, NOW())`,
      [
        userId,
        audioSize,
        result.text || '',
        result.audioTime || 0,
        'realtime',
        JSON.stringify(options)
      ]
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
 * 一句话识别（快速识别短语音）
 * POST /api/voice-recognition/sentence
 * 
 * 适用于60秒以内的短语音
 */
router.post('/sentence', authenticate, upload.single('audio'), async (req, res) => {
  try {
    const userId = req.userId

    if (!req.file) {
      return badRequest(res, '请上传音频文件')
    }

    const audioBuffer = req.file.buffer
    const audioSize = req.file.size

    // 检查音频大小（短语音应该较小）
    if (audioSize > 2 * 1024 * 1024) {
      return badRequest(res, '音频文件过大，请使用长语音识别接口')
    }

    console.log('收到一句话识别请求:', {
      userId,
      fileName: req.file.originalname,
      size: audioSize
    })

    const options = {
      engineType: req.body.engineType || '16k_zh',
      filterDirty: parseInt(req.body.filterDirty) || 0,
      convertNumMode: parseInt(req.body.convertNumMode) || 1
    }

    const voiceService = getVoiceRecognitionService()
    const result = await voiceService.recognizeFile(audioBuffer, options)

    // 保存识别记录
    await query(
      `INSERT INTO voice_recognition_logs 
        (user_id, audio_size, recognized_text, audio_time, recognition_type, created_at) 
       VALUES (?, ?, ?, ?, ?, NOW())`,
      [userId, audioSize, result.text || '', result.audioTime || 0, 'sentence']
    )

    return success(res, {
      text: result.text,
      audioTime: result.audioTime
    }, '识别成功')

  } catch (error) {
    console.error('一句话识别错误:', error)
    return serverError(res, error.message || '语音识别失败')
  }
})

/**
 * 长语音识别（异步任务）
 * POST /api/voice-recognition/long
 * 
 * 请求参数:
 * - audioUrl: 音频文件URL（必填）
 * - engineType: 识别引擎类型（可选）
 */
router.post('/long', authenticate, async (req, res) => {
  try {
    const userId = req.userId
    const { audioUrl, engineType = '16k_zh' } = req.body

    if (!audioUrl) {
      return badRequest(res, '请提供音频文件URL')
    }

    console.log('创建长语音识别任务:', { userId, audioUrl })

    const options = {
      engineType,
      filterDirty: parseInt(req.body.filterDirty) || 0,
      convertNumMode: parseInt(req.body.convertNumMode) || 1
    }

    const voiceService = getVoiceRecognitionService()
    const result = await voiceService.recognizeLongAudio(audioUrl, options)

    // 保存任务记录
    await query(
      `INSERT INTO voice_recognition_tasks 
        (user_id, task_id, audio_url, status, options, created_at) 
       VALUES (?, ?, ?, ?, ?, NOW())`,
      [userId, result.taskId, audioUrl, 'pending', JSON.stringify(options)]
    )

    return success(res, {
      taskId: result.taskId,
      requestId: result.requestId
    }, '任务创建成功')

  } catch (error) {
    console.error('创建长语音识别任务错误:', error)
    return serverError(res, error.message || '任务创建失败')
  }
})

/**
 * 查询长语音识别结果
 * GET /api/voice-recognition/long/:taskId
 * 
 * 返回识别状态和结果
 */
router.get('/long/:taskId', authenticate, async (req, res) => {
  try {
    const userId = req.userId
    const { taskId } = req.params

    // 查询任务记录
    const tasks = await query(
      'SELECT * FROM voice_recognition_tasks WHERE task_id = ? AND user_id = ?',
      [taskId, userId]
    )

    if (tasks.length === 0) {
      return badRequest(res, '任务不存在')
    }

    const voiceService = getVoiceRecognitionService()
    const result = await voiceService.queryLongAudioResult(parseInt(taskId))

    // 更新任务状态
    const statusMap = {
      0: 'pending',
      1: 'processing',
      2: 'success',
      3: 'failed'
    }

    await query(
      `UPDATE voice_recognition_tasks 
       SET status = ?, result_text = ?, error_msg = ?, updated_at = NOW() 
       WHERE task_id = ?`,
      [
        statusMap[result.status] || 'unknown',
        result.result || '',
        result.errorMsg || '',
        taskId
      ]
    )

    return success(res, {
      taskId,
      status: result.status,
      statusStr: result.statusStr,
      result: result.result,
      errorMsg: result.errorMsg,
      resultDetail: result.resultDetail
    })

  } catch (error) {
    console.error('查询长语音识别结果错误:', error)
    return serverError(res, error.message || '查询失败')
  }
})

/**
 * 微信小程序语音识别（支持silk格式）
 * POST /api/voice-recognition/wechat
 * 
 * 专门处理微信小程序的录音格式
 */
router.post('/wechat', authenticate, upload.single('audio'), async (req, res) => {
  try {
    const userId = req.userId

    if (!req.file) {
      return badRequest(res, '请上传音频文件')
    }

    const audioBuffer = req.file.buffer
    const audioSize = req.file.size

    console.log('收到微信小程序语音识别请求:', {
      userId,
      fileName: req.file.originalname,
      size: audioSize
    })

    const voiceService = getVoiceRecognitionService()
    
    // 使用专门的微信语音处理方法
    const result = await voiceService.recognizeWechatSilk(audioBuffer)

    // 保存识别记录
    await query(
      `INSERT INTO voice_recognition_logs 
        (user_id, audio_size, recognized_text, audio_time, recognition_type, created_at) 
       VALUES (?, ?, ?, ?, ?, NOW())`,
      [userId, audioSize, result.text || '', result.audioTime || 0, 'wechat']
    )

    return success(res, {
      text: result.text,
      audioTime: result.audioTime
    }, '识别成功')

  } catch (error) {
    console.error('微信语音识别错误:', error)
    return serverError(res, error.message || '语音识别失败')
  }
})

/**
 * 获取识别历史记录
 * GET /api/voice-recognition/history
 * 
 * 请求参数:
 * - page: 页码
 * - pageSize: 每页数量
 */
router.get('/history', authenticate, async (req, res) => {
  try {
    const userId = req.userId
    const page = parseInt(req.query.page) || 1
    const pageSize = parseInt(req.query.pageSize) || 20
    const offset = (page - 1) * pageSize

    // 查询识别历史
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
       LIMIT ? OFFSET ?`,
      [userId, pageSize, offset]
    )

    // 查询总数
    const [countResult] = await query(
      'SELECT COUNT(*) as total FROM voice_recognition_logs WHERE user_id = ?',
      [userId]
    )

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
        total: countResult.total
      }
    })

  } catch (error) {
    console.error('获取识别历史错误:', error)
    console.error('错误堆栈:', error.stack)
    // 如果是数据库表不存在，返回更明确的错误信息
    if (error.code === 'ER_NO_SUCH_TABLE' || error.message.includes('doesn\'t exist')) {
      return serverError(res, '数据库表不存在，请先执行初始化脚本: scripts/init-voice-recognition-tables.sql')
    }
    return serverError(res, error.message || '获取历史记录失败')
  }
})

/**
 * 删除识别记录
 * DELETE /api/voice-recognition/history/:id
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
 * GET /api/voice-recognition/stats
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

module.exports = router

