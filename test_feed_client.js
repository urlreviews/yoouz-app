import fetch from 'node-fetch';
async function run() {
  const res = await fetch("http://localhost:3000/api/videos/feed");
  const data = await res.json();
  console.log("Videos from API:", data.videos.length);
}
run();
