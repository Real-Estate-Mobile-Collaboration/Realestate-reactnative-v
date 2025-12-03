import mongoose from 'mongoose';

export const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/real-estate';
    
    await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      retryWrites: true,
      w: 'majority',
    });
    
    console.log('✅ MongoDB connected successfully');
    console.log(`📍 Database: ${mongoose.connection.name}`);
  } catch (error: any) {
    console.error('❌ MongoDB connection error:', error.message);
    console.error('\n⚠️  IMPORTANT: Add your IP to MongoDB Atlas whitelist:');
    console.error('1. Go to: https://cloud.mongodb.com');
    console.error('2. Select your cluster');
    console.error('3. Go to Network Access (Security section)');
    console.error('4. Click "+ ADD IP ADDRESS"');
    console.error('5. Select "Allow Access from Anywhere" (0.0.0.0/0)');
    console.error('6. Confirm and retry\n');
    process.exit(1);
  }
};
