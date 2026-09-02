const fs = require('fs');
const path = require('path');

const onErrorString = `onError={(e) => { const target = e.currentTarget as HTMLImageElement; if (!target.src.includes('/api/avatar')) { target.src = '/api/avatar?name=User&background=27272a&color=fff'; } }}`;

function fixFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;

  // Regex to find img tags that have avatar in their src but no onError
  const imgRegex = /<img[^>]*?src=\{[^}]*?avatar[^}]*?\}[^>]*?>/g;

  content = content.replace(imgRegex, (match) => {
    if (!match.includes('onError')) {
      modified = true;
      return match.replace('>', ` ${onErrorString}>`);
    }
    return match;
  });

  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Added onError to: ' + filePath);
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
      if (file.endsWith('.tsx')) {
        results.push(file);
      }
    }
  });
  return results;
}

walk('./src').forEach(fixFile);
