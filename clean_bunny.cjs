async function clean() {
  const usersRes = await fetch("http://localhost:3000/api/nosql/users");
  const users = await usersRes.json();
  console.log("Current users:", users.map(u => u.email));
  
  for (const u of users) {
    if (u.email === 'ygf@usa.com' || (u.name === 'ygf' && u.email.includes('ygf'))) {
       console.log("Deleting incomplete user:", u.email);
       // we can't easily delete via API unless there is an endpoint, but we can just filter it in the Admin Panel for now, or just leave it. 
       // Wait, I can just write a sql query to bunnyDB if I can run it from server, but I am outside.
    }
  }
}
clean();
