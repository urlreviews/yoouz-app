const Database = require('better-sqlite3');
const db = new Database('sqlite.db');

const stmt = db.prepare('SELECT * FROM firestore_video_reviews WHERE id = ?');
const row = stmt.get('rev-1787767870156-774ud');
if (row) {
    const data = JSON.parse(row.data);
    console.log("videoThumbnail:", data.videoThumbnail);
    console.log("videoPreviewUrl:", data.videoPreviewUrl);
    console.log("coverUrl:", data.coverUrl);
    console.log("thumbnailUrl:", data.thumbnailUrl);
    console.log("author avatar:", data.author?.avatar);
    console.log("avatar:", data.avatar);
} else {
    console.log("Not found in sqlite");
}
