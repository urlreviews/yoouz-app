async function purge() {
  const usersRes = await fetch("http://localhost:3000/api/nosql/users");
  const users = await usersRes.json();
  
  let deletedCount = 0;
  for (const u of users) {
     const emailPrefix = u.email ? u.email.split('@')[0].toLowerCase() : "";
     const nameClean = (u.name || "").toLowerCase().trim();
     const isIncomplete = !nameClean || nameClean === emailPrefix || nameClean === "registered user";
     
     if (isIncomplete && u.role !== "Creator") {
        console.log(`Deleting incomplete user: ${u.email} (Name: ${u.name})`);
        
        // Let's call the delete API if one exists, or write a direct sqlite query if I can
        // Since I don't have a direct delete API, I'll fetch the server port and query it directly.
     }
  }
}
purge();
