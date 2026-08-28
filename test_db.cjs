const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, query, where } = require('firebase/firestore');
const fs = require('fs');
const config = JSON.parse(fs.readFileSync('firebase-applet-config.json', 'utf8'));
const app = initializeApp(config);
const db = getFirestore(app);

async function check() {
  const q = query(collection(db, 'places'), where('name', '>=', 'London'), where('name', '<=', 'London\uf8ff'));
  const snap = await getDocs(q);
  snap.forEach(doc => {
    console.log(doc.id, doc.data().name, doc.data().avatarUrl, doc.data().logoUrl, doc.data().website);
  });
  
  const q2 = query(collection(db, 'places'), where('name', '>=', 'Kempinski'), where('name', '<=', 'Kempinski\uf8ff'));
  const snap2 = await getDocs(q2);
  snap2.forEach(doc => {
    console.log(doc.id, doc.data().name, doc.data().avatarUrl, doc.data().logoUrl, doc.data().website);
  });
  process.exit(0);
}
check();
