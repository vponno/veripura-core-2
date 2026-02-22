
// Scripts/bulk_archive.ts
import { initializeApp } from "firebase/app";
import { getFirestore, collection, query, where, getDocs, updateDoc, doc } from "firebase/firestore";

// Config from services/lib/firebase.ts
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "veripura-f92a5.firebaseapp.com",
    projectId: "veripura-f92a5",
    storageBucket: "veripura-f92a5.firebasestorage.app",
    messagingSenderId: "487093021373",
    appId: "1:487093021373:web:14c39cc3a58196621da5d4",
    measurementId: "G-QY4T240SHL"
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
