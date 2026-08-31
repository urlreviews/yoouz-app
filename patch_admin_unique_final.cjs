const fs = require('fs');
let code = fs.readFileSync('src/components/CopoAdminPanel.tsx', 'utf8');

const regex = /\/\/ Final deduplication loop in case videos brought duplicates amongst themselves[\s\S]*?return Array\.from\(finalMap\.values\(\)\);\n  \}, \[allUsers, videos\]\);/;

const replacement = `// Final deduplication loop to aggressively merge records by Email or Name
    const finalList: any[] = [];
    mergedList.forEach(u => {
       const cleanName = u.name ? u.name.toLowerCase().trim() : "";
       let existing = null;
       if (u.email) {
         existing = finalList.find(x => x.email === u.email);
       }
       if (!existing && cleanName && cleanName !== "registered user" && cleanName !== "verified reviewer") {
           existing = finalList.find(x => (x.name || "").toLowerCase().trim() === cleanName);
       }
       
       if (!existing) {
         finalList.push(u);
       } else {
         if (u.role === "Creator") existing.role = "Creator";
         if (u.email && !existing.email) existing.email = u.email;
         if (u.avatar && !u.avatar.includes("ui-avatars") && (!existing.avatar || existing.avatar.includes("ui-avatars"))) existing.avatar = u.avatar;
       }
    });
    return finalList;
  }, [allUsers, videos]);`;

code = code.replace(regex, replacement);
fs.writeFileSync('src/components/CopoAdminPanel.tsx', code);
console.log("Patched CopoAdminPanel final!");
