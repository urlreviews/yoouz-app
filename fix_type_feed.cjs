const fs = require('fs');
let code = fs.readFileSync('src/hooks/useFeedPagination.ts', 'utf-8');

const target = `        // Start with the exact list from Firestore (filtered)
        const nextList = filtered.map(v => {`;

const replace = `        // Start with the exact list from Firestore (filtered)
        const nextList: VideoReview[] = filtered.map(v => {`;

code = code.replace(target, replace);
fs.writeFileSync('src/hooks/useFeedPagination.ts', code, 'utf-8');
console.log("Updated useFeedPagination type");
