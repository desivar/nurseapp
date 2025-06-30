const express = require('express');
const router = express.Router();
const passport = require('passport');
const jwt = require('jsonwebtoken');

// Middleware to verify JWT token
const verifyToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) return res.status(401).json({ message: 'No token provided' });

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            console.error("JWT verification error:", err);
            return res.status(403).json({ message: 'Invalid or expired token' });
        }
        req.user = user;
        next();
    });
};

/**
 * @swagger
 * tags:
 * - name: Authentication
 * description: User authentication endpoints
 * components:
 * securitySchemes:
 * bearerAuth:
 * type: http
 * scheme: bearer
 * bearerFormat: JWT
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
    // === START OF ADDED LOGGING ===
    console.log('--- GitHub Callback Backend Hit ---');
    console.log('req.user after Passport authentication:', req.user); // Should show GitHub profile data

    if (!req.user) {
      console.log('Error: User object is missing after GitHub authentication. Sending 401.');
      return res.status(401).json({ message: 'User not found' });
    }
    // === END OF ADDED LOGGING ===

    const token = jwt.sign(
      { userId: req.user.id, username: req.user.username }, // Assuming req.user.id and req.user.username exist
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    // === START OF ADDED LOGGING ===
    console.log('Successfully generated JWT Token.');
    // CAUTION: Do not log the full token in production logs! Just a snippet or confirmation.
    console.log('Token snippet:', token.substring(0, 30) + '...');
    const redirectUrl = `${process.env.CLIENT_URL}/auth/callback?token=${token}`;
    console.log('Backend redirecting to frontend URL:', redirectUrl);
    // === END OF ADDED LOGGING ===

    res.redirect(redirectUrl);
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
    res.status(200).json({ valid: true, user: req.user });
});

/**
 * @swagger
 * /auth/logout:
 * post:
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
router.post('/logout', (req, res) => {
    // Optionally: blacklist JWT on server or just rely on client to remove it
    res.status(200).json({ message: 'Successfully logged out' });
});

module.exports = router;