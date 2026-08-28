import { drizzle } from 'drizzle-orm/node-postgres';
import pkg from 'pg';
const { Pool } = pkg;
import * as schema from './schema.ts';

let pool: any = null;
let dbInstance: any = null;

export function getDb() {
  if (!dbInstance) {
    if (!process.env.SQL_HOST || !process.env.SQL_DB_NAME) {
      return null;
    }
    try {
      pool = new Pool({
        host: process.env.SQL_HOST,
        user: process.env.SQL_USER,
        password: process.env.SQL_PASSWORD,
        database: process.env.SQL_DB_NAME,
        max: 10,
        connectionTimeoutMillis: 5000,
      });
      pool.on('error', (err: any) => {
        console.warn('PostgreSQL pool background error caught:', err?.message || err);
      });
      dbInstance = drizzle(pool, { schema });
    } catch (e) {
      console.warn("Failed to initialize PostgreSQL pool:", e);
      return null;
    }
  }
  return dbInstance;
}

export const db: any = new Proxy({}, {
  get(target, prop) {
    const realDb = getDb();
    if (!realDb) {
      return () => {
        return Promise.resolve([]);
      };
    }
    return (realDb as any)[prop];
  }
});

export { pool };
