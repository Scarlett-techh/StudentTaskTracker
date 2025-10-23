// Simple script to check users table
const { Pool } = require('pg');

// Get database URL from environment
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('DATABASE_URL environment variable is not set');
  process.exit(1);
}

const pool = new Pool({
  connectionString: databaseUrl,
});

async function checkUsers() {
  const client = await pool.connect();
  try {
    console.log('Checking users with null usernames...');
    const result = await client.query('SELECT id, email, username FROM users WHERE username IS NULL');
    console.log('Users with null usernames:', result.rows);
    
    console.log('\nAll users (first 10):');
    const allUsers = await client.query('SELECT id, email, username FROM users LIMIT 10');
    console.log(allUsers.rows);
  } finally {
    client.release();
    await pool.end();
  }
}

checkUsers().catch(console.error);
