const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

const target1 = `    try {
      const stored = localStorage.getItem("copo_followed_authors") || "[]";
      let followed = JSON.parse(stored);
      if (newFollowState && !followed.includes(authorHandle)) followed.push(authorHandle);
      else if (!newFollowState) followed = followed.filter(h => h !== authorHandle);
      localStorage.setItem("copo_followed_authors", JSON.stringify(followed));
    } catch(e) {}`;

const replace1 = `    try {
      const stored = localStorage.getItem("copo_followed_authors") || "[]";
      let followed = JSON.parse(stored);
      if (newFollowState && !followed.includes(authorHandle)) followed.push(authorHandle);
      else if (!newFollowState) followed = followed.filter(h => h !== authorHandle);
      localStorage.setItem("copo_followed_authors", JSON.stringify(followed));
      
      // Persist to Firestore if user is logged in
      if (auth.currentUser && db) {
        setDoc(doc(db, "users", auth.currentUser.uid), {
          followedAuthors: followed
        }, { merge: true }).catch(err => console.warn("Failed to update followedAuthors:", err));
      }
    } catch(e) {}`;

const target2 = `    try {
      const stored = localStorage.getItem("copo_followed_places") || "[]";
      let followed = JSON.parse(stored);
      if (newFollowState && !followed.includes(placeId)) followed.push(placeId);
      else if (!newFollowState) followed = followed.filter(id => id !== placeId);
      localStorage.setItem("copo_followed_places", JSON.stringify(followed));
    } catch(e) {}`;

const replace2 = `    try {
      const stored = localStorage.getItem("copo_followed_places") || "[]";
      let followed = JSON.parse(stored);
      if (newFollowState && !followed.includes(placeId)) followed.push(placeId);
      else if (!newFollowState) followed = followed.filter(id => id !== placeId);
      localStorage.setItem("copo_followed_places", JSON.stringify(followed));
      
      // Persist to Firestore if user is logged in
      if (auth.currentUser && db) {
        setDoc(doc(db, "users", auth.currentUser.uid), {
          followedPlaces: followed
        }, { merge: true }).catch(err => console.warn("Failed to update followedPlaces:", err));
      }
    } catch(e) {}`;

code = code.replace(target1, replace1).replace(target2, replace2);
fs.writeFileSync('src/App.tsx', code, 'utf-8');
console.log("Updated handleToggleFollow with Firestore sync");
