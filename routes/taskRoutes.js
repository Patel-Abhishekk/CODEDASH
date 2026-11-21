const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const { postTask, getOpenTasks, getTaskById, claimTask, submitProof, approveTask, checkAndResolveGhosting, autoResolveGhosting, deleteTask, rejectTask, searchTasks } = require('../controllers/taskController');
const { validateTaskInput, validateProofInput } = require('../middleware/validation');

// Public routes (browsing tasks)
router.get('/', getOpenTasks);
router.get('/search', searchTasks);
router.get('/:taskId', getTaskById);

// Protected routes (require authentication)
router.post('/', authMiddleware, validateTaskInput, postTask);
router.post('/claim', authMiddleware, claimTask);
router.post('/delete', authMiddleware, deleteTask);
router.post('/submit-proof', authMiddleware, validateProofInput, submitProof);
router.post('/approve', authMiddleware, approveTask);
router.post('/reject', authMiddleware, rejectTask);
router.post('/check-ghosting', authMiddleware, checkAndResolveGhosting);
router.post('/auto-resolve-ghosting', authMiddleware, autoResolveGhosting);

module.exports = router;
