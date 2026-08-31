async function debug() {
  const usersRes = await fetch("http://localhost:3000/api/nosql/users");
  const allUsers = await usersRes.json();
  const vidsRes = await fetch("http://localhost:3000/api/nosql/videoReviews");
  const videos = await vidsRes.json();

  const getCleanHandle = (str) => (str || "").replace(/^@+/, "").trim().toLowerCase();
  const mergedList = [];
  
  (allUsers || []).forEach((u) => {
    if (!u) return;
    const cleanHandle = getCleanHandle(u.name) || (u.email ? u.email.split("@")[0].toLowerCase() : u.id) || "user";
    mergedList.push({
      id: u.id || u.uid || cleanHandle,
      uid: u.uid || u.id,
      name: u.name || "Registered User",
      email: u.email || "",
      handle: cleanHandle,
      avatar: u.avatar || `ui-avatars...`,
      isVerified: true,
      role: u.role || "Member"
    });
  });

  (videos || []).forEach((v) => {
    if (!v) return;
    const author = v.author || { name: "Verified Reviewer" };
    
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
        avatar: author.avatar || `ui-avatars...`,
        isVerified: true,
        role: "Creator"
      });
    }
  });
  
  const finalMap = new Map();
  mergedList.forEach(u => {
     // use email if available, else name
     const key = u.email ? u.email : (u.name ? u.name.toLowerCase() : u.id);
     if (!finalMap.has(key)) {
       finalMap.set(key, u);
     } else {
       const existing = finalMap.get(key);
       if (u.role === "Creator") existing.role = "Creator";
       if (u.email && !existing.email) existing.email = u.email;
     }
  });
  console.log("FINAL COUNT:", Array.from(finalMap.values()).length);
  console.log(Array.from(finalMap.values()).map(u => ({ name: u.name, role: u.role, email: u.email })));
}
debug();
