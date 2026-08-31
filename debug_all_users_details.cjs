async function debug() {
  const usersRes = await fetch("http://localhost:3000/api/nosql/users");
  const users = await usersRes.json();
  console.log(users.map(u => ({ id: u.id, email: u.email, name: u.name, uid: u.uid })));
}
debug();
