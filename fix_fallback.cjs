const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const regex = /const fallbackBuf = await sharp\(\{ create: \{ width: 1200, height: 630, channels: 4, background: \{ r: 9, g: 9, b: 11, alpha: 1 \} \} \}\)\.png\(\)\.toBuffer\(\);/;

const replacement = `const ogBannerPath = path.join(process.cwd(), 'public', 'og-banner.png');
      let fallbackBuf;
      if (fs.existsSync(ogBannerPath)) {
         fallbackBuf = await sharp(ogBannerPath).resize(1200, 630, { fit: 'cover' }).png().toBuffer();
      } else {
         fallbackBuf = await sharp({ create: { width: 1200, height: 630, channels: 4, background: { r: 9, g: 9, b: 11, alpha: 1 } } }).png().toBuffer();
      }`;

code = code.replace(regex, replacement);
fs.writeFileSync('server.ts', code);
console.log("Fixed fallback");
