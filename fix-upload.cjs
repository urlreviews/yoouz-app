const fs = require('fs');
let content = fs.readFileSync('src/lib/videoStorage.ts', 'utf8');

const regex = /const percent = \(snapshot.bytesTransferred \/ snapshot.totalBytes\) \* 100;/g;
const replacement = `const percent = snapshot.totalBytes > 0 ? (snapshot.bytesTransferred / snapshot.totalBytes) * 100 : 0;`;
if(content.match(regex)) {
    content = content.replace(regex, replacement);
    fs.writeFileSync('src/lib/videoStorage.ts', content);
    console.log("Patched percent calculation!");
} else {
    console.log("Could not find percent calc");
}
