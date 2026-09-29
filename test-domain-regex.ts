
const regex = /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]*[a-z0-9])?)*\.[a-z]{2,}$/i;
console.log("nike.com:", regex.test("nike.com"));
console.log("apple.com:", regex.test("apple.com"));
console.log("google.co.il:", regex.test("google.co.il"));
console.log("a.b:", regex.test("a.b"));
console.log("nike:", regex.test("nike"));
