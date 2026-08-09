import mongoose from 'mongoose';

let connection;
export async function connectDb() {
  if (mongoose.connection.readyState === 1) return mongoose;
  if (!process.env.MONGO_URI) throw new Error('MONGO_URI is not configured');
  connection ||= mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 8000 });
  return connection;
}
