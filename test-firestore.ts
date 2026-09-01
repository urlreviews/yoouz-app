import { db } from "./src/db/index.ts";
import { firestore_users } from "./src/db/schema.ts";
import { eq } from "drizzle-orm";
async function run() {
  try {
     const rs = await db.select().from(firestore_users).where(eq(firestore_users.email, 'aouisesmee@gmail.com'));
     console.log(rs);
  } catch(e) {
     console.error(e);
  }
}
run();
