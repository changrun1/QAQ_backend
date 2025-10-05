import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import morgan from 'morgan';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { connectDatabase } from './config/database';
import { errorMiddleware } from './middleware/error.middleware';

// 載入環境變數
dotenv.config();

// Routes
import authRoutes from './routes/auth.routes';
import dataRoutes from './routes/data.routes';
import courseRoutes from './routes/course.routes';

const app: Application = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet()); // 安全性 headers
app.use(morgan('dev')); // HTTP 請求日誌
app.use(
  cors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
    credentials: true,
  })
);
app.use(express.json({ limit: '10mb' })); // 增加限制，支援大量數據上傳
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/data', dataRoutes); // 數據同步 API
app.use('/api/courses', courseRoutes); // 課程查詢 API

// 404 處理
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
  });
});

// Error handling
app.use(errorMiddleware);

// 啟動伺服器
const startServer = () => {
  try {
    // 連接資料庫
    connectDatabase();

    // 啟動伺服器
    app.listen(PORT, () => {
      console.log('');
      console.log('┌─────────────────────────────────────────┐');
      console.log('│  🚀 QAQ Backend Server Started!        │');
      console.log('├─────────────────────────────────────────┤');
      console.log(`│  📍 URL: http://localhost:${PORT}        │`);
      console.log(`│  📝 ENV: ${process.env.NODE_ENV || 'development'}             │`);
      console.log('│  📚 API: /api/auth/login               │');
      console.log('│  ❤️  Health: /health                    │');
      console.log('└─────────────────────────────────────────┘');
      console.log('');
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// 優雅關閉
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('\nSIGINT received, shutting down gracefully...');
  process.exit(0);
});

startServer();
