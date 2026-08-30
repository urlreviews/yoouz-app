const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const debugRoute = `
app.get('/api/debug-metadata', async (req, res) => {
  const targetUrl = req.query.url;
  if (!targetUrl) return res.send("Please provide ?url=...");
  
  try {
    const urlObj = new URL(targetUrl);
    
    // Mock a request object for resolveMetadataForRequest
    const mockReq = {
      headers: {
        'x-forwarded-proto': urlObj.protocol.replace(':', ''),
        'x-forwarded-host': urlObj.host,
        host: urlObj.host
      },
      protocol: urlObj.protocol.replace(':', ''),
      originalUrl: urlObj.pathname + urlObj.search,
      url: urlObj.pathname + urlObj.search
    };
    
    const meta = await resolveMetadataForRequest(mockReq);
    const htmlTags = injectOpenGraphTags("<html><head><title>Test</title></head><body></body></html>", meta);
    
    // Return a beautiful preview
    res.setHeader('Content-Type', 'text/html');
    res.send(\`
      <html>
        <head>
          <style>
            body { font-family: system-ui, sans-serif; background: #09090b; color: #fff; padding: 40px; }
            .card { background: #18181b; padding: 24px; border-radius: 12px; border: 1px solid #27272a; margin-bottom: 24px; }
            pre { background: #000; padding: 16px; border-radius: 8px; overflow-x: auto; color: #a1a1aa; }
            img { max-width: 100%; height: auto; border-radius: 8px; border: 1px solid #27272a; }
            h2 { color: #f4f4f5; margin-top: 0; }
          </style>
        </head>
        <body>
          <h1>URL Metadata Preview</h1>
          
          <div class="card">
            <h2>Generated Open Graph Image</h2>
            <img src="\${meta.imageUrl}" />
          </div>

          <div class="card">
            <h2>Generated HTML Tags</h2>
            <pre>\${htmlTags.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>
          </div>
          
          <div class="card">
            <h2>Raw JSON Metadata Object</h2>
            <pre>\${JSON.stringify(meta, null, 2)}</pre>
          </div>
        </body>
      </html>
    \`);
  } catch (err) {
    res.status(500).send(err.message);
  }
});
`;

code = code.replace(
  /app\.get\(\['\/api\/og-preview-v2',/,
  debugRoute + "\n" + "  app.get(['/api/og-preview-v2',"
);

// Oh wait, my previous script was `app.get('/api/og-preview-v2'` not `['/api/og-preview-v2']`.
// Let's just insert it before `app.get('/api/og-preview-v2'`
code = code.replace(
  /app\.get\('\/api\/og-preview-v2'/,
  debugRoute + "\n" + "app.get('/api/og-preview-v2'"
);

fs.writeFileSync('server.ts', code);
console.log("Added debug metadata route");
