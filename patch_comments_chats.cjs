const fs = require('fs');
let serverCode = fs.readFileSync('server.ts', 'utf8');

const newRoutes = `
  app.post("/api/interactions/comment", async (req, res) => {
    try {
      const { videoId, comment, userId } = req.body;
      if (!videoId || !comment) return res.status(400).json({ error: "Missing fields" });

      const bunnyDb = getBunnyDb();
      if (bunnyDb) {
        await bunnyDb.execute({
          sql: "INSERT OR REPLACE INTO comments (id, videoId, userId, userName, userAvatar, text, data) VALUES (?, ?, ?, ?, ?, ?, ?)",
          args: [comment.id, videoId, userId || comment.authorHandle || "", comment.authorName || "", comment.authorAvatar || "", comment.text || "", JSON.stringify(comment)]
        });
      }
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/interactions/message", async (req, res) => {
    try {
      const { threadId, message, threadData } = req.body;
      if (!threadId || !threadData) return res.status(400).json({ error: "Missing fields" });

      const bunnyDb = getBunnyDb();
      if (bunnyDb) {
        await bunnyDb.execute({
          sql: "INSERT INTO chats (id, participants, lastMessage, lastSenderEmail, data, updatedAt) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP) ON CONFLICT(id) DO UPDATE SET lastMessage = ?, lastSenderEmail = ?, data = ?, updatedAt = CURRENT_TIMESTAMP",
          args: [
            threadId, 
            JSON.stringify(threadData.participants || []), 
            threadData.lastMessage || message?.text || "", 
            threadData.lastSenderEmail || message?.senderEmail || "", 
            JSON.stringify(threadData),
            threadData.lastMessage || message?.text || "", 
            threadData.lastSenderEmail || message?.senderEmail || "", 
            JSON.stringify(threadData)
          ]
        });
      }
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

`;

serverCode = serverCode.replace(
  /app\.post\("\/api\/interactions\/like",/,
  newRoutes + 'app.post("/api/interactions/like",'
);
fs.writeFileSync('server.ts', serverCode);

let appCode = fs.readFileSync('src/App.tsx', 'utf8');
appCode = appCode.replace(
  /fetch\(\`\/api\/nosql\/videoReviews\/\$\{videoId\}\`, \{\n\s*method: "POST",\n\s*headers: \{ "Content-Type": "application\/json" \},\n\s*body: JSON.stringify\(\{ data: dataToSave, merge: true \}\)\n\s*\}\)\.catch\(\(\) => \{\}\);/,
  `fetch(\`/api/nosql/videoReviews/\${videoId}\`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: dataToSave, merge: true })
      }).catch(() => {});
      fetch("/api/interactions/comment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ videoId, comment: newCommentItem, userId: currentUser?.email || auth.currentUser?.uid })
      }).catch(() => {});`
);
fs.writeFileSync('src/App.tsx', appCode);

let syncCode = fs.readFileSync('src/lib/socialSync.ts', 'utf8');
syncCode = syncCode.replace(
  /fetch\(\`\/api\/nosql\/chats\/\$\{threadId\}\`, \{\n\s*method: "POST",\n\s*headers: \{ "Content-Type": "application\/json" \},\n\s*body: JSON.stringify\(\{ data: threadData, merge: true \}\)\n\s*\}\)\.catch\(\(\) => \{\}\);/,
  `fetch(\`/api/nosql/chats/\${threadId}\`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ data: threadData, merge: true })
    }).catch(() => {});
    fetch("/api/interactions/message", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ threadId, message: newMessage, threadData })
    }).catch(() => {});`
);
fs.writeFileSync('src/lib/socialSync.ts', syncCode);

console.log('Patched comments and chats');
