let likedIds = [];
try {
  likedIds = JSON.parse("null");
} catch(e) {}
console.log(likedIds);
console.log(likedIds === null);
