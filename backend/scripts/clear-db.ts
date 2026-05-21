import { db } from '../src/db';
import { sql } from 'drizzle-orm';

async function clearDb() {
  console.log('🗑️  Vidage de la base de données (sauf doctors)...');

  await db.execute(sql`TRUNCATE TABLE
    response_to_question,
    response,
    diagnosis_question_proposition,
    diagnosis_question,
    diagnosis_section,
    ai_synthesis_versions,
    formulaires,
    patient_sessions,
    form_templates,
    children
    RESTART IDENTITY CASCADE`);

  console.log('✅  Base vidée. Le compte médecin est conservé.');
  process.exit(0);
}

clearDb().catch((e) => { console.error('❌', e); process.exit(1); });
