const fs = require('fs');
let code = fs.readFileSync('src/components/CopoAdminPanel.tsx', 'utf8');

const regex = /\/\/ Unique Users Mapping[\s\S]*?return Array\.from\(userMap\.values\(\)\);\n  \}, \[allUsers, videos\]\);/;

const replacement = `// Unique Users Mapping
  const uniqueUsers = useMemo(() => {
    const getCleanHandle = (str?: string) => (str || "").replace(/^@+/, "").trim().toLowerCase();
    const mergedList: any[] = [];
    
    (allUsers || []).forEach((u) => {
      if (!u) return;
      const cleanHandle = getCleanHandle(u.name) || (u.email ? u.email.split("@")[0].toLowerCase() : u.id) || "user";
      mergedList.push({
        id: u.id || u.uid || cleanHandle,
        uid: u.uid || u.id,
        name: u.name || "Registered User",
        email: u.email || "",
        handle: cleanHandle,
        avatar:
          u.avatar ||
          \`https://ui-avatars.com/api/?name=\${encodeURIComponent(u.name || "User")}&background=27272a&color=fff&bold=true&size=128\`,
        isVerified: true,
        isRegisteredAccount: true,
        role: u.role || (u.email === "4samet@gmail.com" ? "Super Admin" : "Member"),
        memberSince: u.memberSince || "Active"
      });
    });

    (videos || []).forEach((v) => {
      if (!v) return;
      const author = v.author || {
        name: "Verified Reviewer",
        handle: v.userId || "reviewer",
        avatar: "",
        isVerified: true
      };
      
      const vEmail = (v.userEmail || "").toLowerCase().trim();
      const vUserId = (v.userId || "").toLowerCase().trim();
      const vCleanHandle = getCleanHandle(author.name) || (vEmail ? vEmail.split("@")[0] : getCleanHandle(vUserId) || "reviewer");
      
      let match = mergedList.find(u => {
        const uEmail = (u.email || "").toLowerCase().trim();
        const uUserId = (u.uid || u.id || "").toLowerCase().trim();
        const uCleanHandle = getCleanHandle(u.name);
        
        return (
          (vEmail && uEmail && vEmail === uEmail) ||
          (vUserId && uUserId && vUserId === uUserId) ||
          (vCleanHandle && uEmail && uEmail.startsWith(vCleanHandle + "@")) ||
          (vCleanHandle && uCleanHandle && vCleanHandle === uCleanHandle)
        );
      });
      
      if (match) {
        if (!match.name || match.name === "Registered User") match.name = author.name;
        if (!match.avatar || match.avatar.includes("ui-avatars")) match.avatar = author.avatar;
        match.role = "Creator"; 
      } else {
        mergedList.push({
          id: vUserId || vCleanHandle,
          uid: vUserId || vCleanHandle,
          name: author.name || "Verified Reviewer",
          email: vEmail,
          handle: vCleanHandle,
          avatar:
            author.avatar ||
            \`https://ui-avatars.com/api/?name=\${encodeURIComponent(author.name || "User")}&background=27272a&color=fff&bold=true&size=128\`,
          isVerified: author.isVerified !== false,
          isRegisteredAccount: Boolean(vUserId),
          role: "Creator",
          memberSince: "Active"
        });
      }
    });
    
    // Final deduplication loop in case videos brought duplicates amongst themselves
    const finalMap = new Map();
    mergedList.forEach(u => {
       const key = u.email ? u.email : (u.name || u.id);
       if (!finalMap.has(key)) {
         finalMap.set(key, u);
       } else {
         const existing = finalMap.get(key);
         if (u.role === "Creator") existing.role = "Creator";
       }
    });
    return Array.from(finalMap.values());
  }, [allUsers, videos]);`;

code = code.replace(regex, replacement);
fs.writeFileSync('src/components/CopoAdminPanel.tsx', code);
console.log("Patched CopoAdminPanel!");
