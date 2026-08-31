async function deleteApi() {
  const usersRes = await fetch("http://localhost:3000/api/nosql/users");
  const users = await usersRes.json();
  
  for (const row of users) {
     const email = row.email || "";
     const name = row.name || "";
     const emailPrefix = email.split('@')[0];
     
     if (name === "" || name === "Registered User" || name === emailPrefix || name === "aouisesmee") {
        console.log("Found user to delete:", email, name);
        // I will try to call a delete endpoint if I created one, but there isn't one by default in server.ts
     }
  }
}
deleteApi();
