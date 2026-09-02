const fs = require('fs');
const path = 'server.ts';
let content = fs.readFileSync(path, 'utf8');

const endpoint = `
  // Fast, zero-dependency local Avatar generator (bypasses tracking blockers for ui-avatars.com)
  app.get("/api/avatar", (req, res) => {
    try {
      const name = String(req.query.name || "User");
      const bg = String(req.query.background || req.query.bg || "27272a").replace("#", "");
      const color = String(req.query.color || "ffffff").replace("#", "");
      
      const cleanName = name.replace(/^(een|a|the)\\s+/i, "").trim() || "U";
      let initials = cleanName.substring(0, 2).toUpperCase();
      if (cleanName.includes(" ")) {
        const parts = cleanName.split(" ").filter(p => p.length > 0);
        if (parts.length > 1) {
          initials = (parts[0][0] + parts[1][0]).toUpperCase();
        }
      }
      
      const svg = \`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="256" height="256">
        <rect width="256" height="256" fill="#\${bg}"/>
        <text x="50%" y="50%" dominant-baseline="central" text-anchor="middle" fill="#\${color}" font-family="system-ui, -apple-system, sans-serif" font-weight="800" font-size="110">\${initials}</text>
      </svg>\`;
      
      res.setHeader("Content-Type", "image/svg+xml");
      res.setHeader("Cache-Control", "public, max-age=31536000"); // 1 year
      res.send(svg);
    } catch (e) {
      res.status(500).send("Error generating avatar");
    }
  });

  app.get('/api/check-env'
`;

content = content.replace("app.get('/api/check-env'", endpoint);
fs.writeFileSync(path, content, 'utf8');
