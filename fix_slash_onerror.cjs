const fs = require('fs');
const path = require('path');

function fixFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  if (content.includes('/ onError={(e) =>')) {
    content = content.replace(/\/\s*onError=\{\(e\)\s*=>/g, ' onError={(e) =>');
    content = content.replace(/ \}\}\s*>/g, ' }} />'); // replace > with />
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Fixed syntax in ' + filePath);
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
