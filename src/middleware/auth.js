const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'imovies_super_secret_jwt_key_2026';

exports.protect = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    if (!token) return res.status(401).json({ success: false, message: 'Not authorized' });

    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = await User.findById(decoded.id).select('-password');
    if (!req.user) return res.status(401).json({ success: false, message: 'User not found' });
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Token invalid' });
  }
};

exports.protectOrGuest = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    if (token) {
      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const user = await User.findById(decoded.id).select('-password');
        if (user) {
          req.user = user;
          return next();
        }
      } catch (e) {}
    }
    // Seamless Guest auto-provisioning
    let guestUser = await User.findOne({ email: 'guest@imovies.com' });
    if (!guestUser) {
      guestUser = await User.create({
        name: 'Guest Cinephile',
        email: 'guest@imovies.com',
        password: 'guestpassword123',
        role: 'user'
      });
    }
    req.user = guestUser;
    next();
  } catch (err) {
    next(err);
  }
};

exports.adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'admin') return next();
  return res.status(403).json({ success: false, message: 'Admin access required' });
};
