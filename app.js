var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var cors = require('cors');

// 加载环境变量
require('dotenv').config();

var app = express();

// 注意：express-ws 将在 bin/www 中初始化，在HTTP服务器创建之后
// 这里不初始化，避免服务器实例未创建的问题

// 路由模块
var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

// API路由（已去掉v1前缀）
var apiRouter = require('./routes/api');

// 天气路由
var weatherRouter = require('./routes/weather');
var weatherSimpleRouter = require('./routes/weather-simple');
var weatherV1Router = require('./routes/v1/weather');

// 中间件
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');

// 数据库连接测试
const { testConnection } = require('./config/database');

// 测试数据库连接
testConnection().catch(err => {
  console.error('数据库连接失败，请检查配置:', err.message);
});

// CORS跨域配置
app.use(cors({
  origin: '*', // 生产环境建议配置具体域名
  credentials: true
}));

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// 页面路由
app.use('/', indexRouter);
app.use('/users', usersRouter);

// API路由（监理日志小程序）
app.use('/api', apiRouter);

// 天气API路由
app.use('/api/weather', weatherRouter);
app.use('/api/weather', weatherSimpleRouter);
app.use('/api/v1/weather', weatherV1Router);

// 健康检查接口（用于云托管健康检测）
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: Date.now(),
    service: 'express-miniapp'
  });
});

// WebSocket 测试接口延迟注册函数
// 必须在 express-ws 初始化之后调用
app.initWebSocketTest = function() {
  // 检查 app.ws 是否存在
  if (typeof app.ws !== 'function') {
    console.error('❌ app.ws 不可用，express-ws 可能未正确初始化');
    return false;
  }

  // WebSocket 测试接口
  app.ws('/test-ws', (ws, req) => {
    console.log('✅ WebSocket 测试连接成功');
    ws.send(JSON.stringify({ 
      type: 'connected', 
      message: 'WebSocket 工作正常',
      timestamp: Date.now()
    }));
    
    ws.on('message', (msg) => {
      console.log('收到测试消息:', msg.toString());
      ws.send(JSON.stringify({ 
        type: 'echo', 
        data: msg.toString(),
        timestamp: Date.now()
      }));
    });
    
    ws.on('close', () => {
      console.log('WebSocket 测试连接已关闭');
    });
  });

  console.log('✓ WebSocket 测试接口已注册');
  return true;
};

// 环境变量诊断接口（用于排查配置问题）
app.get('/diagnose', (req, res) => {
  const config = require('./config/index');
  res.json({
    timestamp: Date.now(),
    environment: {
      NODE_ENV: process.env.NODE_ENV || '(未设置)',
      CLOUDBASE_ENV: process.env.CLOUDBASE_ENV || '(未设置)'
    },
    database: {
      host: config.database.host,
      port: config.database.port,
      database: config.database.database,
      user: config.database.user,
      hasPassword: !!process.env.DB_PASSWORD,
      envVars: {
        DB_HOST_INTERNAL: process.env.DB_HOST_INTERNAL || '(未设置)',
        DB_PORT_INTERNAL: process.env.DB_PORT_INTERNAL || '(未设置)',
        DB_HOST_EXTERNAL: process.env.DB_HOST_EXTERNAL || '(未设置)',
        DB_PORT_EXTERNAL: process.env.DB_PORT_EXTERNAL || '(未设置)',
        DB_USER: process.env.DB_USER || '(未设置)',
        DB_NAME: process.env.DB_NAME || '(未设置)'
      }
    },
    wechat: {
      hasAppId: !!process.env.WECHAT_APPID,
      hasAppSecret: !!process.env.WECHAT_APPSECRET
    },
    diagnosis: {
      isProduction: process.env.NODE_ENV === 'production',
      shouldUseInternal: process.env.NODE_ENV === 'production',
      hasInternalConfig: !!(process.env.DB_HOST_INTERNAL && process.env.DB_PORT_INTERNAL),
      hasExternalConfig: !!(process.env.DB_HOST_EXTERNAL && process.env.DB_PORT_EXTERNAL),
      isLocalhost: config.database.host === 'localhost' || config.database.host === '127.0.0.1',
      warning: config.database.host === 'localhost' || config.database.host === '127.0.0.1' 
        ? '❌ 数据库地址是本地地址，连接会失败！请检查环境变量配置。'
        : null
    }
  });
});


// 404错误处理
app.use(notFoundHandler);

// 全局错误处理
app.use(errorHandler);

module.exports = app;
