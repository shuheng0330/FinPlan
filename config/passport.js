const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const bcrypt = require('bcryptjs');
const User = require('../models/userModel');

// Local Strategy
passport.use(new LocalStrategy({
    usernameField: 'email'
}, async (email, password, done) => {
    try {
        const user = await User.findOne({ email, authProvider: 'local' });
        if (!user) return done(null, false, { message: 'No user with that email or not a local account.' });

        if (!user.passwordHash) {
            return done(null, false, { message: 'User not registered via local strategy.' });
        }

        const isMatch = await bcrypt.compare(password, user.passwordHash);
        if (!isMatch) return done(null, false, { message: 'Incorrect password' });

        return done(null, user);
    } catch (err) {
        return done(err);
    }
}));

console.log("GOOGLE_CLIENT_ID:", process.env.GOOGLE_CLIENT_ID);
console.log("GOOGLE_CLIENT_SECRET:", process.env.GOOGLE_CLIENT_SECRET);

// Google Strategy
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "/users/auth/google/callback"
},
    async (accessToken, refreshToken, profile, done) => {
        try {
            let user = await User.findOne({ googleId: profile.id });

            if (!user) {
                const existingLocalUser = await User.findOne({ email: profile.emails[0].value, authProvider: 'local' });

                if (existingLocalUser) {
                    existingLocalUser.googleId = profile.id;
                    existingLocalUser.profilePicture = profile.photos[0].value;
                    await existingLocalUser.save();
                    return done(null, existingLocalUser);
                }

                user = await User.create({
                    username: profile.displayName,
                    email: profile.emails[0].value,
                    googleId: profile.id,
                    authProvider: 'google',
                    profilePicture: profile.photos[0].value
                });
            }

            return done(null, user);
        } catch (err) {
            console.error("Google Strategy Error:", err);
            return done(err, null);
        }
    }
));

// Session handlers
passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
    try {
        const user = await User.findById(id);
        done(null, user);
    } catch (err) {
        done(err, null);
    }
});