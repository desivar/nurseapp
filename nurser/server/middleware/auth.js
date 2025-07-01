// server/middleware/auth.js
import jwt from 'jsonwebtoken'; // Changed from require()

const authMiddleware = (req, res, next) => { // Encapsulated in a named function
  // Get token from header
  const token = req.header('x-auth-token') || req.query.token;

  // Check if no token
  if (!token) {
    return res.status(401).json({ msg: 'No token, authorization denied' });
  }

  // Verify token
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded.userId;
    next();
  } catch (err) {
    res.status(401).json({ msg: 'Token is not valid' });
  }
};

export default authMiddleware; // Changed from module.exports