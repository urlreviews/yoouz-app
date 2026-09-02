const fs = require('fs');
const path = require('path');

function fixFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  
  // My fix_all_broken_tags.cjs replaced:
  // `}} /> \n <div` with `}}> \n <div`
  // But for img tags, that's wrong. So we need to put `/>` back on `onError` lines.
  // We can just find `onError={(e) => { const target = e.currentTarget as HTMLImageElement; if (!target.src.includes('/api/avatar')) { target.src = '/api/avatar?name=User&background=27272a&color=fff'; } }}>`
  // And replace `}}>` with `}} />` or `}} />`.
  
  const searchStr = `onError={(e) => { const target = e.currentTarget as HTMLImageElement; if (!target.src.includes('/api/avatar')) { target.src = '/api/avatar?name=User&background=27272a&color=fff'; } }}>`;
  const replaceStr = `onError={(e) => { const target = e.currentTarget as HTMLImageElement; if (!target.src.includes('/api/avatar')) { target.src = '/api/avatar?name=User&background=27272a&color=fff'; } }} />`;

  if (content.includes(searchStr)) {
      content = content.split(searchStr).join(replaceStr);
      fs.writeFileSync(filePath, content, 'utf8');
      console.log('Fixed img close in ' + filePath);
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
