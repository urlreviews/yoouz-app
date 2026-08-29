import { db } from './src/db/index';
import { firestore_video_reviews } from './src/db/schema';
import { eq } from 'drizzle-orm';

async function main() {
    const res = await db.select().from(firestore_video_reviews).where(eq(firestore_video_reviews.id, 'rev-1787774080951-vuu2k'));
    console.log(JSON.stringify(res, null, 2));
    process.exit(0);
}
main();
