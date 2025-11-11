const express = require('express')
const router = express.Router()
const multer = require('multer')
const FormData = require('form-data')
const axios = require('axios')
const fs = require('fs')
const path = require('path')
const { success, badRequest, serverError, notFound } = require('../utils/response')
const { query } = require('../config/database')
const { authenticate } = require('../middleware/auth')
const { randomString } = require('../utils/crypto')
const config = require('../config')

// 确保上传目录存在
const uploadsDir = path.join(__dirname, '../public/uploads')
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true })
  console.log('创建上传目录:', uploadsDir)
}

// 配置multer使用内存存储（流式上传）
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 20 * 1024 * 1024 // 20MB限制
  }
})

/**
 * 上传文件到豆包（流式上传）
 * POST /api/file-upload/doubao
 * 
 * 请求参数（FormData）:
 * - file: 文件对象（必填）
 * - fileName: 文件名（可选，默认使用原文件名）
 * - fileType: 文件类型（可选，默认document）
 * - fileSize: 文件大小（可选，自动获取）
 */
router.post('/doubao', authenticate, upload.single('file'), async (req, res) => {
  try {
    const userId = req.userId
    const file = req.file
    const { fileName, fileType } = req.body

    // 参数验证
    if (!file) {
      return badRequest(res, '文件不能为空')
    }

    // 文件大小验证
    if (file.size > 20 * 1024 * 1024) {
      return badRequest(res, '文件大小不能超过20MB')
    }

    // 文件类型验证
    const allowedTypes = ['image', 'document', 'video']
    const finalFileType = fileType || 'document'
    if (!allowedTypes.includes(finalFileType)) {
      return badRequest(res, '文件类型必须是：image/document/video')
    }

    // 生成文件ID
    const fileId = 'file_' + Date.now() + '_' + randomString(8)
    const finalFileName = fileName || file.originalname || '未命名文件'
    
    // 获取文件扩展名
    const fileExt = path.extname(finalFileName) || ''
    const localFileName = fileId + fileExt
    const localFilePath = path.join(uploadsDir, localFileName)

    console.log(`开始上传文件到豆包: ${finalFileName}, 大小: ${file.size} 字节`)

    // 流式上传到豆包
    let doubaoFileId = ''
    let doubaoFileUrl = '' // 豆包返回的文件URL（如果有）
    try {
      const doubaoResult = await uploadToDoubao(file.buffer, finalFileName)
      doubaoFileId = doubaoResult.id || doubaoResult.fileId || ''
      doubaoFileUrl = doubaoResult.url || doubaoResult.fileUrl || ''
      console.log(`文件上传到豆包成功，豆包文件ID: ${doubaoFileId}`)
      if (doubaoFileUrl) {
        console.log(`豆包返回文件URL: ${doubaoFileUrl}`)
      }
    } catch (error) {
      console.error('上传到豆包失败:', error.message)
      // 如果豆包上传失败，仍然保存文件记录，但doubao_file_id为空
      // 这样用户可以在后续重试
    }

    // 保存文件到本地
    fs.writeFileSync(localFilePath, file.buffer)
    console.log(`文件已保存到本地: ${localFilePath}`)

    // 生成文件URL
    // 优先使用豆包返回的URL，如果没有则使用本地存储URL
    const fileUrl = doubaoFileUrl || `${config.server.domain || 'http://localhost'}/uploads/${localFileName}`

    // 保存文件信息到数据库
    await query(
      `INSERT INTO file_uploads 
        (file_id, user_id, file_name, file_type, file_size, file_url, doubao_file_id, upload_time) 
       VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
      [fileId, userId, finalFileName, finalFileType, file.size, fileUrl, doubaoFileId]
    )

    return success(res, {
      fileId,
      fileUrl,
      fileName: finalFileName,
      fileType: finalFileType,
      fileSize: file.size,
      uploadTime: new Date().toISOString()
    }, '上传成功')

  } catch (error) {
    console.error('文件上传错误:', error)
    return serverError(res, '文件上传失败：' + error.message)
  }
})

/**
 * 流式上传文件到豆包AI
 * @param {Buffer} fileBuffer - 文件缓冲区
 * @param {string} fileName - 文件名
 * @returns {Promise<Object>} 豆包文件信息 {id, url?}
 */
async function uploadToDoubao(fileBuffer, fileName) {
  // 检查豆包API配置
  if (!config.doubao.apiKey) {
    throw new Error('豆包API Key未配置')
  }

  // 创建FormData
  const form = new FormData()
  form.append('file', fileBuffer, {
    filename: fileName,
    contentType: getContentType(fileName)
  })

  // 调用豆包文件上传API
  console.log(`[豆包上传] 请求URL: ${config.doubao.apiUrl}/files`)
  console.log(`[豆包上传] 文件名: ${fileName}`)
  console.log(`[豆包上传] 文件大小: ${fileBuffer.length} 字节`)
  
  const response = await axios.post(
    `${config.doubao.apiUrl}/files`,
    form,
    {
      headers: {
        ...form.getHeaders(),
        'Authorization': `Bearer ${config.doubao.apiKey}`
      },
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
      timeout: 60000 // 60秒超时
    }
  )

  // 打印豆包API的完整响应数据
  console.log('[豆包上传] 豆包API完整响应数据:')
  console.log(JSON.stringify(response.data, null, 2))
  console.log('[豆包上传] 响应状态码:', response.status)
  console.log('[豆包上传] 响应头:', JSON.stringify(response.headers, null, 2))

  // 解析响应
  if (response.data) {
    const fileId = response.data.id || response.data.fileId || response.data.file_id
    const fileUrl = response.data.url || response.data.fileUrl || response.data.file_url || ''
    
    console.log(`[豆包上传] 解析后的文件ID: ${fileId}`)
    if (fileUrl) {
      console.log(`[豆包上传] 解析后的文件URL: ${fileUrl}`)
    } else {
      console.log(`[豆包上传] 豆包未返回文件URL`)
    }
    
    // 返回文件ID和可能的URL
    return {
      id: fileId,
      url: fileUrl
    }
  } else {
    throw new Error('豆包API响应格式异常：' + JSON.stringify(response.data))
  }
}

/**
 * 根据文件名获取Content-Type
 * @param {string} fileName - 文件名
 * @returns {string} Content-Type
 */
function getContentType(fileName) {
  const ext = fileName.split('.').pop().toLowerCase()
  const contentTypes = {
    // 图片
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'webp': 'image/webp',
    // 文档
    'pdf': 'application/pdf',
    'doc': 'application/msword',
    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'xls': 'application/vnd.ms-excel',
    'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'ppt': 'application/vnd.ms-powerpoint',
    'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'txt': 'text/plain',
    'md': 'text/markdown',
    // 视频
    'mp4': 'video/mp4',
    'avi': 'video/x-msvideo',
    'mov': 'video/quicktime',
    'wmv': 'video/x-ms-wmv'
  }
  return contentTypes[ext] || 'application/octet-stream'
}

/**
 * 获取用户上传的文件列表
 * GET /api/file-upload/list
 * 
 * 请求参数:
 * - page: 页码，默认1
 * - pageSize: 每页数量，默认20
 */
router.get('/list', authenticate, async (req, res) => {
  try {
    const userId = req.userId
    const page = parseInt(req.query.page) || 1
    const pageSize = parseInt(req.query.pageSize) || 20
    const offset = (page - 1) * pageSize

    // 查询文件列表
    const files = await query(
      `SELECT 
        file_id,
        file_name,
        file_type,
        file_size,
        file_url,
        doubao_file_id,
        upload_time
       FROM file_uploads
       WHERE user_id = ?
       ORDER BY upload_time DESC
       LIMIT ? OFFSET ?`,
      [userId, pageSize, offset]
    )

    // 查询总数
    const countResult = await query(
      'SELECT COUNT(*) as total FROM file_uploads WHERE user_id = ?',
      [userId]
    )

    // 转换为驼峰命名
    const list = files.map(file => ({
      fileId: file.file_id,
      fileName: file.file_name,
      fileType: file.file_type,
      fileSize: file.file_size,
      fileUrl: file.file_url,
      doubaoFileId: file.doubao_file_id,
      uploadTime: file.upload_time
    }))

    return success(res, {
      total: countResult[0]?.total || 0,
      page,
      pageSize,
      list
    })

  } catch (error) {
    console.error('获取文件列表错误:', error)
    return serverError(res, '获取文件列表失败')
  }
})

/**
 * 获取文件（下载/访问）
 * GET /api/file-upload/:fileId
 */
router.get('/:fileId', authenticate, async (req, res) => {
  try {
    const userId = req.userId
    const { fileId } = req.params

    // 查询文件信息
    const files = await query(
      'SELECT * FROM file_uploads WHERE file_id = ? AND user_id = ?',
      [fileId, userId]
    )

    if (files.length === 0) {
      return notFound(res, '文件不存在')
    }

    const file = files[0]
    
    // 如果文件URL是本地存储的，直接返回文件
    if (file.file_url && file.file_url.includes('/uploads/')) {
      const fileName = file.file_url.split('/uploads/')[1]
      const filePath = path.join(uploadsDir, fileName)
      
      if (fs.existsSync(filePath)) {
        // 设置响应头
        res.setHeader('Content-Type', getContentType(file.file_name))
        res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(file.file_name)}"`)
        // 返回文件
        return res.sendFile(path.resolve(filePath))
      }
    }

    // 如果是豆包URL，返回重定向或URL
    return success(res, {
      fileUrl: file.file_url,
      fileName: file.file_name,
      fileType: file.file_type,
      fileSize: file.file_size
    }, '文件信息')

  } catch (error) {
    console.error('获取文件错误:', error)
    return serverError(res, '获取文件失败')
  }
})

/**
 * 删除文件
 * DELETE /api/file-upload/:fileId
 */
router.delete('/:fileId', authenticate, async (req, res) => {
  try {
    const userId = req.userId
    const { fileId } = req.params

    // 查询文件是否存在
    const files = await query(
      'SELECT * FROM file_uploads WHERE file_id = ? AND user_id = ?',
      [fileId, userId]
    )

    if (files.length === 0) {
      return badRequest(res, '文件不存在')
    }

    const file = files[0]

    // 删除本地文件（如果存在）
    if (file.file_url && file.file_url.includes('/uploads/')) {
      const fileName = file.file_url.split('/uploads/')[1]
      const filePath = path.join(uploadsDir, fileName)
      
      if (fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath)
          console.log(`已删除本地文件: ${filePath}`)
        } catch (error) {
          console.error('删除本地文件失败:', error.message)
          // 继续删除数据库记录，即使本地文件删除失败
        }
      }
    }

    // 删除文件记录
    await query(
      'DELETE FROM file_uploads WHERE file_id = ? AND user_id = ?',
      [fileId, userId]
    )

    return success(res, null, '删除成功')

  } catch (error) {
    console.error('删除文件错误:', error)
    return serverError(res, '删除文件失败')
  }
})

module.exports = router

