async function debug() {
  const usersRes = await fetch("http://localhost:3000/api/nosql/users");
  const users = await usersRes.json();
  const map = new Map();
  users.forEach((u) => map.set((u.email || u.uid || u.id || u.name || "").toLowerCase(), u));
  console.log("Unique registered:", Array.from(map.values()).map(u => u.email));
}
debug();
