const fs = require('fs');
let server = fs.readFileSync('server.ts', 'utf8');

server = server.replace(
  "reviewerPhotoBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';",
  "reviewerPhotoBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';"
);

fs.writeFileSync('server.ts', server);
console.log("Transparent pixel fixed.");
