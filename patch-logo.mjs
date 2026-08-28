import fs from 'fs';
let content = fs.readFileSync('src/utils/logoUtils.ts', 'utf8');

content = content.replace(
  '`https://logo.clearbit.com/${domain}`',
  '`https://t1.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://${domain}&size=256`'
);

fs.writeFileSync('src/utils/logoUtils.ts', content);
console.log('Patched logoUtils.ts successfully');
