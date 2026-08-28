import { db } from './src/db/index.ts';
import { places } from './src/db/schema.ts';
async function main() {
  const p = await db.select().from(places).limit(5);
  console.log(JSON.stringify(p, null, 2));
  process.exit(0);
}
main();
