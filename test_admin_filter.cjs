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
      avatar: u.avatar || ``,
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
      match.role = "Creator"; 
    } else {
      mergedList.push({
        id: vUserId || vCleanHandle,
        uid: vUserId || vCleanHandle,
        name: author.name || "Verified Reviewer",
        email: vEmail,
        handle: vCleanHandle,
        avatar: author.avatar || ``,
        isVerified: true,
        role: "Creator"
      });
    }
  });
  
  const finalList = [];
  mergedList.forEach(u => {
     const cleanName = u.name ? u.name.toLowerCase().trim() : "";
     let existing = null;
     if (u.email) existing = finalList.find(x => x.email === u.email);
     if (!existing && cleanName && cleanName !== "registered user" && cleanName !== "verified reviewer") {
         existing = finalList.find(x => (x.name || "").toLowerCase().trim() === cleanName);
     }
     
     if (!existing) {
       finalList.push(u);
     } else {
       if (u.role === "Creator") existing.role = "Creator";
       if (u.email && !existing.email) existing.email = u.email;
     }
  });
  
  const filteredList = finalList.filter(u => {
       if (u.role === "Creator") return true; 
       const emailPrefix = u.email ? u.email.split('@')[0].toLowerCase() : "";
       const nameClean = (u.name || "").toLowerCase().trim();
       const isIncomplete = !nameClean || nameClean === emailPrefix || nameClean === "registered user";
       return !isIncomplete;
  });
  
  console.log("FINAL COUNT:", filteredList.length);
  console.log(filteredList.map(u => ({ name: u.name, role: u.role, email: u.email })));
}
debug();
