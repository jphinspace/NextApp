// Configuration that varies between development and production
const config = {
  // Use in-memory store in development, Postgres in production
  useInMemoryStore: process.env.NODE_ENV === 'development',
  // Log database operations in development
  logDbOperations: process.env.NODE_ENV === 'development',
};

export default config;
