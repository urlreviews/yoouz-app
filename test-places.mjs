import { db } from './src/db/index.js';
import { places } from './src/db/schema.js';
const p = await db.select().from(places).limit(5);
console.log(JSON.stringify(p, null, 2));
process.exit(0);
