import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import session from 'express-session';
import passport from 'passport';
import { Strategy as GitHubStrategy } from 'passport-github2';

const startServer = async () => {
  // Initialize Express app
  const app = express();

  // =============================================
  // 1. DATABASE CONNECTION
  // =============================================
  try {
    await mongoose.connect(process.env.MONGODB_URL, {
      dbName: "nurse_duty_manager",
      auth: {
        username: process.env.DB_USER,
        password: process.env.DB_PASSWORD
      }
    });
    console.log('✅ MongoDB connected successfully');
  } catch (err) {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  }

  // =============================================
  // 2. MIDDLEWARE SETUP
  // =============================================
  app.use(cors({
    origin: process.env.CLIENT_URL,
    credentials: true
  }));

  app.use(express.json());

  app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false,
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000
    }
  }));

  app.use(passport.initialize());
  app.use(passport.session());

  // =============================================
  // 3. PASSPORT AUTHENTICATION SETUP
  // =============================================
  passport.use(new GitHubStrategy({
    clientID: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
    callbackURL: process.env.GITHUB_CALLBACK_URL,
    scope: ['user:email']
  }, 
  async (accessToken, refreshToken, profile, done) => {
    try {
      const user = {
        githubId: profile.id,
        username: profile.username,
        email: profile.emails?.[0]?.value,
        displayName: profile.displayName,
        role: 'admin'
      };
      return done(null, user);
    } catch (err) {
      return done(err);
    }
  }));

  passport.serializeUser((user, done) => done(null, user));
  passport.deserializeUser((obj, done) => done(null, obj));

  // =============================================
  // 4. ROUTES SETUP
  // =============================================
  const routes = [
    { path: '/api/auth', file: 'auth' },
    { path: '/api/duties', file: 'duties' },
    { path: '/api/shifts', file: 'shifts' },
    { path: '/api/patients', file: 'patients' }
  ];

  for (const route of routes) {
    try {
      const module = await import(`./routes/${route.file}.js`);
      app.use(route.path, module.default);
      console.log(`✅ Route ${route.path} mounted successfully`);
    } catch (err) {
      console.error(`❌ Failed to load route ${route.path}:`, err.message);
    }
  }

  // =============================================
  // 5. ERROR HANDLING
  // =============================================
  app.use((err, req, res, next) => {
    console.error('❌ Server error:', err.stack);
    res.status(500).json({ error: 'Internal Server Error' });
  });

  // =============================================
  // 6. SERVER STARTUP
  // =============================================
  const PORT = process.env.PORT || 5500;
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📚 API docs available at http://localhost:${PORT}/api-docs`);
    console.log(`🌐 Client URL: ${process.env.CLIENT_URL}`);
  });
};

startServer().catch(err => console.error('❌ Server startup error:', err));