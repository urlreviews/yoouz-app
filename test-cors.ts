import { adminStorage } from "./src/lib/firebase-admin.ts";

async function setCors() {
  try {
    const bucket = adminStorage.bucket();
    await bucket.setCorsConfiguration([{
      origin: ["*"],
      responseHeader: ["*"],
      method: ["GET", "PUT", "POST", "DELETE", "OPTIONS", "HEAD"],
      maxAgeSeconds: 3600
    }]);
    console.log("CORS set successfully!");
  } catch (err) {
    console.error("Error setting CORS:", err);
  }
}
setCors();
