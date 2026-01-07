import express from 'express';
import { createServer } from 'http';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';

import { config } from './app-config/index.js';
import { logger } from './utils/logger.js';
import { authMiddleware } from './middlewares/permit.js';
import { errorHandler, notFoundHandler } from './middlewares/errorHandler.js';
import routes from './routes/index.js';
import { setupWebSocketServer } from './websocket/index.js';

const app = express();
const server = createServer(app);

// 安全中间件
app.use(helmet());

// CORS 配置
app.use(cors({
  origin: config.corsOrigins,
  credentials: true,
}));

// 请求解析
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// 压缩
app.use(compression());

// 请求日志
app.use((req, _res, next) => {
  logger.debug(`${req.method} ${req.path}`);
  next();
});

// 健康检查（不需要认证）
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});

// 认证中间件
app.use('/api', authMiddleware);

// API 路由
app.use('/api', routes);

// 404 处理
app.use(notFoundHandler);

// 错误处理
app.use(errorHandler);

// 设置 WebSocket 服务器
setupWebSocketServer(server);

// 启动服务（使用 http server 以支持 WebSocket）
server.listen(config.port, () => {
  logger.info(`[Server] docs-api running on http://localhost:${config.port}`);
  logger.info(`[Server] WebSocket available at ws://localhost:${config.port}/ws/collab`);
  logger.info(`[Server] Environment: ${config.env}`);
  logger.info(`[Server] Strapi URL: ${config.strapi.baseUrl}`);
});

export default app;
