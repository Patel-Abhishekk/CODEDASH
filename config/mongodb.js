const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const mongoURL = process.env.MONGODB_URI;
    if (!mongoURL) {
      throw new Error('MONGODB_URI not defined in .env');
    }

    console.log('\n╔═══════════════════════════════════════╗');
    console.log('║  🔗 Connecting to MongoDB Atlas...    ║');
    console.log('╚═══════════════════════════════════════╝\n');

    await mongoose.connect(mongoURL);

    console.log('✅ MongoDB Atlas Connected Successfully!');
    console.log(`  Database: ${mongoose.connection.name}`);
    console.log(`  Host: ${mongoose.connection.host}`);
    console.log(`  Port: ${mongoose.connection.port}\n`);
    
    return mongoose.connection;
  } catch (error) {
    console.error('\n❌ MongoDB Connection Failed:');
    console.error(`  Error: ${error.message}\n`);
    console.log('📝 Troubleshooting:');
    console.log('  1. Check MONGODB_URI in .env file');
    console.log('  2. Check username: ap8677254_db_user');
    console.log('  3. Check password: codedashpass');
    console.log('  4. Check IP whitelist in Atlas (should be 0.0.0.0/0)');
    console.log('  5. Check internet connection\n');
    process.exit(1);
  }
};

module.exports = connectDB;
