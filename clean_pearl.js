import { createClient } from '@libsql/client';

async function test() {
  const client = createClient({
    url: process.env.BUNNY_DATABASE_URL || '',
    authToken: process.env.BUNNY_DATABASE_AUTH_TOKEN || ''
  });
  
  try {
    console.log("Deleting pearldentalnyc row...");
    const del = await client.execute({
      sql: "DELETE FROM places WHERE id = 'pearldentalnyc'",
      args: []
    });
    console.log("Deleted pearldentalnyc row:", del.rowsAffected);
  } catch (e) {
    console.error("Error deleting row:", e);
  } finally {
    client.close();
  }
}

test();
