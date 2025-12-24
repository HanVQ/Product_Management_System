const express = require('express');
const authController = require('../controllers/authController');
const passport = require('passport');

const router = express.Router();

// Sign up route
router.post('/signup', (req, res) => authController.signup(req, res));

// Verify email route (token expected as query param: ?token=...)
router.get('/verify-email', (req, res) => authController.verifyEmail(req, res));

// Login route
router.post('/login', (req, res) => authController.login(req, res));

// Verify token route
router.get('/verify', (req, res) => authController.verifyToken(req, res));

// 1. Tuyến đường khởi tạo Google Sign-In
router.get('/auth/google', passport.authenticate('google', { 
    scope: ['profile', 'email'], 
    session: false 
}));

// 2. Tuyến đường xử lý phản hồi Google (Callback)
// Nếu thất bại (lỗi kết nối/cấu hình), nó sẽ chuyển hướng về '/'
router.get('/auth/google/callback', 
    passport.authenticate('google', { 
        failureRedirect: '/', // Chuyển hướng về trang chủ/login nếu thất bại
        session: false 
    }), 
    (req, res) => authController.googleCallback(req, res) // Nếu thành công, gọi controller
);

module.exports = router;
