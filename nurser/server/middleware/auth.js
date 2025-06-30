const jwt = require('jsonwebtoken');

module.exports = function(req, res, next) {
  // Get token from header, query param, or cookies
  const token = req.header('x-auth-token') || req.query.token || req.cookies?.token;

  // Check if no token
  if (!token) {
    console.error('No token provided for route:', req.originalUrl);
    return res.status(401).json({ 
      success: false,
      error: 'Authorization token required'
    });
  }

  // Verify token
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET, {
      algorithms: ['HS256'], // Only allow HS256 algorithm
      maxAge: '1h' // Must match your token expiration
    });
    
    // Attach full decoded user to request
    req.user = {
      id: decoded.userId,
      role: decoded.role // Assuming your JWT includes role
    };
    
    console.log(`Authenticated request from user ${decoded.userId}`);
    next();
  } catch (err) {
    console.error('JWT verification failed:', err.message);
    
    const errorResponse = {
      success: false,
      error: 'Invalid token'
    };

    // More specific error messages for debugging
    if (err.name === 'TokenExpiredError') {
      errorResponse.error = 'Token expired';
      errorResponse.expiredAt = err.expiredAt;
    } else if (err.name === 'JsonWebTokenError') {
      errorResponse.error = 'Malformed token';
    }

    res.status(401).json(errorResponse);
  }
};