// send_bus_data.js
// This script sends mock bus arrival data to your Firebase Firestore database using the
// RECOMMENDED Firebase Admin SDK (firebase-admin), as the Client SDK failed authentication.

// IMPORTANT: 
// 1. Requires 'firebase-admin' package: npm install firebase-admin
// 2. This script relies on **External Service Account Credentials** for authorization.
//    You must set the GOOGLE_APPLICATION_CREDENTIALS environment variable
//    to the path of your 'service_account.json' file before running.

// FIX: Use modular imports for firebase-admin v10+
import { initializeApp, getApps, applicationDefault } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
// REMOVED: import { getFirestore, doc, setDoc } from 'firebase/firestore'; // Client SDK imports are no longer needed.

// The only piece of client configuration we need is the projectId for path derivation.
const firebaseClientConfig = {
    "projectId": "busweb-5980a",
};
console.log("Using Firebase Admin SDK configuration.");


// We use the projectId to derive the application ID for the secure path.
const APP_ID = firebaseClientConfig.projectId.replace(/[^a-zA-Z0-9_-]/g, '_');

// The collection path MUST match the one used in the web app for public data
// Path: /artifacts/{APP_ID}/public/data/bus-status
const PUBLIC_COLLECTION_PATH = `/artifacts/${APP_ID}/public/data/bus-status`;

// Data to send for multiple buses.
const busUpdates = [
    {
        busId: "166",
        data: {
            // Route 166 Detail
            busNumber: "166",
            busNumberSuffix: "(2-21E)", // For the small text below 166
            destination: "Muang Thong Thani",
            destinationTH: "เมืองทองธานี",

            // Current Target
            targetStopName: "Active Square",
            targetStopNameTH: "แอคทีฟสแควร์",
            estimatedTimeSeconds: 30, // Arriving Very Soon
            currentDistanceMeters: 50,

            // NEW: Progress to next stop (0.0 to 1.0)
            // 0.65 means 65% of the way to the next stop
            progressToNextStop: 0.65,

            // The sequence to display (The image shows flow: Cosmo -> Kasikorn -> Active)
            // If we assume "Active" is the NEXT stop, then Cosmo and Kasikorn are PREVIOUS.
            // But to make the UI look populated, we will send this list.
            nextStops: [
                {
                    stopName: "Cosmo Bazaar",
                    stopNameTH: "คอสโม่บาซาร์",
                    isPassed: true // distinct flag
                },
                {
                    stopName: "Kasikornthai Bank",
                    stopNameTH: "ธนาคารกสิกรไทย",
                    isPassed: true
                },
                {
                    stopName: "Active Square",
                    stopNameTH: "แอคทีฟสแควร์",
                    arrivalTimeSeconds: 30,
                    isNext: true // The big one
                },
                {
                    stopName: "Silicon Science Park",
                    stopNameTH: "อุทยานวิทยาศาสตร์",
                    arrivalTimeSeconds: 300
                }
            ]
        }
    }
];

async function sendData() {
    console.log("--- Starting Firebase Admin Data Sender ---");
    console.log(`Target Collection: ${PUBLIC_COLLECTION_PATH}`);

    try {
        // 2. Initialize Firebase Admin SDK
        // Uses 'getApps' for checking if initialized.
        if (getApps().length === 0) {
            console.log("Attempting to initialize Admin SDK using application default credentials...");

            // This method relies on credentials being set externally 
            // (e.g., via GOOGLE_APPLICATION_CREDENTIALS env var).
            initializeApp({
                credential: applicationDefault(),
                projectId: firebaseClientConfig.projectId
            });
        }

        // 3. Get Firestore instance
        const db = getFirestore();
        console.log("Admin SDK initialized.");

        // --- STEP 0: WIPE EXISTING DATA (Flush old buses) ---
        console.log("🧹 Flushing old data...");
        const existingDocs = await db.collection(PUBLIC_COLLECTION_PATH).listDocuments();
        for (const doc of existingDocs) {
            await doc.delete();
            process.stdout.write("."); // Progress dot
        }
        console.log("\n✨ Database Cleared.");

        // 4. Send updates for all buses
        console.log("🚀 Sending fresh Bus 166 data...");
        for (const update of busUpdates) {
            const docRef = db.collection(PUBLIC_COLLECTION_PATH).doc(update.busId);
            await docRef.set(update.data, { merge: true });
            console.log(`✅ Sent data for ${update.busId}. ETA: ${update.data.estimatedTimeSeconds}s.`);
        }

        // 5. VERIFICATION READ
        console.log("\n🔍 Verifying data in Cloud...");
        const bufRef = db.collection(PUBLIC_COLLECTION_PATH).doc("166");
        const docSnap = await bufRef.get();
        if (docSnap.exists) {
            const d = docSnap.data();
            console.log(`CLOUD STATUS: Bus Number is '${d.busNumber}'`);
            console.log(`CLOUD STATUS: Destination is '${d.destinationTH}'`);
        } else {
            console.log("❌ ERROR: Document 166 not found in cloud after write!");
        }

        console.log("--- All data sent successfully. Check the Canvas live board! ---");

    } catch (error) {
        console.error("❌ An error occurred during data transmission:", error.message);
        console.error("\nCommon Issues:");
        console.error("1. Did you run 'npm install firebase-admin'?");
        console.error("2. **Crucial:** Did you set the GOOGLE_APPLICATION_CREDENTIALS environment variable to the path of your 'service_account.json' file?");
        console.error("3. Are your Firestore Security Rules set to 'allow read, write: if true;' for this public path?");
    }
}

sendData();