const fs = require('fs');
const path = require('path');

const logsDir = path.join(__dirname, '../logs');
const logFile = path.join(logsDir, 'app.log');

if (!fs.existsSync(logsDir)) {
  try {
    fs.mkdirSync(logsDir, { recursive: true });
  } catch (err) {
    // Directory might already exist
  }
}

const formatData = (data) => {
  if (data instanceof Error) {
    return {
      message: data.message,
      stack: data.stack,
      ...(data.statusCode ? { statusCode: data.statusCode } : {})
    };
  }
  return data;
};

const writeToFile = (entry) => {
  try {
    fs.appendFile(logFile, JSON.stringify(entry) + '\n', (err) => {
      if (err) {
        // Fallback to console if file write fails
      }
    });
  } catch (e) {
    // ignore synchronous file write errors
  }
};

const log = (level, message, data = null) => {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    level,
    message,
    ...(data ? { data: formatData(data) } : {})
  };

  const formattedMsg = `[${timestamp}] [${level}] ${message}`;
  if (level === 'ERROR') {
    console.error(formattedMsg, data ? formatData(data) : '');
  } else if (level === 'WARN') {
    console.warn(formattedMsg, data ? formatData(data) : '');
  } else {
    console.log(formattedMsg, data ? formatData(data) : '');
  }

  writeToFile(logEntry);
  return logEntry;
};

const requestMiddleware = (req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    log('INFO', `${req.method} ${req.originalUrl || req.url} ${res.statusCode} - ${duration}ms`, {
      ip: req.ip,
      method: req.method,
      url: req.originalUrl || req.url,
      statusCode: res.statusCode,
      durationMs: duration,
    });
  });
  next();
};

module.exports = {
  info: (msg, data) => log('INFO', msg, data),
  error: (msg, data) => log('ERROR', msg, data),
  warn: (msg, data) => log('WARN', msg, data),
  debug: (msg, data) => log('DEBUG', msg, data),
  requestMiddleware,
};
