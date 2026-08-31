const fs = require('fs');

async function check() {
  const res = await fetch("http://localhost:3000/api/nosql/users");
  const users = await res.json();
  console.log("USERS:", JSON.stringify(users, null, 2));
}
check();
