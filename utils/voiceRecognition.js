const axios = require('axios')
const crypto = require('crypto')
const WebSocket = require('ws')

/**
 * 腾讯云实时语音识别工具类
 * 支持WebSocket流式识别和一句话识别
 * 文档: https://cloud.tencent.com/document/product/1093/48982
 */
class VoiceRecognitionService {
  constructor() {
    // 从配置中获取腾讯云密钥
    const config = require('../config')
    this.secretId = config.tencentCloud.secretId
    this.secretKey = config.tencentCloud.secretKey
    this.appId = config.tencentCloud.appId
    this.region = config.tencentCloud.region || 'ap-guangzhou'
    
    // WebSocket实时识别配置
    this.wsHost = 'asr.cloud.tencent.com'
    this.wsPath = '/asr/v2/'
    
    // API配置（用于一句话识别）
    this.host = 'asr.tencentcloudapi.com'
    this.service = 'asr'
    this.version = '2019-06-14'
    this.algorithm = 'TC3-HMAC-SHA256'
  }

  /**
   * 生成WebSocket鉴权签名
   * 文档: https://cloud.tencent.com/document/product/1093/48982#3.-.E7.AD.BE.E5.90.8D.E7.94.9F.E6.88.90
   */
  generateWebSocketSignature(timestamp) {
    try {
      const signStr = `${this.secretId}${timestamp}`
      const signature = crypto
        .createHmac('sha1', this.secretKey)
        .update(signStr)
        .digest('base64')
      
      return signature
    } catch (error) {
      console.error('生成WebSocket签名错误:', error)
      throw new Error('签名生成失败')
    }
  }

  /**
   * 生成腾讯云API签名（用于一句话识别）
   * 参考文档: https://cloud.tencent.com/document/api/598/38504
   * @param {Object} payload - 请求体数据
   * @param {Number} timestamp - 时间戳（秒）
   * @param {String} action - API动作名称
   * @returns {String} Authorization 字符串
   */
  generateSignature(payload, timestamp, action) {
    try {
      const date = new Date(timestamp * 1000).toISOString().split('T')[0]
      
      // 1. 拼接规范请求串
      const httpRequestMethod = 'POST'
      const canonicalUri = '/'
      const canonicalQueryString = ''
      
      // 构建规范请求头（按字母顺序排序，名称小写，值去除前后空格）
      const headers = {
        'content-type': 'application/json; charset=utf-8',
        'host': this.host,
        'x-tc-action': action.toLowerCase(),
        'x-tc-region': this.region.toLowerCase(),
        'x-tc-timestamp': timestamp.toString(),
        'x-tc-version': this.version
      }
      
      // 按字母顺序排序头部
      const sortedHeaderKeys = Object.keys(headers).sort()
      const canonicalHeaders = sortedHeaderKeys
        .map(key => `${key}:${headers[key]}`)
        .join('\n') + '\n'
      
      const signedHeaders = sortedHeaderKeys.join(';')
      
      // 计算请求体哈希
      const requestPayload = JSON.stringify(payload)
      const hashedRequestPayload = crypto
        .createHash('sha256')
        .update(requestPayload)
        .digest('hex')
      
      const canonicalRequest = [
        httpRequestMethod,
        canonicalUri,
        canonicalQueryString,
        canonicalHeaders,
        signedHeaders,
        hashedRequestPayload
      ].join('\n')

      // 2. 拼接待签名字符串
      const credentialScope = `${date}/${this.service}/tc3_request`
      const hashedCanonicalRequest = crypto
        .createHash('sha256')
        .update(canonicalRequest)
        .digest('hex')
      
      const stringToSign = [
        this.algorithm,
        timestamp.toString(),
        credentialScope,
        hashedCanonicalRequest
      ].join('\n')

      // 3. 计算签名
      const kDate = crypto
        .createHmac('sha256', `TC3${this.secretKey}`)
        .update(date)
        .digest()
      
      const kService = crypto
        .createHmac('sha256', kDate)
        .update(this.service)
        .digest()
      
      const kSigning = crypto
        .createHmac('sha256', kService)
        .update('tc3_request')
        .digest()
      
      const signature = crypto
        .createHmac('sha256', kSigning)
        .update(stringToSign)
        .digest('hex')

      // 4. 拼接Authorization
      const authorization = [
        `${this.algorithm} Credential=${this.secretId}/${credentialScope}`,
        `SignedHeaders=${signedHeaders}`,
        `Signature=${signature}`
      ].join(', ')

      return authorization
    } catch (error) {
      console.error('生成签名错误:', error)
      throw new Error('签名生成失败')
    }
  }

