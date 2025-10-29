# Dual Address Format Support

## Overview

Quasar now supports **dual address formats** for maximum compatibility across blockchain ecosystems:
- **Stellaris/Denaro Native Format**: Base58-encoded addresses with D/E prefix
- **Ethereum-Compatible Format**: Hex-encoded addresses with 0x prefix

This enables seamless interaction with both Stellaris-based chains and Ethereum-compatible networks using the same wallet keys.

## Address Formats

### Stellaris Native Format (D/E Prefix)

The Stellaris native format uses a custom compressed public key encoding:
- **Encoding**: Base58
- **Length**: 33 bytes (1 prefix byte + 32 x-coordinate bytes)
- **Prefix**: 
  - `42` (displays as 'D') for even y-coordinates
  - `43` (displays as 'E') for odd y-coordinates
- **Example**: `DhKfZHgKbkWwLrARdY5PcREbjeQdp65CKMxijGnuZMC5g`

This format is derived from the secp256k1 curve point using little-endian byte ordering for the x-coordinate, matching the Python stellaris-wallet implementation.

### Ethereum-Compatible Format (0x Prefix)

The Ethereum format follows the standard web3 address specification:
- **Encoding**: Hexadecimal
- **Length**: 20 bytes (40 hex characters)
- **Prefix**: `0x`
- **Derivation**: Last 20 bytes of Keccak-256 hash of uncompressed public key
- **Checksum**: EIP-55 mixed-case checksum encoding
- **Example**: `0x2A69659C089bc47444933286dE7e3d44A40451bC`

This format ensures compatibility with Ethereum, BSC, Polygon, and other EVM-compatible chains.

## Key Features

### 1. Address Generation

Both address formats are automatically generated from the same private key:

```typescript
import { generateAddresses } from './lib/address_format_utils';
import { secp256k1 } from '@noble/curves/secp256k1';

const privateKeyHex = 'your_private_key_hex';
const privateKeyInt = BigInt('0x' + privateKeyHex);
const point = secp256k1.ProjectivePoint.fromPrivateKey(privateKeyInt);

const addresses = generateAddresses(point);
console.log('Stellaris:', addresses.stellaris); // DhKf...MC5g
console.log('Ethereum:', addresses.ethereum);   // 0x2A69...51bC
```

### 2. Address Validation

Validate addresses in either format:

```typescript
import { 
    isValidStellarisAddress,
    isValidEthereumAddress,
    isValidAddress,
    detectAddressType,
    AddressType
} from './lib/address_format_utils';

// Validate specific formats
console.log(isValidStellarisAddress('DhKf...MC5g')); // true
console.log(isValidEthereumAddress('0x2A69...51bC')); // true

// Validate any format
console.log(isValidAddress('DhKf...MC5g')); // true
console.log(isValidAddress('0x2A69...51bC')); // true

// Detect format type
const type = detectAddressType('0x2A69...51bC');
console.log(type); // AddressType.ETHEREUM
```

### 3. Address Conversion

Convert between formats (requires the full public key point):

```typescript
import { getAddressInFormat, AddressType } from './lib/address_format_utils';

const stellarisAddress = getAddressInFormat(point, AddressType.STELLARIS);
const ethereumAddress = getAddressInFormat(point, AddressType.ETHEREUM);
```

### 4. Address Display Utilities

Format addresses for UI display:

```typescript
import { 
    shortenAddress,
    formatAddressWithChecksum,
    getAddressInfo
} from './lib/address_format_utils';

// Shorten for display
const stellarisAddr = 'DhKfZHgKbkWwLrARdY5PcREbjeQdp65CKMxijGnuZMC5g';
const ethereumAddr = '0x2A69659C089bc47444933286dE7e3d44A40451bC';

console.log(shortenAddress(stellarisAddr, 6, 4)); // DhKfZH...MC5g
console.log(shortenAddress(ethereumAddr, 6, 4));  // 0x2A69...51bC

// Apply EIP-55 checksum to Ethereum addresses
const lowercaseEth = '0x2a69659c089bc47444933286de7e3d44a40451bc';
const checksummed = formatAddressWithChecksum(lowercaseEth);
console.log(checksummed); // 0x2A69659C089bc47444933286dE7e3d44A40451bC

// Get complete address information
const fullEthAddr = '0x2A69659C089bc47444933286dE7e3d44A40451bC';
const info = getAddressInfo(fullEthAddr);
console.log(info); 
// {
//   type: AddressType.ETHEREUM,
//   isValid: true,
//   formatted: '0x2A69659C089bc47444933286dE7e3d44A40451bC'
// }
```

## Wallet Data Structure

The `Wallet` interface now includes both address formats:

```typescript
interface Wallet {
    id: string | number;
    name?: string;
    address: string;              // Default address (Stellaris for backward compatibility)
    address_ethereum?: string;    // Ethereum-compatible address (0x prefix)
    address_stellaris?: string;   // Stellaris native address (D/E prefix)
    public_key: string;
    private_key?: string;
    mnemonic?: string;
    curve?: string;
    // ... other fields
}
```

### Backward Compatibility

- The `address` field maintains Stellaris format by default for backward compatibility
- New fields `address_ethereum` and `address_stellaris` store format-specific addresses
- Existing wallets are automatically migrated when loaded

## User Interface

### Portfolio View

The Portfolio view displays the current address with a format toggle:

1. **Address Display**: Shows the selected format with shortened notation
2. **Format Toggle Button**: Click to switch between D/E (Stellaris) and 0x (Ethereum)
3. **Copy Address**: Click the address to copy the current format to clipboard
4. **Curve Indicator**: Shows which cryptographic curve is in use (secp256k1 or p256)

