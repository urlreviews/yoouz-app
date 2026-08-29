const fetch = require('node-fetch');
async function run() {
  const res = await fetch('http://localhost:3000/@aouisesmee/video/rev-1787990803895-2ftsu', {
    headers: { 'User-Agent': 'facebookexternalhit/1.1' }
  });
  const html = await res.text();
  
  const ogTitle = html.match(/<meta property="og:title" content="([^"]+)"/);
  const ogImage = html.match(/<meta property="og:image" content="([^"]+)"/);
  const ogDesc = html.match(/<meta property="og:description" content="([^"]+)"/);
  
  console.log("Title:", ogTitle ? ogTitle[1] : 'not found');
  console.log("Image:", ogImage ? ogImage[1] : 'not found');
  console.log("Desc:", ogDesc ? ogDesc[1] : 'not found');
}
run();
