const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const newRoutes = `
  app.post("/api/interactions/like", async (req, res) => {
    try {
      const { videoId, isLiked, likesCount, userId } = req.body;
      if (!videoId || !userId) return res.status(400).json({ error: "Missing fields" });

      const bunnyDb = getBunnyDb();
      if (bunnyDb) {
        if (isLiked) {
          const id = \`\${userId}_\${videoId}\`;
          await bunnyDb.execute({
            sql: "INSERT OR IGNORE INTO likes (id, userId, videoId, data) VALUES (?, ?, ?, ?)",
            args: [id, userId, videoId, JSON.stringify({ createdAt: new Date().toISOString() })]
          });
        } else {
          await bunnyDb.execute({
            sql: "DELETE FROM likes WHERE userId = ? AND videoId = ?",
            args: [userId, videoId]
          });
        }
        
        if (typeof likesCount === "number") {
          await bunnyDb.execute({
            sql: "UPDATE videoReviews SET likesCount = ? WHERE id = ?",
            args: [likesCount, videoId]
          });
        }
      }
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/interactions/bookmark", async (req, res) => {
    try {
      const { videoId, isBookmarked, bookmarksCount, userId } = req.body;
      if (!videoId || !userId) return res.status(400).json({ error: "Missing fields" });

      const bunnyDb = getBunnyDb();
      if (bunnyDb) {
        if (isBookmarked) {
          const id = \`\${userId}_\${videoId}\`;
          await bunnyDb.execute({
            sql: "INSERT OR IGNORE INTO bookmarks (id, userId, placeId, videoId, data) VALUES (?, ?, ?, ?, ?)",
            args: [id, userId, "", videoId, JSON.stringify({ createdAt: new Date().toISOString() })]
          });
        } else {
          await bunnyDb.execute({
            sql: "DELETE FROM bookmarks WHERE userId = ? AND videoId = ?",
            args: [userId, videoId]
          });
        }
        // Note: Currently we don't have bookmarksCount on videoReviews schema, but keeping this robust
      }
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

`;

code = code.replace(
  /app\.post\("\/api\/videos\/save-review",/,
  newRoutes + 'app.post("/api/videos/save-review",'
);

fs.writeFileSync('server.ts', code);
console.log('Patched server.ts');
