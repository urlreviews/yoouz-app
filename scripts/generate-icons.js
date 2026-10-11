import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

async function generateIcons() {
  const svgPath = path.resolve('./public/favicon.svg');
  const svgBuffer = fs.readFileSync(svgPath);

  const targets = [
    { name: 'favicon.png', size: 64 },
    { name: 'apple-touch-icon.png', size: 180 },
    { name: 'icon-192.png', size: 192 },
    { name: 'icon-512.png', size: 512 },
  ];

  for (const t of targets) {
    const outPath = path.resolve('./public', t.name);
    await sharp(svgBuffer)
      .resize(t.size, t.size)
      .png()
      .toFile(outPath);
    console.log(`Generated ${t.name} (${t.size}x${t.size})`);
  }
}

generateIcons().catch(err => {
  console.error(err);
  process.exit(1);
});
