const express = require('express');
const router = express.Router();
const passport = require('passport');
const jwt = require('jsonwebtoken');

/**
 * @swagger
 * tags:
 *   name: Authentication
 *   description: User authentication endpoints
 */

/**
 * @swagger
 * /auth/github:
 *   get:
 *     summary: Initiate GitHub OAuth login
 *     tags: [Authentication]
 *     responses:
 *       302:
 *         description: Redirect to GitHub for authentication
 */
router.get('/github', passport.authenticate('github', { scope: ['user:email'] }));

/**
 * @swagger
 * /auth/github/callback:
 *   get:
 *     summary: GitHub OAuth callback
 *     tags: [Authentication]
 *     responses:
 *       302:
 *         description: Redirect to frontend with token
 *       401:
 *         description: Unauthorized
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
 * /auth/logout:
 *   get:
 *     summary: Logout user
 *     tags: [Authentication]
 *     responses:
 *       200:
 *         description: Successfully logged out
 */
router.get('/logout', (req, res) => {
  req.logout();
  res.redirect(process.env.CLIENT_URL);
});

module.exports = router;