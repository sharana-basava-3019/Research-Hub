const express = require('express');
const path = require('path');
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const hpp = require('hpp');
const swaggerUi = require('swagger-ui-express');
const connectDB = require('./config/database');
const errorHandler = require('./middleware/errorHandler');

// Load environment variables FIRST — must happen before any other module reads process.env
dotenv.config();

// ── Express App Setup ───────────────────────────────────────────────────────
const app = express();

// Security Middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// Allowed Origins for CORS
const defaultAllowedOrigins = [
  'https://research-kxmap9t0k-sharana.vercel.app',
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:5173',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:3001',
  'http://127.0.0.1:5173'
];

// Helper to determine if an origin is permitted
const isOriginAllowed = (origin) => {
  // Allow requests with no origin (mobile apps, curl, Postman, health checks)
  if (!origin) return true;

  // Environment-configured origins
  const envOrigins = (process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',') : [])
    .map(o => o.trim())
    .filter(Boolean);

  const allowedOrigins = [...defaultAllowedOrigins, ...envOrigins];
  if (process.env.FRONTEND_URL) {
    allowedOrigins.push(process.env.FRONTEND_URL.trim());
  }

  // Exact match
  if (allowedOrigins.includes(origin)) {
    return true;
  }

  // Allow any Vercel deployment preview / production domain
  if (/^https:\/\/[a-zA-Z0-9-]+(-[a-zA-Z0-9]+)*\.vercel\.app$/.test(origin) || /^https:\/\/.*\.vercel\.app$/.test(origin)) {
    return true;
  }

  // Allow any localhost or 127.0.0.1 development origin (any port)
  if (/^http:\/\/(localhost|127\.0\.0\.1)(:[0-9]+)?$/.test(origin)) {
    return true;
  }

  return false;
};

// CORS Configuration
const corsOptions = {
  origin: function (origin, callback) {
    if (isOriginAllowed(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin',
    'Access-Control-Request-Method',
    'Access-Control-Request-Headers'
  ],
  exposedHeaders: ['Content-Range', 'X-Content-Range', 'Authorization', 'X-Trace-Step', 'X-Trace-User-Found', 'X-Trace-Password-Match'],
  maxAge: 86400
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// Body Parser Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Data Sanitization against NoSQL Injection
app.use(mongoSanitize());

// Prevent HTTP Parameter Pollution
app.use(hpp());


// Logging Middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Rate Limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 1000,
  standardHeaders: true,
  legacyHeaders: false,
  // In development, only count failed responses toward the limit
  skipSuccessfulRequests: process.env.NODE_ENV === 'development',
  handler: (req, res) => {
    res.status(429).json({
      status: 'error',
      message: 'Too many requests from this IP, please try again in 15 minutes.'
    });
  }
});
app.use('/api/', limiter);

// Swagger API Documentation
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'RESEARCH-HUB API',
      version: '1.0.0',
      description: 'University Research Collaboration Platform API Documentation',
      contact: {
        name: 'API Support',
        email: 'support@research-hub.edu'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: process.env.NODE_ENV === 'production'
          ? `https://${process.env.RENDER_EXTERNAL_HOSTNAME || 'your-api.onrender.com'}`
          : `http://localhost:${process.env.PORT || 5000}`,
        description: process.env.NODE_ENV === 'production' ? 'Production Server' : 'Development Server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    },
    security: [{
      bearerAuth: []
    }]
  },
  apis: ['./routes/*.js']
};

let swaggerDocsCache = null;
const getSwaggerDocs = () => {
  if (!swaggerDocsCache) {
    const swaggerJsDoc = require('swagger-jsdoc');
    swaggerDocsCache = swaggerJsDoc(swaggerOptions);
  }
  return swaggerDocsCache;
};

app.use('/api-docs', swaggerUi.serve, (req, res, next) => {
  swaggerUi.setup(getSwaggerDocs())(req, res, next);
});

// API Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/projects', require('./routes/projectRoutes'));
app.use('/api/collaborations', require('./routes/collaborationRoutes'));
app.use('/api/analytics', require('./routes/analyticsRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/events', require('./routes/eventRoutes'));
app.use('/api/plagiarism', require('./routes/documentPlagiarismRoutes'));

// Route Aliases (support direct requests without /api prefix)
app.use('/auth', require('./routes/authRoutes'));
app.use('/users', require('./routes/userRoutes'));
app.use('/projects', require('./routes/projectRoutes'));
app.use('/collaborations', require('./routes/collaborationRoutes'));
app.use('/analytics', require('./routes/analyticsRoutes'));
app.use('/notifications', require('./routes/notificationRoutes'));
app.use('/events', require('./routes/eventRoutes'));
app.use('/plagiarism', require('./routes/documentPlagiarismRoutes'));

// Health Check Endpoint
app.get('/health', (req, res) => {
  const mongoose = require('mongoose');
  res.status(200).json({
    status: 'success',
    message: 'RESEARCH-HUB API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// Root Endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to RESEARCH-HUB API',
    version: '1.0.0',
    documentation: '/api-docs'
  });
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    status: 'error',
    message: 'Route not found'
  });
});

