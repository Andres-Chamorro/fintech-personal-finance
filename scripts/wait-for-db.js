const { Client } = require('pg');

const maxRetries = 30;
const retryDelay = 2000;

const config = {
  host: 'localhost',
  port: 5432,
  user: 'fintech_user',
  password: 'fintech_password_2026',
  database: 'fintech_db',
};

async function waitForDatabase(retries = 0) {
  const client = new Client(config);
  
  try {
    await client.connect();
    console.log('✅ Database is ready!');
    await client.end();
    process.exit(0);
  } catch (error) {
    if (retries < maxRetries) {
      console.log(`⏳ Waiting for database... (attempt ${retries + 1}/${maxRetries})`);
      await new Promise(resolve => setTimeout(resolve, retryDelay));
      return waitForDatabase(retries + 1);
    } else {
      console.error('❌ Database connection failed after max retries');
      process.exit(1);
    }
  }
}

waitForDatabase();
