class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
  }
}

const handleError = (error, res) => {
  console.error('Error:', {
    message: error.message,
    statusCode: error.statusCode || 500,
    timestamp: new Date()
  });
  
  const statusCode = error.statusCode || 500;
  const message = error.message || 'Internal server error';
  
  if (statusCode === 500) {
    return res.status(500).json({ message: 'Internal server error' });
  }
  
  res.status(statusCode).json({ message });
};

module.exports = { AppError, handleError };
