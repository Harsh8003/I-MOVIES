const mongoose = require('mongoose');

let mongod = null;

const connectDB = async () => {
  // Return immediately if already connected (vital for serverless functions)
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  const uri = process.env.MONGODB_URI || process.env.MONGO_URI;

  // 1. If remote/Atlas URI is provided, connect directly
  if (uri && !uri.includes('localhost') && !uri.includes('127.0.0.1')) {
    try {
      console.log(' Connecting to Cloud MongoDB...');
      const conn = await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 10000,
      });
      console.log(` MongoDB Connected: ${conn.connection.host}`);
      return uri;
    } catch (err) {
      console.warn(` Cloud MongoDB connection failed: ${err.message}`);
      if (!process.env.VERCEL) {
        console.log(' Falling back to in-memory MongoDB...');
      }
    }
  }

  // 2. If localhost URI provided, test if local mongod is active
  if (uri && (uri.includes('localhost') || uri.includes('127.0.0.1')) && !process.env.VERCEL) {
    try {
      const conn = await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 2000,
      });
      console.log(` Local MongoDB Connected: ${conn.connection.host}`);
      return uri;
    } catch {
      console.log(' Local MongoDB daemon not active, starting in-memory database...');
    }
  }

  // 3. On Vercel, in-memory MongoDB binary cannot run inside AWS Lambda
  if (process.env.VERCEL) {
    console.error('❌ Running on Vercel without a Cloud MongoDB URI!');
    console.error('👉 Please configure MONGODB_URI in your Vercel Project Settings > Environment Variables.');
    console.error('   (e.g., your free MongoDB Atlas connection string: mongodb+srv://...)');
    return;
  }

  // 4. Fallback to in-memory MongoDB for local development
  try {
    const { MongoMemoryServer } = require('mongodb-memory-server');
    console.log(' Starting in-memory MongoDB engine...');
    mongod = await MongoMemoryServer.create({
      instance: {
        launchTimeout: 60000,
      },
    });
    const memoryUri = mongod.getUri();
    const conn = await mongoose.connect(memoryUri);
    console.log(` MongoDB In-Memory Connected: ${conn.connection.host}`);
    return memoryUri;
  } catch (error) {
    console.error(` In-Memory MongoDB Failed: ${error.message}`);
    console.warn('⚠️ TIP: Set MONGODB_URI in your cloud deployment environment variables (e.g. free MongoDB Atlas connection string).');
  }
};

module.exports = connectDB;

