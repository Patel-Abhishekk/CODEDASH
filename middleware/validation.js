const { validateTaskTitle, validateBounty, validateDeadlineHours, sanitizeInput } = require('../utils/validation');

const validateTaskInput = (req, res, next) => {
  const { title, description, bounty, deadlineHours } = req.body;
  
  if (!title || !validateTaskTitle(title)) {
    return res.status(400).json({ message: 'Invalid title' });
  }
  
  if (!description || description.length < 10) {
    return res.status(400).json({ message: 'Invalid description' });
  }
  
  if (!validateBounty(bounty)) {
    return res.status(400).json({ message: 'Invalid bounty' });
  }
  
  if (!validateDeadlineHours(deadlineHours)) {
    return res.status(400).json({ message: 'Invalid deadline' });
  }
  
  // Sanitize
  req.body.title = sanitizeInput(title);
  req.body.description = sanitizeInput(description);
  
  next();
};

const validateProofInput = (req, res, next) => {
  const { proofOfWork } = req.body;
  
  if (!proofOfWork || proofOfWork.length < 10) {
    return res.status(400).json({ message: 'Invalid proof of work' });
  }
  
  req.body.proofOfWork = sanitizeInput(proofOfWork);
  
  next();
};

module.exports = { validateTaskInput, validateProofInput };
