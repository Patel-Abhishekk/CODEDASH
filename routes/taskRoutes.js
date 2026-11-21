const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const { postTask, getOpenTasks, getTaskById, claimTask, submitProof, approveTask, checkAndResolveGhosting, autoResolveGhosting, deleteTask, rejectTask, searchTasks } = require('../controllers/taskController');
const { validateTaskInput, validateProofInput } = require('../middleware/validation');

// Public routes (browsing tasks)
router.get('/', getOpenTasks);
router.get('/search', searchTasks);
router.get('/:taskId', getTaskById);

// RESTful routes
router.delete('/:taskId', authMiddleware, deleteTask);
router.patch('/:taskId/claim', authMiddleware, claimTask);
router.patch('/:taskId/approve', authMiddleware, approveTask);
router.patch('/:taskId/reject', authMiddleware, rejectTask);
router.post('/:taskId/submit-proof', authMiddleware, validateProofInput, submitProof);

// Action endpoints & backwards-compatibility aliases
router.post('/', authMiddleware, validateTaskInput, postTask);
router.post('/claim', authMiddleware, claimTask);
router.post('/delete', authMiddleware, deleteTask);
router.post('/submit-proof', authMiddleware, validateProofInput, submitProof);
router.post('/approve', authMiddleware, approveTask);
router.post('/reject', authMiddleware, rejectTask);
router.post('/check-ghosting', authMiddleware, checkAndResolveGhosting);
router.post('/auto-resolve-ghosting', authMiddleware, autoResolveGhosting);

module.exports = router;
