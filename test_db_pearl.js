import { createClient } from '@libsql/client';

async function test() {
  const client = createClient({
    url: process.env.BUNNY_DATABASE_URL || '',
    authToken: process.env.BUNNY_DATABASE_AUTH_TOKEN || ''
  });
  
  try {
    const res = await client.execute({
      sql: "SELECT id, name, category, city, logoUrl, data FROM places WHERE id = 'pearldentalnyc' OR name LIKE '%Pearl Dental NYC%'",
      args: []
    });
    console.log("Found matches in remote database:", res.rows.length);
    for (const row of res.rows) {
      console.log(row.id, row.name, row.category, row.city, row.logoUrl);
      if (row.data) {
        console.log("data:", JSON.stringify(JSON.parse(row.data), null, 2));
      }
    }
  } catch (e) {
    console.error("Error querying remote database:", e);
  } finally {
    client.close();
  }
}

test();
