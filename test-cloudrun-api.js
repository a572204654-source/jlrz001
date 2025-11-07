/**
 * 云托管API接口测试脚本
 * 测试所有API端点是否正常运行
 */

const axios = require('axios');

// 颜色代码
const colors = {
  reset: '\x1b[0m',
  cyan: '\x1b[36m',
  yellow: '\x1b[33m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  gray: '\x1b[90m',
  white: '\x1b[37m',
  bold: '\x1b[1m'
};

// 颜色辅助函数
const colorize = (text, color) => `${color}${text}${colors.reset}`;
const cyan = (text) => colorize(text, colors.cyan);
const yellow = (text) => colorize(text, colors.yellow);
const green = (text) => colorize(text, colors.green);
const red = (text) => colorize(text, colors.red);
const gray = (text) => colorize(text, colors.gray);
const white = (text) => colorize(text, colors.white);
const bold = (text) => colorize(text, colors.bold);

// 云托管服务地址
const BASE_URL = 'https://api.yimengpl.com';
const TIMEOUT = 15000; // 15秒超时

// 创建axios实例
const api = axios.create({
  baseURL: BASE_URL,
  timeout: TIMEOUT,
  headers: {
    'Content-Type': 'application/json'
  }
});

// 测试结果统计
const stats = {
  total: 0,
  passed: 0,
  failed: 0,
  errors: []
};

// 存储测试数据
const testData = {
  token: null,
  userId: null,
  projectId: null,
  workId: null,
  logId: null,
  attachmentId: null,
  chatSessionId: null
};

/**
 * 打印测试标题
 */
function printTitle(title) {
  console.log('\n' + cyan('='.repeat(60)));
  console.log(cyan(`  ${title}`));
  console.log(cyan('='.repeat(60)));
}

/**
 * 打印测试子标题
 */
function printSubtitle(subtitle) {
  console.log(yellow(`\n► ${subtitle}`));
  console.log(gray('-'.repeat(60)));
}

/**
 * 打印成功信息
 */
function printSuccess(message, data = null) {
  stats.total++;
  stats.passed++;
  console.log(green(`  ✓ ${message}`));
  if (data) {
    console.log(gray(`    响应: ${JSON.stringify(data)}`));
  }
}

/**
 * 打印失败信息
 */
function printError(message, error) {
  stats.total++;
  stats.failed++;
  console.log(red(`  ✗ ${message}`));
  const errorMsg = error.response?.data?.message || error.message || '未知错误';
  console.log(red(`    错误: ${errorMsg}`));
  stats.errors.push({
    test: message,
    error: errorMsg
  });
}

/**
 * 打印信息
 */
function printInfo(message) {
  console.log(cyan(`    ℹ ${message}`));
}

/**
 * 执行测试
 */
async function runTest(name, testFn) {
  try {
    const result = await testFn();
    printSuccess(name, result);
    return result;
  } catch (error) {
    printError(name, error);
    return null;
  }
}

/**
 * 1. 基础健康检查
 */
async function testHealthCheck() {
  printSubtitle('基础健康检查');
  
  // 1.1 健康检查接口
  await runTest('健康检查接口 GET /health', async () => {
    const res = await api.get('/health');
    return res.data;
  });
  
  // 1.2 API根路径
  await runTest('API根路径 GET /api', async () => {
    const res = await api.get('/api');
    return { name: res.data.name, version: res.data.version };
  });
}

/**
 * 2. 认证API测试
 */
async function testAuthAPI() {
  printSubtitle('认证API测试');
  
  // 2.1 测试登录（使用测试账号）
  const loginResult = await runTest('小程序登录 POST /api/auth/login', async () => {
    const res = await api.post('/api/auth/login', {
      code: 'test_code_for_cloudrun',
      userInfo: {
        nickname: '云托管测试',
        avatarUrl: 'https://via.placeholder.com/100'
      }
    });
    
    // 保存token和userId
    if (res.data.code === 0 && res.data.data) {
      testData.token = res.data.data.token;
      testData.userId = res.data.data.userId || res.data.data.userInfo?.id;
      
      // 设置后续请求的token
      api.defaults.headers.common['Authorization'] = `Bearer ${testData.token}`;
      
      printInfo(`Token已保存，用户ID: ${testData.userId}`);
    }
    
    return { 
      isNewUser: res.data.data.isNewUser,
      userId: testData.userId
    };
  });
  
  // 如果登录失败，打印提示信息
  if (!testData.token) {
    printInfo('⚠️  登录失败，后续需要认证的接口可能会失败');
    printInfo('提示：云托管环境需要配置 WECHAT_APPID 和 WECHAT_APPSECRET');
  }
}

/**
 * 3. 用户API测试
 */
async function testUserAPI() {
  printSubtitle('用户API测试');
  
  if (!testData.token) {
    printInfo('跳过用户API测试（需要登录）');
    return;
  }
  
  // 3.1 获取用户信息
  await runTest('获取用户信息 GET /api/user/info', async () => {
    const res = await api.get('/api/user/info');
    return res.data.data ? {
      id: res.data.data.id,
      nickname: res.data.data.nickname
    } : null;
  });
  
  // 3.2 更新用户信息
  await runTest('更新用户信息 PUT /api/user/info', async () => {
    const res = await api.put('/api/user/info', {
      nickname: '云托管测试用户',
      phone: '13800138000'
    });
    return res.data;
  });
  
  // 3.3 获取用户统计
  await runTest('获取用户统计 GET /api/user/stats', async () => {
    const res = await api.get('/api/user/stats');
    return res.data.data;
  });
  
  // 3.4 获取用户列表
  await runTest('获取用户列表 GET /api/user/list', async () => {
    const res = await api.get('/api/user/list?page=1&pageSize=10');
    return { 
      total: res.data.data?.pagination?.total || 0,
      count: res.data.data?.list?.length || 0
    };
  });
}

/**
 * 4. 项目管理API测试
 */
async function testProjectAPI() {
  printSubtitle('项目管理API测试');
  
  if (!testData.token) {
    printInfo('跳过项目API测试（需要登录）');
    return;
  }
  
  // 4.1 创建项目
  const createResult = await runTest('新增项目 POST /api/projects', async () => {
    const res = await api.post('/api/projects', {
      projectName: '云托管测试项目',
      projectCode: 'CLOUDRUN-TEST-' + Date.now(),
      location: '上海市浦东新区',
      description: 'API测试项目'
    });
    
    if (res.data.code === 0 && res.data.data) {
      testData.projectId = res.data.data.id;
      printInfo(`项目ID已保存: ${testData.projectId}`);
    }
    
    return res.data.data;
  });
  
  // 4.2 获取项目列表
  await runTest('获取项目列表 GET /api/projects', async () => {
    const res = await api.get('/api/projects?page=1&pageSize=10');
    return {
      total: res.data.data?.pagination?.total || 0,
      count: res.data.data?.list?.length || 0
    };
  });
  
  if (testData.projectId) {
    // 4.3 获取项目详情
    await runTest(`获取项目详情 GET /api/projects/${testData.projectId}`, async () => {
      const res = await api.get(`/api/projects/${testData.projectId}`);
      return res.data.data ? {
        id: res.data.data.id,
        projectName: res.data.data.projectName
      } : null;
    });
    
    // 4.4 更新项目
    await runTest(`编辑项目 PUT /api/projects/${testData.projectId}`, async () => {
      const res = await api.put(`/api/projects/${testData.projectId}`, {
        projectName: '云托管测试项目（已更新）',
        description: 'API测试项目 - 更新测试'
      });
      return res.data;
    });
  }
}

/**
 * 5. 工程管理API测试
 */
async function testWorkAPI() {
  printSubtitle('工程管理API测试');
  
  if (!testData.token || !testData.projectId) {
    printInfo('跳过工程API测试（需要登录且创建项目）');
    return;
  }
  
  // 5.1 创建工程
  const createResult = await runTest('新增工程 POST /api/works', async () => {
    const res = await api.post('/api/works', {
      projectId: testData.projectId,
      workName: '云托管测试工程',
      workType: '土建工程',
      description: 'API测试工程'
    });
    
    if (res.data.code === 0 && res.data.data) {
      testData.workId = res.data.data.id;
      printInfo(`工程ID已保存: ${testData.workId}`);
    }
    
    return res.data.data;
  });
  
  // 5.2 获取工程列表
  await runTest('获取工程列表 GET /api/works', async () => {
    const res = await api.get(`/api/works?projectId=${testData.projectId}&page=1&pageSize=10`);
    return {
      total: res.data.data?.pagination?.total || 0,
      count: res.data.data?.list?.length || 0
    };
  });
  
  if (testData.workId) {
    // 5.3 获取工程详情
    await runTest(`获取工程详情 GET /api/works/${testData.workId}`, async () => {
      const res = await api.get(`/api/works/${testData.workId}`);
      return res.data.data ? {
        id: res.data.data.id,
        workName: res.data.data.workName
      } : null;
    });
    
    // 5.4 更新工程
    await runTest(`编辑工程 PUT /api/works/${testData.workId}`, async () => {
      const res = await api.put(`/api/works/${testData.workId}`, {
        workName: '云托管测试工程（已更新）',
        description: 'API测试工程 - 更新测试'
      });
      return res.data;
    });
  }
}

/**
 * 6. 监理日志API测试
 */
async function testSupervisionLogAPI() {
  printSubtitle('监理日志API测试');
  
  if (!testData.token || !testData.projectId) {
    printInfo('跳过监理日志API测试（需要登录且创建项目）');
    return;
  }
  
  // 6.1 创建监理日志
  const createResult = await runTest('新增监理日志 POST /api/supervision-logs', async () => {
    const res = await api.post('/api/supervision-logs', {
      projectId: testData.projectId,
      workId: testData.workId,
      title: '云托管测试日志',
      date: new Date().toISOString().split('T')[0],
      weather: '晴天',
      temperature: '25℃',
      workContent: '测试工程进展',
      workProgress: '按计划进行',
      qualityStatus: '合格',
      safetyStatus: '良好',
      onSitePersonnel: 50,
      remark: 'API测试日志'
    });
    
    if (res.data.code === 0 && res.data.data) {
      testData.logId = res.data.data.id;
      printInfo(`日志ID已保存: ${testData.logId}`);
    }
    
    return res.data.data;
  });
  
  // 6.2 获取日志列表
  await runTest('获取监理日志列表 GET /api/supervision-logs', async () => {
    const res = await api.get(`/api/supervision-logs?projectId=${testData.projectId}&page=1&pageSize=10`);
    return {
      total: res.data.data?.pagination?.total || 0,
      count: res.data.data?.list?.length || 0
    };
  });
  
  if (testData.logId) {
    // 6.3 获取日志详情
    await runTest(`获取日志详情 GET /api/supervision-logs/${testData.logId}`, async () => {
      const res = await api.get(`/api/supervision-logs/${testData.logId}`);
      return res.data.data ? {
        id: res.data.data.id,
        title: res.data.data.title
      } : null;
    });
    
    // 6.4 更新日志
    await runTest(`编辑监理日志 PUT /api/supervision-logs/${testData.logId}`, async () => {
      const res = await api.put(`/api/supervision-logs/${testData.logId}`, {
        title: '云托管测试日志（已更新）',
        remark: 'API测试日志 - 更新测试'
      });
      return res.data;
    });
    
    // 6.5 导出Word文档（可能较慢）
    await runTest(`导出Word文档 GET /api/supervision-logs/${testData.logId}/export`, async () => {
      const res = await api.get(`/api/supervision-logs/${testData.logId}/export`, {
        responseType: 'arraybuffer',
        timeout: 30000 // Word导出可能需要更长时间
      });
      
      const size = res.data.byteLength;
      printInfo(`导出成功，文件大小: ${(size / 1024).toFixed(2)} KB`);
      
      return { size };
    });
  }
}

/**
 * 7. 附件管理API测试
 */
async function testAttachmentAPI() {
  printSubtitle('附件管理API测试');
  
  if (!testData.token || !testData.logId) {
    printInfo('跳过附件API测试（需要登录且创建日志）');
    return;
  }
  
  // 7.1 模拟创建附件记录
  await runTest('新增附件 POST /api/attachments', async () => {
    const res = await api.post('/api/attachments', {
      logId: testData.logId,
      fileName: 'test-image.jpg',
      fileType: 'image',
      fileUrl: 'https://example.com/test.jpg',
      fileSize: 102400,
      description: 'API测试附件'
    });
    
    if (res.data.code === 0 && res.data.data) {
      testData.attachmentId = res.data.data.id;
      printInfo(`附件ID已保存: ${testData.attachmentId}`);
    }
    
    return res.data.data;
  });
  
  // 7.2 获取附件列表
  await runTest(`获取附件列表 GET /api/attachments?logId=${testData.logId}`, async () => {
    const res = await api.get(`/api/attachments?logId=${testData.logId}`);
    return {
      count: res.data.data?.list?.length || 0
    };
  });
  
  if (testData.attachmentId) {
    // 7.3 删除附件
    await runTest(`删除附件 DELETE /api/attachments/${testData.attachmentId}`, async () => {
      const res = await api.delete(`/api/attachments/${testData.attachmentId}`);
      return res.data;
    });
  }
}

/**
 * 8. AI对话API测试
 */
async function testAIChatAPI() {
  printSubtitle('AI对话API测试');
  
  if (!testData.token) {
    printInfo('跳过AI对话API测试（需要登录）');
    return;
  }
  
  // 8.1 创建对话会话
  const createResult = await runTest('创建AI对话会话 POST /api/ai-chat/sessions', async () => {
    const res = await api.post('/api/ai-chat/sessions', {
      title: '云托管测试对话'
    });
    
    if (res.data.code === 0 && res.data.data) {
      testData.chatSessionId = res.data.data.id;
      printInfo(`会话ID已保存: ${testData.chatSessionId}`);
    }
    
    return res.data.data;
  });
  
  // 8.2 获取对话会话列表
  await runTest('获取会话列表 GET /api/ai-chat/sessions', async () => {
    const res = await api.get('/api/ai-chat/sessions?page=1&pageSize=10');
    return {
      total: res.data.data?.pagination?.total || 0,
      count: res.data.data?.list?.length || 0
    };
  });
  
  if (testData.chatSessionId) {
    // 8.3 发送消息（可能较慢，AI调用）
    await runTest(`发送消息 POST /api/ai-chat/sessions/${testData.chatSessionId}/messages`, async () => {
      const res = await api.post(`/api/ai-chat/sessions/${testData.chatSessionId}/messages`, {
        message: '你好，这是一个API测试'
      }, {
        timeout: 30000 // AI响应可能需要更长时间
      });
      
      return res.data.data ? {
        userMessage: res.data.data.userMessage?.content || '测试消息',
        aiReply: res.data.data.aiMessage?.content?.substring(0, 50) + '...' || '收到回复'
      } : null;
    });
    
    // 8.4 获取对话记录
    await runTest(`获取对话记录 GET /api/ai-chat/sessions/${testData.chatSessionId}/messages`, async () => {
      const res = await api.get(`/api/ai-chat/sessions/${testData.chatSessionId}/messages`);
      return {
        count: res.data.data?.list?.length || 0
      };
    });
  }
}

/**
 * 9. 天气查询API测试
 */
async function testWeatherAPI() {
  printSubtitle('天气查询API测试');
  
  // 9.1 获取当前天气
  await runTest('获取当前天气 GET /api/weather/current', async () => {
    const res = await api.get('/api/weather/current', {
      params: {
        latitude: 31.2304,
        longitude: 121.4737
      }
    });
    
    return res.data.data ? {
      city: res.data.data.city || '未知',
      weather: res.data.data.weather || '未知',
      temperature: res.data.data.temperature || '未知'
    } : null;
  });
  
  // 9.2 测试缓存（再次请求）
  await runTest('测试天气缓存 GET /api/weather/current (第二次)', async () => {
    const res = await api.get('/api/weather/current', {
      params: {
        latitude: 31.2304,
        longitude: 121.4737
      }
    });
    
    printInfo('如果响应很快，说明缓存生效');
    
    return res.data.data ? {
      fromCache: '可能来自缓存'
    } : null;
  });
}

/**
 * 10. 打印测试统计
 */
function printStats() {
  console.log('\n' + cyan('='.repeat(60)));
  console.log(cyan('  测试完成'));
  console.log(cyan('='.repeat(60)));
  console.log(white(`  总计: ${stats.total}`));
  console.log(green(`  通过: ${stats.passed}`));
  console.log(red(`  失败: ${stats.failed}`));
  
  const successRate = stats.total > 0 ? ((stats.passed / stats.total) * 100).toFixed(2) : 0;
  console.log(yellow(`  成功率: ${successRate}%`));
  console.log(cyan('='.repeat(60)));
  
  if (stats.errors.length > 0) {
    console.log(red('\n失败的测试:'));
    stats.errors.forEach((err, index) => {
      console.log(red(`  ${index + 1}. ${err.test}`));
      console.log(gray(`     错误: ${err.error}`));
    });
  }
  
  console.log(yellow('\n提示:'));
  console.log(gray('  - 查看详细日志: 访问云托管控制台 → 服务详情 → 日志查询'));
  console.log(gray('  - 如果登录失败: 检查 WECHAT_APPID 和 WECHAT_APPSECRET 配置'));
  console.log(gray('  - 如果AI对话失败: 检查 DOUBAO_API_KEY 等豆包配置'));
  console.log(gray('  - 控制台地址: https://console.cloud.tencent.com/tcb'));
}

/**
 * 主测试函数
 */
async function main() {
  const startTime = Date.now();
  
  printTitle(`云托管API接口测试 - ${BASE_URL}`);
  console.log(gray(`测试时间: ${new Date().toLocaleString()}`));
  console.log(gray(`超时设置: ${TIMEOUT}ms`));
  
  try {
    // 执行各模块测试
    await testHealthCheck();
    await testAuthAPI();
    await testUserAPI();
    await testProjectAPI();
    await testWorkAPI();
    await testSupervisionLogAPI();
    await testAttachmentAPI();
    await testAIChatAPI();
    await testWeatherAPI();
    
  } catch (error) {
    console.error(red('\n测试过程中发生未捕获的错误:'));
    console.error(error);
  }
  
  const endTime = Date.now();
  const duration = ((endTime - startTime) / 1000).toFixed(2);
  
  printStats();
  console.log(gray(`\n耗时: ${duration}s`));
  console.log('');
  
  // 退出代码：如果有失败则返回1
  process.exit(stats.failed > 0 ? 1 : 0);
}

// 运行测试
main();

