const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

const target = `        const filtered = list.filter(p => !deletedIds.includes(p.id));
        setPlaces((prev) => {
          const map = new Map<string, Place>();
          prev.forEach(p => map.set(p.id, p));
          filtered.forEach(p => map.set(p.id, { ...map.get(p.id), ...p }));
          return Array.from(map.values());
        });`;

const replace = `        const filtered = list.filter(p => !deletedIds.includes(p.id));
        setPlaces((prev) => {
          let followedPlaces = [];
          try { followedPlaces = JSON.parse(localStorage.getItem("copo_followed_places") || "[]"); } catch(e){}

          const map = new Map<string, Place>();
          prev.forEach(p => map.set(p.id, p));
          filtered.forEach(p => {
             const existing = map.get(p.id);
             const isFollowed = followedPlaces.includes(p.id);
             map.set(p.id, { ...existing, ...p, isFollowed });
          });
          return Array.from(map.values());
        });`;

code = code.replace(target, replace);
fs.writeFileSync('src/App.tsx', code, 'utf-8');
console.log("Updated places sync");
