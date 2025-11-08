/**
 * 天气路由
 * 
 * 提供和风天气 API 接口
 */

const express = require('express')
const router = express.Router()
const { success, badRequest, serverError } = require('../utils/response')
const {
  getWeatherNow,
  getWeatherDaily,
  getWeatherHourly,
  getWeatherIndices,
  getAirQuality,
  searchCity,
  getWeatherWarning,
  getWeatherComprehensive
} = require('../utils/qweather')

/**
 * 获取当前气象信息（兼容接口）
 * GET /api/weather/current
 * 
 * 查询参数:
 * - latitude: 纬度
 * - longitude: 经度
 * 
 * 返回数据:
 * - weather: 气象信息字符串（格式：晴，15-25℃）
 * - weatherText: 天气描述
 * - temperature: 当前温度
 * - temperatureMin: 最低温度
 * - temperatureMax: 最高温度
 * - humidity: 湿度
 * - windDirection: 风向
 * - windScale: 风力等级
 * - updateTime: 更新时间
 */
router.get('/current', async (req, res) => {
  try {
    const { latitude, longitude } = req.query

    // 参数验证
    if (!latitude || !longitude) {
      return badRequest(res, '经纬度参数不能为空')
    }

    const lat = parseFloat(latitude)
    const lng = parseFloat(longitude)

    if (isNaN(lat) || isNaN(lng)) {
      return badRequest(res, '经纬度参数格式不正确')
    }

    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return badRequest(res, '经纬度参数超出有效范围')
    }

    // 和风天气API需要的location格式：经度,纬度
    const location = `${lng},${lat}`

    // 并发请求实时天气和3天预报
    const [nowResult, dailyResult] = await Promise.all([
      getWeatherNow(location),
      getWeatherDaily(location, 3)
    ])

    if (!nowResult.success) {
      return serverError(res, nowResult.error || '获取实时天气失败')
    }

    if (!dailyResult.success) {
      return serverError(res, dailyResult.error || '获取天气预报失败')
    }

    // 组合数据
    const now = nowResult.data
    const forecast = dailyResult.data[0]

    const weatherData = {
      // 完整气象字符串：天气 雨 · 气温: 25-31 · 风向: 东 · 风力: 4
      weather: `天气 ${now.text} · 气温: ${forecast.tempMin}-${forecast.tempMax} · 风向: ${now.windDir} · 风力: ${now.windScale}`,
      // 单独字段（方便前端使用）
      weatherText: now.text,
      temperature: parseFloat(now.temp),
      temperatureMin: parseFloat(forecast.tempMin),
      temperatureMax: parseFloat(forecast.tempMax),
      humidity: parseFloat(now.humidity),
      windDirection: now.windDir,
      windScale: now.windScale,
      updateTime: now.obsTime
    }

    return success(res, weatherData, '获取气象信息成功')
  } catch (error) {
    console.error('获取气象信息错误:', error)
    return serverError(res, error.message || '获取气象信息失败')
  }
})

/**
 * 获取实时天气
 * GET /api/weather/now
 * 
 * 查询参数:
 * - location: 位置 (经纬度 "116.41,39.92" 或 城市ID "101010100")
 * 
 * 返回数据:
 * - temp: 温度
 * - text: 天气状况
 * - icon: 天气图标代码
 * - humidity: 相对湿度
 * - windDir: 风向
 * - windScale: 风力等级
 * 等等
 */
router.get('/now', async (req, res) => {
  try {
    const { location } = req.query

    // 参数验证
    if (!location) {
      return badRequest(res, '缺少位置参数')
    }

    // 调用和风天气 API
    const result = await getWeatherNow(location)

    if (result.success) {
      return success(res, result, '获取实时天气成功')
    } else {
      return serverError(res, result.error)
    }
  } catch (error) {
    console.error('获取实时天气错误:', error)
    return serverError(res, '获取实时天气失败')
  }
})

