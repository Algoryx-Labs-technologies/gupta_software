import dns from 'dns';
import mongoose from 'mongoose';
import { env } from './env.js';
import { backfillEntityCodes } from '../utils/backfillEntityCodes.js';
import { logger } from '../utils/logger.js';

function configureMongoDns(): void {
  if (!env.MONGODB_DNS_SERVERS?.length) return;

  dns.setServers(env.MONGODB_DNS_SERVERS);
  logger.info(`MongoDB DNS servers: ${env.MONGODB_DNS_SERVERS.join(', ')}`);
}

export async function connectDb(): Promise<void> {
  mongoose.set('strictQuery', true);
  configureMongoDns();

  try {
    await mongoose.connect(env.MONGODB_URI, {
      serverSelectionTimeoutMS: 15000,
    });
    logger.info('MongoDB connected');
    await backfillEntityCodes();
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logger.error('MongoDB connection failed', { message });

    if (message.includes('querySrv') || message.includes('ECONNREFUSED')) {
      logger.error(
        'Atlas SRV DNS lookup failed. Try: set MONGODB_DNS_SERVERS=8.8.8.8,1.1.1.1; allow IP in Atlas Network Access; or use non-SRV mongodb:// URI',
      );
    }

    throw err;
  }
}

export async function disconnectDb(): Promise<void> {
  await mongoose.disconnect();
}
