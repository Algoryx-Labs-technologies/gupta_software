import dns from 'dns';
import mongoose from 'mongoose';
import { env } from './env.js';
import { backfillEntityCodes } from '../utils/backfillEntityCodes.js';

function configureMongoDns(): void {
  if (!env.MONGODB_DNS_SERVERS?.length) return;

  dns.setServers(env.MONGODB_DNS_SERVERS);
  console.log(`MongoDB DNS servers: ${env.MONGODB_DNS_SERVERS.join(', ')}`);
}

export async function connectDb(): Promise<void> {
  mongoose.set('strictQuery', true);
  configureMongoDns();

  try {
    await mongoose.connect(env.MONGODB_URI, {
      serverSelectionTimeoutMS: 15000,
    });
    console.log('MongoDB connected');
    await backfillEntityCodes();
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('\nMongoDB connection failed:', message);

    if (message.includes('querySrv') || message.includes('ECONNREFUSED')) {
      console.error(`
Atlas SRV DNS lookup failed. Try:

  1. Set MONGODB_DNS_SERVERS=8.8.8.8,1.1.1.1 in apps/api/.env (then restart the API)
  2. Atlas → Network Access → allow your IP
  3. Use the non-SRV mongodb:// URI from Atlas Connect → Drivers
  4. Remove quotes around MONGODB_URI; include DB name: .../gupta_traders?...
`);
    }

    throw err;
  }
}

export async function disconnectDb(): Promise<void> {
  await mongoose.disconnect();
}
