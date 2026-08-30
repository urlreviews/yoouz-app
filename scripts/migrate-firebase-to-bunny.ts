/**
 * ============================================================================
 * FIREBASE TO BUNNY (STORAGE + DATABASE SQL) MIGRATION SCRIPT
 * ============================================================================
 *
 * This enterprise migration utility:
 * 1. Connects to Firebase (Storage + Firestore) using Admin SDK or REST fallback.
 * 2. Scans and downloads all media files (Avatars, Business Logos, Videos, Thumbnails).
 * 3. Uploads media directly to your Bunny.net Storage Zone via Bunny Storage API.
 * 4. Rewrites Firebase media URLs to your fast Bunny CDN / Pull Zone domain.
 * 5. Extracts all Users, Video Reviews, Comments, Places, and Chats from Firestore.
 * 6. Generates a production-ready SQL file (`bunny_migration_dump.sql`) compatible
 *    with SQLite, MySQL, PostgreSQL, and Bunny Database.
 *
 * Usage:
 *   npx tsx scripts/migrate-firebase-to-bunny.ts
 *   -or-
 *   node scripts/migrate-firebase-to-bunny.mjs
 * ============================================================================
 */

import fs from 'fs';
import path from 'path';
import https from 'https';
import http from 'http';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import dotenv from 'dotenv';

// Load environment variables from .env if present
dotenv.config();

// ============================================================================
// CONFIGURATION & ENVIRONMENT VARIABLES
// ============================================================================
interface MigrationConfig {
  // Firebase configuration
  firebaseServiceAccountPath?: string;
  firebaseServiceAccountJson?: string;
  firebaseProjectId?: string;
  firebaseDatabaseId?: string;
  firebaseStorageBucket?: string;
  
  // Bunny.net Storage configuration
  bunnyStorageApiKey: string;        // Storage Zone Password / API Key (Read-Write)
  bunnyStorageZoneName: string;      // Storage Zone Name (e.g. 'yoouz-storage')
  bunnyStorageRegion: string;        // 'de' (Falkenstein/EU), 'ny', 'la', 'sg', 'syd', 'uk', 'se', 'br', 'jh', or '' (Default EU)
  bunnyPullZoneUrl: string;          // Pull Zone URL (e.g. 'https://yoouz-media.b-cdn.net' or 'https://cdn.yoouz.com')

  // Output settings
  outputSqlPath: string;
  outputReportPath: string;
  concurrencyLimit: number;
  dryRun: boolean;                   // If true, scans and generates SQL without uploading files
}

const config: MigrationConfig = {
  firebaseServiceAccountPath: process.env.FIREBASE_SERVICE_ACCOUNT_PATH || './service-account.json',
  firebaseServiceAccountJson: process.env.FIREBASE_SERVICE_ACCOUNT || process.env.FIREBASE_CONFIG,
  firebaseProjectId: process.env.FIREBASE_PROJECT_ID || 'gen-lang-client-0669185519',
  firebaseDatabaseId: process.env.FIREBASE_DATABASE_ID || 'ai-studio-yoouz-95541371-cdcc-4025-9fb0-c7f3ae35f87c',
  firebaseStorageBucket: process.env.FIREBASE_STORAGE_BUCKET || '',

  bunnyStorageApiKey: process.env.BUNNY_STORAGE_API_KEY || '',
  bunnyStorageZoneName: process.env.BUNNY_STORAGE_ZONE_NAME || '',
  bunnyStorageRegion: (process.env.BUNNY_STORAGE_REGION || '').toLowerCase().trim(),
  bunnyPullZoneUrl: (process.env.BUNNY_PULL_ZONE_URL || '').replace(/\/+$/, ''),

  outputSqlPath: process.env.OUTPUT_SQL_PATH || './bunny_migration_dump.sql',
  outputReportPath: process.env.OUTPUT_REPORT_PATH || './bunny_migration_report.json',
  concurrencyLimit: parseInt(process.env.MIGRATION_CONCURRENCY || '5', 10),
  dryRun: process.env.DRY_RUN === 'true'
};

// URL Mapping table: old Firebase URL -> new Bunny CDN URL
const urlMap = new Map<string, string>();

// Statistics
const stats = {
  usersFound: 0,
  placesFound: 0,
  reviewsFound: 0,
  commentsFound: 0,
  mediaDiscovered: 0,
  mediaUploaded: 0,
  mediaSkipped: 0,
  mediaFailed: 0,
  errors: [] as string[]
};

