const express = require('express')
const router = express.Router()
const axios = require('axios')
const NodeCache = require('node-cache')
const { authenticate } = require('../../middleware/auth')
const { success, badRequest, serverError } = require('../../utils/response')

// 创建缓存实例，5分钟过期
const weatherCache = new NodeCache({ stdTTL: 300 })

/**
 * 获取当前气象信息
 * GET /api/v1/weather/current
 * 
 * 请求参数:
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
router.get('/current', authenticate, async (req, res) => {
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

    // 生成缓存key（保留2位小数，相近位置共享缓存）
    const cacheKey = `weather_${lat.toFixed(2)}_${lng.toFixed(2)}`

    // 检查缓存
    const cached = weatherCache.get(cacheKey)
    if (cached) {
      console.log('气象数据来自缓存:', cacheKey)
      return success(res, cached, '操作成功（缓存）')
    }

    // 尝试调用和风天气API
    const apiKey = process.env.QWEATHER_API_KEY
    let weatherData = null
    
    if (apiKey) {
      try {
        // 和风天气API需要的location格式：经度,纬度
        const location = `${lng},${lat}`

        console.log('尝试调用和风天气API:', { location, lat, lng })

        // 并发请求实时天气和3天预报
        const [nowRes, forecastRes] = await Promise.all([
          axios.get('https://devapi.qweather.com/v7/weather/now', {
            params: {
              location: location,
              key: apiKey,
              lang: 'zh'
            },
            timeout: 5000
          }),
          axios.get('https://devapi.qweather.com/v7/weather/3d', {
            params: {
              location: location,
              key: apiKey,
              lang: 'zh'
            },
            timeout: 5000
          })
        ])

        // 检查API返回状态
        if (nowRes.data.code === '200' && forecastRes.data.code === '200') {
          // 解析天气数据
          const now = nowRes.data.now
          const forecast = forecastRes.data.daily[0]

          weatherData = {
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
          
          console.log('和风天气API调用成功')
        }
      } catch (apiError) {
        console.warn('和风天气API调用失败，将使用模拟数据:', apiError.message)
      }
    }
    
    // 如果和风天气API失败或未配置，使用模拟数据
    if (!weatherData) {
      console.log('使用模拟气象数据')
      
      // 根据纬度生成合理的温度范围
      const baseTemp = 20 - Math.abs(lat - 30) / 3 // 纬度越高温度越低
      const minTemp = Math.round(baseTemp - 5)
      const maxTemp = Math.round(baseTemp + 5)
      const currentTemp = Math.round(baseTemp)
      
      // 天气类型列表
      const weatherTypes = ['晴', '多云', '阴', '小雨', '中雨']
      const weatherType = weatherTypes[Math.floor(Math.random() * weatherTypes.length)]
      
      const windDir = ['北风', '东北风', '东风', '东南风', '南风', '西南风', '西风', '西北风'][Math.floor(Math.random() * 8)]
      const windScale = Math.floor(Math.random() * 4) + 1
      
      weatherData = {
        // 完整气象字符串：天气 雨 · 气温: 25-31 · 风向: 东 · 风力: 4
        weather: `天气 ${weatherType} · 气温: ${minTemp}-${maxTemp} · 风向: ${windDir} · 风力: ${windScale}`,
        // 单独字段（方便前端使用）
        weatherText: weatherType,
        temperature: currentTemp,
        temperatureMin: minTemp,
        temperatureMax: maxTemp,
        humidity: Math.floor(Math.random() * 40) + 40, // 40-80%
        windDirection: windDir,
        windScale: `${windScale}`,
        updateTime: new Date().toISOString(),
        isMock: true
      }
    }

    // 存入缓存
    weatherCache.set(cacheKey, weatherData)
    console.log('气象数据已缓存:', cacheKey)

    return success(res, weatherData, '操作成功')

  } catch (error) {
    console.error('气象服务错误:', error.message)
    return serverError(res, error.message || '气象服务异常')
  }
})

/**
 * 获取气象缓存统计
 * GET /api/v1/weather/stats
 * 
 * 仅用于调试，查看缓存使用情况
 */
router.get('/stats', authenticate, async (req, res) => {
  try {
    const stats = weatherCache.getStats()
    const keys = weatherCache.keys()

    return success(res, {
      cacheSize: keys.length,
      stats: stats,
      keys: keys
    }, '操作成功')
  } catch (error) {
    console.error('获取缓存统计错误:', error)
    return serverError(res, '获取统计信息失败')
  }
})

module.exports = router

