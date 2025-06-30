require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const passport = require('passport');
const GitHubStrategy = require('passport-github2').Strategy;
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const User = require('./models/User');
const logger = require('./utils/logger');

const app = express();

// Security Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // limit each IP to 200 requests per windowMs
  message: 'Too many requests from this IP, please try again later'
});
app.use(limiter);

// Body Parsing
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Session Configuration with Mongo Store
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGODB_URL,
    collectionName: 'sessions',
    ttl: 24 * 60 * 60 // 1 day
  }),
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 1 day
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
  }
}));

// Passport Initialization
app.use(passport.initialize());
app.use(passport.session());

// Enhanced GitHub OAuth Strategy
passport.use(new GitHubStrategy({
    clientID: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
    callbackURL: process.env.GITHUB_CALLBACK_URL,
    scope: ['user:email'],
    passReqToCallback: true
  },
  async (req, accessToken, refreshToken, profile, done) => {
    try {
      logger.info(`GitHub authentication attempt for ${profile.username}`);
      
      // Find or create user in database
      let user = await User.findOne({ githubId: profile.id });
      
      if (!user) {
        user = await User.create({
          githubId: profile.id,
          username: profile.username,
          email: profile.emails?.[0]?.value,
          firstName: profile.displayName?.split(' ')[0] || profile.username,
          lastName: profile.displayName?.split(' ')[1] || 'GitHubUser',
          role: 'nurse', // Default role for GitHub users
          isActive: true
        });
        logger.info(`Created new user from GitHub: ${user.username}`);
      }
      
      return done(null, user);
    } catch (err) {
      logger.error('GitHub authentication error:', err);
      return done(err);
    }
  }
));

// Serialization/Deserialization
passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err);
  }
});

// Swagger Documentation
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Nurse Duty Manager API',
      version: '1.0.0',
      description: 'API Documentation for Nurse Scheduling System',
      contact: {
        name: 'API Support',
        email: 'support@nursemanager.com'
      }
    },
    servers: [{
      url: `${process.env.BASE_URL || 'http://localhost:5500'}/api`,
      description: process.env.NODE_ENV === 'production' 
        ? 'Production server' 
        : 'Development server'
    }],
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

const specs = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));

// Database Connection with Enhanced Configuration
mongoose.connect(process.env.MONGODB_URL, {
  auth: {
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD
  },
  authSource: 'admin',
  retryWrites: true,
  w: 'majority',
  socketTimeoutMS: 30000,
  connectTimeoutMS: 30000
})
.then(() => logger.info('MongoDB connected successfully'))
.catch(err => logger.error('MongoDB connection error:', err));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/duties', require('./routes/duties'));
app.use('/api/shifts', require('./routes/shifts'));
app.use('/api/patients', require('./routes/patients'));

// Health Check Endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date(),
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// Error Handling Middleware
app.use((err, req, res, next) => {
  logger.error(err.stack);
  res.status(500).json({
    status: 'error',
    message: process.env.NODE_ENV === 'development' 
      ? err.message 
      : 'Internal server error'
  });
});

// Start Server
const PORT = process.env.PORT || 5500;
const server = app.listen(PORT, () => {
  logger.info(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  logger.info(`API documentation: http://localhost:${PORT}/api-docs`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  logger.error('Unhandled Rejection:', err);
  server.close(() => process.exit(1));
});

module.exports = app;