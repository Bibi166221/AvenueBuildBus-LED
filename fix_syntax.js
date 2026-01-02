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

    // Check what is immediately after
    // We assume the structure:
    // arrivalTimeSeconds: 300
    // }
    // ]
    // }
    // },
    // {
    // busId: "Route-77"

    // We will look for the start of the next bus
    const nextBus = 'busId: "Route-77"';
    const nextBusIndex = content.indexOf(nextBus, anchorIndex);

    if (nextBusIndex === -1) {
        console.error("Next bus anchor not found!");
        process.exit(1);
    }

    const blockToReplace = content.substring(anchorIndex, nextBusIndex + nextBus.length);
    console.log("Found block:");
    console.log(JSON.stringify(blockToReplace));

    // The replacement
    // We use \r\n because we detected it earlier, but to be safe we can match the file's style?
    // Let's just use \n and allow mixed line endings (JS handles it fine), or explicit \r\n.
    // I'll use \n and it should be fine.

    const replacement = `arrivalTimeSeconds: 300
                }
            ]
        }
    },
    {
        busId: "Route-77"`;

    // Normalize line endings in replacement to \r\n just in case the User's editor is picky
    const replacementCRLF = replacement.replace(/\n/g, '\r\n');

    const newContent = content.substring(0, anchorIndex) + replacementCRLF + content.substring(nextBusIndex + nextBus.length);

    fs.writeFileSync(path, newContent, encoding);
    console.log("Successfully replaced content.");

} catch (e) {
    console.error(e);
}
