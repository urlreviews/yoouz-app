const doc = { test: "data" };
const str = JSON.stringify(doc);
console.log(Buffer.byteLength(str, 'utf8'));