// Error Handler Middleware (must be last)
app.use(errorHandler);

// ── Bootstrap: connect to DB FIRST, then start HTTP server ─────────────────
// This is the critical fix — connectDB() MUST be awaited before app.listen().
// Without await, Express starts accepting requests while Mongoose is still
// connecting, causing "buffering timed out after 10000ms" errors on every
// DB query that arrives during the connection window.

const bootstrap = async () => {
  // 1. Connect to MongoDB and wait for it to be ready
  await connectDB();

  // 2. Only AFTER DB is ready, start HTTP server
  const PORT = process.env.PORT || 5000;
  const server = app.listen(PORT, () => {
    console.log(`\n🚀 RESEARCH-HUB Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
    console.log(`📖 API Documentation: http://localhost:${PORT}/api-docs`);
    console.log(`🏥 Health Check: http://localhost:${PORT}/health\n`);
  });

  // 3. Initialize Socket.io
  try {
    const { Server } = require('socket.io');
    const jwt = require('jsonwebtoken');
    const { setIO } = require('./utils/socketEmitter');

    const io = new Server(server, {
      cors: {
        origin: function (origin, callback) {
          if (isOriginAllowed(origin)) {
            callback(null, true);
          } else {
            callback(new Error('Not allowed by CORS'));
          }
        },
        methods: ['GET', 'POST'],
        credentials: true
      }
    });

    // Socket.io JWT Authentication Middleware
    io.use((socket, next) => {
      const token = socket.handshake.auth?.token || socket.handshake.query?.token;
      if (!token) {
        return next(); // Allow unauthenticated connections for public features
      }

      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        socket.user = decoded;
        next();
      } catch (err) {
        console.warn('Socket auth warning:', err.message);
        next(); // Connect as unauthenticated
      }
    });

    io.on('connection', (socket) => {
      if (socket.user && socket.user.id) {
        const userRoom = `user_${socket.user.id}`;
        socket.join(userRoom);
        console.log(`🔌 Socket connected: ${socket.id} (User: ${socket.user.id} in ${userRoom})`);
      } else {
        console.log(`🔌 Socket connected: ${socket.id} (Guest)`);
      }

      socket.on('join_project', (projectId) => {
        if (projectId) {
          socket.join(`project_${projectId}`);
          console.log(`👥 Socket ${socket.id} joined project_${projectId}`);
        }
      });

      socket.on('leave_project', (projectId) => {
        if (projectId) {
          socket.leave(`project_${projectId}`);
          console.log(`👋 Socket ${socket.id} left project_${projectId}`);
        }
      });

      socket.on('disconnect', (reason) => {
        // 'transport close'        = browser closed/refreshed the tab (expected)
        // 'client namespace disconnect' = client called socket.disconnect() (expected)
        // 'server namespace disconnect' = server kicked the client intentionally (expected)
        const expectedReasons = ['transport close', 'client namespace disconnect', 'server namespace disconnect'];
        if (expectedReasons.includes(reason)) {
          // Normal lifecycle — debug-level only, no ❌ alarm
          // console.debug(`Socket ${socket.id} disconnected (${reason})`);
        } else {
          // Unexpected — log for investigation (transport error, ping timeout, etc.)
          console.warn(`⚠️  Socket disconnected unexpectedly: ${socket.id} (${reason})`);
        }
      });
    });

    setIO(io);
    app.set('io', io);

    console.log('✅ Socket.io initialized with room and auth management');
  } catch (err) {
    console.warn('Socket.io could not be initialized:', err.message);
  }

  // Handle unhandled promise rejections
  process.on('unhandledRejection', (err) => {
    console.error(`Unhandled Rejection: ${err.message}`);
    server.close(() => process.exit(1));
  });
};

if (process.env.NODE_ENV !== 'test') {
  bootstrap().catch((err) => {
    console.error('❌ Fatal startup error:', err.message);
    process.exit(1);
  });
}

module.exports = app;
