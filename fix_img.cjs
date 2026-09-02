const fs = require('fs');
const path = require('path');

function fixFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;

  // We are looking for `<img ... }}> \n <` and changing it to `}} /> \n <`
  // Actually, wait, `}}>` might be on the same line as `<img`.
  // The simplest way is to match `<img [^>]*? onError=\{[^}]+\}\}\>` and change it to `}} />`
  
  content = content.replace(/(<img[^>]*?onError=\{[^}]+\}\})\>/g, '$1 />');
  
  // also fix `<img [^>]*? style={{...}}>`
  content = content.replace(/(<img[^>]*?style=\{\{[^}]+\}\})\>/g, '$1 />');

  if (content !== fs.readFileSync(filePath, 'utf8')) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log('Fixed img in ' + filePath);
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
