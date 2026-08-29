import { getApps, initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import dotenv from "dotenv";

dotenv.config();

let adminApp;
if (!getApps().length) {
    let serviceAccount;
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
        serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    }
    if (serviceAccount) {
        adminApp = initializeApp({ credential: cert(serviceAccount) });
    }
} else {
    adminApp = getApps()[0];
}

const adminDb = adminApp ? getFirestore(adminApp) : null;

async function check() {
    if (!adminDb) {
        console.log("No adminDb");
        return;
    }
    const snap = await adminDb.collection("videoReviews").doc("rev-1787774080951-vuu2k").get();
    if (snap.exists) {
        console.log("Firestore Data:", JSON.stringify(snap.data(), null, 2));
    } else {
        console.log("Not found in Firestore");
    }
    process.exit(0);
}
check();
