const fs = require('fs');
const bunnyAccessKey = process.env.BUNNY_STORAGE_API_KEY;
const bunnyStorageZone = process.env.BUNNY_STORAGE_ZONE_NAME;
const bunnyRegion = process.env.BUNNY_STORAGE_REGION || "";
const hostname = bunnyRegion ? `${bunnyRegion}.storage.bunnycdn.com` : 'storage.bunnycdn.com';
const bunnyUrl = `https://${hostname}/${bunnyStorageZone}/videos/test_upload.txt`;
console.log(`Uploading to ${bunnyUrl}...`);
fetch(bunnyUrl, {
  method: 'PUT',
  headers: { 'AccessKey': bunnyAccessKey, 'Content-Type': 'text/plain' },
  body: 'test'
}).then(async r => {
  console.log('Status:', r.status);
  console.log('Body:', await r.text());
}).catch(e => console.error(e));
