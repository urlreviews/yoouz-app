const fs = require('fs');

async function debug() {
  const usersRes = await fetch("http://localhost:3000/api/nosql/users");
  const users = await usersRes.json();
  
  const vidsRes = await fetch("http://localhost:3000/api/nosql/videoReviews");
  const videos = await vidsRes.json();
  
  const userMap = new Map();
  const getCleanHandle = (str) => (str || "").replace(/^@+/, "").trim();

  (users || []).forEach((u) => {
    if (!u) return;
    const cleanHandle = getCleanHandle(u.name) || (u.email ? u.email.split("@")[0] : u.id) || "user";
    const key = (u.email || u.uid || u.id || cleanHandle).toLowerCase().trim();
    if (!key) return;

    if (!userMap.has(key)) {
      userMap.set(key, { name: u.name, role: "Member", key });
    }
  });

  (videos || []).forEach((v) => {
    if (!v) return;
    const author = v.author || {};
    const cleanHandle = getCleanHandle(author.name) || (v.userEmail ? v.userEmail.split("@")[0] : getCleanHandle(v.userId) || "reviewer");
    const key = (v.userEmail || v.userId || cleanHandle).toLowerCase().trim();
    if (!key) return;

    if (!userMap.has(key)) {
      userMap.set(key, { name: author.name, role: "Creator", key });
    } else {
      const existing = userMap.get(key);
      existing.role = "Creator";
    }
  });

  console.log("UNIQUE USERS:", Array.from(userMap.values()));
}
debug();