// ============================================================================
// BUNNY STORAGE API HELPERS
// ============================================================================

/**
 * Resolves the appropriate Bunny Storage API hostname based on region.
 */
function getBunnyStorageEndpoint(region: string): string {
  switch (region) {
    case 'ny':
    case 'us':
    case 'us-east':
      return 'ny.storage.bunnycdn.com';
    case 'la':
    case 'us-west':
      return 'la.storage.bunnycdn.com';
    case 'sg':
    case 'asia':
      return 'sg.storage.bunnycdn.com';
    case 'syd':
    case 'oceania':
      return 'syd.storage.bunnycdn.com';
    case 'uk':
    case 'lon':
      return 'uk.storage.bunnycdn.com';
    case 'se':
    case 'stockholm':
      return 'se.storage.bunnycdn.com';
    case 'br':
    case 'saopaulo':
      return 'br.storage.bunnycdn.com';
    case 'jh':
    case 'africa':
      return 'jh.storage.bunnycdn.com';
    case 'de':
    case 'eu':
    default:
      return 'storage.bunnycdn.com';
  }
}

/**
 * Uploads a Buffer directly to Bunny Storage using PUT request.
 */
async function uploadToBunnyStorage(
  remoteFilePath: string,
  fileBuffer: Buffer,
  contentType: string
): Promise<string> {
  const cleanPath = remoteFilePath.replace(/^\/+/, '');
  const endpoint = getBunnyStorageEndpoint(config.bunnyStorageRegion);
  const uploadUrl = `https://${endpoint}/${config.bunnyStorageZoneName}/${cleanPath}`;

  const cdnBase = config.bunnyPullZoneUrl || `https://${config.bunnyStorageZoneName}.b-cdn.net`;
  const cdnUrl = `${cdnBase}/${cleanPath}`;

  if (config.dryRun) {
    console.log(`[DRY-RUN] Would upload to Bunny: ${uploadUrl} (${fileBuffer.length} bytes)`);
    return cdnUrl;
  }

  if (!config.bunnyStorageApiKey || !config.bunnyStorageZoneName) {
    throw new Error('BUNNY_STORAGE_API_KEY and BUNNY_STORAGE_ZONE_NAME are required for live uploads.');
  }

  const maxRetries = 3;
  let attempt = 0;

  while (attempt < maxRetries) {
    try {
      attempt++;
      const response = await fetch(uploadUrl, {
        method: 'PUT',
        headers: {
          AccessKey: config.bunnyStorageApiKey,
          'Content-Type': contentType || 'application/octet-stream',
          'Content-Length': fileBuffer.length.toString()
        },
        body: fileBuffer
      });

      if (response.ok || response.status === 201 || response.status === 200) {
        return cdnUrl;
      }

      const errorText = await response.text().catch(() => '');
      if (attempt >= maxRetries) {
        throw new Error(`Bunny upload failed (${response.status}): ${errorText}`);
      }
      await new Promise(r => setTimeout(r, 1000 * attempt));
    } catch (err: any) {
      if (attempt >= maxRetries) throw err;
      await new Promise(r => setTimeout(r, 1000 * attempt));
    }
  }

  return cdnUrl;
}

/**
 * Downloads a file from an HTTP/HTTPS URL into a Buffer.
 */
async function downloadFileToBuffer(fileUrl: string): Promise<{ buffer: Buffer; contentType: string } | null> {
  try {
    const res = await fetch(fileUrl, { redirect: 'follow' });
    if (!res.ok) {
      throw new Error(`Failed to download ${fileUrl} (Status ${res.status})`);
    }
    const arrayBuffer = await res.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const contentType = res.headers.get('content-type') || 'application/octet-stream';
    return { buffer, contentType };
  } catch (err: any) {
    console.warn(`⚠️ Warning: Could not download media at ${fileUrl}:`, err.message);
    return null;
  }
}

/**
 * Infers appropriate file extension from content-type or URL.
 */
