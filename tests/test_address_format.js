// Simple Node.js test for Stellaris address format
const bs58 = require('bs58').default || require('bs58');

// Test addresses from your error log
const address1 = "Dn7FpuuLTkAXTbSDuQALMSQVzy4Mp1RWc69ZnddciNa7o";
const address2 = "DnS8Gwn8Kq2X6PPzHxJtMgecs1gUYneWMGGQJZA79hhzC";

console.log("Testing Stellaris address decoding...");

function testAddress(address) {
    console.log("\nTesting address:", address);

    try {
        const bytes = bs58.decode(address);
        console.log("Decoded bytes length:", bytes.length);
        console.log("Prefix byte:", bytes[0]);
        console.log("Is valid Stellaris format:", bytes.length === 33 && (bytes[0] === 42 || bytes[0] === 43));

        if (bytes.length === 33 && (bytes[0] === 42 || bytes[0] === 43)) {
            console.log("✅ Valid Stellaris address format");
            console.log("Prefix indicates:", bytes[0] === 42 ? "even y-coordinate" : "odd y-coordinate");
        } else {
            console.log("❌ Invalid Stellaris address format");
        }
    } catch (error) {
        console.error("❌ Failed to decode:", error.message);
    }
}

testAddress(address1);
testAddress(address2);
