import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Initialize with application default credentials
initializeApp({
  projectId: 'ai-studio-reviuz-95541371-cdcc-4025-9fb0-c7f3ae35f87c'
});

async function main() {
  const db = getFirestore();
  const snapshot = await db.collection('videoReviews').get();
  console.log("Total video reviews in Firestore:", snapshot.size);
  process.exit(0);
}
main();
