const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const authService = require('./authService');

module.exports = function configurePassport() {
    const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
    const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
    const GOOGLE_CALLBACK_URL = process.env.GOOGLE_CALLBACK_URL || '/api/auth/google/callback';

    if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
        console.warn('Google OAuth client id/secret not configured. Skipping passport Google strategy.');
        return passport;
    }

    passport.use(new GoogleStrategy({
        clientID: GOOGLE_CLIENT_ID,
        clientSecret: GOOGLE_CLIENT_SECRET,
        callbackURL: GOOGLE_CALLBACK_URL,
    },
    // Verify callback
    async (accessToken, refreshToken, profile, done) => {
        try {
            // profile contains emails array and id
            const email = (profile.emails && profile.emails[0] && profile.emails[0].value) || null;
            const name = profile.displayName || (profile.name && `${profile.name.givenName} ${profile.name.familyName}`) || 'Google User';
            const providerId = profile.id;
            const avatar = (profile.photos && profile.photos[0] && profile.photos[0].value) || null;

            if (!email) {
                return done(new Error('No email found in Google profile'));
            }

            // Find existing user by email
            let user = await authService.findUserByEmail(email);

            if (user) {
                // Update provider fields if missing
                user.provider = 'google';
                user.providerId = providerId;
                if (avatar) user.avatar = avatar;
                user.emailVerified = true;
                if (!user.role) user.role = 'user';
                await user.save();
                return done(null, user);
            }

            // If user doesn't exist, create one without password
            const newUser = new (require('../models/User'))({
                name,
                email: email.toLowerCase(),
                password: null,
                provider: 'google',
                providerId,
                avatar,
                role: 'user',
                emailVerified: true,
            });

            await newUser.save();
            return done(null, newUser);
        } catch (err) {
            return done(err);
        }
    }));

    // Minimal serialize/deserialize for compatibility (not used if session:false)
    passport.serializeUser((user, done) => done(null, user._id));
    passport.deserializeUser(async (id, done) => {
        try {
            const User = require('../models/User');
            const user = await User.findById(id);
            done(null, user);
        } catch (err) {
            done(err);
        }
    });

    return passport;
};
