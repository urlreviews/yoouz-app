import { drizzle } from 'drizzle-orm/node-postgres';
import pkg from 'pg';
const { Pool } = pkg;
import * as schema from './schema.ts';

let pool: any = null;
let dbInstance: any = null;
let sqlCooldownUntil = 0;

export function getDb() {
  if (Date.now() < sqlCooldownUntil) {
    return null;
  }
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
        connectionTimeoutMillis: 800,
      });
      pool.on('error', (err: any) => {
        sqlCooldownUntil = Date.now() + 300000;
        dbInstance = null;
        console.warn('PostgreSQL pool background error caught (entering 5m cooldown):', err?.message || err);
      });
      dbInstance = drizzle(pool, { schema });
    } catch (e) {
      sqlCooldownUntil = Date.now() + 300000;
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
      const noop = () => noop;
      (noop as any).then = (resolve: any) => resolve([]);
      (noop as any).catch = () => noop;
      (noop as any).where = () => noop;
      (noop as any).values = () => noop;
      (noop as any).set = () => noop;
      (noop as any).from = () => noop;
      (noop as any).select = () => noop;
      (noop as any).insert = () => noop;
      (noop as any).update = () => noop;
      (noop as any).delete = () => noop;
      (noop as any).execute = () => Promise.resolve([]);
      return noop;
    }
    return (realDb as any)[prop];
  }
});

export { pool };
