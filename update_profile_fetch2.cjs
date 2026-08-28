const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

const target = `              try {
                localStorage.setItem("copo_user_profile", JSON.stringify(updatedProfile));
                
                // Sync follows from Firestore to localStorage
                if (data.followedAuthors && Array.isArray(data.followedAuthors)) {
                  localStorage.setItem("copo_followed_authors", JSON.stringify(data.followedAuthors));
                }
                if (data.followedPlaces && Array.isArray(data.followedPlaces)) {
                  localStorage.setItem("copo_followed_places", JSON.stringify(data.followedPlaces));
                }
              } catch (e) {}`;

const replace = `              try {
                localStorage.setItem("copo_user_profile", JSON.stringify(updatedProfile));
                
                // Sync follows from Firestore to localStorage
                let fAuthors = [];
                let fPlaces = [];
                if (data.followedAuthors && Array.isArray(data.followedAuthors)) {
                  fAuthors = data.followedAuthors;
                  localStorage.setItem("copo_followed_authors", JSON.stringify(fAuthors));
                }
                if (data.followedPlaces && Array.isArray(data.followedPlaces)) {
                  fPlaces = data.followedPlaces;
                  localStorage.setItem("copo_followed_places", JSON.stringify(fPlaces));
                }
                
                // Instantly re-hydrate existing places and videos with the fresh follow state
                setPlaces(prev => prev.map(p => ({ ...p, isFollowed: fPlaces.includes(p.id) })));
                setVideos(prev => prev.map(v => ({ ...v, author: { ...v.author, isFollowed: fAuthors.includes(v.author.handle) } })));
                
              } catch (e) {}`;

code = code.replace(target, replace);
fs.writeFileSync('src/App.tsx', code, 'utf-8');
console.log("Updated Profile Fetch with immediate state hydration");
