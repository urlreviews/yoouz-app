import { createClient, type Client, type InStatement, type ResultSet, type TransactionMode } from "@libsql/client";
import path from "path";
import fs from "fs";

let bunnyDbClient: Client | null = null;
let isInitialized = false;
let hasLoggedFallback = false;

function createLocalClient(): Client {
  const uploadsDir = path.resolve(process.cwd(), "uploads");
  if (!fs.existsSync(uploadsDir)) {
    try { fs.mkdirSync(uploadsDir, { recursive: true }); } catch (e) {}
  }
  const dbPath = path.resolve(uploadsDir, "bunny_edge.db");
  return createClient({
    url: `file:${dbPath}`
  });
}

function createResilientClient(remoteClient: Client | null, localClient: Client): Client {
  let activeClient: Client = remoteClient || localClient;
  let remoteFailing = !remoteClient;

  const handleExecute = async (stmt: InStatement): Promise<ResultSet> => {
    if (!remoteFailing && remoteClient) {
      try {
        return await remoteClient.execute(stmt);
      } catch (err: any) {
        if (!hasLoggedFallback) {
          hasLoggedFallback = true;
          console.warn("🐰 [BunnyDB] Remote endpoint unreachable, falling back to local persistent edge database");
        }
        remoteFailing = true;
        activeClient = localClient;
        return await localClient.execute(stmt);
      }
    }
    return await localClient.execute(stmt);
  };

  const handleBatch = async (stmts: InStatement[], mode?: TransactionMode): Promise<ResultSet[]> => {
    if (!remoteFailing && remoteClient) {
      try {
        return await remoteClient.batch(stmts, mode);
      } catch (err: any) {
        if (!hasLoggedFallback) {
          hasLoggedFallback = true;
          console.warn("🐰 [BunnyDB] Remote endpoint unreachable, falling back to local persistent edge database");
        }
        remoteFailing = true;
        activeClient = localClient;
        return await localClient.batch(stmts, mode);
      }
    }
    return await localClient.batch(stmts, mode);
  };

  return {
    get protocol() {
      return activeClient.protocol;
    },
    execute(stmt: InStatement) {
      return handleExecute(stmt);
    },
    batch(stmts: InStatement[], mode?: TransactionMode) {
      return handleBatch(stmts, mode);
    },
    transaction(mode?: TransactionMode) {
      return activeClient.transaction(mode);
    },
    executeMultiple(sql: string) {
      return activeClient.executeMultiple(sql);
    },
    sync() {
      return activeClient.sync();
    },
    close() {
      if (remoteClient) try { remoteClient.close(); } catch (e) {}
      try { localClient.close(); } catch (e) {}
    }
  } as Client;
}

/**
 * Initializes and returns the Bunny Database (libSQL) connection.
 * Reads BUNNY_DATABASE_URL and BUNNY_DATABASE_AUTH_TOKEN from environment if set,
 * or seamlessly defaults to persistent local libSQL database storage with auto-failover.
 */
export function getBunnyDb(): Client | null {
  const rawUrl = process.env.BUNNY_DATABASE_URL || process.env.LIBSQL_URL;
  const rawAuthToken = process.env.BUNNY_DATABASE_AUTH_TOKEN || process.env.LIBSQL_AUTH_TOKEN;

  const url = rawUrl ? rawUrl.trim() : "";
  const authToken = rawAuthToken ? rawAuthToken.trim() : "";

  if (!bunnyDbClient) {
    try {
      const localClient = createLocalClient();
      let remoteClient: Client | null = null;

      if (url && authToken) {
        try {
          remoteClient = createClient({
            url,
            authToken
          });
          console.log("🐰 [BunnyDB] Connected to remote Bunny Cloud Database.");
        } catch (e) {
          remoteClient = null;
        }
      }

      bunnyDbClient = createResilientClient(remoteClient, localClient);
    } catch (err: any) {
      console.error("❌ [BunnyDB] Error initializing database client:", err?.message || err);
      return null;
    }
  }

  return bunnyDbClient;
}

