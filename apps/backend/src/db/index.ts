import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import { config } from '../config';

/**
 * Database connection and Drizzle instance
 */

// Create postgres connection with SSL for Supabase
export const client = postgres(config.databaseUrl, {
  ssl: { rejectUnauthorized: false }, // Required for Supabase
  max: 10, // Connection pool size
  idle_timeout: 20,
  connect_timeout: 10,
});

// Create drizzle instance with schema
export const db = drizzle(client, {
  schema,
  logger: config.nodeEnv === 'development',
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('🔌 Closing database connection...');
  await client.end();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('🔌 Closing database connection...');
  await client.end();
  process.exit(0);
});

// Export schema for convenience
export * from './schema';

console.log('✅ Database connection established');
