// Aplica el SQL de RLS con el rol DUEÑO (DATABASE_MIGRATION_URL).
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import pg from 'pg';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rlsDir = join(__dirname, '..', 'rls');

const url = process.env.DATABASE_MIGRATION_URL ?? process.env.DATABASE_URL;
if (!url) throw new Error('DATABASE_MIGRATION_URL no definido');

const client = new pg.Client({ connectionString: url });
await client.connect();

const files = readdirSync(rlsDir).filter((f) => f.endsWith('.sql')).sort();
for (const file of files) {
  const sql = readFileSync(join(rlsDir, file), 'utf8');
  console.log(`▶ Aplicando RLS: ${file}`);
  await client.query(sql);
}

await client.end();
console.log('✅ RLS aplicado.');