  /**
   * 调用腾讯云API
   */
  async callApi(action, payload) {
    try {
      const timestamp = Math.floor(Date.now() / 1000)
      const authorization = this.generateSignature(payload, timestamp, action)

      const response = await axios({
        method: 'POST',
        url: `https://${this.host}`,
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Host': this.host,
          'Authorization': authorization,
          'X-TC-Action': action,
          'X-TC-Version': this.version,
          'X-TC-Timestamp': timestamp,
          'X-TC-Region': this.region
        },
        data: payload,
        timeout: 30000
      })

      if (response.data.Response && response.data.Response.Error) {
        throw new Error(response.data.Response.Error.Message)
      }

      return response.data.Response
    } catch (error) {
      // 处理 axios 错误响应
      if (error.response && error.response.data) {
        const errorData = error.response.data
        if (errorData.Response && errorData.Response.Error) {
          const errorMsg = errorData.Response.Error.Message
          const errorCode = errorData.Response.Error.Code
          console.error(`调用腾讯云API错误 [${errorCode}]:`, errorMsg)
          throw new Error(`${errorCode}: ${errorMsg}`)
        }
      }
      console.error('调用腾讯云API错误:', error.message)
      throw error
    }
  }

  /**
   * 实时语音识别（WebSocket流式）
   * @param {Object} options - 识别选项
   * @param {Function} onResult - 识别结果回调
   * @param {Function} onError - 错误回调
   * @returns {Object} 包含send和close方法的对象
   */
  createRealtimeRecognition(options = {}, onResult, onError) {
    try {
      const {
        engineType = '16k_zh', // 识别引擎
        voiceFormat = 1, // 1:pcm 4:wav 6:mp3
        needvad = 1, // 是否需要VAD
        filterDirty = 0, // 过滤脏词
        filterModal = 0, // 过滤语气词
        filterPunc = 0, // 过滤标点
        convertNumMode = 1, // 转换数字
        wordInfo = 2, // 词级别时间戳
        hotwordId = '', // 热词ID
        customizationId = '', // 自学习模型ID
        vadSilenceTime = 200 // VAD静音检测时间(ms)
      } = options

      const timestamp = Math.floor(Date.now() / 1000)
      const signature = this.generateWebSocketSignature(timestamp)
      
      // 构建WebSocket URL
      const wsUrl = `wss://${this.wsHost}${this.wsPath}${this.appId}` +
        `?engine_model_type=${engineType}` +
        `&voice_format=${voiceFormat}` +
        `&needvad=${needvad}` +
        `&filter_dirty=${filterDirty}` +
        `&filter_modal=${filterModal}` +
        `&filter_punc=${filterPunc}` +
        `&convert_num_mode=${convertNumMode}` +
        `&word_info=${wordInfo}` +
        `&hotword_id=${hotwordId}` +
        `&customization_id=${customizationId}` +
        `&vad_silence_time=${vadSilenceTime}` +
        `&secretid=${this.secretId}` +
        `&timestamp=${timestamp}` +
        `&expired=${timestamp + 86400}` +
        `&nonce=${Math.floor(Math.random() * 1000000)}` +
        `&signature=${encodeURIComponent(signature)}`

      console.log('创建WebSocket连接:', wsUrl.replace(/signature=.*/, 'signature=***'))

      const ws = new WebSocket(wsUrl)
      let voiceId = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      let isFirstFrame = true

      // 连接打开
      ws.on('open', () => {
        console.log('WebSocket连接已建立')
      })

      // 接收消息
      ws.on('message', (data) => {
        try {
          const response = JSON.parse(data.toString())
          console.log('收到识别结果:', response)

          if (response.code !== 0) {
            console.error('识别错误:', response)
            if (onError) {
              onError(new Error(response.message || '识别失败'))
            }
            return
          }

          // 返回识别结果
          if (onResult) {
            onResult({
              voiceId: response.voice_id,
              text: response.result?.voice_text_str || '',
              isFinal: response.final === 1,
              startTime: response.result?.slice_type === 0 ? Date.now() : null,
              endTime: response.final === 1 ? Date.now() : null,
              wordList: response.result?.word_list || []
            })
          }
        } catch (error) {
          console.error('解析识别结果错误:', error)
          if (onError) {
            onError(error)
          }
        }
      })

      // 连接错误
      ws.on('error', (error) => {
        console.error('WebSocket错误:', error)
        if (onError) {
          onError(error)
        }
      })

      // 连接关闭
      ws.on('close', (code, reason) => {
        console.log('WebSocket连接已关闭:', code, reason.toString())
      })

      // 返回控制接口
      return {
        /**
         * 发送音频数据
         * @param {Buffer} audioData - 音频数据
         * @param {Boolean} isEnd - 是否为最后一帧
         */
        send: (audioData, isEnd = false) => {
          if (ws.readyState !== WebSocket.OPEN) {
            throw new Error('WebSocket连接未就绪')
          }

          const audioBase64 = audioData.toString('base64')
          const frame = {
            voice_id: voiceId,
            end: isEnd ? 1 : 0,
            seq: isFirstFrame ? 0 : 1,
            voice_format: voiceFormat,
            data: audioBase64
          }

          isFirstFrame = false
          ws.send(JSON.stringify(frame))
        },

        /**
         * 关闭连接
         */
        close: () => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.close()
          }
        },

        /**
         * 获取连接状态
         */
        getReadyState: () => {
          return ws.readyState
        }
      }
    } catch (error) {
      console.error('创建实时识别连接错误:', error)
      throw error
    }
  }

  /**
   * 录音文件识别（一句话识别）
   * @param {Buffer} audioData - 音频数据
   * @param {Object} options - 识别选项
   * @returns {Promise<Object>} 识别结果
   */
  async recognizeFile(audioData, options = {}) {
    try {
      const {
        engineType = '16k_zh',
        voiceFormat = 1,
        filterDirty = 0,
        filterModal = 0,
        filterPunc = 0,
        convertNumMode = 1,
        wordInfo = 2
      } = options

      // 将音频数据转为Base64
      const audioBase64 = audioData.toString('base64')

      const payload = {
        ProjectId: 0,
        SubServiceType: 2,
        EngineModelType: engineType,
        VoiceFormat: voiceFormat,
        UsrAudioKey: Date.now().toString(),
        Data: audioBase64,
        DataLen: audioData.length,
        FilterDirty: filterDirty,
        FilterModal: filterModal,
        FilterPunc: filterPunc,
        ConvertNumMode: convertNumMode,
        WordInfo: wordInfo
      }

      const result = await this.callApi('SentenceRecognition', payload)
      return {
        text: result.Result,
        audioTime: result.AudioTime,
        requestId: result.RequestId
      }
    } catch (error) {
      console.error('录音文件识别错误:', error)
      throw new Error('语音识别失败：' + error.message)
    }
  }

  /**
   * 长语音识别（异步）
   * @param {String} audioUrl - 音频文件URL
   * @param {Object} options - 识别选项
   * @returns {Promise<Object>} 任务ID
   */
  async recognizeLongAudio(audioUrl, options = {}) {
    try {
      const {
        engineType = '16k_zh',
        channelNum = 1,
        resTextFormat = 0, // 结果文本格式：0(基础), 1(详细)
        filterDirty = 0,
        filterModal = 0,
        filterPunc = 0,
        convertNumMode = 1
      } = options

      const payload = {
        EngineModelType: engineType,
        ChannelNum: channelNum,
        ResTextFormat: resTextFormat,
        SourceType: 0, // 音频来源：0(URL)
        Url: audioUrl,
        FilterDirty: filterDirty,
        FilterModal: filterModal,
        FilterPunc: filterPunc,
        ConvertNumMode: convertNumMode
      }

      const result = await this.callApi('CreateRecTask', payload)
      return {
        taskId: result.Data.TaskId,
        requestId: result.RequestId
      }
    } catch (error) {
      console.error('长语音识别错误:', error)
      throw new Error('语音识别任务创建失败：' + error.message)
    }
  }

  /**
   * 查询长语音识别结果
   * @param {Number} taskId - 任务ID
   * @returns {Promise<Object>} 识别结果
   */
  async queryLongAudioResult(taskId) {
    try {
      const payload = {
        TaskId: taskId
      }

      const result = await this.callApi('DescribeTaskStatus', payload)
      
      return {
        status: result.Data.Status, // 0-任务等待, 1-任务执行中, 2-任务成功, 3-任务失败
        statusStr: result.Data.StatusStr,
        result: result.Data.Result,
        errorMsg: result.Data.ErrorMsg,
        resultDetail: result.Data.ResultDetail
      }
    } catch (error) {
      console.error('查询识别结果错误:', error)
      throw new Error('查询识别结果失败：' + error.message)
    }
  }

  /**
   * 微信小程序专用：处理silk格式音频
   * 微信录音上传的是silk格式，需要先转换
   * @param {Buffer} silkData - silk格式音频数据
   * @returns {Promise<Object>} 识别结果
   */
  async recognizeWechatSilk(silkData) {
    try {
      // 注意：silk格式需要先转换为pcm/wav等格式
      // 这里简化处理，实际项目中可能需要调用转换服务
      console.log('处理微信silk格式音频，长度:', silkData.length)
      
      // 如果有转换服务，在这里调用
      // const pcmData = await this.convertSilkToPcm(silkData)
      
      // 暂时直接识别（腾讯云ASR可能支持silk格式）
      return await this.recognizeFile(silkData, {
        voiceFormat: 1 // 根据实际格式调整
      })
    } catch (error) {
      console.error('微信语音识别错误:', error)
      throw new Error('微信语音识别失败：' + error.message)
    }
  }

  /**
   * 批量识别多个音频文件
   * @param {Array<Buffer>} audioDataList - 音频数据数组
   * @param {Object} options - 识别选项
   * @returns {Promise<Array>} 识别结果数组
   */
  async recognizeBatch(audioDataList, options = {}) {
    try {
      const results = []
      
      for (let i = 0; i < audioDataList.length; i++) {
        try {
          const result = await this.recognizeFile(audioDataList[i], options)
          results.push({
            index: i,
            success: true,
            ...result
          })
        } catch (error) {
          results.push({
            index: i,
            success: false,
            error: error.message
          })
        }
        
        // 避免请求过快，添加延迟
        if (i < audioDataList.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 100))
        }
      }
      
      return results
    } catch (error) {
      console.error('批量识别错误:', error)
      throw error
    }
  }
}

// 导出单例
let voiceRecognitionInstance = null

module.exports = {
  /**
   * 获取语音识别服务实例
   */
  getVoiceRecognitionService: () => {
    if (!voiceRecognitionInstance) {
      voiceRecognitionInstance = new VoiceRecognitionService()
    }
    return voiceRecognitionInstance
  },
  
  VoiceRecognitionService
}

