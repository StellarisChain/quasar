const { stringToPoint, stringToBytes } = require('../build/chrome/background.bundle.js');

// Test addresses from your error log
const address1 = "Dn7FpuuLTkAXTbSDuQALMSQVzy4Mp1RWc69ZnddciNa7o";
const address2 = "DnS8Gwn8Kq2X6PPzHxJtMgecs1gUYneWMGGQJZA79hhzC";

console.log("Testing Stellaris address parsing...");

try {
    console.log("\nTesting address1:", address1);
    const bytes1 = stringToBytes(address1);
    console.log("Address1 bytes length:", bytes1.length);
    console.log("Address1 prefix:", bytes1[0]);

    const publicKey1 = stringToPoint(address1);
    console.log("Address1 public key length:", publicKey1.length);
    console.log("Address1 success!");

    console.log("\nTesting address2:", address2);
    const bytes2 = stringToBytes(address2);
    console.log("Address2 bytes length:", bytes2.length);
    console.log("Address2 prefix:", bytes2[0]);

    const publicKey2 = stringToPoint(address2);
    console.log("Address2 public key length:", publicKey2.length);
    console.log("Address2 success!");

} catch (error) {
    console.error("Error:", error.message);
}
