#!/usr/bin/env node
/**
 * Migration runner — run from the backend/ directory.
 *
 * Usage:
 *   node migrate.js           # run migrations
 *   node migrate.js --seed    # run migrations then seed
 *
 * npm scripts (in backend/package.json):
 *   npm run migrate
 *   npm run seed
 */
import 'dotenv/config';
import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const { Client } = pg;
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbDir = path.join(__dirname, '..', 'db');

async function run() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  try {
    await client.query(`
      create table if not exists _migrations (
        filename   text primary key,
        applied_at timestamptz not null default now()
      )
    `);

    const migrationsDir = path.join(dbDir, 'migrations');
    const files = fs.readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql'))
      .sort();

    for (const file of files) {
      const { rows } = await client.query(
        'select 1 from _migrations where filename = $1',
        [file]
      );
      if (rows.length > 0) {
        console.log(`  skip  ${file}`);
        continue;
      }

      const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
      console.log(`  apply ${file}`);
      await client.query('begin');
      await client.query(sql);
      await client.query('insert into _migrations (filename) values ($1)', [file]);
      await client.query('commit');
    }

    if (process.argv.includes('--seed')) {
      const seedsDir = path.join(dbDir, 'seeds');
      const seeds = fs.readdirSync(seedsDir)
        .filter(f => f.endsWith('.sql'))
        .sort();

      for (const file of seeds) {
        const sql = fs.readFileSync(path.join(seedsDir, file), 'utf8');
        console.log(`  seed  ${file}`);
        await client.query(sql);
      }
    }

    console.log('Done.');
  } finally {
    await client.end();
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
