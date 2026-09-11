const testReview = {
  id: `rev-test-nosql-${Date.now()}`,
  placeId: "test-place-2",
  placeName: "Test NoSQL Place",
  authorName: "Test Auto Bot",
  videoUrl: "https://test.com/video.mp4"
};

fetch("http://localhost:3000/api/nosql/videoReviews/" + testReview.id, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ data: testReview, merge: true })
})
.then(r => r.json())
.then(d => console.log("Response:", d))
.catch(e => console.error("Error:", e));
