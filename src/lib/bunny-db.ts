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
    userEmail TEXT,
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
    userEmail TEXT,
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

function withTimeout<T>(promise: Promise<T>, timeoutMs: number, errMsg = "Remote query timed out"): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(errMsg));
    }, timeoutMs);
    promise
      .then((val) => {
        clearTimeout(timer);
        resolve(val);
      })
      .catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
  });
}

function syncRemoteToLocalBackground(remoteClient: Client, localClient: Client) {
  setTimeout(async () => {
    const tables = ["users", "places", "videoReviews", "comments", "likes", "bookmarks", "shares", "chats", "notifications", "businessClaims", "follows", "agencies"];
    for (const tbl of tables) {
      try {
        const rs = await withTimeout(remoteClient.execute(`SELECT * FROM ${tbl}`), 2500, `Sync timeout for ${tbl}`);
        if (rs && rs.rows && rs.rows.length > 0) {
          for (const row of rs.rows) {
            const r = row as Record<string, any>;
            const cols = Object.keys(r).filter((k) => isNaN(Number(k)));
            if (cols.length === 0) continue;
            // Skip deleted system/duplicate user IDs during background sync
            if (tbl === "users" && ["usr_yoouz_admin", "usr_samet", "usr_steven_akan", "usr_ben_blue", "admin@users.yoouz.com", "4samet@users.yoouz.com", "stevenakan@users.yoouz.com", "benblue@users.yoouz.com"].includes(String(r.id))) {
              continue;
            }
            const placeholders = cols.map(() => "?").join(", ");
            const args = cols.map((c) => r[c] ?? null);
            await localClient.execute({
              sql: `INSERT OR IGNORE INTO ${tbl} (${cols.join(", ")}) VALUES (${placeholders})`,
              args
            }).catch(() => {});
          }
        }
      } catch (e) {}
    }
  }, 100);
}

function createResilientClient(remoteClient: Client | null, localClient: Client): Client {
  let remoteCooldownUntil = 0;

  if (remoteClient) {
    syncRemoteToLocalBackground(remoteClient, localClient);
  }

  const handleExecute = async (stmt: InStatement, args?: any[]): Promise<ResultSet> => {
    const finalStmt: InStatement = (args && typeof stmt === "string") ? { sql: stmt, args } : stmt;
    const sqlStr = typeof finalStmt === "string" ? finalStmt : finalStmt.sql;
    const isSelect = /^\s*SELECT\b/i.test(sqlStr);

    // 1. Always execute against ultra-fast local persistent edge SQLite (<1ms latency)
    const localRes = await localClient.execute(finalStmt);

    // 2. For any write/mutation (INSERT, UPDATE, DELETE, CREATE, ALTER), asynchronously replicate to remote Bunny Cloud DB without blocking HTTP response
    if (!isSelect && remoteClient && Date.now() > remoteCooldownUntil) {
      withTimeout(remoteClient.execute(finalStmt), 2500, "BunnyDB remote write timeout")
        .catch((err: any) => {
          const isSqlError =
            err.message?.includes("SQLITE_") ||
            err.message?.includes("SQLite error") ||
            err.code?.startsWith("SQLITE_");
          if (!isSqlError) {
            remoteCooldownUntil = Date.now() + 60000;
          }
        });
    }

    return localRes;
  };

  const handleBatch = async (stmts: InStatement[], mode?: TransactionMode): Promise<ResultSet[]> => {
    const localRes = await localClient.batch(stmts, mode);
    if (remoteClient && Date.now() > remoteCooldownUntil) {
      withTimeout(remoteClient.batch(stmts, mode), 2500, "BunnyDB remote batch timeout")
        .catch(() => {
          remoteCooldownUntil = Date.now() + 60000;
        });
    }
    return localRes;
  };

  return {
    get protocol() {
      const now = Date.now();
      return (remoteClient && now > remoteCooldownUntil) ? remoteClient.protocol : localClient.protocol;
    },
    execute(stmt: InStatement, args?: any[]) {
      return handleExecute(stmt, args);
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
      userEmail TEXT,
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
      userEmail TEXT,
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
    try { await client.execute("ALTER TABLE likes ADD COLUMN userEmail TEXT"); } catch (e) {}
    try { await client.execute("ALTER TABLE bookmarks ADD COLUMN userEmail TEXT"); } catch (e) {}
    try { await client.execute("ALTER TABLE videoReviews ADD COLUMN sharesCount INTEGER DEFAULT 0"); } catch (e) {}
    try { await client.execute("ALTER TABLE videoReviews ADD COLUMN commentsCount INTEGER DEFAULT 0"); } catch (e) {}
    try { await client.execute("ALTER TABLE places ADD COLUMN bannerUrl TEXT"); } catch (e) {}
    try { await client.execute("ALTER TABLE places ADD COLUMN brandDomain TEXT"); } catch (e) {}
    try { await client.execute("ALTER TABLE places ADD COLUMN website TEXT"); } catch (e) {}
    // Strict Author Immutability: Database never modifies or overrides review author names.
    isInitialized = true;
  } catch (err: any) {
    console.error("⚠️ [BunnyDB] Schema migration warning:", err?.message || err);
  }
}
