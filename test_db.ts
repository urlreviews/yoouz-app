import { createClient } from "@libsql/client";
const client = createClient({
  url: process.env.BUNNY_DATABASE_URL || "file:.data/bunny.db",
  authToken: process.env.BUNNYDB_AUTH_TOKEN
});
async function main() {
  try {
    const rs = await client.execute("SELECT id, data FROM places ORDER BY updatedAt DESC");
    console.log("Success, count:", rs.rows.length);
  } catch (e: any) {
    console.error("Error:", e.message);
  }
}
main();