/**
 * Ensures essential tables exist in Bunny Database
 */
export async function initBunnyDbSchema() {
  const client = getBunnyDb();
  if (!client || isInitialized) return;

  const tableSchemas = [
    `CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE,
      name TEXT,
      firstName TEXT,
      lastName TEXT,
      avatar TEXT,
      bio TEXT,
      role TEXT DEFAULT 'user',
      data TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS places (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      address TEXT,
      category TEXT,
      city TEXT,
      country TEXT,
      latitude REAL,
      longitude REAL,
      logoUrl TEXT,
      data TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS videoReviews (
      id TEXT PRIMARY KEY,
      placeId TEXT,
      placeName TEXT,
      authorName TEXT,
      authorAvatar TEXT,
      userId TEXT,
      rating REAL,
      videoUrl TEXT,
      thumbnailUrl TEXT,
      duration REAL,
      likesCount INTEGER DEFAULT 0,
      bookmarksCount INTEGER DEFAULT 0,
      sharesCount INTEGER DEFAULT 0,
      commentsCount INTEGER DEFAULT 0,
      viewsCount INTEGER DEFAULT 0,
      data TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS comments (
      id TEXT PRIMARY KEY,
      videoId TEXT,
      userId TEXT,
      userName TEXT,
      userAvatar TEXT,
      text TEXT,
      data TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS bookmarks (
      id TEXT PRIMARY KEY,
      userId TEXT,
      placeId TEXT,
      videoId TEXT,
      data TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS chats (
      id TEXT PRIMARY KEY,
      participants TEXT,
      lastMessage TEXT,
      lastSenderEmail TEXT,
      data TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      recipientEmail TEXT,
      type TEXT,
      text TEXT,
      isRead INTEGER DEFAULT 0,
      data TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS businessClaims (
      id TEXT PRIMARY KEY,
      placeId TEXT,
      placeName TEXT,
      userEmail TEXT,
      status TEXT DEFAULT 'pending',
      data TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS follows (
      id TEXT PRIMARY KEY,
      followerId TEXT,
      followingId TEXT,
      data TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS likes (
      id TEXT PRIMARY KEY,
      userId TEXT,
      videoId TEXT,
      data TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS shares (
      id TEXT PRIMARY KEY,
      userId TEXT,
      videoId TEXT,
      platform TEXT,
      data TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS contact_requests (
      id TEXT PRIMARY KEY,
      name TEXT,
      email TEXT,
      category TEXT,
      domain TEXT,
      message TEXT,
      data TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )`
  ];

  try {
    for (const sql of tableSchemas) {
      await client.execute(sql);
    }
    try { await client.execute("ALTER TABLE videoReviews ADD COLUMN bookmarksCount INTEGER DEFAULT 0"); } catch (e) {}
    try { await client.execute("ALTER TABLE videoReviews ADD COLUMN sharesCount INTEGER DEFAULT 0"); } catch (e) {}
    try { await client.execute("ALTER TABLE videoReviews ADD COLUMN commentsCount INTEGER DEFAULT 0"); } catch (e) {}
    try { await client.execute("ALTER TABLE places ADD COLUMN bannerUrl TEXT"); } catch (e) {}
    try { await client.execute("ALTER TABLE places ADD COLUMN brandDomain TEXT"); } catch (e) {}
    try { await client.execute("ALTER TABLE places ADD COLUMN website TEXT"); } catch (e) {}
    try { 
      await client.execute("UPDATE videoReviews SET authorName = 'Steven Akan' WHERE authorName = 'Verified Customer' OR authorName IS NULL OR authorName = ''"); 
    } catch (e) {}
    isInitialized = true;
  } catch (err: any) {
    console.error("⚠️ [BunnyDB] Schema migration warning:", err?.message || err);
  }
}
