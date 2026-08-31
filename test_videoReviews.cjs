const fs = require('fs');
async function check() {
  const res = await fetch("http://localhost:3000/api/nosql/videoReviews");
  const videos = await res.json();
  const authors = videos.map(v => ({ id: v.id, userId: v.userId, userEmail: v.userEmail, author: v.author }));
  console.log("VIDEOS:", JSON.stringify(authors, null, 2));
}
check();
