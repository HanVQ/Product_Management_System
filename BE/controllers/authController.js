const authService = require('../services/authService');

class AuthController {
    // Sign up controller
    async signup(req, res) {
        try {
            const { email, password, name } = req.body;

            if (!email || !password || !name) {
                return res.status(400).json({
                    success: false,
                    message: 'Please provide email, password, and name',
                });
            }

            const result = await authService.createUser({ name, email, password });
            const createdUser = result && result.user ? result.user : result;
            const emailPreviewUrl = result && result.emailPreviewUrl ? result.emailPreviewUrl : null;

            const responseBody = {
                success: true,
                message: 'User registered successfully. Please check your email for verification link.',
                user: authService.formatUserResponse(createdUser),
            };

            if (emailPreviewUrl) {
                responseBody.emailPreviewUrl = emailPreviewUrl;
                console.log('Email preview URL:', emailPreviewUrl);
            }

            res.status(201).json(responseBody);
        } catch (error) {
            res.status(400).json({ success: false, message: error.message });
        }
    }

    // Login controller
    async login(req, res) {
        try {
            const { email, password } = req.body;

            if (!email || !password) {
                return res.status(400).json({ success: false, message: 'Please provide email and password' });
            }

            const user = await authService.authenticateUser(email, password);

            // Prevent login if email not verified
            if (!user.emailVerified) {
                return res.status(403).json({ success: false, message: 'Please verify your email before logging in' });
            }

            const token = authService.generateToken(user);

            res.status(200).json({ success: true, message: 'Login successful', token, user: authService.formatUserResponse(user) });
        } catch (error) {
            res.status(401).json({ success: false, message: error.message });
        }
    }

    // Verify email controller
    async verifyEmail(req, res) {
        const { token } = req.query;

        if (!token) {
            return res.status(400).json({ success: false, message: 'Verification token is required' });
        }

        try {
            const user = await authService.verifyEmailToken(token);
            const jwtToken = authService.generateToken(user);

            // Cookie options
            const cookieOptions = {
                httpOnly: true,
                maxAge: 24 * 60 * 60 * 1000, // 24h
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'Lax'
            };

            // Try set cookie
            try {
                res.cookie('token', jwtToken, cookieOptions);
            } catch (err) {
                console.error('Could not set auth cookie:', err.message);
            }

            const frontendBase = (process.env.FRONTEND_URL || process.env.APP_URL || 'http://localhost:5000')
                .replace(/\/+$/, '');

            const payload = {
                token: jwtToken,
                user: {
                    id: String(user._id),
                    name: user.name || '',
                    email: user.email,
                    role: user.role || 'user'
                }
            };

            // HTML auto-login
            const html = `<!doctype html>
            <html>
            <head><meta charset="utf-8"><title>Verification Success</title></head>
            <body>
            <script>
            (function(){
                const p = ${JSON.stringify(payload)};
                try {
                    localStorage.setItem('token', p.token);
                    localStorage.setItem('user', JSON.stringify(p.user));
                } catch(e) {}
                window.location = '${frontendBase}/';
            })();
            </script>
            </body>
            </html>`;

            return res.send(html);

        } catch (err) {
            console.error('Verification error:', err.message);

            // fallback redirect
            const frontendBase = (process.env.FRONTEND_URL || process.env.APP_URL || 'http://localhost:5000')
                .replace(/\/+$/, '');
            const emailB64 = Buffer.from(String(req.query.email || '')).toString('base64');
            const redirectUrl = `${frontendBase}/?verified=true&email=${encodeURIComponent(emailB64)}`;

            return res.redirect(redirectUrl);
        }
    }

    // Verify JWT token controller
    async verifyToken(req, res) {
        try {
            const tokenHeaderKey = process.env.TOKEN_HEADER_KEY || 'authorization';
            const token = req.header(tokenHeaderKey);

            if (!token) {
                return res.status(401).json({ success: false, message: 'No token provided' });
            }

            const verified = authService.verifyToken(token);

            res.status(200).json({ success: true, message: 'Token verified successfully', user: verified });
        } catch (error) {
            res.status(401).json({ success: false, message: error.message });
        }
    }

    // Google OAuth callback handler
    async googleCallback(req, res) {
        try {
            // Passport sets req.user
            const user = req.user;
            if (!user) {
                return res.redirect('/');
            }

            const token = authService.generateToken(user);

            // Return a small HTML page that sets token and user in localStorage then redirects
            const payload = {
                token,
                user: {
                    id: String(user._id),
                    name: user.name,
                    email: user.email,
                    avatar: user.avatar || null,
                    provider: user.provider || null,
                    role: user.role || 'user'
                }
            };

            const html = `<!doctype html><html><head><meta charset="utf-8"><title>Auth Success</title></head><body><script>(function(){const p = ${JSON.stringify(payload)}; try{localStorage.setItem('token', p.token); localStorage.setItem('user', JSON.stringify(p.user));}catch(e){}; window.location = '/';})();</script></body></html>`;
            return res.send(html);
        } catch (error) {
            console.error('Google callback error:', error.message);
            return res.redirect('/');
        }
    }
}

module.exports = new AuthController();
