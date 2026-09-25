const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '../database.json');
console.log('Database path:', dbPath);

// Read database
const readDB = () => {
  try {
    const data = fs.readFileSync(dbPath, 'utf-8');
    const db = JSON.parse(data);
    if (!db.users) db.users = [];
    if (!db.tasks) db.tasks = [];
    if (!db.chats) db.chats = [];
    if (!db.notifications) db.notifications = [];
    return db;
  } catch (error) {
    console.error('Error reading database:', error);
    return { users: [], tasks: [], chats: [], notifications: [] };
  }
};

// Write database
const writeDB = (data) => {
  try {
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (error) {
    console.error('Error writing to database:', error);
    return false;
  }
};

// Connect to database (for JSON, this just verifies the file exists)
const connectDB = async () => {
  try {
    const data = readDB();
    console.log(`✅ JSON Database Connected: ${dbPath}`);
    return data;
  } catch (error) {
    console.error(`❌ Database Connection Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = { connectDB, readDB, writeDB };