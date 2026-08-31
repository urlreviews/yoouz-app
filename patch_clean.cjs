const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const regex = /app\.post\("\/api\/auth\/update-profile"/;
const replacement = `app.get("/api/admin/clean-users", async (req, res) => {
    try {
      const bunnyDb = getBunnyDb();
      if (!bunnyDb) return res.json({ error: "No DB" });
      
      const rows = await bunnyDb.execute("SELECT id, email, name FROM users");
      let deleted = [];
      for (const row of rows.rows) {
        const email = row.email || "";
        const name = row.name || "";
        const prefix = email.split('@')[0];
        if (name === "" || name === "Registered User" || name === prefix || name === "aouisesmee" || name === "ygf") {
          await bunnyDb.execute({ sql: "DELETE FROM users WHERE id = ?", args: [row.id] });
          deleted.push({ email, name });
        }
      }
      return res.json({ success: true, deleted });
    } catch (e) {
      return res.json({ error: e.message });
    }
  });

  app.post("/api/auth/update-profile"`;

code = code.replace(regex, replacement);
fs.writeFileSync('server.ts', code);
console.log("Patched server.ts with clean endpoint");
