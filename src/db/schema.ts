import { pgTable, serial, text, timestamp, integer, varchar, decimal, jsonb } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: varchar('uid', { length: 128 }).notNull().unique(),
  email: varchar('email', { length: 255 }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  avatar: text('avatar'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const reviews = pgTable('reviews', {
  id: serial('id').primaryKey(),
  placeId: varchar('place_id', { length: 128 }).notNull(),
  userId: varchar('user_id', { length: 128 }).notNull(),
  authorName: varchar('author_name', { length: 255 }).notNull(),
  authorAvatar: text('author_avatar'),
  videoUrl: text('video_url').notNull(),
  videoThumbnail: text('video_thumbnail'),
  rating: integer('rating').notNull(),
  comment: text('comment'),
  likesCount: integer('likes_count').default(0).notNull(),
  helpfulCount: integer('helpful_count').default(0).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const bookings = pgTable('bookings', {
  id: serial('id').primaryKey(),
  placeId: varchar('place_id', { length: 128 }).notNull(),
  userId: varchar('user_id', { length: 128 }).notNull(),
  checkIn: varchar('check_in', { length: 64 }).notNull(),
  checkOut: varchar('check_out', { length: 64 }).notNull(),
  guests: integer('guests').notNull(),
  totalPrice: decimal('total_price', { precision: 10, scale: 2 }).notNull(),
  status: varchar('status', { length: 32 }).default('confirmed').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const places = pgTable('places', {
  id: varchar('id', { length: 255 }).primaryKey(), // domain
  url: text('url').notNull(),
  title: text('title'),
  description: text('description'),
  image: text('image'),
  siteName: text('site_name'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const firestore_video_reviews = pgTable('firestore_video_reviews', {
  id: varchar('id', { length: 255 }).primaryKey(),
  data: jsonb('data').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const firestore_users = pgTable('firestore_users', {
  id: varchar('id', { length: 255 }).primaryKey(),
  data: jsonb('data').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const firestore_places = pgTable('firestore_places', {
  id: varchar('id', { length: 255 }).primaryKey(),
  data: jsonb('data').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const firestore_chats = pgTable('firestore_chats', {
  id: varchar('id', { length: 255 }).primaryKey(),
  data: jsonb('data').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
