const User = require('../models/userModel');
const bcrypt = require('bcryptjs');
const validator = require('validator');


// Get all users (for admin or debugging)
exports.getAllUsers = async (req, res) => {
    try {
        const users = await User.find();

        res.status(200).json({
            status: 'success',
            results: users.length,
            data: {
                users
            }
        });
    } catch (err) {
        console.error('Error fetching users:', err);
        res.status(500).json({
            status: 'error',
            message: 'Failed to fetch users'
        });
    }
};

// Create a new user for Local Signup (called from authRoutes.js /register)
exports.createUser = async (req, res) => {
    try {
        const {
            username,
            email,
            password, // Password only required for 'local' authProvider
            authProvider = 'local', // Default to local
            googleId,
            profilePicture,
            lastLogin
        } = req.body;

        // Basic validation
        if (!username || !email || !authProvider) {
            return res.status(400).json({ message: 'Username, email, and auth provider are required.' });
        }

        if (!validator.isEmail(email)) {
            return res.status(400).json({ message: 'Invalid email format.' });
        }

        if (!['google', 'local'].includes(authProvider)) {
            return res.status(400).json({ message: 'Auth provider must be either "google" or "local".' });
        }

        // Check if email already exists BEFORE hashing password
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(409).json({ status: 'fail', message: 'A user with this email already exists.' });
        }

        let passwordHash = null;

        if (authProvider === 'local') {
            if (!password) {
                return res.status(400).json({ message: 'Password is required for local signup.' });
            }

            // Using validator.isStrongPassword
            if (!validator.isStrongPassword(password, {
                minLength: 8,
                minLowercase: 1,
                minUppercase: 1,
                minNumbers: 1,
                minSymbols: 1,
            })) {
                return res.status(400).json({
                    message: 'Password is not strong enough. Use at least 8 characters, including uppercase, lowercase, numbers, and symbols.'
                });
            }

            // Hash the password
            passwordHash = await bcrypt.hash(password, 12); // 12 salt rounds
        }

        if (authProvider === 'google' && !googleId) {
            return res.status(400).json({ message: 'Google ID is required for Google signup.' });
        }

        const newUser = new User({
            username,
            email,
            passwordHash, 
            authProvider,
            googleId: authProvider === 'google' ? googleId : null,
            profilePicture,
            lastLogin: lastLogin || new Date()
        });

        const savedUser = await newUser.save();

        res.status(201).json({
            status: 'success',
            message: 'User created successfully',
            data: {
                user: savedUser
            }
        });

    } catch (err) {
        console.error('Error creating user:', err);

        if (err.name === 'ValidationError') {
            const messages = Object.values(err.errors).map(val => val.message);
            return res.status(400).json({ status: 'fail', message: 'Validation failed', errors: messages });
        } else if (err.code === 11000) {
            return res.status(409).json({ status: 'fail', message: 'A user with this email already exists.' });
        }

        res.status(500).json({
            status: 'error',
            message: 'Failed to create user',
            error: err.message
        });
    }
};

// Get a single user by ID
exports.getUserById = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({ status: 'fail', message: 'User not found' });
        }

        res.status(200).json({
            status: 'success',
            data: {
                user
            }
        });
    } catch (err) {
        console.error('Error fetching user:', err);
        res.status(500).json({
            status: 'error',
            message: 'Failed to get user',
            error: err.message
        });
    }
};

// UPDATE USER - Profile Edit (by ID, potentially for admin or specific scenarios)
exports.updateUser = async (req, res) => {
    try {
        const userId = req.params.id;

        // Allowed fields to update (you can add more as needed)
        const { username, profilePicture, lastLogin } = req.body;

        const updatedUser = await User.findByIdAndUpdate(
            userId,
            {
                ...(username && { username }),
                ...(profilePicture && { profilePicture }),
                ...(lastLogin && { lastLogin }),
                updatedAt: new Date() // Explicitly update timestamp (optional)
            },
            { new: true, runValidators: true }
        );

        if (!updatedUser) {
            return res.status(404).json({
                status: 'fail',
                message: 'User not found'
            });
        }

        res.status(200).json({
            status: 'success',
            message: 'User updated successfully',
            data: { user: updatedUser }
        });

    } catch (err) {
        console.error('Error updating user:', err);
        res.status(500).json({
            status: 'error',
            message: 'Failed to update user',
            error: err.message
        });
    }
};

