
import * as admin from 'firebase-admin';

// Check for service account key
const serviceAccountPath = './service-account.json';
let app;

try {
    // If you have a service account key, use it:
    const serviceAccount = require(serviceAccountPath);
    app = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
} catch (e) {
    // Fallback to Application Default Credentials
    console.warn("⚠️  service-account.json not found. Attempting to use Default Credentials...");
    app = admin.initializeApp({
        projectId: "veripura-connect-live" // Found in services/lib/firebase.ts
    });
}

const db = admin.firestore();

const SEED_USER_ID = "i0pMnv3nhsSJlrH2KJmIGjikYEx2"; // Validated UID from existing data

const seedData = [
    {
        ownerId: SEED_USER_ID,
        exportFrom: "Vietnam",
        importTo: "United States",
        product: "Cinnamon Sticks",
        hsCode: "0906.11",
        status: "In Progress",
        createdAt: new Date().toISOString(),
        roadmap: {
            "Purchase Order": { required: true, status: "Validated", uploadedAt: new Date().toISOString() },
            "Commercial Invoice": { required: true, status: "Pending" },
            "Packing List": { required: true, status: "Pending" },
            "Bill of Lading": { required: true, status: "Pending" }
        },
        agentState: {
            messages: [
                { id: "1", sender: "agent", content: "Welcome! I've initialized the compliance roadmap for your Cinnamon export to the US.", timestamp: new Date().toISOString(), type: "text" }
            ],
            unreadCount: 0,
            lastActive: new Date().toISOString()
        }
    },
    {
        ownerId: SEED_USER_ID,
        exportFrom: "Vietnam",
        importTo: "Indonesia",
        product: "Dried Peppercorns",
        hsCode: "0904.11",
        status: "In Progress",
        createdAt: new Date().toISOString(),
        roadmap: {
            "Purchase Order": { required: true, status: "Validated", uploadedAt: new Date().toISOString() },
            "Phytosanitary Certificate": { required: true, status: "Pending", description: "Required for plant products." },
            "Halal Certificate": { required: true, status: "Pending", description: "Required for food exports to Indonesia." },
            "Bill of Lading": { required: true, status: "Pending" }
        },
        agentState: {
            messages: [
                { id: "1", sender: "agent", content: "Note: Indonesia requires Halal certification for this product category.", timestamp: new Date().toISOString(), type: "alert" }
            ],
            unreadCount: 1,
            lastActive: new Date().toISOString()
        }
    },
    {
        ownerId: SEED_USER_ID,
        exportFrom: "Vietnam",
        importTo: "Switzerland",
        product: "Bio Arabica Coffee Beans",
        hsCode: "0901.11",
        status: "In Progress",
        createdAt: new Date().toISOString(),
        roadmap: {
            "Purchase Order": { required: true, status: "Validated", uploadedAt: new Date().toISOString() },
            "Organic Certificate": { required: true, status: "Pending", description: "Required for 'Bio' labeled products." },
            "Certificate of Origin": { required: true, status: "Pending" },
            "Bill of Lading": { required: true, status: "Pending" }
        }
    }
];

async function seed() {
    console.log("🚀 Starting Admin Seed Process...");
    for (const item of seedData) {
        try {
            const docRef = await db.collection("consignments").add(item);
            console.log(`✅ Created Consignment: ${docRef.id} (${item.product})`);
        } catch (e: any) {
            console.error(`❌ Failed to create ${item.product}:`, e.message);
            if (e.message.includes("PERMISSION_DENIED")) {
                console.log("\n💡 TIP: Please ensure you have a valid 'service-account.json' in the root or GOOGLE_APPLICATION_CREDENTIALS set.");
                process.exit(1);
            }
        }
    }
    console.log("🏁 Seed Process Complete!");
    process.exit(0);
}

seed();
