import { adminDb } from './src/lib/firebase-admin.ts';
async function main() {
  const snapshot = await adminDb.collection('videoReviews').get();
  console.log("Total video reviews in Firestore:", snapshot.size);
  process.exit(0);
}
main();
