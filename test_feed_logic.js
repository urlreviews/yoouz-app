import fs from 'fs';

let prev = [];

const serverData = [
  { id: 'rev-1', videoUrl: 'https://rev1.b-cdn.net/videos/rev-1.mp4' }
];

// loadServerData finishes
prev = serverData.slice();

// onSnapshot fires with empty
let filtered = [];
if (filtered.length === 0) {
  if (prev.length > 0) {
    prev = prev.filter(v => true);
  } else {
    prev = [];
  }
}
console.log(prev);