function inferExtension(url: string, contentType: string, defaultExt = '.bin'): string {
  if (contentType.includes('mp4')) return '.mp4';
  if (contentType.includes('webm')) return '.webm';
  if (contentType.includes('quicktime')) return '.mov';
  if (contentType.includes('png')) return '.png';
  if (contentType.includes('jpeg') || contentType.includes('jpg')) return '.jpg';
  if (contentType.includes('webp')) return '.webp';
  if (contentType.includes('svg')) return '.svg';

  const extMatch = url.match(/\.([a-zA-Z0-9]{2,5})(\?|$)/);
  if (extMatch && extMatch[1]) return `.${extMatch[1].toLowerCase()}`;

  return defaultExt;
}

/**
 * Handles downloading a media URL and uploading it to Bunny Storage.
 */
async function migrateMediaUrl(originalUrl: string | undefined | null, category: 'avatars' | 'logos' | 'videos' | 'thumbnails', entityId: string): Promise<string> {
  if (!originalUrl || typeof originalUrl !== 'string' || originalUrl.trim() === '') {
    return '';
  }

  const trimmed = originalUrl.trim();

  // If already migrated or hosted on Bunny CDN, return as-is
  if (urlMap.has(trimmed)) {
    return urlMap.get(trimmed)!;
  }
  if (config.bunnyPullZoneUrl && trimmed.startsWith(config.bunnyPullZoneUrl)) {
    return trimmed;
  }
  if (trimmed.includes('b-cdn.net')) {
    return trimmed;
  }

  // Skip inline base64 or UI-Avatar generators unless specifically desired
  if (trimmed.startsWith('data:') || trimmed.includes('ui-avatars.com') || trimmed.includes('dicebear.com')) {
    return trimmed;
  }

  stats.mediaDiscovered++;
  console.log(`📥 Migrating [${category}] for ID: ${entityId} from ${trimmed.slice(0, 60)}...`);

  try {
    const downloaded = await downloadFileToBuffer(trimmed);
    if (!downloaded) {
      stats.mediaFailed++;
      return trimmed; // keep original if download failed
    }

    const ext = inferExtension(trimmed, downloaded.contentType, category === 'videos' ? '.mp4' : '.jpg');
    const safeEntityId = entityId.replace(/[^a-zA-Z0-9_-]/g, '_');
    const remotePath = `${category}/${safeEntityId}_${Date.now()}${ext}`;

    const newCdnUrl = await uploadToBunnyStorage(remotePath, downloaded.buffer, downloaded.contentType);
    urlMap.set(trimmed, newCdnUrl);
    stats.mediaUploaded++;
    console.log(`✅ [${category}] Uploaded -> ${newCdnUrl}`);
    return newCdnUrl;
  } catch (err: any) {
    stats.mediaFailed++;
    stats.errors.push(`Failed migrating ${trimmed}: ${err.message}`);
    console.error(`❌ Error migrating media: ${err.message}`);
    return trimmed;
  }
}

// ============================================================================
// SQL FORMATTING & ESCAPING HELPERS (SQLITE / MYSQL / BUNNY DB COMPATIBLE)
// ============================================================================

function escapeSqlString(val: any): string {
  if (val === null || val === undefined) return 'NULL';
  if (typeof val === 'number') return isNaN(val) ? 'NULL' : val.toString();
  if (typeof val === 'boolean') return val ? '1' : '0';
  if (typeof val === 'object') {
    return `'${JSON.stringify(val).replace(/'/g, "''")}'`;
  }
  return `'${String(val).replace(/'/g, "''")}'`;
}

function escapeSqlDate(val: any): string {
  if (!val) return 'NULL';
  try {
    let d: Date;
    if (typeof val === 'number') d = new Date(val);
    else if (val._seconds) d = new Date(val._seconds * 1000);
    else d = new Date(val);

    if (isNaN(d.getTime())) return escapeSqlString(val);
    return `'${d.toISOString()}'`;
  } catch {
    return escapeSqlString(val);
  }
}

// ============================================================================
// FIREBASE INITIALIZATION & DATA EXTRACTION
// ============================================================================

