const express = require('express');
const router = express.Router();
const { postTask, getOpenTasks, getTaskById, claimTask, submitProof, approveTask, checkAndResolveGhosting } = require('../controllers/taskController');// POST /api/tasks - Create a new task
router.post('/', postTask);

// GET /api/tasks - Get all open tasks (feed)
router.get('/', getOpenTasks);

// GET /api/tasks/:taskId - Get task by ID
router.get('/:taskId', getTaskById);

// POST /api/tasks/claim - Claim a task
router.post('/claim', claimTask);

// POST /api/tasks/submit-proof - Submit proof of work
router.post('/submit-proof', submitProof);
// POST /api/tasks/approve - Approve task and give rating
router.post('/approve', approveTask);
// POST /api/tasks/check-ghosting - Check and resolve 48-hour ghosting
router.post('/check-ghosting', checkAndResolveGhosting);

module.exports = router;