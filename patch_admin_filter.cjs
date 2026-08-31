const fs = require('fs');
let code = fs.readFileSync('src/components/CopoAdminPanel.tsx', 'utf8');

const regex = /return finalList;\n  \}, \[allUsers, videos\]\);/;

const replacement = `// Filter out incomplete signups (e.g. no reviews, name matches email prefix)
    return finalList.filter(u => {
       if (u.role === "Creator") return true; // Keep creators
       
       const emailPrefix = u.email ? u.email.split('@')[0].toLowerCase() : "";
       const nameClean = (u.name || "").toLowerCase().trim();
       
       // If they have no name, or their name is just their email prefix, consider them incomplete
       const isIncomplete = !nameClean || nameClean === emailPrefix || nameClean === "registered user";
       
       return !isIncomplete;
    });
  }, [allUsers, videos]);`;

if (code.includes('return finalList;')) {
    code = code.replace(regex, replacement);
    fs.writeFileSync('src/components/CopoAdminPanel.tsx', code);
    console.log("Patched CopoAdminPanel to filter incomplete users!");
} else {
    console.log("Regex not found");
}
