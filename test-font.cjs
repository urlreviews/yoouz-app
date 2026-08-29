const sharp = require('sharp');
const fs = require('fs');

async function testFont(fontFamily) {
  const svg = `<svg width="400" height="100" xmlns="http://www.w3.org/2000/svg">
    <rect width="100%" height="100%" fill="black" />
    <text x="50" y="50" font-family="${fontFamily}" font-size="30" fill="white">Hello ${fontFamily}</text>
  </svg>`;
  const buffer = await sharp(Buffer.from(svg)).png().toBuffer();
  fs.writeFileSync(`test-${fontFamily.replace(/[^a-zA-Z]/g, '')}.png`, buffer);
  console.log(`Saved ${fontFamily}`);
}

async function run() {
  await testFont('sans-serif');
  await testFont('Liberation Sans');
  await testFont('Arial');
  await testFont('system-ui');
  await testFont('DejaVu Sans');
}
run();
