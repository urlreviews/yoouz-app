const fs = require('fs');

// 1. Clean CopoProfileView
let profile = fs.readFileSync('src/components/CopoProfileView.tsx', 'utf8');
profile = profile.replace(/ YouTube integration active \(Private & Secure\)\./g, '');
fs.writeFileSync('src/components/CopoProfileView.tsx', profile);

// 2. Clean App.tsx
let app = fs.readFileSync('src/App.tsx', 'utf8');
app = app.replace(/\{\/\* Google Sign-In & YouTube Access Modal \*\/\}/g, '{/* Google Sign-In Modal */}');
fs.writeFileSync('src/App.tsx', app);

// 3. Clean server.ts
let server = fs.readFileSync('server.ts', 'utf8');
server = server.replace(/const \{ uid, email, name, avatar, youtubeChannel \} = req\.body;/g, 'const { uid, email, name, avatar } = req.body;');
server = server.replace(/youtubeChannel: youtubeChannel \|\| `\$\{name \|\| 'User'\}'s YouTube Studio`/g, '');
server = server.replace(/youtubeChannel: youtubeChannel \|\| existing\[0\]\.youtubeChannel/g, '');
// Handle trailing commas in object literals after removal
server = server.replace(/avatar: avatar \|\| existing\[0\]\.avatar,/g, 'avatar: avatar || existing[0].avatar');
server = server.replace(/avatar: avatar \|\| `https:\/\/api\.dicebear\.com\/7\.x\/avataaars\/svg\?seed=\$\{uid\}`\s*,?\s*$/gm, "avatar: avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${uid}`");
fs.writeFileSync('server.ts', server);

// 4. Uninstall react-youtube