### Receive Modal

The Receive modal includes:

1. **Format Selection Buttons**: Choose between D/E and 0x formats
2. **QR Code**: Automatically updates to show the selected format
3. **Address Display**: Full address with copy functionality
4. **Visual Feedback**: Active format is highlighted in blue

## Migration

### Existing Wallets

Existing wallets are automatically migrated when loaded:

```typescript
function migrateWalletsToMultiFormat(wallets: Wallet[]): Wallet[] {
    return wallets.map(wallet => {
        // If wallet already has both formats, return as-is
        if (wallet.address_stellaris && wallet.address_ethereum) {
            return wallet;
        }

        // If public key is available, derive both formats
        if (wallet.public_key) {
            const addresses = generateAddresses(publicKeyPoint);
            return {
                ...wallet,
                address_stellaris: addresses.stellaris,
                address_ethereum: addresses.ethereum
            };
        }

        // Otherwise, detect format from existing address
        // ...
    });
}
```

Migration happens automatically in `getStoredWallets()` and is transparent to users.

## API Usage Examples

### Creating a New Wallet with Both Formats

```typescript
import { generate } from './lib/wallet_generation_utils';

const wallet = generate({
    mnemonicPhrase: 'your twelve word mnemonic phrase here...',
    curve: 'secp256k1'
});

console.log('Private Key:', wallet.private_key);
console.log('Public Key:', wallet.public_key);
console.log('Stellaris Address:', wallet.address_stellaris); // DhKf...
console.log('Ethereum Address:', wallet.address_ethereum);   // 0x2A69...
console.log('Default Address:', wallet.address);             // DhKf... (Stellaris)
```

### Importing a Wallet from Private Key

```typescript
import { generateFromPrivateKey } from './lib/wallet_generation_utils';

const walletData = generateFromPrivateKey(
    'be531298d55bba6639cbe813f9d7a82ff5467146c2d0154ca7150ad9d5042aa7',
    ['private_key', 'public_key', 'address'],
    'secp256k1'
);

console.log(walletData);
// {
//   private_key: 'be531298d55bba6639cbe813f9d7a82ff5467146c2d0154ca7150ad9d5042aa7',
//   public_key: '02...',
//   address: 'DhKfZHgKbkWwLrARdY5PcREbjeQdp65CKMxijGnuZMC5g',
//   address_stellaris: 'DhKfZHgKbkWwLrARdY5PcREbjeQdp65CKMxijGnuZMC5g',
//   address_ethereum: '0x2A69659C089bc47444933286dE7e3d44A40451bC',
//   curve: 'secp256k1'
// }
```

### Sending Transactions with Different Formats

Transactions can be sent using either address format depending on the target network:

```typescript
// For Stellaris-based chains, use Stellaris format
const stellarisAddress = wallet.address_stellaris;

// For Ethereum-compatible chains, use Ethereum format
const ethereumAddress = wallet.address_ethereum;

// The wallet client automatically handles the appropriate format
```

## Security Considerations

1. **Same Private Key**: Both addresses are derived from the same private key, so securing one secures both
2. **Format Detection**: Always validate and detect address format before processing
3. **Checksum Validation**: Ethereum addresses should use EIP-55 checksum validation
4. **Base58 Validation**: Stellaris addresses should validate proper base58 encoding

## Testing

Run the comprehensive test suite:

```bash
node tests/test_address_formats_direct.js
```

The test suite validates:
- Address generation from known test vectors
- Format detection for both Stellaris and Ethereum addresses
- Address validation (valid and invalid cases)
- Address shortening for UI display
- EIP-55 checksum formatting
- Random key generation and validation

## Implementation Files

- **Core Library**: `src/lib/address_format_utils.ts`
- **Wallet Generation**: `src/lib/wallet_generation_utils.ts`
- **Data Types**: `src/pages/Popup/DataTypes.ts`
- **Wallet Utilities**: `src/pages/Popup/WalletUtils.ts`
- **UI Components**: 
  - `src/pages/Popup/Portfolio.tsx`
  - `src/components/ReceiveModal.tsx`
- **Tests**: `tests/test_address_formats_direct.js`

## Future Enhancements

Potential future improvements:

1. **Additional Formats**: Support for other blockchain address formats (Solana, Cardano, etc.)
2. **Format Preferences**: User-configurable default format per network
3. **Address Book**: Store contacts with preferred format per entry
4. **Chain-Specific Display**: Automatically show appropriate format based on selected chain
5. **Multi-Format QR Codes**: QR codes that encode both formats

## Troubleshooting

### Address Format Not Showing

If a wallet doesn't show both formats:
1. Check that `public_key` is available in the wallet data
2. Verify the wallet has been loaded through `getStoredWallets()`
3. Check console for migration warnings

### Invalid Address Error

If you encounter invalid address errors:
1. Verify the address format matches the expected type
2. Use `detectAddressType()` to identify the format
3. Validate using `isValidAddress()` before processing

### Format Toggle Not Working

If the format toggle doesn't appear:
1. Ensure both `address_stellaris` and `address_ethereum` are present
2. Check that the wallet was created/imported after the dual format feature
3. Try re-importing the wallet to trigger migration

## References

- [EIP-55: Mixed-case checksum address encoding](https://eips.ethereum.org/EIPS/eip-55)
- [Base58 Encoding](https://en.bitcoin.it/wiki/Base58Check_encoding)
- [Keccak-256 Hash Function](https://keccak.team/keccak.html)
- [secp256k1 Elliptic Curve](https://en.bitcoin.it/wiki/Secp256k1)
- [Stellaris Blockchain Documentation](https://stellaris.dev)
