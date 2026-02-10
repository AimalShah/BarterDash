import * as dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

/**
 * Environment configuration schema with Zod validation
 */
const configSchema = z.object({
  nodeEnv: z.enum(['development', 'production', 'test']).default('development'),
  port: z.coerce.number().int().positive().default(3000),
  apiPrefix: z.string().default('api/v1'),

  // Database
  databaseUrl: z.string().url(),

  // JWT
  jwtSecret: z.string().min(32),
  jwtExpiresIn: z.string().default('7d'),

  // CORS
  corsOrigin: z.string().default('*'),

  // Stripe
  stripeSecretKey: z.string(),
  stripeWebhookSecret: z.string(),
  stripeIdentityWebhookSecret: z.string().optional(),
  stripePublishableKey: z.string().optional(),

  // Redis
  redisUrl: z.string().url(),

  // Supabase
  supabaseUrl: z.string().url(),
  supabaseAnonKey: z.string(),
  supabaseServiceRoleKey: z.string().optional(),

  // Monitoring
  sentryDsn: z.string().url().optional(),

  // Security
  encryptionKey: z.string().optional(),
  // Email (optional for dev)
  sendgridApiKey: z.string().optional(),
  fromEmail: z.string().email().default('no-reply@barterdash.com'),

  // Stream Video (getstream.io) credentials
  streamApiKey: z.string().optional(),
  streamApiSecret: z.string().optional(),
});

export type Config = z.infer<typeof configSchema>;

/**
 * Parse and validate environment configuration
 */
function loadConfig(): Config {
  const result = configSchema.safeParse({
    nodeEnv: process.env.NODE_ENV,
    port: process.env.PORT,
    apiPrefix: process.env.API_PREFIX,
    databaseUrl: process.env.DATABASE_URL,
    jwtSecret: process.env.JWT_SECRET,
    jwtExpiresIn: process.env.JWT_EXPIRES_IN,
    corsOrigin: process.env.CORS_ORIGIN,
    stripeSecretKey: process.env.STRIPE_SECRET_KEY,
    stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
    stripeIdentityWebhookSecret: process.env.STRIPE_IDENTITY_WEBHOOK_SECRET,
    stripePublishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
    redisUrl: process.env.REDIS_URL,
    supabaseUrl: process.env.SUPABASE_URL,
    supabaseAnonKey: process.env.SUPABASE_ANON_KEY,
    supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
    sentryDsn: process.env.SENTRY_DSN,
    encryptionKey: process.env.ENCRYPTION_KEY,
    sendgridApiKey: process.env.SENDGRID_API_KEY,
    fromEmail: process.env.FROM_EMAIL || 'no-reply@barterdash.com',
    streamApiKey: process.env.STREAM_API_KEY,
    streamApiSecret: process.env.STREAM_API_SECRET,
    streamAppId: process.env.STREAM_APP_ID,
  });

  if (!result.success) {
    console.error('❌ Invalid environment configuration:');
    console.error(result.error.format());
    throw new Error('Invalid environment configuration');
  }

  return result.data;
}

export const config = loadConfig();

// Log configuration (redact sensitive values)
if (config.nodeEnv === 'development') {
  console.log('📋 Configuration loaded:');
  console.log(`  - Environment: ${config.nodeEnv}`);
  console.log(`  - Port: ${config.port}`);
  console.log(`  - API Prefix: ${config.apiPrefix}`);
  console.log(
    `  - Database: ${config.databaseUrl.split('@')[1]?.split('/')[0] || 'configured'}`,
  );
  console.log(`  - JWT Secret: ${config.jwtSecret.substring(0, 10)}...`);
  console.log(`  - CORS Origin: ${config.corsOrigin}`);
}