/**
 * 获取逐天天气预报
 * GET /api/weather/daily
 * 
 * 查询参数:
 * - location: 位置
 * - days: 预报天数 (3/7/10/15/30，默认7天)
 * 
 * 返回数据:
 * - 每天的天气预报数组
 */
router.get('/daily', async (req, res) => {
  try {
    const { location, days } = req.query

    // 参数验证
    if (!location) {
      return badRequest(res, '缺少位置参数')
    }

    const dayCount = parseInt(days) || 7
    const validDays = [3, 7, 10, 15, 30]

    if (!validDays.includes(dayCount)) {
      return badRequest(res, '预报天数必须是 3/7/10/15/30 之一')
    }

    // 调用和风天气 API
    const result = await getWeatherDaily(location, dayCount)

    if (result.success) {
      return success(res, result, '获取天气预报成功')
    } else {
      return serverError(res, result.error)
    }
  } catch (error) {
    console.error('获取天气预报错误:', error)
    return serverError(res, '获取天气预报失败')
    }
})

/**
 * 获取逐小时天气预报
 * GET /api/weather/hourly
 * 
 * 查询参数:
 * - location: 位置
 * - hours: 预报小时数 (24/72/168，默认24小时)
 * 
 * 返回数据:
 * - 每小时的天气预报数组
 */
router.get('/hourly', async (req, res) => {
      try {
    const { location, hours } = req.query

    // 参数验证
    if (!location) {
      return badRequest(res, '缺少位置参数')
    }

    const hourCount = parseInt(hours) || 24
    const validHours = [24, 72, 168]
    
    if (!validHours.includes(hourCount)) {
      return badRequest(res, '预报小时数必须是 24/72/168 之一')
    }

    // 调用和风天气 API
    const result = await getWeatherHourly(location, hourCount)

    if (result.success) {
      return success(res, result, '获取逐小时天气成功')
    } else {
      return serverError(res, result.error)
    }
  } catch (error) {
    console.error('获取逐小时天气错误:', error)
    return serverError(res, '获取逐小时天气失败')
  }
})

/**
 * 获取天气生活指数
 * GET /api/weather/indices
 * 
 * 查询参数:
 * - location: 位置
 * - type: 指数类型 (0=全部, 1=运动, 2=洗车, 3=穿衣, 4=钓鱼, 5=紫外线, 6=旅游, 7=花粉过敏, 8=舒适度, 9=感冒, 10=空气污染扩散, 11=空调开启, 12=太阳镜, 13=化妆, 14=晾晒, 15=交通, 16=防晒)
 * 
 * 返回数据:
 * - 生活指数数组
 */
router.get('/indices', async (req, res) => {
  try {
    const { location, type } = req.query

    // 参数验证
    if (!location) {
      return badRequest(res, '缺少位置参数')
    }

    const indexType = type || '0'

    // 调用和风天气 API
    const result = await getWeatherIndices(location, indexType)

    if (result.success) {
      return success(res, result, '获取生活指数成功')
    } else {
      return serverError(res, result.error)
    }
  } catch (error) {
    console.error('获取生活指数错误:', error)
    return serverError(res, '获取生活指数失败')
  }
})

/**
 * 获取空气质量
 * GET /api/weather/air
 * 
 * 查询参数:
 * - location: 位置
 * 
 * 返回数据:
 * - aqi: 空气质量指数
 * - category: 空气质量类别
 * - pm2p5: PM2.5浓度
 * - pm10: PM10浓度
 * 等等
 */
router.get('/air', async (req, res) => {
  try {
    const { location } = req.query

    // 参数验证
    if (!location) {
      return badRequest(res, '缺少位置参数')
    }

    // 调用和风天气 API
    const result = await getAirQuality(location)

    if (result.success) {
      return success(res, result, '获取空气质量成功')
    } else {
      return serverError(res, result.error)
        }
  } catch (error) {
    console.error('获取空气质量错误:', error)
    return serverError(res, '获取空气质量失败')
      }
})

