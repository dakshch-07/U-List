import mongoose from 'express';
import mongooseConn from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongod: MongoMemoryServer | null = null;

export async function connectDB(): Promise<void> {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/ulist';
  try {
    mongooseConn.set('strictQuery', true);
    await mongooseConn.connect(uri, {
      serverSelectionTimeoutMS: 3000,
    });
    console.log('[Database] Connected to external MongoDB instance at', uri);
  } catch (err: any) {
    console.warn('[Database] External MongoDB connection failed, spinning up Embedded MongoMemoryServer for standalone zero-config reliability...');
    try {
      mongod = await MongoMemoryServer.create({
        instance: {
          dbName: 'ulist',
          port: 27018,
        },
      });
      const inMemUri = mongod.getUri();
      await mongooseConn.connect(inMemUri);
      console.log('[Database] Connected to Embedded MongoDB instance at', inMemUri);
    } catch (innerErr) {
      console.error('[Database] Fatal: Unable to initialize embedded MongoDB', innerErr);
      process.exit(1);
    }
  }
}

export async function disconnectDB(): Promise<void> {
  await mongooseConn.disconnect();
  if (mongod) {
    await mongod.stop();
  }
}
