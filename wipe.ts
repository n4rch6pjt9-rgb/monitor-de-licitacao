import { neon } from '@neondatabase/serverless';
import 'dotenv/config';

async function wipe() {
  try {
    const sql = neon(process.env.DATABASE_URL!);
    await sql`DROP SCHEMA public CASCADE;`;
    await sql`CREATE SCHEMA public;`;
    console.log('Database wiped successfully.');
  } catch (error) {
    console.error('Failed to wipe database:', error);
    process.exit(1);
  }
}

wipe();
