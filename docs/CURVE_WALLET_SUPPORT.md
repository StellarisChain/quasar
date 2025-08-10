# Multi-Curve Wallet Support

This implementation adds support for multiple cryptographic curves in wallet generation, allowing users to create wallets that are compatible with different blockchain networks based on their cryptographic requirements.

## Features

### 1. Curve-Based Wallet Generation
- **secp256k1**: Standard Bitcoin/Ethereum curve, widely supported
- **P-256 (NIST P-256)**: Used by specialized networks like Classic Stellaris and Denaro

### 2. Asset Filtering by Curve Compatibility
- Automatically filters available assets based on wallet's curve
- Prevents incompatible asset transactions
- Clear visual indicators for supported assets

### 3. Enhanced User Experience
- Curve selection during wallet creation
- Real-time asset compatibility display
- Compatible asset count indicators

## Implementation Details

### Core Components

1. **Wallet Generation Utils** (`src/lib/wallet_generation_utils.ts`)
   - Extended `generate()` function with curve parameter
   - Support for multiple cryptographic curves
   - Backward compatibility maintained

2. **Token Loader** (`src/lib/token_loader.ts`)
   - Parses tokens.xml with curve information
   - Provides filtering functions by curve type
   - Caches token data for performance

3. **Wallet Asset Manager** (`src/lib/wallet_asset_manager.ts`)
   - Manages asset compatibility checking
   - Provides React hooks for asset filtering
   - Caches token data for performance

4. **UI Components**
   - **CurveSelector**: Allows users to choose cryptographic curve
   - **CompatibleAssetsDisplay**: Shows assets compatible with selected curve

### Token Configuration

Assets are defined in `src/assets/static/tokens.xml` with curve support:

```xml
<Token>
    <Name>Halogen</Name>
    <Symbol>HAL</Symbol>
    <Color>#ff4545ff</Color>
    <Node>https://halogen-node.connor33341.dev</Node>
    <TokenSupport>true</TokenSupport>
    <Curve>secp256k1</Curve>
</Token>
```

### Usage Examples

#### Creating a Wallet with Specific Curve

```typescript
import { generate } from '../lib/wallet_generation_utils';

// Create secp256k1 wallet
const wallet = generate({
  curve: 'secp256k1',
  deterministic: false,
  fields: ['mnemonic', 'id', 'private_key', 'public_key', 'address'],
  walletVersion: '0.2.3'
});
```

#### Checking Asset Compatibility

```typescript
import { WalletAssetManager } from '../lib/wallet_asset_manager';

// Check if wallet can transact with HAL token
const canUseHAL = await WalletAssetManager.isAssetCompatible(wallet, 'HAL');
```

#### Getting Compatible Assets

```typescript
// Get all assets compatible with the wallet
const result = await WalletAssetManager.getCompatibleAssets(wallet);
console.log(`${result.compatibleCount} compatible assets found`);
```

## Asset Compatibility Matrix

| Asset | Symbol | Curve | Compatible Wallets |
|-------|--------|-------|-------------------|
| Halogen | HAL | secp256k1 | secp256k1 wallets |
| Stellaris | STE | secp256k1 | secp256k1 wallets |
| Classic Stellaris | cSTE | p256 | P-256 wallets |
| Denaro | DNR | p256 | P-256 wallets |

## Wallet Creation Flow

1. **Curve Selection**: User chooses cryptographic curve
2. **Asset Preview**: Display compatible assets for selected curve
3. **Seed Generation**: Generate mnemonic with selected curve
4. **Wallet Creation**: Create wallet with curve-specific keys

## Benefits

### For Users
- **Clarity**: Clear understanding of which assets work with their wallet
- **Security**: Proper cryptographic curve selection for intended use
- **Flexibility**: Support for multiple blockchain networks

### For Developers
- **Type Safety**: Full TypeScript support for curve types
- **Extensibility**: Easy to add new curves and assets
- **Performance**: Efficient asset filtering with caching

## Troubleshooting

### Token Loading Issues

If you see errors like "NetworkError when attempting to fetch resource" for tokens.xml:

1. **Check Manifest**: Ensure tokens.xml is listed in `web_accessible_resources`
2. **Correct Paths**: The extension uses `chrome.runtime.getURL()` for proper asset paths
3. **Fallback Data**: The system provides fallback token data if loading fails
4. **Debug Test**: Use the test function in browser console: `window.testTokenLoading()`

### Browser Extension Context

The token loader automatically detects browser extension context and uses proper APIs:
- Chrome: `chrome.runtime.getURL()`
- Firefox: `browser.runtime.getURL()`
- Fallback: Direct fetch for development/testing

## Migration Notes

- Existing wallets default to `secp256k1` curve for backward compatibility
- All existing functionality continues to work without changes
- New curve parameter is optional in all generation functions

## Future Enhancements

1. **Dynamic Curve Detection**: Auto-detect curve from private key import
2. **Multi-Curve Wallets**: Support wallets with multiple curve types
3. **Curve-Specific Optimizations**: Performance optimizations per curve
4. **Extended Curve Support**: Additional curves like Ed25519

## Testing

The implementation includes comprehensive examples in `src/examples/curve_wallet_examples.ts` demonstrating all major features and use cases.
