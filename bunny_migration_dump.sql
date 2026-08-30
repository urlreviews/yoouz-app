-- ==========================================================
-- BUNNY DATABASE SCHEMA DEFINITIONS (SQLite / MySQL Compatible)
-- Generated automatically at: 2026-08-30T07:44:53.847Z
-- ==========================================================

-- Users Table
CREATE TABLE IF NOT EXISTS users (
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
);

-- Places / Businesses Table
CREATE TABLE IF NOT EXISTS places (
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
);

-- Video Reviews Table
CREATE TABLE IF NOT EXISTS video_reviews (
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
);

-- Review Comments Table
CREATE TABLE IF NOT EXISTS comments (
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
);

-- ==========================================================
-- DATA INSERTS
-- ==========================================================
