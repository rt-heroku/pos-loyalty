import { Pool, PoolClient, QueryResult } from 'pg';
import { z } from 'zod';

// Environment variable validation
const envSchema = z.object({
  DATABASE_URL: z.string().url().optional(),
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
});

const env = envSchema.parse(process.env);

// Database configuration
const dbConfig = {
  connectionString:
    env.DATABASE_URL || 'postgresql://localhost:5432/loyalty_db',
  /*ssl: env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,*/
  ssl: { rejectUnauthorized: false },
  max: 2, // Maximum number of clients in the pool (reduced for shared database)
  idleTimeoutMillis: 10000, // Close idle clients after 10 seconds (reduced)
  connectionTimeoutMillis: 5000, // Return an error after 5 seconds if connection could not be established
  maxUses: 1000, // Close (and replace) a connection after it has been used 1000 times (reduced)
};

// Create connection pool
let pool: Pool | null = null;

// Connection monitoring
let connectionStats = {
  totalConnections: 0,
  activeConnections: 0,
  idleConnections: 0,
  waitingClients: 0,
  lastReset: new Date(),
};

// Initialize database connection pool
function initializePool(): Pool {
  if (!pool) {
    pool = new Pool(dbConfig);

    // Handle pool errors
    pool.on('error', err => {
      console.error('Unexpected error on idle client', err);
      process.exit(-1);
    });

    // Monitor connection events
    pool.on('connect', () => {
      connectionStats.totalConnections++;
      connectionStats.activeConnections++;
      console.log(`Database connection established. Active: ${connectionStats.activeConnections}/${dbConfig.max}`);
    });

    pool.on('remove', () => {
      connectionStats.activeConnections = Math.max(0, connectionStats.activeConnections - 1);
      console.log(`Database connection removed. Active: ${connectionStats.activeConnections}/${dbConfig.max}`);
    });

    // Test connection on startup
    pool.query('SELECT NOW()', err => {
      if (err) {
        console.error('Database connection failed:', err);
      } else {
        console.log('Database connected successfully');
      }
    });
  }
  return pool;
}

// Get database pool
export function getPool(): Pool {
  return initializePool();
}

// Execute a query with retry logic
export async function query(
  text: string,
  params?: any[],
  retries: number = 3
): Promise<QueryResult> {
  const pool = getPool();

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const result = await pool.query(text, params);
      return result;
    } catch (error) {
      console.error(`Database query attempt ${attempt} failed:`, error);

      if (attempt === retries) {
        throw new Error(
          `Database query failed after ${retries} attempts: ${error}`
        );
      }

      // Wait before retrying (exponential backoff)
      await new Promise(resolve =>
        setTimeout(resolve, Math.pow(2, attempt) * 1000)
      );
    }
  }

  throw new Error('Database query failed');
}

// Execute a transaction
export async function transaction<T>(
  callback: (client: PoolClient) => Promise<T>
): Promise<T> {
  const pool = getPool();
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

// Execute multiple queries in a transaction
export async function executeTransaction(
  queries: Array<{ text: string; params?: any[] }>
): Promise<void> {
  await transaction(async client => {
    for (const query of queries) {
      await client.query(query.text, query.params);
    }
  });
}

// Health check function
export async function healthCheck(): Promise<boolean> {
  try {
    await query('SELECT 1');
    return true;
  } catch (error) {
    console.error('Database health check failed:', error);
    return false;
  }
}

// Close database connections (for graceful shutdown)
export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
    console.log('Database pool closed');
  }
}

// Get connection statistics
export function getConnectionStats() {
  if (pool) {
    return {
      ...connectionStats,
      poolConfig: {
        max: dbConfig.max,
        idleTimeoutMillis: dbConfig.idleTimeoutMillis,
        connectionTimeoutMillis: dbConfig.connectionTimeoutMillis,
        maxUses: dbConfig.maxUses,
      },
      poolStats: {
        totalCount: pool.totalCount,
        idleCount: pool.idleCount,
        waitingCount: pool.waitingCount,
      },
    };
  }
  return connectionStats;
}

// Reset connection statistics
export function resetConnectionStats() {
  connectionStats = {
    totalConnections: 0,
    activeConnections: 0,
    idleConnections: 0,
    waitingClients: 0,
    lastReset: new Date(),
  };
}

// Database utility functions
export const db = {
  query,
  transaction,
  executeTransaction,
  healthCheck,
  closePool,
  getPool,
  getConnectionStats,
  resetConnectionStats,
};

// Graceful shutdown handling
process.on('SIGINT', async () => {
  console.log('Received SIGINT, closing database connections...');
  await closePool();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('Received SIGTERM, closing database connections...');
  await closePool();
  process.exit(0);
});

export default db;
