const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: [true, 'User must have a username'],
        trim: true
    },
    email: {
        type: String,
        required: [true, 'User must have an email'],
        unique: true,
        lowercase: true,
        trim: true
    },
    passwordHash: {
        type: String,
        default: null // Only used for 'local' provider
    },
    authProvider: {
        type: String,
        enum: ['local', 'google'],
        required: true
    },
    googleId: {
        type: String,
        default: null
    },
    profilePicture: {
        type: String,
        default: null
    },
    isEmailVerified: {
        type: Boolean,
        default: function () {
            return this.authProvider === 'google';
        }
    },
    lastLogin: {
        type: Date,
        default: null
    }
}, {
    timestamps: true // Adds createdAt and updatedAt
});

const User = mongoose.model('User', userSchema);
module.exports = User;
