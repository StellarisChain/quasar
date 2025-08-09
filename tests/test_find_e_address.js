// Test to find an address that starts with E (odd y-coordinate)
const { secp256k1 } = require('@noble/curves/secp256k1');
const bs58 = require('bs58');

const encode = bs58.encode || bs58.default?.encode || bs58;

function intToBytesLE(num, length) {
    const arr = new Uint8Array(length);
    for (let i = 0; i < length; i++) {
        arr[i] = Number((num >> BigInt(8 * i)) & 0xFFn);
    }
    return arr;
}

console.log('Testing to find addresses that start with E (odd y-coordinates)...');

let foundE = false;
let attempts = 0;

while (!foundE && attempts < 100) {
    attempts++;
    const randomKey = secp256k1.utils.randomPrivateKey();
    const randomPoint = secp256k1.ProjectivePoint.fromPrivateKey(randomKey);
    const yIsEven = randomPoint.y % 2n === 0n;
    const prefix = yIsEven ? 42 : 43;
    
    const xBytes = intToBytesLE(randomPoint.x, 32);
    const addressBytes = new Uint8Array(33);
    addressBytes[0] = prefix;
    addressBytes.set(xBytes, 1);
    const address = encode(addressBytes);
    
    if (address.startsWith('E')) {
        console.log(`Found E address after ${attempts} attempts:`);
        console.log('Address:', address);
        console.log('Y is even:', yIsEven);
        console.log('Prefix:', prefix);
        foundE = true;
    } else if (attempts % 10 === 0) {
        console.log(`Attempt ${attempts}: ${address} (starts with ${address[0]}, y even: ${yIsEven}, prefix: ${prefix})`);
    }
}

if (!foundE) {
    console.log('Could not find an E address in 100 attempts. All generated addresses start with D.');
}
