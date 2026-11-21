class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
  }
}

const handleError = (error, res) => {
  const statusCode = error.statusCode || 500;
  const message = error.message || 'Internal server error';

  console.error('Error:', {
    message,
    statusCode,
    timestamp: new Date()
  });

  return res.status(statusCode).json({
    success: false,
    message: statusCode === 500 ? 'Internal server error' : message
  });
};

module.exports = { AppError, handleError };
