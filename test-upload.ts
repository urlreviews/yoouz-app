import { adminStorage } from "./src/lib/firebase-admin.ts";
import fs from "fs";

async function testUpload() {
  try {
    fs.writeFileSync("test.txt", "hello world");
    const bucket = adminStorage.bucket();
    await bucket.upload("test.txt", { destination: "reviews/test.txt" });
    const file = bucket.file("reviews/test.txt");
    await file.makePublic();
    const url = file.publicUrl();
    console.log("Upload success! URL:", url);
  } catch (err) {
    console.error("Upload failed:", err);
  }
}
testUpload();