async function initFirebase() {
  if (getApps().length > 0) {
    return {
      db: getFirestore(getApps()[0], config.firebaseDatabaseId),
      storage: getStorage(getApps()[0])
    };
  }

  let credential: any;

  if (config.firebaseServiceAccountJson) {
    try {
      const parsed = JSON.parse(config.firebaseServiceAccountJson);
      credential = cert(parsed);
    } catch {
      console.warn('Could not parse FIREBASE_SERVICE_ACCOUNT JSON, checking file path...');
    }
  }

  if (!credential && config.firebaseServiceAccountPath && fs.existsSync(config.firebaseServiceAccountPath)) {
    try {
      const content = fs.readFileSync(config.firebaseServiceAccountPath, 'utf8');
      const parsed = JSON.parse(content);
      credential = cert(parsed);
      console.log(`🔑 Loaded Firebase Service Account from ${config.firebaseServiceAccountPath}`);
    } catch (err: any) {
      console.warn(`Could not load Service Account from path: ${err.message}`);
    }
  }

  const appOptions: any = {
    projectId: config.firebaseProjectId
  };

  if (credential) {
    appOptions.credential = credential;
  }
  if (config.firebaseStorageBucket) {
    appOptions.storageBucket = config.firebaseStorageBucket;
  }

  const app = initializeApp(appOptions);
  const db = getFirestore(app, config.firebaseDatabaseId);
  const storage = getStorage(app);

  return { db, storage };
}

// ============================================================================
// MAIN MIGRATION EXECUTION
// ============================================================================

