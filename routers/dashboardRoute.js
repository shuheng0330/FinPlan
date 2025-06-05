const express = require('express');
const router = express.Router();
const User = require('../models/userModel');

router.get('/header', async (req, res) => {
    try {
        const userId = req.session.userId;
        if (!userId) return res.redirect('/');

        const user = await User.findById(userId);
        if (!user) return res.status(404).send('User not found');

    } catch (err) {
        console.error('Error loading dashboard:', err);
        res.status(500).send('Server error');
    }
});


module.exports = router;
