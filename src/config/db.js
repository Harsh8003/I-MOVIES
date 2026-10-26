const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongod = null;

const connectDB = async () => {
  try {
    console.log('🚀 Starting in-memory MongoDB (no install required)...');
    mongod = await MongoMemoryServer.create({
      instance: {
        launchTimeout: 120000,
      },
    });
    const uri = mongod.getUri();
    const conn = await mongoose.connect(uri);
    console.log(`✅ MongoDB In-Memory Connected: ${conn.connection.host}`);
    return uri;
  } catch (error) {
    console.error(`❌ MongoDB Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
