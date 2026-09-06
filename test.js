const { JSDOM } = require("jsdom");
const dom = new JSDOM();
const vid = dom.window.document.createElement("video");
vid.src = "/default-review.mp4";
console.log("assigned:", "/default-review.mp4");
console.log("vid.src:", vid.src);
