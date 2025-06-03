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
/*
        if (username.length < 3 || username.length > 20) {
            return res.status(400).json({ message: 'Username must be between 3 and 20 characters.' });
        }
*/
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

            // // Using validator.isStrongPassword
            // if (!validator.isStrongPassword(password, {
            //     minLength: 8,
            //     minLowercase: 1,
            //     minUppercase: 1,
            //     minNumbers: 1,
            //     minSymbols: 1,
            // })) {
            //     return res.status(400).json({
            //         message: 'Password is not strong enough. Use at least 8 characters, including uppercase, lowercase, numbers, and symbols.'
            //     });
            // }

            // Hash the password
            passwordHash = await bcrypt.hash(password, 12); // 12 salt rounds
        }

        if (authProvider === 'google' && !googleId) {
            return res.status(400).json({ message: 'Google ID is required for Google signup.' });
        }

        const newUser = new User({
            username,
            email,
            passwordHash, // <--- IMPORTANT: Ensure passwordHash is set here for local users
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
            return res.status(404).send('User not found');
        }

        // Only allow local users to delete using password confirmation
        if (user.authProvider !== 'local') {
            return res.status(403).send('Only local users can delete accounts using password');
        }

        // Verify password
        const isMatch = await bcrypt.compare(passwordToDelete, user.passwordHash); // <--- ENSURE passwordHash
        if (!isMatch) {
            return res.status(401).send('Incorrect password');
        }

        // Delete user
        await User.findByIdAndDelete(userId);

        // Destroy session and redirect to login
        req.session.destroy((err) => {
            if (err) {
                console.error('Session destruction error:', err);
                return res.status(500).send('Error logging out');
            }
            res.redirect('/users/login'); // Redirect to consistent login page
        });
    } catch (err) {
        console.error('Error deleting account:', err);
        res.status(500).send('Server error');
    }
};

// UPDATE PROFILE (for logged-in user)
exports.updateProfile = async (req, res) => {
    const userId = req.session.userId; // Get user ID from session
    const { username, currentPassword, newPassword, confirmPassword } = req.body;

    try {
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        // --- Handle Username Update ---
        // Only update if username is provided in the request and it's different
        if (username !== undefined && username !== user.username) {
            user.username = username;
            user.updatedAt = new Date();
        }

        // --- Handle Password Change (if any password fields are provided) ---
        // This block executes only if the user is attempting to change their password
        if (currentPassword || newPassword || confirmPassword) {
            // First, validate that ALL password fields are present if any are provided
            if (!currentPassword || !newPassword || !confirmPassword) {
                return res.status(400).json({ message: 'All password fields (Current, New, Confirm) are required to change your password.' });
            }

            // Check if new password matches confirmation
            if (newPassword !== confirmPassword) {
                return res.status(400).json({ message: 'New password and confirmation do not match.' });
            }

            // Check if the user is a local authentication provider
            if (user.authProvider !== 'local') {
                return res.status(403).json({ message: 'Password change is only available for local accounts. Please manage your password through your Google account.' });
            }

            // Verify the current password
            const isMatch = await bcrypt.compare(currentPassword, user.passwordHash); // <--- ENSURE passwordHash
            if (!isMatch) {
                return res.status(401).json({ message: 'Current password is incorrect. Please try again.' });
            }

            // Hash the new password and update
            user.passwordHash = await bcrypt.hash(newPassword, 12);
            user.updatedAt = new Date(); // Update timestamp as password changed
        }

        // Save the user document with all applied changes (username and/or password)
        await user.save();

        // Send a success response back to the client
        res.status(200).json({ message: 'Profile updated successfully!', updatedUser: user });

    } catch (err) {
        console.error('Error updating profile:', err);
        res.status(500).json({ message: 'Server error. Failed to update profile. Please try again later.', error: err.message });
    }
};