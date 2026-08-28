
import { initializeApp } from "firebase/app";
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged as firebaseOnAuthStateChanged, getRedirectResult, signInWithRedirect } from "firebase/auth";
import { 
  initializeFirestore,
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  addDoc, 
  onSnapshot, 
  query, 
  where, 
  orderBy, 
  limit, 
  serverTimestamp,
  getDocFromServer
} from "firebase/firestore";
import { 
  getStorage, 
  ref, 
  uploadBytesResumable, 
  getDownloadURL 
} from "firebase/storage";
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

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

// Initialize Firestore with auto-detect long-polling enabled to avoid WebSocket/stream timeouts in containerized & iframe environments
export const db = initializeFirestore(
  app,
  {
    experimentalAutoDetectLongPolling: true,
  },
  firebaseConfig.firestoreDatabaseId
);
export const storage = getStorage(app);

// Graceful connection test on boot
async function testConnection() {
  try {
    await getDocFromServer(doc(db, '_health', 'check'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn("Firestore operating in resilient offline cache mode.");
    }
  }
}
testConnection();

export function onAuthStateChanged(authObj: any, callback: (user: any) => void) {
  return firebaseOnAuthStateChanged(auth, async (user) => {
    if (user) {
      try {
        const userProfile = {
          name: user.displayName || user.email?.split("@")[0] || "Google User",
          email: user.email || "",
          avatar: user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName || "User")}&background=1a73e8&color=fff&bold=true&size=128`,
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

export async function signInWithGoogle(): Promise<any> {
  try {
    const isIOSPWA = (window.navigator as any).standalone === true || window.matchMedia('(display-mode: standalone)').matches;
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
        avatar: user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName || "User")}&background=1a73e8&color=fff&bold=true&size=128`,
      };
      localStorage.setItem("copo_user_profile", JSON.stringify(userProfile));
      try {
        await setDoc(doc(db, "users", user.uid), {
          uid: user.uid,
          name: userProfile.name,
          email: userProfile.email,
          avatar: userProfile.avatar,
          lastLogin: Date.now()
        }, { merge: true });
      } catch (dbErr) {
        console.warn("Failed to write user to Firestore during Google Sign-In:", dbErr);
      }
      return userProfile;
    }
    return null;
  } catch (err: any) {
    if (err?.code === 'auth/popup-closed-by-user' || err?.code === 'auth/cancelled-popup-request') {
      // User closed the Google popup window before completion; treat as a benign cancellation
      return null;
    }
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

export function handleFirestoreError(error: unknown, operationType: OperationType = OperationType.GET, path: string | null = null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.warn('Firestore notice: ', JSON.stringify(errInfo));
  return errInfo;
}

// Export the real Firebase functions so the rest of the app can use them
export {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  addDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  getDocFromServer,
  ref,
  uploadBytesResumable,
  getDownloadURL
};

