/**
 * Test file for curve detection utilities
 * This file demonstrates the automatic curve detection functionality
 */

import {
    detectCurveFromPrivateKey,
    detectCurveFromPublicKey,
    detectCurveFromAddress,
    detectCurveFromWalletData
} from '../src/lib/curve_detection_utils';

// Test data
const testData = {
    secp256k1: {
        privateKey: 'be531298d55bba6639cbe813f9d7a82ff5467146c2d0154ca7150ad9d5042aa7',
        publicKey: '02a1b2c3d4e5f6789abcdef0123456789abcdef0123456789abcdef0123456789a',
        address: 'DhKfZHgKbkWwLrARdY5PcREbjeQdp65CKMxijGnuZMC5g'
    },
    p256: {
        privateKey: '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        publicKey: '03b2c3d4e5f6789abcdef0123456789abcdef0123456789abcdef0123456789abc',
        address: 'FhKfZHgKbkWwLrARdY5PcREbjeQdp65CKMxijGnuZMC5g'
    }
};

console.log('=== Curve Detection Tests ===');

// Test 1: Private key detection
console.log('\n1. Testing private key detection:');
const secp256k1Detection = detectCurveFromPrivateKey(testData.secp256k1.privateKey);
console.log(`secp256k1 private key -> ${secp256k1Detection.curve} (${Math.round(secp256k1Detection.confidence * 100)}% confidence, method: ${secp256k1Detection.method})`);

// Test 2: Public key detection
console.log('\n2. Testing public key detection:');
const publicKeyDetection = detectCurveFromPublicKey(testData.secp256k1.publicKey);
console.log(`Compressed public key -> ${publicKeyDetection.curve} (${Math.round(publicKeyDetection.confidence * 100)}% confidence, method: ${publicKeyDetection.method})`);

// Test 3: Address detection
console.log('\n3. Testing address detection:');
const addressDetection = detectCurveFromAddress(testData.secp256k1.address);
console.log(`Stellaris address -> ${addressDetection.curve} (${Math.round(addressDetection.confidence * 100)}% confidence, method: ${addressDetection.method})`);

// Test 4: Comprehensive wallet data detection
console.log('\n4. Testing comprehensive wallet data detection:');
const walletDetection = detectCurveFromWalletData({
    private_key: testData.secp256k1.privateKey,
    public_key: testData.secp256k1.publicKey,
    address: testData.secp256k1.address
});
console.log(`Complete wallet data -> ${walletDetection.curve} (${Math.round(walletDetection.confidence * 100)}% confidence, method: ${walletDetection.method})`);

// Test 5: Minimal data detection
console.log('\n5. Testing with minimal data:');
const minimalDetection = detectCurveFromWalletData({
    address: testData.secp256k1.address
});
console.log(`Address only -> ${minimalDetection.curve} (${Math.round(minimalDetection.confidence * 100)}% confidence, method: ${minimalDetection.method})`);

// Test 6: No data detection (fallback)
console.log('\n6. Testing with no data (fallback):');
const fallbackDetection = detectCurveFromWalletData({});
console.log(`No data -> ${fallbackDetection.curve} (${Math.round(fallbackDetection.confidence * 100)}% confidence, method: ${fallbackDetection.method})`);

console.log('\n=== Test Complete ===');

export { testData };
