const fs = require('fs');
let code = fs.readFileSync('src/utils/placeUtils.ts', 'utf8');

// Add 4samet@gmail.com
code = code.replace(
  /"aouisesmee": {/,
  `"4samet@gmail.com": {
    name: "Samet",
    handle: "@samet",
    avatar: "https://lh3.googleusercontent.com/a/ACg8ocLtE8R7n91f-0eFh94h90p2z-K4G57VbA9_c=s96-c",
    bio: "Yoouz Founder & Reviewer."
  },
  "samet": {
    name: "Samet",
    handle: "@samet",
    avatar: "https://lh3.googleusercontent.com/a/ACg8ocLtE8R7n91f-0eFh94h90p2z-K4G57VbA9_c=s96-c",
    bio: "Yoouz Founder & Reviewer."
  },
  "aouisesmee": {`
);

// Fix resolveSafeAuthor logic
code = code.replace(
  /if \(activeUser\.avatar && !candidateAvatar\) candidateAvatar = activeUser\.avatar;/,
  `if (activeUser.avatar) candidateAvatar = activeUser.avatar;`
);

fs.writeFileSync('src/utils/placeUtils.ts', code);
console.log('Patched placeUtils.ts');
