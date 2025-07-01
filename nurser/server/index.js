require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const session = require('express-session');
const passport = require('passport');
const GitHubStrategy = require('passport-github2').Strategy;

// Initialize Express app
const app = express();

// =============================================
// 1. DATABASE CONNECTION
// =============================================
mongoose.connect(process.env.MONGODB_URL, {
  auth: {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD
  },
  authSource: 'admin',
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('✅ MongoDB connected successfully'))
.catch(err => console.error('❌ MongoDB connection error:', err));

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
    secure: false, // Set to true in production with HTTPS
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 1 day
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
    // This is where you should add your user creation/login logic
    // For now, we'll just pass the profile info
    const user = {
      githubId: profile.id,
      username: profile.username,
      email: profile.emails?.[0]?.value,
      displayName: profile.displayName,
      role: 'admin' // You'll want to change this to check against a list of approved admins
    };
    return done(null, user);
  } catch (err) {
    return done(err);
  }
}));

// Serialization/Deserialization
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

routes.forEach(route => {
  try {
    app.use(route.path, require(`./routes/${route.file}`));
    console.log(`✅ Route ${route.path} mounted successfully`);
  } catch (err) {
    console.error(`❌ Failed to load route ${route.path}:`, err.message);
  }
});

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