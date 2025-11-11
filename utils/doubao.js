const axios = require('axios')
const config = require('../config')

/**
 * 调用豆包AI API
 * @param {Array} messages - 对话消息列表 [{role: 'user'|'assistant', content: '...', attachments?: [...]}]
 * @param {Object} options - 可选配置
 * @returns {Promise<string>} AI回复内容
 */
async function callDoubaoAPI(messages, options = {}) {
  try {
    const {
      maxTokens = config.doubao.maxTokens,
      temperature = config.doubao.temperature,
      timeout = 60000 // 默认60秒超时，应对复杂AI对话
    } = options

    // 检查API Key是否配置
    if (!config.doubao.apiKey) {
      throw new Error('豆包API Key未配置')
    }

    // 检查Endpoint ID是否配置
    if (!config.doubao.endpointId) {
      throw new Error('豆包Endpoint ID未配置')
    }

    // 构建请求数据
    const requestData = {
      model: config.doubao.endpointId,
      messages: messages,
      max_tokens: maxTokens,
      temperature: temperature,
      stream: false
    }

    // 调用豆包API（使用较短的超时时间）
    const response = await axios.post(
      `${config.doubao.apiUrl}/chat/completions`,
      requestData,
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.doubao.apiKey}`
        },
        timeout: timeout
      }
    )

    // 解析响应
    if (response.data && response.data.choices && response.data.choices.length > 0) {
      const aiReply = response.data.choices[0].message.content
      return aiReply
    } else {
      throw new Error('豆包API响应格式异常')
    }

  } catch (error) {
    console.error('调用豆包API失败:', error.message)
    
    // 根据不同的错误类型返回更友好的提示
    if (error.message.includes('API Key未配置') || error.message.includes('Endpoint ID未配置')) {
      return '抱歉，AI对话服务尚未配置完成。请联系管理员配置豆包AI相关参数。'
    }
    
    if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
      return '抱歉，AI服务响应超时，请稍后再试。如果问题持续存在，请联系技术支持。'
    }
    
    if (error.response) {
      // API返回了错误响应
      const status = error.response.status
      if (status === 401) {
        return '抱歉，AI服务认证失败。请联系管理员检查API密钥配置。'
      } else if (status === 429) {
        return '抱歉，AI服务请求过于频繁，请稍后再试。'
      } else if (status >= 500) {
        return '抱歉，AI服务暂时不可用，请稍后再试。'
      }
    }
    
    // 网络错误
    if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      return '抱歉，无法连接到AI服务。请检查网络连接或稍后再试。'
    }
    
    // 通用错误提示
    return '抱歉，AI服务暂时遇到了一些问题。请稍后再试，或联系技术支持寻求帮助。'
  }
}

/**
 * 单次对话（不带上下文）
 * @param {string} userMessage - 用户消息
 * @param {Object} options - 可选配置
 * @returns {Promise<string>} AI回复
 */
async function chatWithDoubao(userMessage, options = {}) {
  const messages = [
    {
      role: 'user',
      content: userMessage
    }
  ]
  
  return await callDoubaoAPI(messages, options)
}

/**
 * 多轮对话（带上下文）
 * @param {Array} conversationHistory - 对话历史 [{role: 'user'|'assistant', content: '...'}]
 * @param {string} newMessage - 新消息
 * @param {Object} options - 可选配置
 * @param {Array} fileIds - 文件ID列表（可选）
 * @returns {Promise<string>} AI回复
 */
async function chatWithContext(conversationHistory, newMessage, options = {}, fileIds = []) {
  const userMessage = {
    role: 'user',
    content: newMessage
  }

  // 如果有文件，添加附件
  if (fileIds && fileIds.length > 0) {
    userMessage.attachments = fileIds.map(fileId => ({
      type: 'file',
      file_id: fileId
    }))
  }

  const messages = [
    ...conversationHistory,
    userMessage
  ]
  
  // callDoubaoAPI现在会自动处理错误并返回mock数据
  return await callDoubaoAPI(messages, options)
}

/**
 * 监理日志优化专用（带系统提示）
 * @param {string} logContent - 日志内容
 * @returns {Promise<string>} 优化后的内容
 */
async function optimizeSupervisionLog(logContent) {
  const messages = [
    {
      role: 'system',
      content: '你是一个专业的工程监理助手，擅长撰写和优化监理日志。请帮助用户优化监理日志内容，使其更加专业、规范、完整。'
    },
    {
      role: 'user',
      content: `请帮我优化以下监理日志内容，使其更加专业规范：\n\n${logContent}`
    }
  ]
  
  return await callDoubaoAPI(messages)
}

/**
 * 获取AI建议
 * @param {string} question - 用户问题
 * @param {string} context - 上下文信息（可选）
 * @returns {Promise<string>} AI建议
 */
async function getAISuggestion(question, context = '') {
  const systemPrompt = '你是一个工程监理领域的AI助手，请根据用户的问题提供专业的建议和指导。'
  
  const messages = [
    {
      role: 'system',
      content: systemPrompt
    }
  ]
  
  if (context) {
    messages.push({
      role: 'user',
      content: `背景信息：${context}`
    })
  }
  
  messages.push({
    role: 'user',
    content: question
  })
  
  return await callDoubaoAPI(messages)
}

module.exports = {
  callDoubaoAPI,
  chatWithDoubao,
  chatWithContext,
  optimizeSupervisionLog,
  getAISuggestion
}

