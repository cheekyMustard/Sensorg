#!/usr/bin/env node
/**
 * Simple migration runner. Reads all *.sql files from db/migrations in
 * alphabetical order and executes them against DATABASE_URL.
 *
 * Usage:
 *   node db/migrate.js           # run migrations
 *   node db/migrate.js --seed    # run migrations then seed
 */
import 'dotenv/config';
import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const { Client } = pg;
const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function run() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  try {
    // Ensure tracking table exists
    await client.query(`
      create table if not exists _migrations (
        filename   text primary key,
        applied_at timestamptz not null default now()
      )
    `);

    const migrationsDir = path.join(__dirname, 'migrations');
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
      const seedsDir = path.join(__dirname, 'seeds');
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
