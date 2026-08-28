const { getFirestore } = require('firebase-admin/firestore');
const { initializeApp } = require('firebase-admin/app');
initializeApp({ projectId: "gen-lang-client-0669185519" });
try {
  const db = getFirestore("ai-studio-googlemapsvideor-95541371-cdcc-4025-9fb0-c7f3ae35f87c");
  console.log("Success");
} catch(e) {
  console.error("Error:", e);
}
