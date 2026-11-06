import mongoose from 'express';
import mongooseConn from 'mongoose';
import dns from 'dns';
import { MongoMemoryServer } from 'mongodb-memory-server';

// Ensure standard Google public DNS resolution for cloud SRV records (fixes local ISP SRV lookup failures)
try {
  dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
} catch {}

let mongod: MongoMemoryServer | null = null;

const DEFAULT_ATLAS_URI = 'mongodb+srv://chopradaksh61_db_user:nJ0wSe4GdS4313dU@cluster0.euppub7.mongodb.net/ulist?retryWrites=true&w=majority&appName=Cluster0';

export async function connectDB(): Promise<void> {
  const uri = process.env.MONGODB_URI || DEFAULT_ATLAS_URI;
  try {
    mongooseConn.set('strictQuery', true);
    await mongooseConn.connect(uri, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log('[Database] Connected to external MongoDB instance at', uri.replace(/:([^:@]+)@/, ':****@'));
  } catch (err: any) {
    console.warn('[Database] External MongoDB connection failed:', err.message, 'spinning up Embedded MongoMemoryServer...');
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
