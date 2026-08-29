import { db } from './src/db/index';
import { firestore_video_reviews } from './src/db/schema';

async function main() {
    const res = await db.select().from(firestore_video_reviews);
    res.forEach(r => {
        const data = r.data;
        console.log(`Video: ${r.id}, AuthorName: ${data.authorName}, Author: ${JSON.stringify(data.author)}`);
    });
    process.exit(0);
}
main();
