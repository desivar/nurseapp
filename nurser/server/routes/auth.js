const express = require('express');
const router = express.Router();
const passport = require('passport');
const jwt = require('jsonwebtoken');

// Middleware to verify JWT token
const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Extract token from "Bearer TOKEN"

  if (token == null) return res.status(401).json({ message: 'No token provided' }); // No token

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      console.error("JWT verification error:", err);
      // If token is invalid or expired, clear it from client storage
      // This part should ideally be handled by the frontend's AuthContext after receiving 403
      return res.status(403).json({ message: 'Invalid or expired token' }); // Forbidden
    }
    req.user = user; // Attach user payload from token
    next(); // Proceed to the route handler
  });
};

/**
 * @swagger
 * tags:
 * name: Authentication
 * description: User authentication endpoints
 */

/**
 * @swagger
 * /auth/github:
 * get:
 * summary: Initiate GitHub OAuth login
 * tags: [Authentication]
 * responses:
 * 302:
 * description: Redirect to GitHub for authentication
 */
router.get('/github', passport.authenticate('github', { scope: ['user:email'] }));

/**
 * @swagger
 * /auth/github/callback:
 * get:
 * summary: GitHub OAuth callback
 * tags: [Authentication]
 * responses:
 * 302:
 * description: Redirect to frontend with token
 * 401:
 * description: Unauthorized
 */
router.get('/github/callback', 
  passport.authenticate('github', { failureRedirect: '/login' }),
  (req, res) => {
    // Successful authentication, generate JWT
    const token = jwt.sign(
      { userId: req.user.id, username: req.user.username },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
    
    // Redirect to frontend with token
    res.redirect(`${process.env.CLIENT_URL}/auth/callback?token=${token}`);
  }
);

/**
 * @swagger
 * /auth/verify:
 * get:
 * summary: Verify JWT token validity
 * tags: [Authentication]
 * security:
 * - bearerAuth: []
 * responses:
 * 200:
 * description: Token is valid
 * content:
 * application/json:
 * schema:
 * type: object
 * properties:
 * valid:
 * type: boolean
 * example: true
 * user:
 * type: object
 * properties:
 * userId:
 * type: string
 * username:
 * type: string
 * 401:
 * description: No token provided
 * 403:
 * description: Invalid or expired token
 */
router.get('/verify', verifyToken, (req, res) => {
  // If we reach here, the token has been verified by the middleware
  // and req.user contains the decoded payload.
  res.status(200).json({ valid: true, user: req.user });
});

/**
 * @swagger
 * /auth/logout:
 * post: # Changed to POST as typically logout involves state change (e.g., revoking token)
 * summary: Logout user
 * tags: [Authentication]
 * responses:
 * 200:
 * description: Successfully logged out
 * content:
 * application/json:
 * schema:
 * type: object
 * properties:
 * message:
 * type: string
 * example: Successfully logged out
 */
router.post('/logout', (req, res) => { // Changed to router.post
  // For JWT, actual "logout" on server side often means invalidating the token
  // or simply letting it expire. Here, we're just confirming.
  // The frontend handles clearing its local token.
  res.status(200).json({ message: 'Successfully logged out' });
});

module.exports = router;