
// Scripts/bulk_archive.ts
import { initializeApp } from "firebase/app";
import { getFirestore, collection, query, where, getDocs, updateDoc, doc } from "firebase/firestore";

// Config from services/lib/firebase.ts
const firebaseConfig = {
    apiKey: "AIzaSyA80wb0r7T1eeQyGbJMbtVZukG5uUuaggM",
    authDomain: "veripura-connect-live.firebaseapp.com",
    projectId: "veripura-connect-live",
    storageBucket: "veripura-connect-live.firebasestorage.app",
    messagingSenderId: "249189264102",
    appId: "1:249189264102:web:92944fb8c2a2e62824a927"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function archiveAllConsignments() {
    console.log("[Script] Starting Bulk Archive...");
    try {
        const q = query(
            collection(db, 'consignments'),
            where('status', '!=', 'Archived')
        );
        const snapshot = await getDocs(q);

        if (snapshot.empty) {
            console.log("[Script] No active consignments to archive.");
            process.exit(0);
        }

        console.log(`[Script] Found ${snapshot.size} consignments to archive.`);

        const batchPromises = snapshot.docs.map(docSnap => {
            console.log(`Archiving ${docSnap.id}...`);
            return updateDoc(doc(db, 'consignments', docSnap.id), { status: 'Archived' });
        });

        await Promise.all(batchPromises);
        console.log(`[Script] Successfully archived ${snapshot.size} consignments.`);
    } catch (e) {
        console.error("Error:", e);
    }
    process.exit(0);
}

archiveAllConsignments();
