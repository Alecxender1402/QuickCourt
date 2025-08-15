import pg from 'pg';

const { Pool } = pg;

const connectDB = async () => {
  try {
    console.log('🔍 Attempting database connection...');

    // Create pool inside the function to ensure env vars are loaded
    const pool = new Pool({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      ssl: { rejectUnauthorized: false },
    });

    await pool.query('SELECT 1');
    console.log('✅ Database connected');

    // Store pool for query function
    global.dbPool = pool;
    return pool;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    console.error('Error details:', error);
    process.exit(1);
  }
};

// Simple query function
export const query = async (text, params) => {
  try {
    if (!global.dbPool) {
      throw new Error('Database pool not initialized');
    }
    const result = await global.dbPool.query(text, params);
    return result;
  } catch (error) {
    console.error('Query error:', error.message);
    throw error;
  }
};

export default connectDB;
