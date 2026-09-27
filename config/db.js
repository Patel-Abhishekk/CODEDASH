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
    
    // Create manual indexes
    db.usersByEmail = {};
    db.users.forEach(user => {
      db.usersByEmail[user.email] = user.id;
    });
    
    db.tasksByStatus = {};
    db.tasksByPoster = {};
    db.tasksBySolver = {};
    
    db.tasks.forEach(task => {
      // Status index
      if (!db.tasksByStatus[task.status]) db.tasksByStatus[task.status] = [];
      db.tasksByStatus[task.status].push(task.id);
      
      // Poster index
      if (!db.tasksByPoster[task.postedBy]) db.tasksByPoster[task.postedBy] = [];
      db.tasksByPoster[task.postedBy].push(task.id);
      
      // Solver index
      if (task.claimedBy) {
        if (!db.tasksBySolver[task.claimedBy]) db.tasksBySolver[task.claimedBy] = [];
        db.tasksBySolver[task.claimedBy].push(task.id);
      }
    });

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