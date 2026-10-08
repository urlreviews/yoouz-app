
import { getBunnyDb } from "./src/lib/bunny-db.ts";

async function cleanDb() {
  const db = getBunnyDb();
  if (!db) {
    console.error("Failed to connect to database");
    process.exit(1);
  }

  console.log("🧹 Starting database cleanup...");

  try {
    // Delete all comments
    console.log("Cleaning comments...");
    await db.execute("DELETE FROM comments");
    
    // Delete all chats
    console.log("Cleaning chats...");
    await db.execute("DELETE FROM chats");

    // Optional: reset counts in videoReviews if they exist
    console.log("Resetting comment counts in videoReviews...");
    await db.execute("UPDATE videoReviews SET commentsCount = 0");

    console.log("✅ Database cleaned successfully. Starting from scratch!");
  } catch (error) {
    console.error("❌ Error cleaning database:", error);
    process.exit(1);
  }
}

cleanDb();
