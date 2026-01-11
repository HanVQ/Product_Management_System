const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const emailService = require('./emailService');

class AuthService {
    // Find user by email
    async findUserByEmail(email) {
        try {
            return await User.findOne({ email: email.toLowerCase() });
        } catch (error) {
            throw new Error('Error finding user: ' + error.message);
        }
    }

    // Create new user
    async createUser(userData) {
        try {
            const { name, email, password } = userData;

            // Check if user already exists
            const existingUser = await this.findUserByEmail(email);
            if (existingUser) {
                throw new Error('User already exists with this email');
            }

            // Hash password
            const hashedPassword = await bcrypt.hash(password, 10);

            // Generate verification token
            const verificationToken = crypto.randomBytes(32).toString('hex');
            const verificationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

            // Create new user in MongoDB
            const newUser = new User({
                name,
                email: email.toLowerCase(),
                password: hashedPassword,
                role: 'user',
                verificationToken,
                verificationTokenExpires,
                emailVerified: false,
            });

            await newUser.save();

            // Send verification email (emailService should implement sendVerificationEmail)
            let emailPreviewUrl = null;
            if (emailService && typeof emailService.sendVerificationEmail === 'function') {
                try {
                    const result = await emailService.sendVerificationEmail(newUser.email, newUser.name, verificationToken);
                    if (typeof result === 'string') emailPreviewUrl = result;
                    console.log('✅ Verification email sent for:', newUser.email);
                } catch (err) {
                    // log but don't block user creation
                    console.error('\u274c Email error:', err.message);
                }
            }

            return { user: newUser, emailPreviewUrl };
        } catch (error) {
            throw new Error(error.message);
        }
    }

    // Authenticate user
    async authenticateUser(email, password) {
        try {
            // Find user
            const user = await this.findUserByEmail(email);
            if (!user) {
                throw new Error('Invalid email or password');
            }

            // Compare password
            const passwordMatch = await bcrypt.compare(password, user.password);
            if (!passwordMatch) {
                throw new Error('Invalid email or password');
            }

            return user;
        } catch (error) {
            throw new Error(error.message);
        }
    }

    // Generate JWT token
    generateToken(user) {
        const JWT_SECRET = process.env.JWT_SECRET_KEY;
        if (!JWT_SECRET) {
            throw new Error('JWT_SECRET_KEY is not defined in environment variables.');
        }
        try {
            const token = jwt.sign(
                { userId: user._id, email: user.email, name: user.name, role: user.role || 'user', avatar: user.avatar || null }, JWT_SECRET, { expiresIn: '24h' }
            );
            return token;
        } catch (error) {
            throw new Error('Error generating token: ' + error.message);
        }
    }

    // Verify email verification token, mark user as verified
    async verifyEmailToken(token) {
        try {
            if (!token) throw new Error('Verification token is required');

            const user = await User.findOne({ verificationToken: token });
            if (!user) {
                throw new Error('Invalid verification token');
            }

            if (user.verificationTokenExpires && user.verificationTokenExpires < Date.now()) {
                throw new Error('Verification token has expired');
            }

            user.emailVerified = true;
            user.verificationToken = null;
            user.verificationTokenExpires = null;
            await user.save();

            return user;
        } catch (error) {
            throw new Error(error.message || 'Error verifying email token');
        }
    }

    // Verify JWT token
    verifyToken(token) {
        try {
            const JWT_SECRET = process.env.JWT_SECRET_KEY;
            if (!JWT_SECRET) throw new Error('JWT_SECRET_KEY not configured');
            const verified = jwt.verify(token, JWT_SECRET);
            return verified;
        } catch (error) {
            throw new Error('Invalid or expired token');
        }
    }

    // Format user response
    formatUserResponse(user) {
        return {
            id: user._id,
            name: user.name,
            email: user.email,
            emailVerified: user.emailVerified,
            avatar: user.avatar || null,
            role: user.role || 'user'
        };
    }

