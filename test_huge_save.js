const testReview = {
  id: `rev-test-save-${Date.now()}`,
  placeId: "test-place-huge",
  placeName: "Test Save Place Huge",
  authorName: "Test Auto Bot",
  videoUrl: "https://test.com/video.mp4",
  videoData: "A".repeat(60 * 1024 * 1024) // 60MB
};

fetch("http://localhost:3000/api/videos/save-review", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(testReview)
})
.then(r => console.log("Status:", r.status, r.statusText))
.catch(e => console.error("Error:", e));