/**
 * 城市搜索
 * GET /api/weather/city/search
 * 
 * 查询参数:
 * - location: 城市名称或关键词 (如 "北京" 或 "beijing")
 * 
 * 返回数据:
 * - 城市信息数组，包含城市ID、名称、经纬度等
 */
router.get('/city/search', async (req, res) => {
  try {
    const { location } = req.query

    // 参数验证
    if (!location) {
      return badRequest(res, '缺少搜索关键词')
    }

    // 调用和风天气 API
    const result = await searchCity(location)

    if (result.success) {
      return success(res, result, '城市搜索成功')
    } else {
      return serverError(res, result.error)
    }
  } catch (error) {
    console.error('城市搜索错误:', error)
    return serverError(res, '城市搜索失败')
  }
})

/**
 * 获取天气预警
 * GET /api/weather/warning
 * 
 * 查询参数:
 * - location: 位置（城市ID）
 * 
 * 返回数据:
 * - 天气预警信息数组
 */
router.get('/warning', async (req, res) => {
  try {
    const { location } = req.query

    // 参数验证
    if (!location) {
      return badRequest(res, '缺少位置参数')
    }

    // 调用和风天气 API
    const result = await getWeatherWarning(location)

    if (result.success) {
      return success(res, result, '获取天气预警成功')
    } else {
      return serverError(res, result.error)
    }
  } catch (error) {
    console.error('获取天气预警错误:', error)
    return serverError(res, '获取天气预警失败')
  }
})

/**
 * 获取综合天气信息
 * GET /api/weather/comprehensive
 * 
 * 查询参数:
 * - location: 位置
 * 
 * 返回数据:
 * - now: 实时天气
 * - daily: 7天预报
 * - hourly: 24小时预报
 * - air: 空气质量
 * - warning: 天气预警
 */
router.get('/comprehensive', async (req, res) => {
  try {
    const { location } = req.query

    // 参数验证
    if (!location) {
      return badRequest(res, '缺少位置参数')
    }

    // 调用和风天气 API
    const result = await getWeatherComprehensive(location)

    if (result.success) {
      return success(res, result, '获取综合天气信息成功')
    } else {
      return serverError(res, result.error)
    }
  } catch (error) {
    console.error('获取综合天气信息错误:', error)
    return serverError(res, '获取综合天气信息失败')
  }
})

/**
 * 调试接口 - 检查环境变量配置
 * GET /api/weather/debug-config
 * 
 * 返回数据:
 * - 环境变量配置状态
 */
router.get('/debug-config', async (req, res) => {
  try {
    const config = {
      keyId: process.env.QWEATHER_KEY_ID ? '已配置 ✅' : '未配置 ❌',
      keyIdValue: process.env.QWEATHER_KEY_ID || null,
      projectId: process.env.QWEATHER_PROJECT_ID ? '已配置 ✅' : '未配置 ❌',
      projectIdValue: process.env.QWEATHER_PROJECT_ID || null,
      privateKey: process.env.QWEATHER_PRIVATE_KEY ? '已配置 ✅' : '未配置 ❌',
      privateKeyPreview: process.env.QWEATHER_PRIVATE_KEY 
        ? process.env.QWEATHER_PRIVATE_KEY.substring(0, 50) + '...'
        : null,
      privateKeyLength: process.env.QWEATHER_PRIVATE_KEY 
        ? process.env.QWEATHER_PRIVATE_KEY.length
        : 0,
      privateKeyHasBr: process.env.QWEATHER_PRIVATE_KEY 
        ? process.env.QWEATHER_PRIVATE_KEY.includes('<br>')
        : false,
      nodeEnv: process.env.NODE_ENV || 'development'
    }

    return success(res, config, '环境变量配置状态')
  } catch (error) {
    console.error('获取配置状态错误:', error)
    return serverError(res, '获取配置状态失败')
  }
})

module.exports = router