    // Generate HTML for auto-login
    generateAutoLoginHTML(user, frontendBase = null) {
        if (!frontendBase) {
            frontendBase = (process.env.FRONTEND_URL || process.env.APP_URL || 'http://localhost:5000')
                .replace(/\/+$/, '');
        }

        const token = this.generateToken(user);
        const payload = {
            token,
            user: {
                id: String(user._id),
                name: user.name,
                email: user.email,
                avatar: user.avatar || null,
                emailVerified: user.emailVerified || false,
                role: user.role || 'user'
            }
        };

        return `<!doctype html>
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
    }

    // Handle email verification and return auto-login response
    async handleEmailVerification(token) {
        try {
            if (!token) throw new Error('Verification token is required');
            
            const user = await this.verifyEmailToken(token);
            const frontendBase = (process.env.FRONTEND_URL || process.env.APP_URL || 'http://localhost:5000')
                .replace(/\/+$/, '');
            
            const html = this.generateAutoLoginHTML(user, frontendBase);
            return { success: true, html };
        } catch (err) {
            return { success: false, error: err.message };
        }
    }

    // Handle Google OAuth callback response
    async handleGoogleCallback(user) {
        try {
            if (!user) {
                throw new Error('User not provided');
            }

            const frontendBase = (process.env.FRONTEND_URL || process.env.APP_URL || 'http://localhost:5000')
                .replace(/\/+$/, '');
            
            const html = this.generateAutoLoginHTML(user, frontendBase);
            return { success: true, html };
        } catch (err) {
            return { success: false, error: err.message };
        }
    }

    // Handle verify token request
    handleVerifyTokenRequest(tokenFromHeader) {
        try {
            if (!tokenFromHeader) {
                return {
                    success: false,
                    statusCode: 401,
                    message: 'No token provided'
                };
            }

            const verified = this.verifyToken(tokenFromHeader);

            return {
                success: true,
                statusCode: 200,
                message: 'Token verified successfully',
                user: verified
            };
        } catch (error) {
            return {
                success: false,
                statusCode: 401,
                message: error.message
            };
        }
    }

    // Handle email verification with response action
    async handleEmailVerificationResponse(token, email) {
        try {
            const action = await this.handleEmailVerificationRequest(token, email);

            if (action.type === 'redirect') {
                return {
                    type: 'redirect',
                    redirectUrl: action.redirectUrl
                };
            }

            return {
                type: 'html',
                html: action.html,
                cookies: action.cookies
            };
        } catch (err) {
            return {
                type: 'redirect',
                redirectUrl: this.getVerificationFailureRedirectUrl(email)
            };
        }
    }

    // Handle Google callback response action
    async handleGoogleCallbackResponse(user) {
        try {
            const result = await this.handleGoogleCallback(user);

            if (!result.success) {
                return {
                    type: 'redirect',
                    redirectUrl: '/'
                };
            }

            return {
                type: 'html',
                html: result.html
            };
        } catch (error) {
            console.error('Google callback error:', error.message);
            return {
                type: 'redirect',
                redirectUrl: '/'
            };
        }
    }

    // Get fallback redirect URL for verification failure
    getVerificationFailureRedirectUrl(email = '') {
        const frontendBase = (process.env.FRONTEND_URL || process.env.APP_URL || 'http://localhost:5000').replace(/\/+$/, '');
        const emailB64 = Buffer.from(String(email)).toString('base64');
        return `${frontendBase}/?verified=false&email=${encodeURIComponent(emailB64)}`;
    }

    // Handle email verification request with complete response
    async handleEmailVerificationRequest(token, email) {
        try {
            if (!token) {
                return {
                    type: 'redirect',
                    redirectUrl: this.getVerificationFailureRedirectUrl(email)
                };
            }

            const result = await this.handleEmailVerification(token);

            if (!result.success) {
                return {
                    type: 'redirect',
                    redirectUrl: this.getVerificationFailureRedirectUrl(email)
                };
            }

            return {
                type: 'html',
                html: result.html,
                cookies: {
                    token: {
                        value: this.extractTokenFromHtml(result.html),
                        options: {
                            httpOnly: true,
                            maxAge: 24 * 60 * 60 * 1000,
                            secure: process.env.NODE_ENV === 'production',
                            sameSite: 'Lax'
                        }
                    }
                }
            };
        } catch (err) {
            return {
                type: 'redirect',
                redirectUrl: this.getVerificationFailureRedirectUrl(email)
            };
        }
    }

    // Extract token from generated HTML
    extractTokenFromHtml(html) {
        const match = html.match(/"token":"([^"]+)"/);
        return match ? match[1] : null;
    }

    // Handle signup request with validation
    async handleSignupRequest(data) {
        const { email, password, name } = data;

        if (!email || !password || !name) {
            return {
                success: false,
                statusCode: 400,
                message: 'Please provide email, password, and name'
            };
        }

        try {
            const result = await this.createUser({ name, email, password });
            const createdUser = result.user;
            const emailPreviewUrl = result.emailPreviewUrl;

            return {
                success: true,
                statusCode: 201,
                message: 'User registered successfully. Please check your email for verification link.',
                user: this.formatUserResponse(createdUser),
                emailPreviewUrl
            };
        } catch (error) {
            return {
                success: false,
                statusCode: 400,
                message: error.message
            };
        }
    }

    // Handle login request with validation
    async handleLoginRequest(data) {
        const { email, password } = data;

        if (!email || !password) {
            return {
                success: false,
                statusCode: 400,
                message: 'Please provide email and password'
            };
        }

        try {
            const user = await this.authenticateUser(email, password);

            if (!user.emailVerified) {
                return {
                    success: false,
                    statusCode: 403,
                    message: 'Please verify your email before logging in'
                };
            }

            if (user.status !== 'Active') {
                return {
                    success: false,
                    statusCode: 401,
                    message: 'Your account is not active'
                };
            }

            const token = this.generateToken(user);

            return {
                success: true,
                statusCode: 200,
                message: 'Login successful',
                token,
                user: this.formatUserResponse(user)
            };
        } catch (error) {
            return {
                success: false,
                statusCode: 401,
                message: error.message
            };
        }
    }
}

module.exports = new AuthService();
