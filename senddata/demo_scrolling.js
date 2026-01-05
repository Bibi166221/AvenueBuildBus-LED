// demo_scrolling.js
// This script simulates a bus passing through stops:
// - Stops scroll down (slide animation)
// - New stops appear from the top
// - Simulates bus progression through the route


import { initializeApp, getApps, applicationDefault, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';


const firebaseClientConfig = {
    "projectId": "busweb-5980a",
};


// Helper to find service account
const findServiceAccount = () => {
    const paths = [
        join(process.cwd(), 'service_account.json'),
        join(process.cwd(), '..', 'service_account.json'),
        process.env.GOOGLE_APPLICATION_CREDENTIALS
    ];
    for (const p of paths) {
        if (p && existsSync(p)) return p;
    }
    return null;
};


const APP_ID = firebaseClientConfig.projectId.replace(/[^a-zA-Z0-9_-]/g, '_');
const PUBLIC_COLLECTION_PATH = `/artifacts/${APP_ID}/public/data/bus-status`;


// Full route with all stops
const allStops = [
    { stopName: "AKTIV Square", stopNameTH: "แอคทีฟสแควร์" },
    { stopName: "Opp. Wat Phasuk", stopNameTH: "ตรงข้ามวัดผาสุก" },
    { stopName: "Sukhothai Univ.", stopNameTH: "ม.สุโขทัยฯ" },
    { stopName: "MRT Srirat station", stopNameTH: "สถานีรถไฟฟ้าศรีรัช" },
    { stopName: "Klong Kleau school", stopNameTH: "โรงเรียนคลองเกลือ" },
];


// Scenarios showing bus progressing through stops
const scenarios = [
    {
        name: "At Aktiv Square",
        currentStopIndex: 0,
        lat: 13.903083,
        lng: 100.535583,
        description: "Bus is at first stop"
    },
    {
        name: "Approaching Turn Left",
        currentStopIndex: 0,
        lat: 13.9035,
        lng: 100.5358,
        warning: "TURN LEFT",
        description: "Simulating GPS trigger for TURN LEFT"
    },
    {
        name: "At Opp. Wat Phasuk",
        currentStopIndex: 1,
        lat: 13.902,
        lng: 100.535,
        description: "Bus passed Active, now at Opp. Wat Phasuk"
    },
    {
        name: "Approaching Turn Right",
        currentStopIndex: 1,
        lat: 13.9025,
        lng: 100.5352,
        warning: "TURN LEFT",
        description: "Simulating GPS trigger for TURN LEFT"
    },
    {
        name: "At Sukhothai Univ.",
        currentStopIndex: 2,
        lat: 13.901,
        lng: 100.534,
        description: "Bus passed Opp. Wat Phasuk, now at Sukhothai Univ."
    }
];


async function demonstrateScenario(scenarioIndex) {
    try {
        if (getApps().length === 0) {
            const saPath = findServiceAccount();
            if (saPath) {
                console.log(`🔑 Using service account from: ${saPath}`);
                initializeApp({
                    credential: cert(JSON.parse(readFileSync(saPath, 'utf8'))),
                    projectId: firebaseClientConfig.projectId
                });
            } else {
                console.log("⚠️ No service_account.json found. Falling back to applicationDefault().");
                initializeApp({
                    credential: applicationDefault(),
                    projectId: firebaseClientConfig.projectId
                });
            }
        }


        const db = getFirestore();
        const scenario = scenarios[scenarioIndex];
        const currentIndex = scenario.currentStopIndex;


        console.log(`\n${'='.repeat(70)}`);
        console.log(`🚏 Scenario ${scenarioIndex + 1}: ${scenario.name}`);
        console.log(`   ${scenario.description}`);
        console.log('='.repeat(70));


        // Build nextStops array (show current + 2 upcoming)
        const nextStops = [];


        // Add passed stops (marked as isPassed: true)
        for (let i = Math.max(0, currentIndex - 1); i < currentIndex; i++) {
            nextStops.push({
                ...allStops[i],
                isPassed: true
            });
        }


        // Add current stop (marked as isNext: true)
        if (currentIndex < allStops.length) {
            nextStops.push({
                ...allStops[currentIndex],
                isNext: true,
                arrivalTimeSeconds: 0
            });
        }


        // Add upcoming stops
        for (let i = currentIndex + 1; i < Math.min(currentIndex + 3, allStops.length); i++) {
            nextStops.push({
                ...allStops[i],
                arrivalTimeSeconds: (i - currentIndex) * 120  // 2 min per stop
            });
        }


        const busData = {
            busNumber: "166",
            busNumberSuffix: "(2-21E)",
            destination: "Victory Monument",
            destinationTH: "อนุสาวรีย์ชัยสมรภูมิ  ",
            targetStopName: allStops[currentIndex].stopName,
            targetStopNameTH: allStops[currentIndex].stopNameTH,
            estimatedTimeSeconds: 5,
            currentDistanceMeters: 10,
            nextStops: nextStops,
            gps_lat: scenario.lat,
            gps_lng: scenario.lng,
            warning: scenario.warning || ""
        };


        const docRef = db.collection(PUBLIC_COLLECTION_PATH).doc("166");
        await docRef.set(busData, { merge: true });


        console.log(`✅ Updated to: ${allStops[currentIndex].stopNameTH}`);
        console.log(`📋 Showing ${nextStops.length} stops:`);
        nextStops.forEach((stop, i) => {
            const marker = stop.isPassed ? '✓' : stop.isNext ? '→' : ' ';
            console.log(`   ${marker} ${i + 1}. ${stop.stopNameTH}`);
        });
        console.log(`\n🎬 Watch the browser - stops should scroll down!`);


    } catch (error) {
        console.error("❌ Error:", error.message);
    }
}


async function runDemo() {
    console.log("\n🚌 BUS SCROLLING ANIMATION DEMO");
    console.log("Watch the stops slide down as the bus progresses!\n");


    for (let i = 0; i < scenarios.length; i++) {
        await demonstrateScenario(i);


        if (i < scenarios.length - 1) {
            console.log(`\n⏳ Next stop in 20 seconds...`);
            await new Promise(resolve => setTimeout(resolve, 20000));
        }
    }


    console.log(`\n${'='.repeat(70)}`);
    console.log("🎉 Demo Complete!");
    console.log("The stops should have scrolled down as new ones appeared!");
    console.log(`${'='.repeat(70)}\n`);
}


// Check for command line argument
const scenarioNum = parseInt(process.argv[2]);


if (scenarioNum && scenarioNum >= 1 && scenarioNum <= scenarios.length) {
    // Run single scenario
    demonstrateScenario(scenarioNum - 1);
} else if (process.argv[2] === 'list') {
    // List all scenarios
    console.log("\n🚌 Available Scrolling Scenarios:\n");
    scenarios.forEach((s, i) => {
        console.log(`${i + 1}. ${s.name}`);
        console.log(`   ${s.description}\n`);
    });
    console.log("Usage:");
    console.log("  node demo_scrolling.js [1-5]  - Run specific scenario");
    console.log("  node demo_scrolling.js         - Run full demo");
    console.log("  node demo_scrolling.js list    - Show this help\n");
} else {
    // Run full demo
    runDemo();
}



