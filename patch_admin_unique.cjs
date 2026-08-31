const fs = require('fs');
let code = fs.readFileSync('src/components/CopoAdminPanel.tsx', 'utf8');

const regex = /const uniqueUsers = useMemo\(\(\) => \{[\s\S]*?return Array\.from\(userMap\.values\(\)\);\n  \}, \[allUsers, videos\]\);/;

const newCode = `const uniqueUsers = useMemo(() => {
    const userMap = new Map<string, any>();
    const getCleanHandle = (str?: string) => (str || "").replace(/^@+/, "").trim();

    (allUsers || []).forEach((u) => {
      if (!u) return;
      const cleanHandle = getCleanHandle(u.name) || (u.email ? u.email.split("@")[0] : u.id) || "user";
      // prioritize EMAIL to combine multiple auth records for the same human
      const key = (u.email || u.uid || u.id || cleanHandle).toLowerCase().trim();
      if (!key) return;

      if (!userMap.has(key)) {
        userMap.set(key, {
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
      } else {
        const existing = userMap.get(key);
        if (existing && !existing.email && u.email) existing.email = u.email;
        if (existing && (!existing.name || existing.name === "Registered User") && u.name) existing.name = u.name;
        if (existing && (!existing.avatar || existing.avatar.includes("ui-avatars")) && u.avatar) existing.avatar = u.avatar;
      }
    });

    (videos || []).forEach((v) => {
      if (!v) return;
      const author = v.author || {
        name: "Verified Reviewer",
        handle: v.userId || "reviewer",
        avatar: "",
        isVerified: true
      };
      const cleanHandle =
        getCleanHandle(author.name) ||
        (v.userEmail ? v.userEmail.split("@")[0] : getCleanHandle(v.userId) || "reviewer");
        
      const key = (v.userEmail || v.userId || cleanHandle).toLowerCase().trim();
      if (!key) return;

      if (!userMap.has(key)) {
        userMap.set(key, {
          id: v.userId || cleanHandle,
          uid: v.userId || cleanHandle,
          name: author.name || "Verified Reviewer",
          email: v.userEmail || "",
          handle: cleanHandle,
          avatar:
            author.avatar ||
            \`https://ui-avatars.com/api/?name=\${encodeURIComponent(author.name || "User")}&background=27272a&color=fff&bold=true&size=128\`,
          isVerified: author.isVerified !== false,
          isRegisteredAccount: Boolean(v.userId),
          role: "Creator",
          memberSince: "Active"
        });
      } else {
        const existing = userMap.get(key);
        if (existing && (!existing.name || existing.name === "Registered User") && author.name) {
          existing.name = author.name;
        }
        if (existing && (!existing.avatar || existing.avatar.includes("ui-avatars")) && author.avatar) {
          existing.avatar = author.avatar;
        }
        // Upgrade role to Creator if they have videos but were just marked as Member
        if (existing) {
           existing.role = "Creator";
        }
      }
    });

    return Array.from(userMap.values());
  }, [allUsers, videos]);`;

code = code.replace(regex, newCode);
fs.writeFileSync('src/components/CopoAdminPanel.tsx', code);
