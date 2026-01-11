const authService = require('../services/authService');

class AuthController {
    // Sign up controller
    async signup(req, res) {
        const response = await authService.handleSignupRequest(req.body);
        return res.status(response.statusCode).json(response);
    }

    // Login controller
    async login(req, res) {
        const response = await authService.handleLoginRequest(req.body);
        return res.status(response.statusCode).json(response);
    }

    // Verify email controller
    async verifyEmail(req, res) {
        const { token, email } = req.query;
        const action = await authService.handleEmailVerificationResponse(token, email);

        if (action.type === 'redirect') {
            return res.redirect(action.redirectUrl);
        }

        if (action.cookies) {
            Object.entries(action.cookies).forEach(([name, config]) => {
                try {
                    res.cookie(name, config.value, config.options);
                } catch (err) {
                    console.error(`Could not set ${name} cookie:`, err.message);
                }
            });
        }

        return res.send(action.html);
    }

    // Verify JWT token controller
    async verifyToken(req, res) {
        const tokenHeaderKey = process.env.TOKEN_HEADER_KEY || 'authorization';
        const token = req.header(tokenHeaderKey);
        const response = await authService.handleVerifyTokenRequest(token);

        return res.status(response.statusCode).json(response);
    }

    // Google OAuth callback handler
    async googleCallback(req, res) {
        const user = req.user;
        const action = await authService.handleGoogleCallbackResponse(user);

        if (action.type === 'redirect') {
            return res.redirect(action.redirectUrl);
        }

        return res.send(action.html);
    }
}

module.exports = new AuthController();
