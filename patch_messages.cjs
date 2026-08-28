const fs = require('fs');
const file = './src/components/CopoMessagesView.tsx';
let content = fs.readFileSync(file, 'utf8');

// Replace placeholder
content = content.replace(
  'placeholder="Search by name or handle..."',
  'placeholder="Search by name..."'
);

// Remove handle under name
const handleDisplay = `<p className="text-[10px] text-zinc-400 truncate">
                          @{recipient.handle || recipient.name.toLowerCase().replace(/\\s+/g, "")}
                        </p>`;
if (content.includes(handleDisplay)) {
  content = content.replace(handleDisplay, '');
} else {
    // try replacing with regex
    content = content.replace(/<p className="text-\[10px\] text-zinc-400 truncate">\s*@\{recipient\.handle[^<]+<\/p>/, '');
}

fs.writeFileSync(file, content);
