// Test the fixed address generation
const { secp256k1 } = require('@noble/curves/secp256k1');
const bs58 = require('bs58');

// Check if bs58 is properly imported
console.log('bs58 methods:', Object.keys(bs58));

// Use the correct method
const encode = bs58.encode || bs58.default?.encode || bs58;

// Test private key from the Python test case
const privateKeyHex = 'be531298d55bba6639cbe813f9d7a82ff5467146c2d0154ca7150ad9d5042aa7';
const expectedAddress = 'DhKfZHgKbkWwLrARdY5PcREbjeQdp65CKMxijGnuZMC5g';

console.log('Testing fixed address generation...');
console.log('Private key:', privateKeyHex);
console.log('Expected address:', expectedAddress);

try {
    // Convert private key to point
    const privateKeyInt = BigInt('0x' + privateKeyHex);
    const point = secp256k1.ProjectivePoint.fromPrivateKey(privateKeyInt);
    
    const x = point.x;
    const y = point.y;
    
    console.log('Point x:', x.toString(16));
    console.log('Point y:', y.toString(16));
    console.log('Y is even:', y % 2n === 0n);
    
    // Create address using Stellaris format (matching the updated TypeScript code)
    const prefix = (y % 2n === 0n) ? 42 : 43;
    console.log('Prefix:', prefix);
    
    // Convert x to little-endian bytes (32 bytes) - matching Python implementation
    function intToBytesLE(num, length) {
        const arr = new Uint8Array(length);
        for (let i = 0; i < length; i++) {
            arr[i] = Number((num >> BigInt(8 * i)) & 0xFFn);
        }
        return arr;
    }
    
    const xBytes = intToBytesLE(x, 32);
    const addressBytes = new Uint8Array(33);
    addressBytes[0] = prefix;
    addressBytes.set(xBytes, 1);
    
    console.log('Address bytes length:', addressBytes.length);
    console.log('First few bytes:', Array.from(addressBytes.slice(0, 10)));
    
    const generatedAddress = encode(addressBytes);
    console.log('Generated address:', generatedAddress);
    console.log('Addresses match:', generatedAddress === expectedAddress);
    console.log('Generated address starts with D:', generatedAddress.startsWith('D'));
    
    // Test a few more random keys to see the distribution
    console.log('\nTesting additional random keys:');
    for (let i = 0; i < 5; i++) {
        const randomKey = secp256k1.utils.randomPrivateKey();
        const randomPoint = secp256k1.ProjectivePoint.fromPrivateKey(randomKey);
        const randomPrefix = (randomPoint.y % 2n === 0n) ? 42 : 43;
        const randomXBytes = intToBytesLE(randomPoint.x, 32);
        const randomAddressBytes = new Uint8Array(33);
        randomAddressBytes[0] = randomPrefix;
        randomAddressBytes.set(randomXBytes, 1);
        const randomAddress = encode(randomAddressBytes);
        console.log(`Random address ${i + 1}:`, randomAddress, `(starts with ${randomAddress[0]})`);
    }
    
} catch (error) {
    console.error('Error:', error);
}
