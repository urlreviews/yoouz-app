import fs from 'fs';
import path from 'path';

const uploadsDir = path.join(process.cwd(), "uploads");
const reviewsIndexPath = path.join(uploadsDir, "reviews_index.json");

if (fs.existsSync(reviewsIndexPath)) {
  const raw = fs.readFileSync(reviewsIndexPath, "utf8");
  const parsed = JSON.parse(raw);
  const filtered = parsed.filter(v => v.videoUrl !== "/default-review.mp4" && v.videoUrl !== "/api/videos/stream/default-review.mp4");
  fs.writeFileSync(reviewsIndexPath, JSON.stringify(filtered, null, 2), "utf8");
  console.log(`Removed ${parsed.length - filtered.length} dummy videos from reviews_index.json`);
} else {
  console.log("No reviews_index.json found.");
}
