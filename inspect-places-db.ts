import { db } from "./src/db/index.ts";
import { places, firestore_places } from "./src/db/schema.ts";
import { inArray, eq } from "drizzle-orm";

async function run() {
  const targetIds = ["digitalpark-ae", "districtuae-com", "districtuae", "thecapitalavenue-com", "thecapitalavenue"];
  
  console.log("=== Querying PostgreSQL places table ===");
  try {
    for (const id of targetIds) {
      const list = await db.select().from(places).where(eq(places.id, id));
      if (list.length > 0) {
        list.forEach((p: any) => {
          console.log(`- ID: ${p.id}`);
          console.log(`  Title: ${p.title}`);
          console.log(`  URL: ${p.url}`);
          console.log(`  Image: ${p.image}`);
          console.log(`  SiteName: ${p.siteName}`);
        });
      } else {
        console.log(`- ID: ${id} NOT FOUND in 'places' table`);
      }
    }
  } catch (err: any) {
    console.error("Error querying 'places' table:", err.message);
  }

  console.log("\n=== Querying PostgreSQL firestore_places table ===");
  try {
    for (const id of targetIds) {
      const list = await db.select().from(firestore_places).where(eq(firestore_places.id, id));
      if (list.length > 0) {
        list.forEach((p: any) => {
          console.log(`- ID: ${p.id}`);
          console.log(`  Data:`, JSON.stringify(p.data, null, 2));
        });
      } else {
        console.log(`- ID: ${id} NOT FOUND in 'firestore_places' table`);
      }
    }
  } catch (err: any) {
    console.error("Error querying 'firestore_places' table:", err.message);
  }
}

run().catch(console.error);
