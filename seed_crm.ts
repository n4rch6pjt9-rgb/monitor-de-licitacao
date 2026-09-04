import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './server/db/schema';
import 'dotenv/config';

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql, { schema });

async function seedStages() {
  console.log('Seeding CRM Stages...');
  await db.insert(schema.crmStages).values([
    { id: 'new', name: 'Novo Edital', order: 1 },
    { id: 'qualification', name: 'Em Qualificação', order: 2 },
    { id: 'proposal', name: 'Proposta / Documentação', order: 3 },
    { id: 'won', name: 'Ganho', order: 4 },
    { id: 'lost', name: 'Perdido (Desqualificado)', order: 5 },
  ]).onConflictDoNothing();
  console.log('Done!');
}

seedStages().catch(console.error);
