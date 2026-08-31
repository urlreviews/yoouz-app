async function debug() {
  const vidsRes = await fetch("http://localhost:3000/api/nosql/videoReviews");
  const videos = await vidsRes.json();
  console.log(videos.map(v => ({ id: v.id, userEmail: v.userEmail, userId: v.userId, authorName: v.author?.name })));
}
debug();
