import { db } from "./src/db/index.ts";
import { users } from "./src/db/schema.ts";
import { eq } from "drizzle-orm";
async function run() {
  try {
     const rs = await db.select().from(users).where(eq(users.email, 'aouisesmee@gmail.com'));
     console.log(rs);
  } catch(e) {
     console.error(e);
  }
}
run();
