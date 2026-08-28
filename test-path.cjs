const fs = require('fs');
const path = require('path');
const distPath = fs.existsSync(path.join(__dirname, "dist", "index.html"))
      ? path.join(__dirname, "dist")
      : __dirname;
console.log("distPath:", distPath);
console.log("index.html exists?:", fs.existsSync(path.join(distPath, "index.html")));
