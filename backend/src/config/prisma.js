import { PrismaClient } from '../generated/prisma/index.js';

// Create a single instance of PrismaClient
const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
  errorFormat: 'pretty',
});

// Handle graceful shutdown
process.on('beforeExit', async () => {
  console.log('🔄 Disconnecting from database...');
  await prisma.$disconnect();
  console.log('✅ Database disconnected');
});

// Handle SIGINT (Ctrl+C)
process.on('SIGINT', async () => {
  console.log('🔄 Received SIGINT, disconnecting from database...');
  await prisma.$disconnect();
  process.exit(0);
});

// Handle SIGTERM
process.on('SIGTERM', async () => {
  console.log('🔄 Received SIGTERM, disconnecting from database...');
  await prisma.$disconnect();
  process.exit(0);
});

// Test database connection
export const connectDB = async () => {
  try {
    console.log('🔍 Testing database connection...');
    await prisma.$connect();
    console.log('✅ Database connected successfully with Prisma');
    return prisma;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    console.error('Error details:', error);
    process.exit(1);
  }
};

export default prisma;
