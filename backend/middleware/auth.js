const { verifyToken } = require('../utils/token');
const User = require('../models/User');
const AppError = require('../utils/AppError');

/**
 * Requires a valid JWT (Authorization: Bearer <token> or httpOnly cookie `token`).
 * Attaches req.user (full Mongo user doc, minus sensitive fields) on success.
 */
async function protect(req, res, next) {
  try {
    let token;
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    if (!token) {
      return next(new AppError('Not authenticated. Please log in.', 401));
    }

    const decoded = verifyToken(token);

    const user = await User.findById(decoded.id);
    if (!user || !user.isActive) {
      return next(new AppError('User no longer exists or is inactive.', 401));
    }

    if (user.changedPasswordAfter(decoded.iat)) {
      return next(new AppError('Password was changed recently. Please log in again.', 401));
    }

    req.user = user;
    next();
  } catch (err) {
    return next(new AppError('Invalid or expired token.', 401));
  }
}

/**
 * Restricts a route to specific roles. Use after `protect`.
 * Usage: restrictTo('admin'), restrictTo('doctor', 'admin')
 */
function restrictTo(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(new AppError('You do not have permission to perform this action.', 403));
    }
    next();
  };
}

module.exports = { protect, restrictTo };
