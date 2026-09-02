const fs = require('fs');
const path = require('path');

function fixFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;

  // We are looking for `}} />` which was wrongly replaced.
  // We want to change it to `}}>` EXCEPT if it comes immediately after `onError={...`
  // Actually, wait. I ONLY added `onError` to `<img`.
  // So `}} />` is ONLY correct if it's the end of an `<img ... />` tag.
  // Or a `<div ... />` tag that is empty.
  
  // To be perfectly safe, I will change `}} />` to `}}>` if the next non-whitespace character is NOT `</` and it's not the end of the file, OR if we can see it's followed by children.
  
  // Let's just fix the specific multi-line style tag in CopoBusinessDashboardView.tsx:
  if (content.includes('}} />')) {
      // Replace `}} />` with `}}>` if it's inside a div or span that actually has children.
      content = content.replace(/\}\}\s*\/\>\s*(<(?:span|div|button|p|h1|h2|h3|h4|svg|ul|li|a)[^>]*>|{[^}]+})/g, '}}> \n $1');
      fs.writeFileSync(filePath, content, 'utf8');
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
