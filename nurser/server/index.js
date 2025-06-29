require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const session = require('express-session');
const passport = require('passport');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');
const GitHubStrategy = require('passport-github2').Strategy;

const app = express();

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL,
  credentials: true
}));
app.use(express.json());
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());

// Define the base URL for the backend API for internal use (Swagger, GitHub callback)
// This should match how your routes are mounted, typically including the /api prefix.
const BACKEND_API_URL = `http://localhost:${process.env.PORT || 5500}/api`;

// Swagger setup
const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Nurse Duty Manager API',
      version: '1.0.0',
      description: 'API for managing nurse duties and shifts',
    },
    servers: [
      {
        url: BACKEND_API_URL, // Use the internally constructed backend API URL
      },
    ],
  },
  apis: ['./routes/*.js'],
};

const specs = swaggerJsdoc(options);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));

// GitHub OAuth Strategy
passport.use(new GitHubStrategy({
    clientID: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
    // Use the specific GITHUB_CALLBACK_URL from your .env for this
    callbackURL: process.env.GITHUB_CALLBACK_URL
  },
  function(accessToken, refreshToken, profile, done) {
    // Here you would typically find or create a user in your database
    return done(null, profile);
  }
));

passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((obj, done) => {
  done(null, obj);
});

// Routes - ENSURE these files exist in ./routes/
app.use('/api/auth', require('./routes/auth'));
app.use('/api/duties', require('./routes/duties'));
app.use('/api/shifts', require('./routes/shifts')); // Make sure server/routes/shifts.js exists
app.use('/api/patients', require('./routes/patients')); // Make sure server/routes/patients.js exists
// If you have more routes (e.g., users, nurses), ensure they are also included and their files exist.

// Database connection
mongoose.connect(process.env.MONGODB_URL)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Start server
const PORT = process.env.PORT || 5500
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  // Use the constructed URL for the API docs link
  console.log(`API docs available at http://localhost:${PORT}/api-docs`);
});