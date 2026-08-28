const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// 1. Add firestore imports
code = code.replace(
  /import \{ auth, logOutUser, onAuthStateChanged \} from "\.\/lib\/firebase";/,
  'import { auth, db, logOutUser, onAuthStateChanged } from "./lib/firebase";\nimport { collection, getDocs, query, orderBy } from "firebase/firestore";'
);

// 2. Add useEffect to fetch cloud reviews
const firestoreSyncCode = `  // Sync cloud video reviews from Firestore
  useEffect(() => {
    const fetchCloudReviews = async () => {
      try {
        const q = query(collection(db, "videoReviews"));
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
          const cloudReviews: VideoReview[] = [];
          snapshot.forEach((docSnap) => {
            const data = docSnap.data() as VideoReview;
            cloudReviews.push({ ...data, id: docSnap.id });
          });
          if (cloudReviews.length > 0) {
            setVideos((prev) => {
              const existingIds = new Set(prev.map((v) => v.id));
              const fresh = cloudReviews.filter((cr) => !existingIds.has(cr.id));
              return fresh.length > 0 ? [...fresh, ...prev] : prev;
            });
          }
        }
      } catch (e) {
        console.warn("Firestore reviews sync skipped or empty:", e);
      }
    };
    fetchCloudReviews();
  }, []);
`;

code = code.replace(
  /\/\/ Sync to LocalStorage\n  useEffect\(\(\) => \{/,
  firestoreSyncCode + '\n  // Sync to LocalStorage\n  useEffect(() => {'
);

fs.writeFileSync('src/App.tsx', code);
console.log('Successfully updated App.tsx with Firestore videoReviews sync!');