// DELETE USER - Account Deletion (for logged-in user)
exports.deleteAccount = async (req, res) => {
    const userId = req.session.userId; // Get user ID from session
    const { passwordToDelete } = req.body; // Password for local users

    try {
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        // Only allow local users to delete using password confirmation
        if (user.authProvider !== 'local') {
            return res.status(403).json({ message: 'Account managed via Google. Please delete through Google account settings.' });
        }

        // Verify password
        const isMatch = await bcrypt.compare(passwordToDelete, user.passwordHash); // <--- ENSURE passwordHash
        if (!isMatch) {
            return res.status(401).json({ message: 'Incorrect password.' });
        }

        // Delete user
        await User.findByIdAndDelete(userId);

        // Destroy session and redirect to login
        req.session.destroy((err) => {
            if (err) {
                console.error('Session destruction error:', err);
                return res.status(200).json({ success: true, message: 'Account deleted, but session logout error occurred.' });
            }
            res.status(200).json({ success: true, message: 'Account deleted successfully!' });
        });
    } catch (err) {
        console.error('Error deleting account:', err);
        res.status(500).json({ message: 'Server error during account deletion.' }); // Send JSON response
    }
};

// UPDATE PROFILE (for logged-in user)
exports.updateProfile = async (req, res) => {
    const userId = req.user ? req.user._id : null;

    if (!userId) {
        return res.status(401).json({ message: 'User not authenticated or session expired.' });
    }

    const { username, currentPassword, newPassword, confirmPassword } = req.body;

    try {
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ message: 'User not found in database.' });
        }

        let changesMade = false;

        // --- Handle Username Update ---
        if (username !== undefined && username !== user.username) {
            user.username = username;
            changesMade = true;
        }

        // --- Handle Password Change (if any password-related fields are provided) ---
        if (currentPassword || newPassword || confirmPassword) {
            if (user.authProvider !== 'local') {
                return res.status(403).json({ message: 'Password change is only available for local accounts. Please manage your password through your Google account settings.' });
            }

            if (!currentPassword || !newPassword || !confirmPassword) {
                return res.status(400).json({ message: 'All password fields (Current, New, Confirm) are required to change your password.' });
            }

            if (newPassword !== confirmPassword) {
                return res.status(400).json({ message: 'New password and confirmation do not match.' });
            }

            const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
            if (!isMatch) {
                return res.status(401).json({ message: 'Current password is incorrect. Please try again.' });
            }

            const isSameAsCurrent = await bcrypt.compare(newPassword, user.passwordHash);
            if (isSameAsCurrent) {
                return res.status(400).json({ message: 'New password cannot be the same as your current password.' });
            }

            // Validate new password strength
            const passwordOptions = {
                minLength: 8,
                minLowercase: 1,
                minUppercase: 1,
                minNumbers: 1,
                minSymbols: 1,
            };

            if (!validator.isStrongPassword(newPassword, passwordOptions)) {
                return res.status(400).json({
                    message: 'New password is not strong enough. Use at least 8 characters, including uppercase, lowercase, numbers, and symbols.'
                });
            }

            user.passwordHash = await bcrypt.hash(newPassword, 12);
            changesMade = true;
        }

        // --- Save Changes if any were made ---
        if (changesMade) {
            user.updatedAt = new Date();
            const updatedUser = await user.save();

            // Re-login the user to update req.user in session
            req.login(updatedUser, (err) => {
                if (err) {
                    console.error('Error re-logging in user:', err); // Keep this error log
                    return res.status(500).json({ message: 'Profile updated but failed to refresh session.', error: err.message });
                }
                return res.status(200).json({
                    message: 'Profile updated successfully!',
                    updatedUser: {
                        id: updatedUser._id,
                        username: updatedUser.username,
                        email: updatedUser.email,
                        profilePicture: updatedUser.profilePicture
                    }
                });
            });

        } else {
            return res.status(200).json({
                message: 'No changes detected or applied.',
                updatedUser: {
                    id: user._id,
                    username: user.username,
                    email: user.email,
                    profilePicture: user.profilePicture
                }
            });
        }

    } catch (err) {
        console.error('Server error during profile update:', err);
        res.status(500).json({ message: 'Server error. Failed to update profile. Please try again later.', error: err.message });
    }
};
