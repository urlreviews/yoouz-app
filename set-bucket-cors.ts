import { initializeApp } from 'firebase-admin/app';
import { getStorage } from 'firebase-admin/storage';
import config from './firebase-applet-config.json' assert { type: "json" };

const app = initializeApp({
  projectId: config.projectId,
  storageBucket: config.storageBucket
});

const bucket = getStorage(app).bucket();
const cors = [
  {
    origin: ["*"],
    method: ["GET", "PUT", "POST", "DELETE", "HEAD", "OPTIONS"],
    responseHeader: ["*"],
    maxAgeSeconds: 3600
  }
];

bucket.setCorsConfiguration(cors)
  .then(() => console.log("CORS set successfully!"))
  .catch((err) => console.error("Error setting CORS:", err));
