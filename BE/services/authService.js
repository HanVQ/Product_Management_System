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
}

module.exports = new AuthService();
