import { Pool } from 'pg';

async function setupDatabase() {
  // First, connect to the default 'postgres' database to create our database
  const adminPool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    database: 'postgres', // Connect to default postgres DB
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    connectionTimeoutMillis: 5000,
  });

  try {
    console.log('Attempting to create database if not exists...');
    await adminPool.query(`CREATE DATABASE IF NOT EXISTS imss_medical;`);
    console.log('✓ Database created or already exists');
  } catch (err: any) {
    console.error('Failed to create database:', err.message);
    // This might fail if it already exists, which is okay
    if (!err.message.includes('already exists')) {
      throw err;
    }
  } finally {
    await adminPool.end();
  }
}

setupDatabase()
  .then(() => console.log('Setup complete'))
  .catch(err => {
    console.error('Setup failed:', err);
    process.exit(1);
  });
