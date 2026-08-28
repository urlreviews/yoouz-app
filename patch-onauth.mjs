import fs from 'fs';
let code = fs.readFileSync('src/lib/firebase.ts', 'utf8');

code = code.replace(/export async function onAuthStateChanged\(authObj: any, callback: \(user: any\) => void\) \{[\s\S]*?\}\);\n\}/, `export function onAuthStateChanged(authObj: any, callback: (user: any) => void) {
  const profileStr = localStorage.getItem("copo_user_profile");
  if (profileStr) {
    try {
      const profile = JSON.parse(profileStr);
      const mockUser = {
        uid: profile.email.replace(/[^a-zA-Z0-9]/g, "_"),
        email: profile.email,
        displayName: profile.name,
        photoURL: profile.avatar,
      };
      auth.currentUser = mockUser;
      callback(mockUser);
    } catch (e) {
      callback(null);
    }
  } else {
    callback(null);
  }
  
  const listener = (e: any) => {
    const profile = e.detail;
    if (profile) {
      const mockUser = {
        uid: profile.email.replace(/[^a-zA-Z0-9]/g, "_"),
        email: profile.email,
        displayName: profile.name,
        photoURL: profile.avatar,
      };
      auth.currentUser = mockUser;
      callback(mockUser);
    } else {
      auth.currentUser = null;
      callback(null);
    }
  };
  
  window.addEventListener("copo_auth_changed", listener);
  return () => {
    window.removeEventListener("copo_auth_changed", listener);
  };
}`);

fs.writeFileSync('src/lib/firebase.ts', code);
