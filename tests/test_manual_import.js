/**
 * Test script for manual import functionality
 * Run this with: node test_manual_import.js
 */

// Import the necessary utilities
import { generate, generateFromPrivateKey, isValidMnemonic } from '../src/lib/wallet_generation_utils.js';

// Test data
const testMnemonic = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';
const testPrivateKey = 'be531298d55bba6639cbe813f9d7a82ff5467146c2d0154ca7150ad9d5042aa7';

console.log('=== Manual Import Test ===');

// Test 1: Validate mnemonic
console.log('\n1. Testing mnemonic validation:');
console.log(`Valid mnemonic: ${isValidMnemonic(testMnemonic)}`);
console.log(`Invalid mnemonic: ${isValidMnemonic('invalid words here')}`);

// Test 2: Generate wallet from mnemonic
console.log('\n2. Testing wallet generation from mnemonic:');
try {
    const walletFromMnemonic = generate({
        mnemonicPhrase: testMnemonic,
        curve: 'secp256k1',
        deterministic: false,
        fields: ['mnemonic', 'id', 'private_key', 'public_key', 'address'],
        walletVersion: '0.2.3'
    });
    console.log('✅ Mnemonic import successful');
    console.log(`Address: ${walletFromMnemonic.address}`);
    console.log(`Curve: ${walletFromMnemonic.curve}`);
} catch (error) {
    console.log('❌ Mnemonic import failed:', error.message);
}

// Test 3: Generate wallet from private key
console.log('\n3. Testing wallet generation from private key:');
try {
    const walletFromPrivateKey = generateFromPrivateKey(
        testPrivateKey,
        ['private_key', 'public_key', 'address'],
        'secp256k1'
    );
    console.log('✅ Private key import successful');
    console.log(`Address: ${walletFromPrivateKey.address}`);
    console.log(`Curve: ${walletFromPrivateKey.curve}`);
} catch (error) {
    console.log('❌ Private key import failed:', error.message);
}

// Test 4: Test different curves
console.log('\n4. Testing different curves:');
try {
    const p256Wallet = generateFromPrivateKey(
        testPrivateKey,
        ['private_key', 'public_key', 'address'],
        'p256'
    );
    console.log('✅ P-256 curve import successful');
    console.log(`Address: ${p256Wallet.address}`);
    console.log(`Curve: ${p256Wallet.curve}`);
} catch (error) {
    console.log('❌ P-256 curve import failed:', error.message);
}

console.log('\n=== Test Complete ===');
