const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');
code = code.replace(
  /prev\.forEach\(\(u\) => map\.set\(\(u\.uid \|\| u\.id \|\| u\.email \|\| u\.name \|\| ""\)\.toLowerCase\(\), u\)\);/,
  'prev.forEach((u) => map.set((u.email || u.uid || u.id || u.name || "").toLowerCase(), u));'
);
code = code.replace(
  /dbUsers\.forEach\(\(u\) => map\.set\(\(u\.uid \|\| u\.id \|\| u\.email \|\| u\.name \|\| ""\)\.toLowerCase\(\), u\)\);/,
  'dbUsers.forEach((u) => map.set((u.email || u.uid || u.id || u.name || "").toLowerCase(), u));'
);
fs.writeFileSync('src/App.tsx', code);
