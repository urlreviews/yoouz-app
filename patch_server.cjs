const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const regex = /\/\/ Save\/update user session in Bunny Database[\s\S]*?try \{[\s\S]*?const bunnyDb = getBunnyDb\(\);[\s\S]*?if \(bunnyDb\) \{[\s\S]*?await bunnyDb\.execute\(\{[\s\S]*?sql: `INSERT INTO users \(id, email, name, data, updatedAt\)[\s\S]*?VALUES \(\?, \?, \?, \?, CURRENT_TIMESTAMP\)[\s\S]*?ON CONFLICT\(id\) DO UPDATE SET data = \?, updatedAt = CURRENT_TIMESTAMP`,[\s\S]*?args: \[[\s\S]*?userSession\.uid,[\s\S]*?cleanEmail,[\s\S]*?userSession\.name,[\s\S]*?JSON\.stringify\(userSession\),[\s\S]*?JSON\.stringify\(userSession\)[\s\S]*?\][\s\S]*?\}\);[\s\S]*?\}[\s\S]*?\} catch \(saveErr\) \{[\s\S]*?console\.warn\("Could not persist verified user to BunnyDB:", saveErr\);[\s\S]*?\}/g;

const replacement = `// Save/update user session in Bunny Database ONLY if they are an existing user
      // We do not want incomplete signups (who haven't filled out their profile) to appear in the DB
      if (!userSession.isNewUser) {
        try {
          const bunnyDb = getBunnyDb();
          if (bunnyDb) {
            await bunnyDb.execute({
              sql: \`INSERT INTO users (id, email, name, data, updatedAt) 
                    VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP) 
                    ON CONFLICT(id) DO UPDATE SET data = ?, updatedAt = CURRENT_TIMESTAMP\`,
              args: [
                userSession.uid,
                cleanEmail,
                userSession.name,
                JSON.stringify(userSession),
                JSON.stringify(userSession)
              ]
            });
          }
        } catch (saveErr) {
          console.warn("Could not persist verified user to BunnyDB:", saveErr);
        }
      }`;

if (regex.test(code)) {
    code = code.replace(regex, replacement);
    fs.writeFileSync('server.ts', code);
    console.log("Patched server.ts successfully");
} else {
    console.log("Regex not found in server.ts");
}
