async function check() {
  const vidsRes = await fetch("http://localhost:3000/api/nosql/videoReviews");
  const videos = await vidsRes.json();
  console.log(videos.map(v => ({id: v.id, placeName: v.placeName, placeWebsiteUrl: v.placeWebsiteUrl})));
}
check();
