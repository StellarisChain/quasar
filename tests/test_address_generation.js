// Test script to compare address generation
const { generateFromPrivateKey } = require('../src/lib/wallet_generation_utils.ts');

// Private key from the test.json file
const privateKey = 'be531298d55bba6639cbe813f9d7a82ff5467146c2d0154ca7150ad9d5042aa7';

// Expected address from Python stellaris-wallet
const expectedAddress = 'DhKfZHgKbkWwLrARdY5PcREbjeQdp65CKMxijGnuZMC5g';

console.log('Testing address generation with private key:', privateKey);
console.log('Expected address (Python):', expectedAddress);

try {
    const result = generateFromPrivateKey(privateKey);
    console.log('Generated address (TypeScript):', result.address);
    console.log('Addresses match:', result.address === expectedAddress);
} catch (error) {
    console.error('Error generating address:', error);
}
