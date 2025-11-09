const express = require('express')
const router = express.Router()
const { success, serverError, unauthorized } = require('../utils/response')
const { query } = require('../config/database')
const { authenticate } = require('../middleware/auth')

/**
 * 获取用户信息
 * GET /api/user/info
 */
router.get('/info', authenticate, async (req, res) => {
  try {
    const userId = req.userId

    // 查询用户信息
    const users = await query(
      'SELECT id, openid, unionid, nickname, avatar, organization, created_at, updated_at FROM users WHERE id = ?',
      [userId]
    )

    if (users.length === 0) {
      return unauthorized(res, '用户不存在')
    }

    const user = users[0]

    // 查询统计信息
    const [projectStats] = await query(
      `SELECT COUNT(DISTINCT p.id) as projectCount
       FROM projects p 
       WHERE p.creator_id = ?`,
      [userId]
    )

    const [logStats] = await query(
      `SELECT 
        COUNT(*) as logCount,
        COUNT(CASE WHEN DATE_FORMAT(log_date, '%Y-%m') = DATE_FORMAT(NOW(), '%Y-%m') THEN 1 END) as monthLogCount
       FROM supervision_logs 
       WHERE user_id = ?`,
      [userId]
    )

    // 组装响应数据（字段使用驼峰命名）
    return success(res, {
      id: user.id,
      openid: user.openid,
      unionid: user.unionid,
      nickname: user.nickname,
      avatar: user.avatar,
      organization: user.organization,
      createdAt: user.created_at,
      updatedAt: user.updated_at,
      stats: {
        projectCount: projectStats.projectCount || 0,
        logCount: logStats.logCount || 0,
        monthLogCount: logStats.monthLogCount || 0
      }
    })

  } catch (error) {
    console.error('获取用户信息错误:', error)
    return serverError(res, '获取用户信息失败')
  }
})

/**
 * 更新用户信息
 * PUT /api/user/info
 * 
 * 请求参数:
 * - nickname: 用户昵称
 * - avatar: 用户头像URL
 * 
 * 请求头:
 * - Authorization: Bearer {token}
 * 
 * 响应格式:
 * {
 *   "code": 0,
 *   "message": "更新成功",
 *   "data": {},
 *   "timestamp": 1699200000000
 * }
 */
router.put('/info', authenticate, async (req, res) => {
  try {
    const userId = req.userId
    const { nickname, avatar } = req.body

    // 更新用户信息（只更新 nickname 和 avatar 字段）
    await query(
      `UPDATE users SET 
        nickname = COALESCE(?, nickname),
        avatar = COALESCE(?, avatar),
        updated_at = NOW()
      WHERE id = ?`,
      [nickname ?? null, avatar ?? null, userId]
    )

    return success(res, {}, '更新成功')

  } catch (error) {
    console.error('更新用户信息错误:', error)
    return serverError(res, '更新用户信息失败')
  }
})

/**
 * 获取用户参与的项目列表
 * GET /api/user/projects
 */
router.get('/projects', authenticate, async (req, res) => {
  try {
    const userId = req.userId
    const page = parseInt(req.query.page) || 1
    const pageSize = parseInt(req.query.pageSize) || 20
    const offset = (page - 1) * pageSize

    // 查询用户创建的项目
    const projects = await query(
      `SELECT 
        p.id, 
        p.project_name,
        p.project_code,
        p.organization,
        p.chief_engineer,
        p.address,
        p.start_date,
        p.end_date,
        p.created_at,
        (SELECT COUNT(*) FROM works WHERE project_id = p.id) as workCount
       FROM projects p
       WHERE p.creator_id = ?
       ORDER BY p.created_at DESC
       LIMIT ${pageSize} OFFSET ${offset}`,
      [userId]
    )

    // 转换为驼峰命名
    const list = projects.map(p => ({
      id: p.id,
      projectName: p.project_name,
      projectCode: p.project_code,
      organization: p.organization,
      chiefEngineer: p.chief_engineer,
      address: p.address,
      startDate: p.start_date,
      endDate: p.end_date,
      createdAt: p.created_at,
      workCount: p.workCount || 0
    }))

    // 查询总数
    const [countResult] = await query(
      'SELECT COUNT(*) as total FROM projects WHERE creator_id = ?',
      [userId]
    )

    return success(res, {
      total: countResult.total,
      page,
      pageSize,
      list
    })

  } catch (error) {
    console.error('获取用户项目列表错误:', error)
    return serverError(res, '获取项目列表失败')
  }
})

/**
 * 获取用户日志统计
 * GET /api/user/log-stats
 * 
 * 请求参数:
 * - month: 月份（YYYY-MM格式），可选，默认当前月
 */
router.get('/log-stats', authenticate, async (req, res) => {
  try {
    const userId = req.userId
    const month = req.query.month || new Date().toISOString().slice(0, 7) // YYYY-MM

    // 查询统计信息
    const [stats] = await query(
      `SELECT 
        COUNT(CASE WHEN DATE_FORMAT(log_date, '%Y-%m') = ? THEN 1 END) as monthCount,
        COUNT(*) as totalCount
       FROM supervision_logs 
       WHERE user_id = ?`,
      [month, userId]
    )

    return success(res, {
      monthCount: stats.monthCount || 0,
      totalCount: stats.totalCount || 0,
      submittedCount: stats.totalCount || 0,
      pendingCount: 0,
      passRate: '100%'
    })

  } catch (error) {
    console.error('获取用户日志统计错误:', error)
    return serverError(res, '获取统计信息失败')
  }
})

module.exports = router

