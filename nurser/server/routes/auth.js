import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import axios from 'axios';

const router = express.Router();

// Local login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.json({ token });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GitHub OAuth
router.get('/github', (req, res) => {
  const url = `https://github.com/login/oauth/authorize?client_id=${process.env.GITHUB_CLIENT_ID}`;
  res.redirect(url);
});

router.get('/github/callback', async (req, res) => {
  try {
    const { code } = req.query;
    const { data } = await axios.post(
      'https://github.com/login/oauth/access_token',
      {
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code,
      },
      { headers: { accept: 'application/json' } }
    );

    const { access_token } = data;
    const { data: userData } = await axios.get('https://api.github.com/user', {
      headers: { Authorization: `token ${access_token}` }
    });

    // Find or create user in your DB
    let user = await User.findOne({ githubId: userData.id });
    if (!user) {
      user = new User({
        githubId: userData.id,
        email: userData.email || `${userData.login}@github.com`,
        name: userData.name || userData.login
      });
      await user.save();
    }

    const token = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.redirect(`${process.env.CLIENT_URL}/auth/callback?token=${token}`);
  } catch (error) {
    res.redirect(`${process.env.CLIENT_URL}/login?error=github_auth_failed`);
  }
});

export default router;