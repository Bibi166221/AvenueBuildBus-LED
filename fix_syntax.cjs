const fs = require('fs');
const path = 'senddata/send_bus_data.js';
const encoding = 'utf8';

try {
    let content = fs.readFileSync(path, encoding);

    // Anchor: The line with matched specific data
    const anchor = 'arrivalTimeSeconds: 300';
    const anchorIndex = content.indexOf(anchor);

    if (anchorIndex === -1) {
        console.error("Anchor not found!");
        process.exit(1);
    }

    const nextBus = 'busId: "Route-77"';
    const nextBusIndex = content.indexOf(nextBus, anchorIndex);

    if (nextBusIndex === -1) {
        fs.writeFileSync('debug.txt', content.substring(anchorIndex, anchorIndex + 500));
        process.exit(1);
    }

    const blockToReplace = content.substring(anchorIndex, nextBusIndex + nextBus.length);
    console.log("Found block:");
    console.log(JSON.stringify(blockToReplace));

    // The replacement
    const replacement = `arrivalTimeSeconds: 300
                }
            ]
        }
    },
    {
        busId: "Route-77"`;

    const replacementCRLF = replacement.replace(/\n/g, '\r\n');

    const newContent = content.substring(0, anchorIndex) + replacementCRLF + content.substring(nextBusIndex + nextBus.length);

    fs.writeFileSync(path, newContent, encoding);
    console.log("Successfully replaced content.");

} catch (e) {
    console.error(e);
}
