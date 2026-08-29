import fetch from "node-fetch";

// Simulated useFeedPagination
async function load() {
  try {
    const res = await fetch("http://localhost:3000/api/videos/feed");
    if (res.ok) {
      const data = await res.json();
      console.log("videos returned:", data.videos.length);
    } else {
      console.log("res.ok false", res.status);
    }
  } catch(e) {
    console.error("error", e);
  }
}
load();
