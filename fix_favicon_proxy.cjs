const fs = require('fs');
const path = 'server.ts';
let content = fs.readFileSync(path, 'utf8');

const proxyEndpoint = `
  // Proxy for Google Favicon CDN to bypass mobile tracking blockers (e.g. iOS Safari)
  app.get("/api/favicon", async (req, res) => {
    try {
      const domain = req.query.domain;
      if (!domain) return res.status(400).send("Domain required");
      const url = \`https://t1.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://\${domain}&size=256\`;
      const response = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
      if (!response.ok) return res.status(response.status).send("Failed to fetch favicon");
      res.setHeader('Content-Type', response.headers.get('content-type') || 'image/png');
      res.setHeader('Cache-Control', 'public, max-age=604800');
      const arrayBuffer = await response.arrayBuffer();
      res.send(Buffer.from(arrayBuffer));
    } catch (e) {
      res.status(500).send(e.message);
    }
  });

  // SEO Robots.txt
`;

content = content.replace(/\/\/ SEO Robots\.txt/, proxyEndpoint);
fs.writeFileSync(path, content, 'utf8');
