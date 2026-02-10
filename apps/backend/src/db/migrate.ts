import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { db } from './index';

async function main() {
  try {
    console.log('🚀 Starting database migration...');

    // This will run migrations on the database
    await migrate(db, { migrationsFolder: './drizzle' });

    console.log('✅ Database migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

main();