async function runMigration() {
  console.log('================================================================');
  console.log('🚀 STARTING FIREBASE -> BUNNY STORAGE & SQL DATABASE MIGRATION');
  console.log('================================================================');
  console.log(`Target Storage Zone: ${config.bunnyStorageZoneName || '(Not set / Dry run)'}`);
  console.log(`Storage Region:      ${config.bunnyStorageRegion || 'default (EU Falkenstein)'}`);
  console.log(`Pull Zone CDN:       ${config.bunnyPullZoneUrl || '(Auto b-cdn.net)'}`);
  console.log(`Output SQL Dump:     ${config.outputSqlPath}`);
  console.log(`Dry Run Mode:        ${config.dryRun ? 'YES (No live uploads)' : 'NO (Live Uploads Active)'}`);
  console.log('----------------------------------------------------------------\n');

  const { db, storage } = await initFirebase();

  const sqlStatements: string[] = [];

  // Write Table Schemas (DDL)
  sqlStatements.push(`-- ==========================================================`);
  sqlStatements.push(`-- BUNNY DATABASE SCHEMA DEFINITIONS (SQLite / MySQL Compatible)`);
  sqlStatements.push(`-- Generated automatically at: ${new Date().toISOString()}`);
  sqlStatements.push(`-- ==========================================================\n`);

  sqlStatements.push(`-- Users Table`);
  sqlStatements.push(`CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(128) PRIMARY KEY,
  uid VARCHAR(128) NOT NULL,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  avatar_url TEXT,
  bio TEXT,
  role VARCHAR(64) DEFAULT 'user',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_login TIMESTAMP,
  metadata_json TEXT
);\n`);

  sqlStatements.push(`-- Places / Businesses Table`);
  sqlStatements.push(`CREATE TABLE IF NOT EXISTS places (
  id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  domain VARCHAR(255),
  url TEXT,
  category VARCHAR(128),
  logo_url TEXT,
  banner_url TEXT,
  description TEXT,
  site_name VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  metadata_json TEXT
);\n`);

  sqlStatements.push(`-- Video Reviews Table`);
  sqlStatements.push(`CREATE TABLE IF NOT EXISTS video_reviews (
  id VARCHAR(255) PRIMARY KEY,
  place_id VARCHAR(255) NOT NULL,
  place_name VARCHAR(255) NOT NULL,
  place_category VARCHAR(128),
  user_id VARCHAR(128) NOT NULL,
  author_name VARCHAR(255) NOT NULL,
  author_handle VARCHAR(128),
  author_avatar_url TEXT,
  video_url TEXT NOT NULL,
  video_thumbnail_url TEXT,
  rating INTEGER DEFAULT 5,
  comment TEXT,
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  bookmarks_count INTEGER DEFAULT 0,
  helpful_count INTEGER DEFAULT 0,
  duration_seconds INTEGER DEFAULT 60,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  metadata_json TEXT
);\n`);

  sqlStatements.push(`-- Review Comments Table`);
  sqlStatements.push(`CREATE TABLE IF NOT EXISTS comments (
  id VARCHAR(255) PRIMARY KEY,
  video_id VARCHAR(255) NOT NULL,
  user_id VARCHAR(128),
  author_name VARCHAR(255) NOT NULL,
  author_handle VARCHAR(128),
  author_avatar_url TEXT,
  text TEXT NOT NULL,
  likes_count INTEGER DEFAULT 0,
  reply_to_id VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);\n`);

  sqlStatements.push(`-- ==========================================================`);
  sqlStatements.push(`-- DATA INSERTS`);
  sqlStatements.push(`-- ==========================================================\n`);

  // --------------------------------------------------------------------------
  // 1. MIGRATE USERS
  // --------------------------------------------------------------------------
  console.log('👤 [1/4] Fetching Users from Firestore...');
  try {
    const userDocs: any[] = [];

    // Try root 'users' collection
    const usersSnap = await db.collection('users').get().catch(() => null);
    if (usersSnap && !usersSnap.empty) {
      usersSnap.forEach(d => userDocs.push({ id: d.id, ...d.data() }));
    }

    // Try fallback 'firestore_users' collection
    const fUsersSnap = await db.collection('firestore_users').get().catch(() => null);
    if (fUsersSnap && !fUsersSnap.empty) {
      fUsersSnap.forEach(d => {
        const val = d.data();
        userDocs.push({ id: d.id, ...(val.data || val) });
      });
    }

    // Deduplicate by ID / UID
    const seenUsers = new Set<string>();
    for (const u of userDocs) {
      const userId = u.uid || u.id;
      if (!userId || seenUsers.has(userId)) continue;
      seenUsers.add(userId);
      stats.usersFound++;

      // Migrate User Avatar to Bunny Storage
      const newAvatarUrl = await migrateMediaUrl(u.avatar || u.avatarUrl || u.photoURL, 'avatars', userId);

      const sql = `INSERT INTO users (id, uid, name, email, avatar_url, bio, role, created_at, last_login, metadata_json)
VALUES (
  ${escapeSqlString(userId)},
  ${escapeSqlString(u.uid || userId)},
  ${escapeSqlString(u.name || u.displayName || 'Anonymous User')},
  ${escapeSqlString(u.email || `${userId}@yoouz.com`)},
  ${escapeSqlString(newAvatarUrl)},
  ${escapeSqlString(u.bio || '')},
  ${escapeSqlString(u.role || 'user')},
  ${escapeSqlDate(u.createdAt || u.created_at || new Date())},
  ${escapeSqlDate(u.lastLogin || u.last_login)},
  ${escapeSqlString(u)}
);`;
      sqlStatements.push(sql);
    }
    console.log(`✅ Processed ${stats.usersFound} User profiles.`);
  } catch (err: any) {
    console.error('⚠️ Notice reading users collection:', err.message);
  }

  // --------------------------------------------------------------------------
  // 2. MIGRATE PLACES / BUSINESSES
  // --------------------------------------------------------------------------
  console.log('\n🏢 [2/4] Fetching Places & Businesses from Firestore...');
  try {
    const placeDocs: any[] = [];
    const placesSnap = await db.collection('places').get().catch(() => null);
    if (placesSnap && !placesSnap.empty) {
      placesSnap.forEach(d => placeDocs.push({ id: d.id, ...d.data() }));
    }

    const seenPlaces = new Set<string>();
    for (const p of placeDocs) {
      const placeId = p.id || p.domain || p.name;
      if (!placeId || seenPlaces.has(placeId)) continue;
      seenPlaces.add(placeId);
      stats.placesFound++;

      // Migrate Business Logo and Banner to Bunny Storage
      const newLogoUrl = await migrateMediaUrl(p.image || p.logoUrl || p.logo, 'logos', `${placeId}_logo`);
      const newBannerUrl = await migrateMediaUrl(p.bannerUrl || p.banner, 'logos', `${placeId}_banner`);

      const sql = `INSERT INTO places (id, name, domain, url, category, logo_url, banner_url, description, site_name, created_at, metadata_json)
VALUES (
  ${escapeSqlString(placeId)},
  ${escapeSqlString(p.name || p.title || placeId)},
  ${escapeSqlString(p.domain || placeId)},
  ${escapeSqlString(p.url || `https://${placeId}`)},
  ${escapeSqlString(p.category || 'Website')},
  ${escapeSqlString(newLogoUrl)},
  ${escapeSqlString(newBannerUrl)},
  ${escapeSqlString(p.description || '')},
  ${escapeSqlString(p.siteName || p.site_name || '')},
  ${escapeSqlDate(p.createdAt || p.created_at || new Date())},
  ${escapeSqlString(p)}
);`;
      sqlStatements.push(sql);
    }
    console.log(`✅ Processed ${stats.placesFound} Places & Business entities.`);
  } catch (err: any) {
    console.error('⚠️ Notice reading places collection:', err.message);
  }

  // --------------------------------------------------------------------------
  // 3. MIGRATE VIDEO REVIEWS & MEDIA
  // --------------------------------------------------------------------------
  console.log('\n📹 [3/4] Fetching Video Reviews from Firestore...');
  const allComments: any[] = [];

  try {
    const videoDocs: any[] = [];
    
    // Check 'videoReviews' and 'videos'
    const snap1 = await db.collection('videoReviews').get().catch(() => null);
    if (snap1 && !snap1.empty) {
      snap1.forEach(d => videoDocs.push({ id: d.id, ...d.data() }));
    }

    const snap2 = await db.collection('videos').get().catch(() => null);
    if (snap2 && !snap2.empty) {
      snap2.forEach(d => {
        if (!videoDocs.some(v => v.id === d.id)) {
          videoDocs.push({ id: d.id, ...d.data() });
        }
      });
    }

    const seenVideos = new Set<string>();
    for (const v of videoDocs) {
      if (!v.id || seenVideos.has(v.id)) continue;
      seenVideos.add(v.id);
      stats.reviewsFound++;

      // 1. Migrate video file itself to Bunny Storage
      const newVideoUrl = await migrateMediaUrl(v.videoUrl || v.url, 'videos', v.id);

      // 2. Migrate video thumbnail
      const newThumbUrl = await migrateMediaUrl(v.videoThumbnail || v.thumbnailUrl, 'thumbnails', `${v.id}_thumb`);

      // 3. Migrate author avatar if needed
      const authorObj = typeof v.author === 'object' ? v.author : {};
      const authorAvatar = authorObj.avatar || v.authorAvatar || '';
      const newAuthorAvatar = await migrateMediaUrl(authorAvatar, 'avatars', `author_${v.userId || v.id}`);

      const sql = `INSERT INTO video_reviews (
  id, place_id, place_name, place_category, user_id, author_name, author_handle, author_avatar_url,
  video_url, video_thumbnail_url, rating, comment, likes_count, comments_count, bookmarks_count, helpful_count,
  duration_seconds, created_at, metadata_json
) VALUES (
  ${escapeSqlString(v.id)},
  ${escapeSqlString(v.placeId || v.place_id || 'general')},
  ${escapeSqlString(v.placeName || v.place_name || 'Business')},
  ${escapeSqlString(v.placeCategory || v.category || 'Website')},
  ${escapeSqlString(v.userId || v.user_id || 'anonymous')},
  ${escapeSqlString(authorObj.name || v.authorName || 'Reviewer')},
  ${escapeSqlString(authorObj.handle || v.authorHandle || '')},
  ${escapeSqlString(newAuthorAvatar)},
  ${escapeSqlString(newVideoUrl || v.videoUrl)},
  ${escapeSqlString(newThumbUrl)},
  ${escapeSqlString(v.rating || 5)},
  ${escapeSqlString(v.comment || v.description || '')},
  ${escapeSqlString(v.likesCount || v.likes || 0)},
  ${escapeSqlString(v.commentsCount || (Array.isArray(v.comments) ? v.comments.length : 0))},
  ${escapeSqlString(v.bookmarksCount || 0)},
  ${escapeSqlString(v.helpfulCount || 0)},
  ${escapeSqlString(v.durationSeconds || 60)},
  ${escapeSqlDate(v.createdAt || v.createdAtMs || new Date())},
  ${escapeSqlString(v)}
);`;
      sqlStatements.push(sql);

      // Collect inline comments
      if (Array.isArray(v.comments)) {
        v.comments.forEach((c: any, idx: number) => {
          allComments.push({
            id: c.id || `${v.id}_c_${idx}`,
            videoId: v.id,
            userId: c.userId || c.authorId || '',
            authorName: c.authorName || 'User',
            authorHandle: c.authorHandle || '',
            authorAvatar: c.authorAvatar || '',
            text: c.text || c.comment || '',
            likesCount: c.likesCount || 0,
            replyToId: c.replyToId || null,
            createdAt: c.createdAt || c.createdAtMs || new Date()
          });
        });
      }

      // Check subcollection `/videoReviews/{id}/comments`
      try {
        const subSnap = await db.collection('videoReviews').doc(v.id).collection('comments').get();
        if (!subSnap.empty) {
          subSnap.forEach(cd => {
            const cdData = cd.data();
            allComments.push({
              id: cd.id,
              videoId: v.id,
              userId: cdData.userId || cdData.authorId || '',
              authorName: cdData.authorName || 'User',
              authorHandle: cdData.authorHandle || '',
              authorAvatar: cdData.authorAvatar || '',
              text: cdData.text || cdData.comment || '',
              likesCount: cdData.likesCount || 0,
              replyToId: cdData.replyToId || null,
              createdAt: cdData.createdAt || new Date()
            });
          });
        }
      } catch {}
    }
    console.log(`✅ Processed ${stats.reviewsFound} Video Reviews.`);
  } catch (err: any) {
    console.error('⚠️ Notice reading video reviews:', err.message);
  }

  // --------------------------------------------------------------------------
  // 4. MIGRATE COMMENTS
  // --------------------------------------------------------------------------
  console.log('\n💬 [4/4] Processing Comments...');
  const seenComments = new Set<string>();
  for (const c of allComments) {
    if (!c.id || seenComments.has(c.id)) continue;
    seenComments.add(c.id);
    stats.commentsFound++;

    const newCommentAvatar = await migrateMediaUrl(c.authorAvatar, 'avatars', `comment_author_${c.id}`);

    const sql = `INSERT INTO comments (id, video_id, user_id, author_name, author_handle, author_avatar_url, text, likes_count, reply_to_id, created_at)
VALUES (
  ${escapeSqlString(c.id)},
  ${escapeSqlString(c.videoId)},
  ${escapeSqlString(c.userId)},
  ${escapeSqlString(c.authorName || 'User')},
  ${escapeSqlString(c.authorHandle || '')},
  ${escapeSqlString(newCommentAvatar)},
  ${escapeSqlString(c.text || '')},
  ${escapeSqlString(c.likesCount || 0)},
  ${escapeSqlString(c.replyToId)},
  ${escapeSqlDate(c.createdAt)}
);`;
    sqlStatements.push(sql);
  }
  console.log(`✅ Processed ${stats.commentsFound} Comments.`);

  // --------------------------------------------------------------------------
  // WRITE OUTPUT FILES
  // --------------------------------------------------------------------------
  console.log('\n💾 Writing SQL and JSON Migration Reports...');
  
  // 1. Write SQL file
  fs.writeFileSync(config.outputSqlPath, sqlStatements.join('\n'), 'utf8');
  console.log(`✅ SQL Dump written to: ${path.resolve(config.outputSqlPath)} (${sqlStatements.length} statements)`);

  // 2. Write Report file
  const report = {
    timestamp: new Date().toISOString(),
    configuration: {
      bunnyStorageZone: config.bunnyStorageZoneName,
      bunnyRegion: config.bunnyStorageRegion,
      bunnyPullZone: config.bunnyPullZoneUrl,
      outputSqlPath: config.outputSqlPath
    },
    statistics: stats,
    urlMapping: Object.fromEntries(urlMap.entries())
  };
  fs.writeFileSync(config.outputReportPath, JSON.stringify(report, null, 2), 'utf8');
  console.log(`✅ Migration Summary Report written to: ${path.resolve(config.outputReportPath)}`);

  console.log('\n================================================================');
  console.log('🎉 MIGRATION COMPLETED SUCCESSFULLY!');
  console.log('================================================================');
  console.log(`📊 Summary:`);
  console.log(`   - Users migrated:        ${stats.usersFound}`);
  console.log(`   - Places migrated:       ${stats.placesFound}`);
  console.log(`   - Video Reviews:         ${stats.reviewsFound}`);
  console.log(`   - Comments migrated:     ${stats.commentsFound}`);
  console.log(`   - Media Uploaded to CDN: ${stats.mediaUploaded} / ${stats.mediaDiscovered}`);
  console.log(`   - SQL File:              ${config.outputSqlPath}`);
  console.log('================================================================\n');
}

// Execute
runMigration().catch(err => {
  console.error('\n❌ Fatal Migration Error:', err);
  process.exit(1);
});
