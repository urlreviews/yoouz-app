import { getBunnyDb, initBunnyDbSchema } from "../src/lib/bunny-db.ts";
import fs from "fs";

async function syncAllToBunnyDb() {
  const client = getBunnyDb();
  if (!client) {
    console.error("Cannot connect to Bunny Database");
    return;
  }
  await initBunnyDbSchema();
  const reviews = JSON.parse(fs.readFileSync("uploads/reviews_index.json", "utf8"));

  console.log(`Syncing ${reviews.length} video reviews into Bunny Cloud Database...`);
  for (const r of reviews) {
    const jsonStr = JSON.stringify(r);
    await client.execute({
      sql: `INSERT INTO videoReviews (id, placeId, placeName, authorName, rating, videoUrl, likesCount, viewsCount, data, updatedAt) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP) 
            ON CONFLICT(id) DO UPDATE SET data = ?, updatedAt = CURRENT_TIMESTAMP`,
      args: [
        r.id,
        r.placeId || r.place?.id || "",
        r.placeName || r.place?.name || "",
        r.author?.name || r.authorName || "",
        r.rating || 5,
        r.videoUrl || "",
        r.likes || r.likesCount || 0,
        r.views || r.viewsCount || 0,
        jsonStr,
        jsonStr
      ]
    });

    // Also sync place
    if (r.placeId || r.place?.id) {
      const pId = r.placeId || r.place?.id;
      const pName = r.placeName || r.place?.name || pId;
      const placeData = {
        id: pId,
        name: pName,
        website: r.placeWebsite || "",
        logoUrl: r.placeLogoUrl || "",
        category: r.placeCategory || "Business"
      };
      await client.execute({
        sql: `INSERT INTO places (id, name, data, updatedAt) 
              VALUES (?, ?, ?, CURRENT_TIMESTAMP) 
              ON CONFLICT(id) DO UPDATE SET data = ?, updatedAt = CURRENT_TIMESTAMP`,
        args: [pId, pName, JSON.stringify(placeData), JSON.stringify(placeData)]
      });
    }

    // Also sync user/author
    if (r.author?.name || r.userId) {
      const uId = r.userId || `usr_${(r.author?.name || "user").replace(/\s+/g, "_").toLowerCase()}`;
      const userData = {
        id: uId,
        name: r.author?.name || "User",
        email: r.userId || "",
        avatar: r.author?.avatar || ""
      };
      await client.execute({
        sql: `INSERT INTO users (id, email, name, data, updatedAt) 
              VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP) 
              ON CONFLICT(id) DO UPDATE SET data = ?, updatedAt = CURRENT_TIMESTAMP`,
        args: [uId, r.userId || "", r.author?.name || "User", JSON.stringify(userData), JSON.stringify(userData)]
      });
    }
  }

  // Verify counts in Bunny Cloud Database
  const rCount = await client.execute("SELECT count(*) as count FROM videoReviews;");
  const pCount = await client.execute("SELECT count(*) as count FROM places;");
  const uCount = await client.execute("SELECT count(*) as count FROM users;");

  console.log("🎉 Bunny Cloud Database Sync Complete:");
  console.log("✅ videoReviews in Bunny Cloud DB:", rCount.rows[0].count);
  console.log("✅ places in Bunny Cloud DB:", pCount.rows[0].count);
  console.log("✅ users in Bunny Cloud DB:", uCount.rows[0].count);
}

syncAllToBunnyDb();
