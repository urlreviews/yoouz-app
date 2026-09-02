const fs = require('fs');
const path = require('path');

function replaceInFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  if (content.includes('ui-avatars.com/api/')) {
    // We just replace the base URL. The query parameters ?name=...&background=... are compatible.
    content = content.replace(/https:\/\/ui-avatars\.com\/api\//g, '/api/avatar');
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Replaced in ' + filePath);
  }
}

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(function(file) {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) { 
      results = results.concat(walk(file));
    } else { 
      if (file.endsWith('.ts') || file.endsWith('.tsx')) {
        results.push(file);
      }
    }
  });
  return results;
}

const files = walk('./src');
files.forEach(replaceInFile);
