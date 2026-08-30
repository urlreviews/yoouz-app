const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const replacement = `
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

         const playButtonSvg = \\\`
           <svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
             <rect width="1200" height="630" fill="#000000" fill-opacity="0.2"/>
             <g transform="translate(560, 275)">
               <circle cx="40" cy="40" r="40" fill="#000000" fill-opacity="0.6"/>
               <path d="M30 25l26 15-26 15V25z" fill="#ffffff"/>
             </g>
           </svg>
         \\\`;

         try {
           // 1. Create a blurred, covered background
           const background = await sharp(thumbBuf)
             .resize(1200, 630, { fit: 'cover' })
             .blur(40)
             .modulate({ brightness: 0.6 })
             .toBuffer();

           // 2. Create the crisp, contained foreground
           // Videos are typically 9:16 vertical (e.g. 720x1280). We fit it into 1200x630 with 'contain'.
           // To make it look like a short, we give it a clean height of 630.
           const foreground = await sharp(thumbBuf)
             .resize(1200, 630, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
             .toBuffer();

           const finalPng = await sharp(background)
             .composite([
                { input: foreground, blend: 'over' },
                { input: Buffer.from(playButtonSvg), blend: 'over' }
             ])
             .png({ quality: 90 })
             .toBuffer();
             
           res.setHeader('Content-Type', 'image/png');
           res.setHeader('Cache-Control', 'public, max-age=86400');
           return res.send(finalPng);
         } catch(e) {
           console.error("Sharp composite error:", e);
           const blank = await sharp({ create: { width: 1200, height: 630, channels: 4, background: { r: 9, g: 9, b: 11, alpha: 1 } } }).png().toBuffer();
           res.setHeader('Content-Type', 'image/png');
           return res.send(blank);
         }
      }
`;

code = code.replace(/if \(type === 'video'\) \{[\s\S]*?res\.send\(blank\);\n\s*\}/, replacement);

fs.writeFileSync('server.ts', code);
console.log("Patched to render exactly like a YouTube Short");
