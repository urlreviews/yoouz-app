const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const replacement = `
      // Short-circuit for 'video' type to use native Sharp compositing (Avoid SVG text rendering issues on Linux)
      if (type === 'video') {
         let thumbBuf;
         if (req.query.thumbUrl) {
           const tUrl = req.query.thumbUrl;
           if (tUrl.startsWith('data:image')) {
             thumbBuf = Buffer.from(tUrl.split(',')[1], 'base64');
           } else {
             try {
                const tr = await fetch(tUrl);
                thumbBuf = Buffer.from(await tr.arrayBuffer());
             } catch(e) {
                console.error("Failed to fetch thumbUrl", e);
             }
           }
         }
         
         if (!thumbBuf) {
            thumbBuf = await sharp({ create: { width: 1200, height: 630, channels: 4, background: { r: 9, g: 9, b: 11, alpha: 1 } } }).png().toBuffer();
         }

         const playButtonSvg = \`
           <svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
             <rect width="1200" height="630" fill="#000000" fill-opacity="0.3"/>
             <!-- Subtle glow behind player -->
             <circle cx="600" cy="315" r="200" fill="#3b82f6" fill-opacity="0.2" filter="blur(60px)"/>
             <g transform="translate(536, 251)">
               <circle cx="64" cy="64" r="64" fill="#000000" fill-opacity="0.6"/>
               <circle cx="64" cy="64" r="64" fill="none" stroke="#ffffff" stroke-opacity="0.3" stroke-width="2"/>
               <path d="M52 40l36 24-36 24V40z" fill="#ffffff"/>
             </g>
           </svg>
         \`;

         try {
           const finalPng = await sharp(thumbBuf)
             .resize(1200, 630, { fit: 'cover' })
             .blur(4) // Add a slight blur to mask low-res avatars
             .composite([{ input: Buffer.from(playButtonSvg), blend: 'over' }])
             .png({ quality: 90 })
             .toBuffer();
             
           res.setHeader('Content-Type', 'image/png');
           res.setHeader('Cache-Control', 'public, max-age=86400');
           return res.send(finalPng);
         } catch(e) {
           console.error("Sharp composite error:", e);
           // Fallback to textless blank background
           const blank = await sharp({ create: { width: 1200, height: 630, channels: 4, background: { r: 9, g: 9, b: 11, alpha: 1 } } }).png().toBuffer();
           res.setHeader('Content-Type', 'image/png');
           return res.send(blank);
         }
      }

      const svg = buildOgImageSvg({`;

code = code.replace(/const svg = buildOgImageSvg\(\{/, replacement);

fs.writeFileSync('server.ts', code);
console.log("Patched video OG image route successfully!");
