const testReview = {
  id: `rev-test-save-${Date.now()}`,
  placeId: "test-place-1",
  placeName: "Test Save Place",
  authorName: "Test Auto Bot",
  videoUrl: "https://test.com/video.mp4"
};

fetch("http://localhost:3000/api/videos/save-review", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(testReview)
})
.then(r => r.json())
.then(d => console.log("Response:", d))
.catch(e => console.error("Error:", e));
