const { Client } = require('pg');

const maxRetries = 30;
const retryDelay = 2000;

const config = {
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || '5432'),
  user: process.env.DATABASE_USER || 'fintech_user',
  password: process.env.DATABASE_PASSWORD || 'fintech_password_2026',
  database: process.env.DATABASE_NAME || 'fintech_db',
};

async function waitForDatabase(retries = 0) {
  const client = new Client(config);

  try {
    await client.connect();
    await client.end();
    process.exit(0);
  } catch {
    if (retries < maxRetries) {
      await new Promise(resolve => setTimeout(resolve, retryDelay));
      return waitForDatabase(retries + 1);
    } else {
      process.exit(1);
    }
  }
}

waitForDatabase();
