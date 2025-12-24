const authService = require('../services/authService');
const User = require('../models/User');

// Middleware to verify JWT and attach user payload to req.user
async function authenticate(req, res, next) {
    try {
        const header = process.env.TOKEN_HEADER_KEY || 'authorization';
        const token = req.header(header);
        if (!token) return res.status(401).json({ success: false, message: 'No token provided' });

        const payload = authService.verifyToken(token);
        if (!payload || !payload.userId) return res.status(401).json({ success: false, message: 'Invalid token' });

        // Attach full user from DB to req.user
        const user = await User.findById(payload.userId).select('-password');
        if (!user) return res.status(401).json({ success: false, message: 'User not found' });

        req.user = user;
        next();
    } catch (err) {
        return res.status(401).json({ success: false, message: err.message || 'Unauthorized' });
    }
}

// Middleware factory to require a specific role
function requireRole(role) {
    return (req, res, next) => {
        if (!req.user) return res.status(401).json({ success: false, message: 'Unauthorized' });
        if (req.user.role !== role) return res.status(403).json({ success: false, message: 'Forbidden: insufficient role' });
        next();
    };
}

module.exports = { authenticate, requireRole };
