import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import axios from 'axios';

const router = express.Router();

// =============================================
// 1. LOCAL LOGIN (Email/Password)
// =============================================
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Input validation
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // JWT Token generation
    const token = jwt.sign(
      { 
        id: user._id, 
        email: user.email,
        role: user.role // Include role in token
      },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.json({ 
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// =============================================
// 2. GITHUB OAUTH FLOW
// =============================================
router.get('/github', (req, res) => {
  // Generate GitHub OAuth URL with required scopes
  const url = `https://github.com/login/oauth/authorize?client_id=${
    process.env.GITHUB_CLIENT_ID
  }&scope=user:email`;
  
  res.redirect(url);
});

router.get('/github/callback', async (req, res) => {
  try {
    const { code } = req.query;
    
    if (!code) {
      return res.redirect(`${process.env.CLIENT_URL}/login?error=missing_code`);
    }

    // 1. Exchange code for access token
    const { data } = await axios.post(
      'https://github.com/login/oauth/access_token',
      {
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code,
      },
      { 
        headers: { 
          accept: 'application/json',
          'Content-Type': 'application/json'
        } 
      }
    );

    if (!data.access_token) {
      throw new Error('No access token received');
    }

    // 2. Get user data from GitHub
    const { data: githubUser } = await axios.get('https://api.github.com/user', {
      headers: { 
        Authorization: `Bearer ${data.access_token}`,
        Accept: 'application/json'
      }
    });

    // 3. Get primary email (separate API call)
    const { data: emails } = await axios.get('https://api.github.com/user/emails', {
      headers: { 
        Authorization: `Bearer ${data.access_token}`,
        Accept: 'application/json'
      }
    });
    
    const primaryEmail = emails.find(email => email.primary)?.email || 
                       `${githubUser.login}@users.noreply.github.com`;

    // 4. Find or create user
    let user = await User.findOne({ 
      $or: [
        { githubId: githubUser.id },
        { email: primaryEmail }
      ]
    });

    if (!user) {
      user = new User({
        githubId: githubUser.id,
        email: primaryEmail,
        name: githubUser.name || githubUser.login,
        // Default role for GitHub users
        role: 'user',
        // Mark as GitHub-authenticated
        authMethod: 'github'
      });
      await user.save();
    } else if (!user.githubId) {
      // Link existing account to GitHub
      user.githubId = githubUser.id;
      await user.save();
    }

    // 5. Generate JWT
    const token = jwt.sign(
      { 
        id: user._id,
        email: user.email,
        role: user.role
      },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    // 6. Redirect to frontend with token
    res.redirect(`${process.env.CLIENT_URL}/auth/callback?token=${token}`);
    
  } catch (error) {
    console.error('GitHub auth error:', error);
    res.redirect(`${process.env.CLIENT_URL}/login?error=github_auth_failed`);
  }
});

export default router;