async function debug() {
  const usersRes = await fetch("http://localhost:3000/api/nosql/users");
  const allUsers = await usersRes.json();
  const vidsRes = await fetch("http://localhost:3000/api/nosql/videoReviews");
  const videos = await vidsRes.json();
  
  const userMap = new Map();
  const getCleanHandle = (str) => (str || "").replace(/^@+/, "").trim();

  (allUsers || []).forEach((u) => {
    if (!u) return;
    const cleanHandle = getCleanHandle(u.name) || (u.email ? u.email.split("@")[0] : u.id) || "user";
    const key = (u.email || u.uid || u.id || cleanHandle).toLowerCase().trim();
    if (!key) return;
    
    if (!userMap.has(key)) {
      userMap.set(key, { email: u.email, name: u.name, key, role: "Member", id: u.id });
    }
  });
  
  (videos || []).forEach((v) => {
    if (!v) return;
    const author = v.author || { name: "Verified Reviewer" };
    const cleanHandle = getCleanHandle(author.name) || (v.userEmail ? v.userEmail.split("@")[0] : getCleanHandle(v.userId) || "reviewer");
    const key = (v.userEmail || v.userId || cleanHandle).toLowerCase().trim();
    
    if (!userMap.has(key)) {
      userMap.set(key, { email: v.userEmail, name: author.name, key, role: "Creator", id: v.userId });
    } else {
      userMap.get(key).role = "Creator";
    }
  });
  
  console.log(Array.from(userMap.values()));
}
debug();
