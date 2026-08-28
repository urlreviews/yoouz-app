const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

const target = `              const updatedProfile: UserProfile = {
                ...profileObj,
                name: data.name || profileObj.name,
                bio: data.bio || profileObj.bio,
                avatar: data.avatar || profileObj.avatar,
              };
              setCurrentUser(updatedProfile);
              try {
                localStorage.setItem("copo_user_profile", JSON.stringify(updatedProfile));
              } catch (e) {}`;

const replace = `              const updatedProfile: UserProfile = {
                ...profileObj,
                name: data.name || profileObj.name,
                bio: data.bio || profileObj.bio,
                avatar: data.avatar || profileObj.avatar,
              };
              setCurrentUser(updatedProfile);
              try {
                localStorage.setItem("copo_user_profile", JSON.stringify(updatedProfile));
                
                // Sync follows from Firestore to localStorage
                if (data.followedAuthors && Array.isArray(data.followedAuthors)) {
                  localStorage.setItem("copo_followed_authors", JSON.stringify(data.followedAuthors));
                }
                if (data.followedPlaces && Array.isArray(data.followedPlaces)) {
                  localStorage.setItem("copo_followed_places", JSON.stringify(data.followedPlaces));
                }
              } catch (e) {}`;

if(code.includes('name: data.name || profileObj.name,')) {
    code = code.replace(target, replace);
    fs.writeFileSync('src/App.tsx', code, 'utf-8');
    console.log("Updated Profile Fetch");
} else {
    console.log("Could not find target");
}
