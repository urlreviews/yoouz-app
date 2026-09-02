const fs = require('fs');
let c = fs.readFileSync('src/components/CopoMessagesView.tsx', 'utf8');

c = c.replace(
    /target\.src = "https:\/\/images\.unsplash\.com\/photo-1534528741775-53994a69daeb\?w=400&auto=format&fit=crop&q=80";\s*\}\s*\}\}\>\s*\n/g,
    'target.src = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80";\n                                        }\n                                      }} />\n\n'
);

fs.writeFileSync('src/components/CopoMessagesView.tsx', c, 'utf8');
