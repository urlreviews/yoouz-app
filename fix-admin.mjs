import fs from 'fs';
let content = fs.readFileSync('server.ts', 'utf8');

content = content.replace(
  `      if (adminDb) {
        await adminDb.collection("videoReviews").doc(videoId).delete().catch(() => {});
        await adminDb.collection("videos").doc(videoId).delete().catch(() => {});
      }`,
  ``
);

content = content.replace(
  `      if (adminDb) {
        const batch = adminDb.batch();
        videoIds.forEach((id: string) => {
          batch.delete(adminDb!.collection("videoReviews").doc(id));
        });
        await batch.commit().catch(() => {});
      }`,
  ``
);

fs.writeFileSync('server.ts', content);
console.log('Fixed adminDb reference error in server.ts');
