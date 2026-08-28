import { db } from './src/db/index.ts';
import { firestore_places } from './src/db/schema.ts';
async function main() {
  const p = await db.select().from(firestore_places).limit(5);
  console.log(JSON.stringify(p, null, 2));
  process.exit(0);
}
main();
