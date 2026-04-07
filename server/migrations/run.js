require('dotenv').config();
const fs   = require('fs');
const path = require('path');
const db   = require('../src/config/db');

async function migrate() {
  const files = fs.readdirSync(__dirname)
    .filter(f => f.endsWith('.sql'))
    .sort();

  for (const file of files) {
    const sql = fs.readFileSync(path.join(__dirname, file), 'utf8');
    console.log(`Running ${file}…`);
    await db.query(sql);
    console.log(`✓ ${file}`);
  }

  console.log('Migrations complete.');
  process.exit(0);
}

migrate().catch(err => { console.error(err); process.exit(1); });
