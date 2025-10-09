# Wallet Filtering Feature

## Overview

The Quasar wallet API now supports advanced wallet filtering capabilities, allowing websites to request connections to specific types of wallets based on cryptographic curves, supported assets, chains, and minimum balance requirements.

## Feature Summary

### What's New

Websites can now filter which wallets appear in the connection dialog by specifying filter criteria when calling `window.quasar.connect()`. This is useful for:

- **DeFi applications** that only support specific tokens
- **NFT marketplaces** that require specific chains
- **High-security apps** that require specific cryptographic curves (e.g., P256)
- **Financial apps** that need wallets with minimum balances

### Filter Options

```typescript
interface WalletFilter {
    curves?: string[];      // Filter by cryptographic curves
    assets?: string[];      // Filter by asset symbols
    chains?: string[];      // Filter by chain names
    minBalance?: number;    // Minimum total balance in USD
}
```

### How It Works

1. **Website requests connection** with filter criteria
2. **Background script** passes filters to popup
3. **RequestDialog** filters available wallets
4. **User sees** only matching wallets
5. **Connection established** with selected wallet

### Filter Logic

- **AND logic between criteria**: Wallet must match ALL specified filters
- **OR logic within arrays**: Any match in an array is accepted
- **Case-insensitive**: Asset symbols and chain names are matched case-insensitively
- **Graceful fallback**: If no filters specified, all wallets are shown

## Implementation Details

### Files Modified

1. **`src/lib/browser/wallet-injection.ts`**
   - Added `WalletFilter` interface
   - Updated `QuasarConnectionParams` to include `filter` option
   - Maintained backward compatibility (string address still works)

2. **`src/pages/Popup/RequestDialog.tsx`**
   - Added `filterWallets()` function with comprehensive filtering logic
   - Updated wallet selection to use filtered wallet list
   - Added visual indicator showing active filters
   - Error handling for no matching wallets

3. **`docs/WALLET_API.md`**
   - Complete documentation with examples
   - Usage patterns for common scenarios
   - Parameter descriptions and behavior notes

4. **`tests/wallet-filter-test.html`**
   - Comprehensive test page
   - 8 pre-defined test cases
   - Custom filter builder
   - Visual results and debugging

### Background Script

No changes needed! The existing background script already passes `connectionParams` through correctly, so filters are automatically forwarded to the popup.

## Examples

### Example 1: DeFi App (Ethereum Only)

```javascript
await window.quasar.connect({
    filter: {
        chains: ['Ethereum'],
        assets: ['USDC', 'USDT', 'DAI']
    }
});
```

### Example 2: P256-Only Application

```javascript
await window.quasar.connect({
    filter: {
        curves: ['p256']
    }
});
```

### Example 3: High-Value Wallets

```javascript
await window.quasar.connect({
    filter: {
        minBalance: 1000
    }
});
```

### Example 4: Stellaris Ecosystem App

```javascript
await window.quasar.connect({
    filter: {
        assets: ['STRX', 'STE'],
        chains: ['Stellaris']
    }
});
```

### Example 5: Combined Requirements

```javascript
await window.quasar.connect({
    filter: {
        curves: ['p256'],
        chains: ['Ethereum', 'Stellaris'],
        minBalance: 100
    }
});
```

## Testing

### Test File: `wallet-filter-test.html`

Run the test page to verify filtering works correctly:

1. Load the extension in Chrome/Firefox
2. Open `tests/wallet-filter-test.html`
3. Test each pre-defined filter scenario
4. Use the custom filter builder for additional tests

### Pre-defined Tests

1. ✨ Basic Connection (no filter)
2. 🔐 P256 Curve Only
3. 🔑 Secp256k1 Curve Only
4. 💎 Ethereum Assets
5. ⭐ Stellaris Assets
6. ⛓️ Ethereum Chain
7. 💰 Minimum Balance ($100)
8. 🎯 Combined Filters

### Custom Filter Builder

The test page includes an interactive form to build and test custom filter combinations.

## Backward Compatibility

✅ **Fully backward compatible!**

- Old code: `await window.quasar.connect()` - still works
- Old code: `await window.quasar.connect('0x123...')` - still works
- New code: `await window.quasar.connect({ filter: {...} })` - new feature

## Error Handling

### No Matching Wallets

If no wallets match the filter criteria, the user sees:
- Error message: "No wallets match the requested filter criteria"
- Dialog shows the active filters for transparency
- Connection is rejected

### Specific Address + Filter

If both `address` and `filter` are specified:
- Wallet must match BOTH the address AND the filter
- Error if wallet doesn't match: "Wallet with address X is not loaded in the extension or does not match the requested filters"

## UI/UX Enhancements

### Filter Display

When filters are active, the connection dialog shows:
- "Select Wallet to Connect (Filtered):" header
- Info box displaying active filter criteria
- Only wallets matching ALL criteria

### Visual Feedback

- Filter criteria clearly displayed
- Selected wallet highlighted
- Wallet curve shown for each option
- Address preview for identification

## Performance Considerations

- Filtering is performed in-memory (fast)
- No additional API calls required
- Minimal overhead even with many wallets
- Scales well with large wallet lists

## Security Considerations

- Filters don't expose sensitive wallet data
- User always sees what filters are active
- User maintains full control over connection
- No automatic connections (still requires approval)

## Future Enhancements

Possible future additions:

1. **Token balance filters**: Filter by specific token balances
2. **Network filters**: Filter by specific networks (mainnet/testnet)
3. **Transaction history**: Filter by transaction count or activity
4. **NFT holdings**: Filter by NFT collections
5. **Complex logic**: Support for OR groups and nested conditions

## API Stability

This API is considered **stable** and follows semantic versioning:
- Major version changes for breaking changes
- Minor version changes for new features
- Patch version changes for bug fixes

## Support

For questions or issues:
- Check the documentation: `docs/WALLET_API.md`
- Test with: `tests/wallet-filter-test.html`
- Open an issue on GitHub

## Version

Feature added in: **v5.5.0** (pending release)
