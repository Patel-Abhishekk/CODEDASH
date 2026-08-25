const express = require('express');
const router = express.Router();
const { registerUser, loginUser, getUserById } = require('../controllers/userController');

// POST /api/users/register
router.post('/register', registerUser);

// POST /api/users/login
router.post('/login', loginUser);

// GET /api/users/:userId - Get user profile by ID
router.get('/:userId', getUserById);

module.exports = router;