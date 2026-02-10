import express, { Application } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { config } from './config';
import { errorHandler, notFoundHandler } from './middleware/error-handler';
import { requestLogger, productionLogger } from './middleware/logger';
import routes from './routes';
import { initJobs } from './jobs';

const app: Application = express();

// ============================================
// Security Middleware
// ============================================
app.use(
  helmet({
    contentSecurityPolicy: config.nodeEnv === 'production',
  }),
);

app.use(
  cors({
    origin: config.corsOrigin,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }),
);

// ============================================
// Rate Limiting
// ============================================
const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(limiter);

// Stricter limit for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 requests per windowMs
  message: 'Too many authentication attempts, please try again later',
});

app.use(`/${config.apiPrefix}/auth`, authLimiter);

// ============================================
// Body Parsing
// ============================================
app.use(
  express.json({
    limit: '10mb',
    verify: (req: any, _res, buf) => {
      req.rawBody = buf;
    },
  }),
);
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ============================================
// Logging
// ============================================
if (config.nodeEnv === 'development') {
  app.use(requestLogger);
} else {
  app.use(productionLogger);
}

// ============================================
// API Routes
// ============================================
app.use(`/${config.apiPrefix}`, routes);

// Root endpoint
app.get('/', (_req, res) => {
  res.json({
    success: true,
    message: 'BarterDash API - Express + Drizzle ORM',
    version: '1.0.0',
    environment: config.nodeEnv,
    endpoints: {
      health: `/${config.apiPrefix}/health`,
      auth: `/${config.apiPrefix}/auth`,
      auctions: `/${config.apiPrefix}/auctions`,
    },
  });
});

// ============================================
// Error Handling
// ============================================
app.use(notFoundHandler);
app.use(errorHandler);

// ============================================
// Initialize Background Jobs
// ============================================
initJobs();

// ============================================
// Server Start
// ============================================
const PORT = config.port || 3000;

const server = app.listen(PORT, () => {
  console.log('');
  console.log('╔══════════════════════════════════════════════╗');
  console.log('║   BarterDash Backend - Express + Drizzle    ║');
  console.log('╚══════════════════════════════════════════════╝');
  console.log('');
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📝 Environment: ${config.nodeEnv}`);
  console.log(`🌐 API Base: http://localhost:${PORT}/${config.apiPrefix}`);
  console.log(
    `💚 Health Check: http://localhost:${PORT}/${config.apiPrefix}/health`,
  );
  console.log('');
  console.log('Available Routes:');
  console.log(`  - POST /${config.apiPrefix}/auth/sync`);
  console.log(`  - POST /${config.apiPrefix}/auth/logout`);
  console.log(`  - GET  /${config.apiPrefix}/auth/me`);
  console.log(`  - POST /${config.apiPrefix}/auctions`);
  console.log(`  - GET  /${config.apiPrefix}/auctions`);
  console.log(`  - GET  /${config.apiPrefix}/auctions/:id`);
  console.log(`  - POST /${config.apiPrefix}/auctions/:id/go-live`);
  console.log('');
});

// ============================================
// Graceful Shutdown
// ============================================
const gracefulShutdown = async (signal: string) => {
  console.log(`\n${signal} received. Starting graceful shutdown...`);

  server.close(() => {
    console.log('✅ HTTP server closed');
    console.log('👋 Goodbye!');
    process.exit(0);
  });

  // Force close after 10 seconds
  setTimeout(() => {
    console.error('⚠️  Forcing shutdown after timeout');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  gracefulShutdown('UncaughtException');
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  gracefulShutdown('UnhandledRejection');
});

export default app;
