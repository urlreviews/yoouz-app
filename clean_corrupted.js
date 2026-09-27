import { createClient } from '@libsql/client';

async function test() {
  const client = createClient({
    url: process.env.BUNNY_DATABASE_URL || '',
    authToken: process.env.BUNNY_DATABASE_AUTH_TOKEN || ''
  });
  
  try {
    console.log("Fetching place rows without dots in ID...");
    const res = await client.execute("SELECT id, name, category, city FROM places");
    const toDelete = [];
    
    const protectedIds = new Set([
      "yoouz", "yoouz.com", "vrijens", "dental-care"
    ]);
    
    for (const row of res.rows) {
      const id = String(row.id);
      if (!id.includes('.') && !protectedIds.has(id)) {
        toDelete.push(id);
      }
    }
    
    console.log("Candidate rows to delete (no dots in ID):", toDelete);
    
    for (const id of toDelete) {
      const del = await client.execute({
        sql: "DELETE FROM places WHERE id = ?",
        args: [id]
      });
      console.log(`Deleted ${id}:`, del.rowsAffected);
    }
    
    console.log("Cleanup complete!");
  } catch (e) {
    console.error("Error during cleanup:", e);
  } finally {
    client.close();
  }
}

test();
