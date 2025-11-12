const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Verify token and attach user
const authMiddleware = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No token provided' });
  }

  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return res.status(401).json({ message: 'Invalid token user' });
    }

    req.user = user;
    next();
  } catch (err) {
    console.error('🔐 Auth error:', err.message);
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

// Ensure authenticated user is an admin
const requireAdmin = async (req, res, next) => {
  try {
    // Ensure authMiddleware ran first
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied: Admins only' });
    }

    next();
  } catch (err) {
    console.error('⚠️ Admin middleware error:', err.message);
    return res.status(500).json({ message: 'Server error in admin check' });
  }
};

module.exports = { authMiddleware, requireAdmin };
