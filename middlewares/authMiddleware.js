import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const protect = async (req, res, next) => {
  let token = null;

  // ✅ Method 1: Check Authorization header
  if (req.headers.authorization) {
    const authHeader = req.headers.authorization;
    
    if (authHeader.startsWith('Bearer ')) {
      token = authHeader.slice(7); // Remove "Bearer " prefix

    }
  }

  // ✅ Method 2: Check if no token from header, check cookies
  if (!token && req.cookies?.token) {
    token = req.cookies.token;
    
  }

  // ✅ Token not found
  if (!token) {

    return res.status(401).json({ 
      success: false, 
      message: 'Not authorized to access this route - no token found' 
    });
  }

  try {
    // ✅ Verify the token
  
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
   
    
    // ✅ Fetch user from database
    req.user = await User.findById(decoded.id).select('-password');
    
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        message: 'User not found' 
      });
    }
    
    next();
    
  } catch (error) {
    console.error('Token verification failed:', error.message);
    
    // ✅ More detailed error messages
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        success: false, 
        message: 'Token has expired' 
      });
    }
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid token' 
      });
    }
    
    return res.status(401).json({ 
      success: false, 
      message: 'Token verification failed: ' + error.message
    });
  }
};

export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        success: false, 
        message: `User role '${req.user.role}' is not authorized for this route. Required: ${roles.join(', ')}` 
      });
    }
    next();
  };
};
