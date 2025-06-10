const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

const requireLogin = (req, res, next) => {
    if (!req.isAuthenticated()) {
        return res.status(401).json({ message: 'Unauthorized: Please log in.' });
    }
    next();
};

// Get all users (often for admin purposes)
router.get('/', userController.getAllUsers);
// Get a single user by ID
router.get('/:id', userController.getUserById);


router.patch('/:id', userController.updateUser);

module.exports = router;
