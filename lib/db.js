import mongoose from 'mongoose';

const cache = globalThis.__mustafaArwaMongo || { connection: null, promise: null };
globalThis.__mustafaArwaMongo = cache;

export async function connectDb() {
  if (cache.connection?.connection?.readyState === 1) return cache.connection;
  if (!process.env.MONGO_URI) throw new Error('MONGO_URI is not configured');

  if (!cache.promise) {
    cache.promise = mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 8000,
      maxPoolSize: 5
    }).then(instance => {
      cache.connection = instance;
      return instance;
    }).catch(error => {
      cache.connection = null;
      cache.promise = null;
      throw error;
    });
  }

  return cache.promise;
}
