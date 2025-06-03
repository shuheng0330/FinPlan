const express = require('express');
const passport = require('passport');
const User = require('../models/userModel');
const userController = require('../controllers/userController');
const multer = require('multer');
const path = require('path');
const router = express.Router();

const requireLogin = (req, res, next) => {
    if (!req.isAuthenticated()) {
        return res.status(401).json({ message: 'Unauthorized: Please log in.' });
    }
    next();
};

// Google OAuth
router.get('/auth/google',
    passport.authenticate('google', { scope: ['profile', 'email'] })
);

router.get('/auth/google/callback',
    passport.authenticate('google', {
        failureRedirect: '/'
    }),
    (req, res) => {
        if (req.user) {
            req.user.lastLogin = new Date();
            req.user.save();
        }

        req.session.userId = req.user._id;
        res.redirect('/dashboard');
    }
);

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        // Ensure this folder exists: path.join(__dirname, '..', 'public', 'uploads', 'profile_pics')
        cb(null, "public/uploads/profile_pics");
    },
    filename: function (req, file, cb) {
        const ext = path.extname(file.originalname);
        const userId = req.user ? req.user._id : null;
        if (!userId) {
            return cb(new Error("User ID not found in session for file upload."));
        }
        cb(null, userId + "_profile" + ext);
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter: function (req, file, cb) {
        const allowedTypes = /jpeg|jpg|png/;
        const ext = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mime = allowedTypes.test(file.mimetype);
        if (ext && mime) cb(null, true);
        else cb(new Error("Only .jpeg, .jpg and .png allowed"));
    }
});

// Register
router.post('/register', userController.createUser);

// Login
router.post('/login', (req, res, next) => {
    passport.authenticate('local', (err, user, info) => {
        if (err) {
            console.error("Passport Authentication Error:", err);
            // Internal server error for unexpected authentication issues
            return res.status(500).json({ message: 'An internal server error occurred during authentication.' });
        }
        if (!user) {
            return res.status(401).json({ message: info.message || 'Login failed: Invalid credentials.' });
        }
        // If authentication successful, log the user in via Passport
        req.logIn(user, (err) => {
            if (err) {
                console.error("req.logIn Error:", err);
                return res.status(500).json({ message: 'Could not log in user after authentication.' });
            }
            req.session.userId = user._id;

            // Send a success JSON response
            return res.status(200).json({ message: 'Login successful!', user: { id: user._id, username: user.username, email: user.email } });
        });
    })(req, res, next);
});

// Logout
router.get('/logout', (req, res, next) => {
    req.logout(err => {
        if (err) {
            console.error("Logout error:", err);
            return next(err);
        }
        // Destroy the session (optional, Passport's logout might handle much of this)
        req.session.destroy(sessionErr => {
            if (sessionErr) {
                console.error("Session destruction error during logout:", sessionErr);
            }
            res.redirect('/');
        });
    });
});

router.patch('/:id', userController.updateUser);

// Delete a user's own account
router.post('/delete-account', requireLogin, userController.deleteAccount);

// Update user info (profile) - for logged-in user
router.post('/profile/updateProfile', requireLogin, userController.updateProfile);

// Profile Picture Upload Route
router.post("/upload-profile-picture", requireLogin, upload.single("profilePicture"), async (req, res) => {
    try {
        const userId = req.user._id;
        if (!userId) {
            return res.status(401).json({ success: false, message: "Unauthorized: User ID not found in session." });
        }

        if (!req.file) {
            return res.status(400).json({ success: false, message: "No file uploaded." });
        }

        const filePath = "/uploads/profile_pics/" + req.file.filename;

        // Update user with new profile picture path
        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { profilePicture: filePath, updatedAt: new Date() },
            { new: true }
        );

        res.json({ success: true, profilePicture: filePath, user: updatedUser });
    } catch (error) {
        console.error("Profile picture upload error:", error);
        res.status(500).json({ success: false, message: "Upload failed", error: error.message });
    }
});


module.exports = router;
