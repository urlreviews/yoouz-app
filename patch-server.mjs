import fs from 'fs';
let content = fs.readFileSync('server.ts', 'utf8');

content = content.replace(
  "image = getMetaContent('og:image') || getMetaContent('twitter:image') || '';",
  `image = getMetaContent('og:image') || getMetaContent('twitter:image') || '';
          if (image && !image.startsWith('http')) {
            try {
              image = new URL(image, finalUrl).toString();
            } catch (e) {}
          }`
);

fs.writeFileSync('server.ts', content);
console.log('Patched server.ts successfully');
