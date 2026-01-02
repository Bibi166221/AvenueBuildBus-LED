// demo_animations.js
// This script simulates different bus positions along the route
// Run this to see the bus move through different stages

// IMPORTANT: 
// 1. Requires 'firebase-admin' package: npm install firebase-admin
// 2. Set GOOGLE_APPLICATION_CREDENTIALS environment variable before running

import { initializeApp, getApps, applicationDefault } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const firebaseClientConfig = {
    "projectId": "busweb-5980a",
};

const APP_ID = firebaseClientConfig.projectId.replace(/[^a-zA-Z0-9_-]/g, '_');
const PUBLIC_COLLECTION_PATH = `/artifacts/${APP_ID}/public/data/bus-status`;

// Different animation scenarios to demonstrate
const scenarios = [
    {
        name: "Just Left Kasikorn Bank (Start of Journey)",
        progressToNextStop: 0.15,  // 15% to Active Square
        description: "Bus has just left the previous stop"
    },
    {
        name: "Halfway to Active Square",
        progressToNextStop: 0.5,   // 50% to Active Square
        description: "Bus is midway between stops"
    },
    {
        name: "Almost at Active Square",
        progressToNextStop: 0.85,  // 85% to Active Square
        description: "Bus is approaching the next stop"
    },
    {
        name: "Just Arrived at Active Square",
        progressToNextStop: 0.95,  // 95% - Almost complete progress ring
        description: "Bus has just arrived"
    }
];

async function demonstrateAnimation(scenarioIndex) {
    try {
        if (getApps().length === 0) {
            initializeApp({
                credential: applicationDefault(),
                projectId: firebaseClientConfig.projectId
            });
        }

        const db = getFirestore();
        const scenario = scenarios[scenarioIndex];

        console.log(`\n${'='.repeat(60)}`);
        console.log(`📍 Scenario ${scenarioIndex + 1}: ${scenario.name}`);
        console.log(`   ${scenario.description}`);
        console.log(`   Progress: ${(scenario.progressToNextStop * 100).toFixed(0)}%`);
        console.log('='.repeat(60));

        const busData = {
            busNumber: "166",
            busNumberSuffix: "(2-21E)",
            destination: "Muang Thong Thani",
            destinationTH: "เมืองทองธานี",
            targetStopName: "Active Square",
            targetStopNameTH: "แอคทีฟสแควร์",
            estimatedTimeSeconds: Math.round((1 - scenario.progressToNextStop) * 60),
            currentDistanceMeters: Math.round((1 - scenario.progressToNextStop) * 200),
            progressToNextStop: scenario.progressToNextStop,
            nextStops: [
                {
                    stopName: "Cosmo Bazaar",
                    stopNameTH: "คอสโม่บาซาร์",
                    isPassed: true
                },
                {
                    stopName: "Kasikornthai Bank",
                    stopNameTH: "ธนาคารกสิกรไทย",
                    isPassed: true
                },
                {
                    stopName: "Active Square",
                    stopNameTH: "แอคทีฟสแควร์",
                    arrivalTimeSeconds: Math.round((1 - scenario.progressToNextStop) * 60),
                    isNext: true
                },
                {
                    stopName: "Silicon Science Park",
                    stopNameTH: "อุทยานวิทยาศาสตร์",
                    arrivalTimeSeconds: 300
                }
            ]
        };

        const docRef = db.collection(PUBLIC_COLLECTION_PATH).doc("166");
        await docRef.set(busData, { merge: true });

        console.log(`✅ Updated bus position!`);
        console.log(`   ETA: ${busData.estimatedTimeSeconds}s`);
        console.log(`   Distance: ${busData.currentDistanceMeters}m`);
        console.log(`\n🎬 Check your browser to see the animation!`);

    } catch (error) {
        console.error("❌ Error:", error.message);
    }
}

async function runDemo() {
    console.log("\n🚌 BUS ANIMATION DEMO");
    console.log("This demo will cycle through different bus positions");
    console.log("Watch your browser to see the bus icon move!\n");

    for (let i = 0; i < scenarios.length; i++) {
        await demonstrateAnimation(i);

        if (i < scenarios.length - 1) {
            console.log(`\n⏳ Next scenario in 5 seconds...`);
            await new Promise(resolve => setTimeout(resolve, 5000));
        }
    }

    console.log(`\n${'='.repeat(60)}`);
    console.log("🎉 Demo Complete!");
    console.log("The bus should have moved from 15% to 95% progress");
    console.log(`${'='.repeat(60)}\n`);
}

// Check for command line argument
const scenarioNum = parseInt(process.argv[2]);

if (scenarioNum && scenarioNum >= 1 && scenarioNum <= scenarios.length) {
    // Run single scenario
    demonstrateAnimation(scenarioNum - 1);
} else if (process.argv[2] === 'list') {
    // List all scenarios
    console.log("\n🚌 Available Animation Scenarios:\n");
    scenarios.forEach((s, i) => {
        console.log(`${i + 1}. ${s.name} (${(s.progressToNextStop * 100).toFixed(0)}%)`);
        console.log(`   ${s.description}\n`);
    });
    console.log("Usage:");
    console.log("  node demo_animations.js [1-4]  - Run specific scenario");
    console.log("  node demo_animations.js         - Run full demo (cycles through all)");
    console.log("  node demo_animations.js list    - Show this help\n");
} else {
    // Run full demo
    runDemo();
}
