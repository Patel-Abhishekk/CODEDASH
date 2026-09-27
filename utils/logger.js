const fs = require('fs');
const path = require('path');

const logFile = path.join(__dirname, '../logs/app.log');

if (!fs.existsSync(path.dirname(logFile))) {
  fs.mkdirSync(path.dirname(logFile), { recursive: true });
}

const log = (level, message, data = {}) => {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    level,
    message,
    data
  };
  
  console.log(`[${level}] ${message}`, data);
  
  fs.appendFileSync(logFile, JSON.stringify(logEntry) + '\n');
};

module.exports = {
  info: (msg, data) => log('INFO', msg, data),
  error: (msg, data) => log('ERROR', msg, data),
  warn: (msg, data) => log('WARN', msg, data),
  debug: (msg, data) => log('DEBUG', msg, data)
};
