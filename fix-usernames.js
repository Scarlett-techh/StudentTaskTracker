const { Pool } = require('pg');

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('DATABASE_URL environment variable is not set');
  process.exit(1);
}

const pool = new Pool({
  connectionString: databaseUrl,
});

async function fixUsernames() {
  const client = await pool.connect();
  try {
    console.log('Fixing null usernames...');
    
    // Count null usernames first
    const countResult = await client.query('SELECT COUNT(*) FROM users WHERE username IS NULL');
    console.log(`Found ${countResult.rows[0].count} users with null usernames`);
    
    // Update null usernames to use email (without @domain)
    const updateResult = await client.query(`
      UPDATE users 
      SET username = REPLACE(REPLACE(email, '@', '_'), '.', '_')
      WHERE username IS NULL
    `);
    
    console.log(`Fixed ${updateResult.rowCount} null usernames`);
    
    // Verify
    const verifyResult = await client.query('SELECT COUNT(*) FROM users WHERE username IS NULL');
    console.log(`Remaining null usernames: ${verifyResult.rows[0].count}`);
    
  } finally {
    client.release();
    await pool.end();
  }
}

fixUsernames().catch(console.error);
