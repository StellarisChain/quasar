// Test address format utilities
const { secp256k1 } = require('@noble/curves/secp256k1');
const { 
    detectAddressType, 
    isValidStellarisAddress, 
    isValidEthereumAddress,
    isValidAddress,
    generateEthereumAddress,
    generateStellarisAddress,
    generateAddresses,
    shortenAddress,
    formatAddressWithChecksum,
    getAddressInfo,
    AddressType
} = require('../build/chrome/background.bundle.js');

console.log('=== Testing Address Format Utilities ===\n');

// Test private key from existing test case
const privateKeyHex = 'be531298d55bba6639cbe813f9d7a82ff5467146c2d0154ca7150ad9d5042aa7';
const expectedStellarisAddress = 'DhKfZHgKbkWwLrARdY5PcREbjeQdp65CKMxijGnuZMC5g';

console.log('1. Testing with known test case:');
console.log('Private key:', privateKeyHex);
console.log('Expected Stellaris address:', expectedStellarisAddress);

try {
    // Generate public key point
    const privateKeyInt = BigInt('0x' + privateKeyHex);
    const point = secp256k1.ProjectivePoint.fromPrivateKey(privateKeyInt);
    
    // Generate both address formats
    const addresses = generateAddresses(point);
    console.log('\nGenerated addresses:');
    console.log('  Stellaris:', addresses.stellaris);
    console.log('  Ethereum:', addresses.ethereum);
    
    // Verify Stellaris address matches
    console.log('\nStellarisaddress matches expected:', addresses.stellaris === expectedStellarisAddress);
    
    // Test address detection
    console.log('\n2. Testing address type detection:');
    console.log('  Stellaris address type:', detectAddressType(addresses.stellaris));
    console.log('  Ethereum address type:', detectAddressType(addresses.ethereum));
    
    // Test address validation
    console.log('\n3. Testing address validation:');
    console.log('  Stellaris address is valid:', isValidStellarisAddress(addresses.stellaris));
    console.log('  Ethereum address is valid:', isValidEthereumAddress(addresses.ethereum));
    console.log('  Stellaris via isValidAddress:', isValidAddress(addresses.stellaris));
    console.log('  Ethereum via isValidAddress:', isValidAddress(addresses.ethereum));
    
    // Test invalid addresses
    console.log('\n4. Testing invalid addresses:');
    console.log('  Invalid Stellaris "ABC123":', isValidStellarisAddress('ABC123'));
    console.log('  Invalid Ethereum "0xINVALID":', isValidEthereumAddress('0xINVALID'));
    console.log('  Too short Ethereum "0x123":', isValidEthereumAddress('0x123'));
    
    // Test address shortening
    console.log('\n5. Testing address shortening:');
    console.log('  Stellaris shortened:', shortenAddress(addresses.stellaris, 6, 4));
    console.log('  Ethereum shortened:', shortenAddress(addresses.ethereum, 6, 4));
    
    // Test checksum formatting for Ethereum
    console.log('\n6. Testing Ethereum checksum (EIP-55):');
    const lowercaseEth = addresses.ethereum.toLowerCase();
    const checksummedEth = formatAddressWithChecksum(lowercaseEth);
    console.log('  Lowercase:', lowercaseEth);
    console.log('  Checksummed:', checksummedEth);
    
    // Test address info
    console.log('\n7. Testing getAddressInfo:');
    const stellarisInfo = getAddressInfo(addresses.stellaris);
    console.log('  Stellaris info:', stellarisInfo);
    const ethereumInfo = getAddressInfo(addresses.ethereum);
    console.log('  Ethereum info:', ethereumInfo);
    
    // Test with multiple random keys
    console.log('\n8. Testing with random keys:');
    for (let i = 0; i < 3; i++) {
        const randomKey = secp256k1.utils.randomPrivateKey();
        const randomPoint = secp256k1.ProjectivePoint.fromPrivateKey(randomKey);
        const randomAddresses = generateAddresses(randomPoint);
        
        console.log(`\n  Random key ${i + 1}:`);
        console.log(`    Stellaris: ${randomAddresses.stellaris} (starts with ${randomAddresses.stellaris[0]})`);
        console.log(`    Ethereum: ${randomAddresses.ethereum}`);
        console.log(`    Both valid: ${isValidAddress(randomAddresses.stellaris) && isValidAddress(randomAddresses.ethereum)}`);
    }
    
    console.log('\n✅ All tests completed successfully!');
    
} catch (error) {
    console.error('❌ Error during testing:', error);
    console.error(error.stack);
}
