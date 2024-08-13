const express = require('express');
const bcrypt = require('bcryptjs');
const { User } = require('../database');

const router = express.Router();

// Register user
router.post('/register', async (req, res) => {
    const { username, password, name, email } = req.body;

    try {
        const user = new User({
            username,
            password,
            name,
            email,
            profile_picture_url: 'path/to/default_profile.png'
        });
        await user.save();
        res.status(201).json({ message: `User ${username} registered successfully!` });
    } catch (error) {
        if (error.code === 11000) {
            res.status(400).json({ message: 'Username already exists. Try a different one.' });
        } else {
            res.status(500).json({ message: 'Error registering user', error });
        }
    }
});

// Login user
router.post('/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        const user = await User.findOne({ username });
        if (user && await bcrypt.compare(password, user.password)) {
            res.status(200).json({ message: 'Login successful', user });
        } else {
            res.status(400).json({ message: 'Invalid username or password' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Error logging in', error });
    }
});

// Log scan
router.post('/log-scan', async (req, res) => {
    const { username, filename } = req.body;

    try {
        await User.updateOne(
            { username },
            { $push: { scan_history: { date: new Date().toISOString(), filename } } }
        );
        res.status(200).json({ message: 'Scan logged successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error logging scan', error });
    }
});

module.exports = router;
