const fs = require('fs');
const path = require('path');
const { Client } = require('../backend/node_modules/pg');

// Usage:
//   set DATABASE_URL=postgresql://postgres.PROJECT:PASSWORD@aws-1-REGION.pooler.supabase.com:5432/postgres
//   node apply.js
// Or set PGHOST/PGUSER/PGPASSWORD/PGPORT

async function run() {
  const client = process.env.DATABASE_URL
    ? new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false },
      })
    : new Client({
        host: process.env.PGHOST,
        port: Number(process.env.PGPORT || 5432),
        user: process.env.PGUSER,
        password: process.env.PGPASSWORD,
        database: process.env.PGDATABASE || 'postgres',
        ssl: { rejectUnauthorized: false },
      });

  await client.connect();
  console.log('Connected');

  const migration = fs.readFileSync(
    path.join(__dirname, 'migrations', '001_init.sql'),
    'utf8',
  );
  const seed = fs.readFileSync(path.join(__dirname, 'seed.sql'), 'utf8');

  console.log('Running migration...');
  await client.query(migration);
  console.log('Migration OK');

  const { rows } = await client.query(
    `select count(*)::int as count from public.products`,
  );
  if (rows[0].count === 0) {
    console.log('Seeding products...');
    await client.query(seed);
    console.log('Seed OK');
  } else {
    console.log(`Products already present (${rows[0].count}), skipping seed`);
  }

  const { rows: counts } = await client.query(
    `select platform, count(*)::int as count from public.products group by platform order by platform`,
  );
  console.log('Products by platform:', counts);

  await client.end();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
