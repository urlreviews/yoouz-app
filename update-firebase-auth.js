const fs = require('fs');
let code = fs.readFileSync('src/lib/firebase.ts', 'utf8');

const authReplacement = `
import { initializeApp } from "firebase/app";
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged as firebaseOnAuthStateChanged, getRedirectResult, signInWithRedirect } from "firebase/auth";
import firebaseConfig from "../../firebase-applet-config.json";

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export const db = "NOSQL_DB";
export const storage = "NOSQL_STORAGE";

export function onAuthStateChanged(authObj, callback) {
  return firebaseOnAuthStateChanged(auth, async (user) => {
    if (user) {
      try {
        const userProfile = {
          name: user.displayName || user.email?.split("@")[0] || "Google User",
          email: user.email || "",
          avatar: user.photoURL || \`https://ui-avatars.com/api/?name=\${encodeURIComponent(user.displayName || "User")}&background=1a73e8&color=fff&bold=true&size=128\`,
        };
        localStorage.setItem("copo_user_profile", JSON.stringify(userProfile));
        
        await setDoc(doc(db, "users", user.uid), {
          uid: user.uid,
          name: userProfile.name,
          email: userProfile.email,
          avatar: userProfile.avatar,
          lastLogin: Date.now()
        }, { merge: true });
      } catch (e) {}
    }
    callback(user);
  });
}

export async function signInWithGoogle() {
  try {
    const isIOSPWA = window.navigator.standalone === true || window.matchMedia('(display-mode: standalone)').matches;
    let user = null;
    if (isIOSPWA) {
      await signInWithRedirect(auth, googleProvider);
      return null;
    }
    const result = await signInWithPopup(auth, googleProvider);
    user = result.user;
    if (user) {
      const userProfile = {
        name: user.displayName || user.email?.split("@")[0] || "Google User",
        email: user.email || "",
        avatar: user.photoURL || \`https://ui-avatars.com/api/?name=\${encodeURIComponent(user.displayName || "User")}&background=1a73e8&color=fff&bold=true&size=128\`,
      };
      localStorage.setItem("copo_user_profile", JSON.stringify(userProfile));
      return userProfile;
    }
    return null;
  } catch (err) {
    console.error("Sign in error", err);
    throw err;
  }
}

export async function logOutUser() {
  localStorage.removeItem("copo_user_profile");
  await signOut(auth);
}

export async function handleRedirectResult() {
  try {
    const result = await getRedirectResult(auth);
    if (result?.user) {
      return { name: result.user.displayName, email: result.user.email, avatar: result.user.photoURL };
    }
  } catch(e) {}
  return null;
}

export function handleFirestoreError(err) {
  console.error("DB Error:", err);
}
`;

// Replace from top until // FIRESTORE MOCK HTTP API
const splitParts = code.split('// -------------------------------------------------------------');
if (splitParts.length > 1) {
  const newCode = authReplacement + '\n// -------------------------------------------------------------\n' + splitParts.slice(1).join('// -------------------------------------------------------------');
  fs.writeFileSync('src/lib/firebase.ts', newCode);
  console.log("Replaced auth.");
} else {
  console.log("Could not find split point.");
}
