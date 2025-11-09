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
    
    // 验证密钥配置
    if (!this.secretId || !this.secretKey) {
      throw new Error('腾讯云 SecretId 或 SecretKey 未配置，请检查环境变量 TENCENTCLOUD_SECRET_ID 和 TENCENTCLOUD_SECRET_KEY')
    }
    
    // 验证 SecretKey 格式（通常为40个字符）
    if (this.secretKey.length < 32) {
      console.warn('警告: SecretKey 长度异常，可能导致签名验证失败')
    }
    
    // WebSocket实时识别配置
    this.wsHost = 'asr.cloud.tencent.com'
    this.wsPath = '/asr/v2/'
    
    // API配置（用于一句话识别）
    this.host = 'asr.tencentcloudapi.com'
    this.service = 'asr'
    this.version = '2019-06-14'
    this.algorithm = 'TC3-HMAC-SHA256'
    
    // 代理配置（如果设置了环境变量）
    this.proxy = process.env.HTTP_PROXY || process.env.http_proxy || null
    this.httpsProxy = process.env.HTTPS_PROXY || process.env.https_proxy || null
  }
  
  /**
   * 获取 UTC 时间戳（秒）
   * 确保使用 UTC 时区，避免时区问题导致签名错误
   */
  getUTCTimestamp() {
    // Date.now() 返回的是 UTC 时间戳（毫秒），除以1000得到秒
    // 为了确保一致性，使用 Math.floor 向下取整
    return Math.floor(Date.now() / 1000)
  }
  
  /**
   * 获取 UTC 日期字符串（YYYY-MM-DD）
   * 用于签名中的 credential scope
   */
  getUTCDateString(timestamp) {
    // 使用 UTC 时间戳创建 Date 对象
    const date = new Date(timestamp * 1000)
    // 使用 UTC 方法获取年月日，确保时区正确
    const year = date.getUTCFullYear()
    const month = String(date.getUTCMonth() + 1).padStart(2, '0')
    const day = String(date.getUTCDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
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
   * @param {Number} timestamp - 时间戳（秒，必须是 UTC 时间戳）
   * @param {String} action - API动作名称
   * @returns {String} Authorization 字符串
   */
  generateSignature(payload, timestamp, action) {
    try {
      // 使用 UTC 时区获取日期字符串，确保时区正确
      const date = this.getUTCDateString(timestamp)
      
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
      // 使用 UTC 时间戳，确保时区正确
      const timestamp = this.getUTCTimestamp()
      const authorization = this.generateSignature(payload, timestamp, action)

      // 配置 axios 请求选项
      const axiosConfig = {
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
      }
      
      // 如果配置了代理，添加代理设置（可选功能）
      if (this.httpsProxy || this.proxy) {
        try {
          const HttpsProxyAgent = require('https-proxy-agent')
          const HttpProxyAgent = require('http-proxy-agent')
          const proxyUrl = this.httpsProxy || this.proxy
          
          if (proxyUrl && (proxyUrl.startsWith('https://') || proxyUrl.startsWith('http://'))) {
            axiosConfig.httpsAgent = new HttpsProxyAgent(proxyUrl)
            axiosConfig.httpAgent = new HttpProxyAgent(proxyUrl)
            console.log('使用代理:', proxyUrl.replace(/:[^:@]+@/, ':****@'))
          }
        } catch (error) {
          console.warn('代理配置失败，将直接连接（如需使用代理，请安装: npm install https-proxy-agent http-proxy-agent）:', error.message)
        }
      }

      const response = await axios(axiosConfig)

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

      // 使用 UTC 时间戳，确保时区正确
      const timestamp = this.getUTCTimestamp()
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

      // 连接状态标志
      let isConnected = false
      let connectionPromise = null
      let connectionResolve = null
      let connectionReject = null
      let connectionTimeout = null
      
      const waitForConnection = () => {
        // 如果已经连接，再次验证状态
        if (isConnected && ws.readyState === WebSocket.OPEN) {
          console.log('连接已建立，状态验证通过')
          return Promise.resolve()
        }
        // 如果连接已经打开但标志未设置，设置标志并返回
        if (ws.readyState === WebSocket.OPEN) {
          console.log('连接已打开，设置连接标志')
          isConnected = true
          return Promise.resolve()
        }
        // 如果连接已关闭，拒绝
        if (ws.readyState === WebSocket.CLOSED || ws.readyState === WebSocket.CLOSING) {
          console.error('连接已关闭或正在关闭，无法建立连接')
          return Promise.reject(new Error('WebSocket连接已关闭'))
        }
        // 如果正在连接，等待现有Promise
        if (connectionPromise) {
          console.log('已有连接Promise，等待现有连接')
          return connectionPromise
        }
        // 创建新的连接Promise
        connectionPromise = new Promise((resolve, reject) => {
          connectionResolve = resolve
          connectionReject = reject
          
          console.log('创建新的连接Promise，当前状态:', ws.readyState)
          console.log('  CONNECTING:', WebSocket.CONNECTING)
          console.log('  OPEN:', WebSocket.OPEN)
          console.log('  CLOSING:', WebSocket.CLOSING)
          console.log('  CLOSED:', WebSocket.CLOSED)
          
          // 设置超时
          connectionTimeout = setTimeout(() => {
            if (connectionReject) {
              console.error('WebSocket连接超时')
              console.error('  当前状态:', ws.readyState)
              console.error('  连接URL:', wsUrl.replace(/signature=.*/, 'signature=***'))
              connectionReject(new Error('WebSocket连接超时'))
              connectionReject = null
              connectionResolve = null
              connectionPromise = null
              connectionTimeout = null
            }
          }, 10000) // 10秒超时
        })
        return connectionPromise
      }

      // 连接打开
      ws.on('open', () => {
        isConnected = true
        console.log('WebSocket连接已建立，readyState:', ws.readyState)
        // 清除超时
        if (connectionTimeout) {
          clearTimeout(connectionTimeout)
          connectionTimeout = null
        }
        // 解析Promise
        if (connectionResolve) {
          connectionResolve()
          connectionResolve = null
          connectionReject = null
          connectionPromise = null
        }
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
        // 清除超时
        if (connectionTimeout) {
          clearTimeout(connectionTimeout)
          connectionTimeout = null
        }
        // 拒绝Promise
        if (connectionReject) {
          connectionReject(error)
          connectionReject = null
          connectionResolve = null
          connectionPromise = null
        }
        if (onError) {
          onError(error)
        }
      })

      // 连接关闭
      ws.on('close', (code, reason) => {
        console.log('WebSocket连接已关闭:', code, reason.toString())
        isConnected = false
        // 如果连接关闭时还有未完成的Promise，拒绝它
        if (connectionReject) {
          connectionReject(new Error(`WebSocket连接已关闭: ${code} ${reason.toString()}`))
          connectionReject = null
          connectionResolve = null
          connectionPromise = null
        }
        // 清除超时
        if (connectionTimeout) {
          clearTimeout(connectionTimeout)
          connectionTimeout = null
        }
      })

      // 返回控制接口
      return {
        /**
         * 等待连接建立
         * @returns {Promise}
         */
        waitForConnection: waitForConnection,
        
        /**
         * 发送音频数据
         * @param {Buffer} audioData - 音频数据
         * @param {Boolean} isEnd - 是否为最后一帧
         */
        send: async (audioData, isEnd = false) => {
          // 等待连接建立
          try {
            console.log('开始等待WebSocket连接，当前状态:', ws.readyState, 'isConnected:', isConnected)
            await waitForConnection()
            console.log('等待连接完成，当前状态:', ws.readyState, 'isConnected:', isConnected)
          } catch (error) {
            console.error('等待连接建立失败:', error)
            console.error('连接详细信息 - readyState:', ws.readyState, 'isConnected:', isConnected, 'URL:', wsUrl)
            throw new Error('WebSocket连接失败：' + error.message)
          }
          
          // 再次检查连接状态
          if (ws.readyState !== WebSocket.OPEN) {
            console.error('连接状态检查失败')
            console.error('  readyState:', ws.readyState)
            console.error('  WebSocket.OPEN:', WebSocket.OPEN)
            console.error('  isConnected:', isConnected)
            console.error('  URL:', wsUrl)
            throw new Error(`WebSocket连接未就绪，当前状态: ${ws.readyState} (OPEN=${WebSocket.OPEN})`)
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
   * 使用实时语音识别接口识别音频文件
   * 将音频文件分块发送到实时识别服务，模拟实时流
   * @param {Buffer} audioData - 音频数据
   * @param {Object} options - 识别选项
   * @returns {Promise<Object>} 识别结果
   */
  async recognizeFileWithRealtime(audioData, options = {}) {
    return new Promise((resolve, reject) => {
      try {
        const {
          engineType = '16k_zh',
          voiceFormat = 1,
          needvad = 1,
          filterDirty = 0,
          filterModal = 0,
          filterPunc = 0,
          convertNumMode = 1,
          wordInfo = 2,
          vadSilenceTime = 200
        } = options

        let finalText = ''
        let allTexts = []
        let wordList = []
        let isResolved = false

        // 创建实时识别连接
        const recognition = this.createRealtimeRecognition(
          {
            engineType,
            voiceFormat,
            needvad,
            filterDirty,
            filterModal,
            filterPunc,
            convertNumMode,
            wordInfo,
            vadSilenceTime
          },
          // 识别结果回调
          (result) => {
            if (result.text) {
              allTexts.push(result.text)
              finalText = result.text // 最终结果会覆盖中间结果
            }
            if (result.wordList && result.wordList.length > 0) {
              wordList = result.wordList
            }

            // 如果是最终结果，等待音频发送完成后返回
            if (result.isFinal) {
              // 延迟一点确保所有数据都处理完成
              setTimeout(() => {
                if (!isResolved) {
                  isResolved = true
                  recognition.close()
                  resolve({
                    text: finalText || allTexts.join(''),
                    wordList: wordList,
                    audioTime: Math.ceil(audioData.length / 3200) // 估算音频时长（16k采样率，16bit，单声道）
                  })
                }
              }, 500)
            }
          },
          // 错误回调
          (error) => {
            if (!isResolved) {
              isResolved = true
              reject(error)
            }
          }
        )

        // 等待连接建立后再开始发送数据
        recognition.waitForConnection()
          .then(() => {
            // 再次验证连接状态
            const readyState = recognition.getReadyState()
            if (readyState !== 1) { // WebSocket.OPEN = 1
              console.error('连接状态异常，readyState:', readyState)
              if (!isResolved) {
                isResolved = true
                reject(new Error(`WebSocket连接未就绪，状态: ${readyState}`))
              }
              return
            }
            
            console.log('连接已建立，开始发送音频数据，readyState:', readyState)
            // 将音频数据分块发送（每40ms发送一次，模拟实时流）
            // 16k采样率，16bit，单声道：每秒3200字节，40ms = 128字节
            const chunkSize = 128 * 10 // 每次发送1280字节（约400ms的音频）
            let offset = 0

            const sendChunk = async () => {
              if (offset >= audioData.length) {
                // 所有数据已发送完成，等待识别结果
                // 如果超时还没有收到最终结果，直接返回当前结果
                setTimeout(() => {
                  if (!isResolved) {
                    isResolved = true
                    recognition.close()
                    resolve({
                      text: finalText || allTexts.join(''),
                      wordList: wordList,
                      audioTime: Math.ceil(audioData.length / 3200)
                    })
                  }
                }, 3000) // 3秒超时
                return
              }

              const chunk = audioData.slice(offset, offset + chunkSize)
              const isLastChunk = offset + chunkSize >= audioData.length

              try {
                // 确保连接已建立，如果连接关闭则重试等待
                let retryCount = 0
                while (recognition.getReadyState() !== 1 && retryCount < 3) {
                  console.log(`连接状态异常，重试等待连接 (${retryCount + 1}/3)`)
                  await recognition.waitForConnection()
                  retryCount++
                  // 等待一小段时间让连接稳定
                  await new Promise(resolve => setTimeout(resolve, 100))
                }
                
                // 最终检查连接状态
                if (recognition.getReadyState() !== 1) {
                  throw new Error(`WebSocket连接未就绪，状态: ${recognition.getReadyState()}`)
                }
                
                await recognition.send(chunk, isLastChunk)
              } catch (error) {
                console.error('发送音频数据错误:', error)
                console.error('当前连接状态:', recognition.getReadyState())
                if (!isResolved) {
                  isResolved = true
                  reject(new Error('发送音频数据失败：' + error.message))
                }
                return
              }

              offset += chunkSize

              if (!isLastChunk) {
                // 模拟实时发送，每40ms发送一次
                setTimeout(sendChunk, 40)
              } else {
                // 如果是最后一帧，等待识别结果
                // 如果超时还没有收到最终结果，直接返回当前结果
                setTimeout(() => {
                  if (!isResolved) {
                    isResolved = true
                    recognition.close()
                    resolve({
                      text: finalText || allTexts.join(''),
                      wordList: wordList,
                      audioTime: Math.ceil(audioData.length / 3200)
                    })
                  }
                }, 3000) // 3秒超时
              }
            }

            // 开始发送音频数据
            sendChunk()
          })
          .catch((error) => {
            if (!isResolved) {
              isResolved = true
              reject(new Error('WebSocket连接失败：' + error.message))
            }
          })

      } catch (error) {
        console.error('实时识别文件错误:', error)
        reject(new Error('语音识别失败：' + error.message))
      }
    })
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

