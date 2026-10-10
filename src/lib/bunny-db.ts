import { createClient, type Client, type InStatement, type ResultSet, type TransactionMode } from "@libsql/client";
import path from "path";
import fs from "fs";

let bunnyDbClient: Client | null = null;
let isInitialized = false;
let hasLoggedFallback = false;

const ALL_TABLE_SCHEMAS = [
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
    bannerUrl TEXT,
    brandDomain TEXT,
    website TEXT,
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
  )`,
  `CREATE TABLE IF NOT EXISTS nosql_items (
    collection TEXT NOT NULL,
    id TEXT NOT NULL,
    data TEXT,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (collection, id)
  )`,
  `CREATE TABLE IF NOT EXISTS agencies (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    logoUrl TEXT,
    website TEXT,
    phone TEXT,
    email TEXT,
    city TEXT,
    country TEXT,
    data TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
  )`
];

function createLocalClient(): Client {
  const uploadsDir = path.resolve(process.cwd(), "uploads");
  if (!fs.existsSync(uploadsDir)) {
    try { fs.mkdirSync(uploadsDir, { recursive: true }); } catch (e) {}
  }
  const dbPath = path.resolve(uploadsDir, "bunny_edge.db");
  const local = createClient({
    url: `file:${dbPath}`
  });
  // Auto-bootstrap schema in local edge db
  try {
    for (const sql of ALL_TABLE_SCHEMAS) {
      local.execute(sql).catch(() => {});
    }
  } catch (e) {}
  return local;
}

function createResilientClient(remoteClient: Client | null, localClient: Client): Client {
  let remoteCooldownUntil = 0;

  const handleExecute = async (stmt: InStatement): Promise<ResultSet> => {
    const now = Date.now();
    const isRemoteAvailable = remoteClient && now > remoteCooldownUntil;

    if (isRemoteAvailable && remoteClient) {
      try {
        return await remoteClient.execute(stmt);
      } catch (err: any) {
        const isSqlError = err.message?.includes("SQLITE_") || err.message?.includes("SQLite error") || err.code?.startsWith("SQLITE_");
        if (isSqlError) {
          throw err; // Re-throw SQL errors so they can be caught by the caller without triggering a fallback
        }

        // Transient network or connection failure. Impose a 5-second cooldown to protect performance, then fallback to local sqlite for this request
        remoteCooldownUntil = Date.now() + 5000;
        console.warn(`🐰 [BunnyDB] Remote endpoint query failed (${err.message || err}). Initiating 5-second auto-recovering cooldown and falling back to local persistent edge database.`);
        return await localClient.execute(stmt);
      }
    }
    return await localClient.execute(stmt);
  };

  const handleBatch = async (stmts: InStatement[], mode?: TransactionMode): Promise<ResultSet[]> => {
    const now = Date.now();
    const isRemoteAvailable = remoteClient && now > remoteCooldownUntil;

    if (isRemoteAvailable && remoteClient) {
      try {
        return await remoteClient.batch(stmts, mode);
      } catch (err: any) {
        const isSqlError = err.message?.includes("SQLITE_") || err.message?.includes("SQLite error") || err.code?.startsWith("SQLITE_");
        if (isSqlError) {
          throw err;
        }

        remoteCooldownUntil = Date.now() + 5000;
        console.warn(`🐰 [BunnyDB] Remote endpoint batch failed (${err.message || err}). Initiating 5-second auto-recovering cooldown and falling back to local persistent edge database.`);
        return await localClient.batch(stmts, mode);
      }
    }
    return await localClient.batch(stmts, mode);
  };

  return {
    get protocol() {
      const now = Date.now();
      return (remoteClient && now > remoteCooldownUntil) ? remoteClient.protocol : localClient.protocol;
    },
    execute(stmt: InStatement) {
      return handleExecute(stmt);
    },
    batch(stmts: InStatement[], mode?: TransactionMode) {
      return handleBatch(stmts, mode);
    },
    transaction(mode?: TransactionMode) {
      const now = Date.now();
      if (remoteClient && now > remoteCooldownUntil) {
        try {
          return remoteClient.transaction(mode);
        } catch (e) {
          remoteCooldownUntil = Date.now() + 5000;
          return localClient.transaction(mode);
        }
      }
      return localClient.transaction(mode);
    },
    executeMultiple(sql: string) {
      const now = Date.now();
      if (remoteClient && now > remoteCooldownUntil) {
        try {
          return remoteClient.executeMultiple(sql);
        } catch (e) {
          remoteCooldownUntil = Date.now() + 5000;
          return localClient.executeMultiple(sql);
        }
      }
      return localClient.executeMultiple(sql);
    },
    sync() {
      const now = Date.now();
      if (remoteClient && now > remoteCooldownUntil) {
        try {
          return remoteClient.sync();
        } catch (e) {
          remoteCooldownUntil = Date.now() + 5000;
          return localClient.sync();
        }
      }
      return localClient.sync();
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
        } catch (e: any) {
          remoteClient = null;
        }
      } else {
        console.log("🐰 [BunnyDB] No remote credentials found, using local persistent edge database.");
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
    )`,
    `CREATE TABLE IF NOT EXISTS nosql_items (
      collection TEXT NOT NULL,
      id TEXT NOT NULL,
      data TEXT,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (collection, id)
    )`,
    `CREATE TABLE IF NOT EXISTS agencies (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      logoUrl TEXT,
      website TEXT,
      phone TEXT,
      email TEXT,
      city TEXT,
      country TEXT,
      data TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
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
