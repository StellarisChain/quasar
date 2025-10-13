# Symbol Alias Feature

## Overview
This document describes the implementation of the symbol alias feature, which allows tokens to have multiple symbol representations (e.g., `STR/STE` for Stellaris) while displaying only the primary symbol in the UI.

## Problem Statement
The Stellaris token in `tokens.xml` has the symbol `STR/STE`, where:
- `STR` is the primary/canonical symbol
- `STE` is an alternative/legacy symbol for the same token

The requirement was to:
1. Display only `STR` in the GUI
2. Store `STR` in wallet data structures
3. Allow transactions using either `STR` or `STE` to work correctly
4. Maintain backward compatibility with existing code

## Solution

### 1. Helper Functions in `token_loader.ts`

Three new utility functions were added:

#### `getPrimarySymbol(symbol: string): string`
Extracts the first (primary) symbol from a slash-separated symbol string.
```typescript
getPrimarySymbol("STR/STE") // Returns "STR"
getPrimarySymbol("HAL")     // Returns "HAL"
```

#### `getSymbolAliases(symbol: string): string[]`
Returns all symbol aliases as an array.
```typescript
getSymbolAliases("STR/STE") // Returns ["STR", "STE"]
getSymbolAliases("HAL")     // Returns ["HAL"]
```

#### `matchesSymbol(symbolToCheck: string, fullSymbol: string): boolean`
Checks if a symbol matches any alias in the full symbol string (case-insensitive).
```typescript
matchesSymbol("STR", "STR/STE") // Returns true
matchesSymbol("STE", "STR/STE") // Returns true
matchesSymbol("HAL", "STR/STE") // Returns false
```

### 2. Updated Components

#### `tokens.xml`
The XML file keeps the full symbol with aliases:
```xml
<Symbol>STR/STE</Symbol>
```

#### `Portfolio.tsx`
- Imports `getPrimarySymbol` and `matchesSymbol`
- Uses `getPrimarySymbol()` when saving tokens to wallet (line 101)
- Uses `matchesSymbol()` when looking up token data (lines 181, 218)

#### `WalletOperations.ts`
- Uses `matchesSymbol()` when finding node URL for transactions (line 36)
- This allows both "STR" and "STE" to find the correct node for transactions

#### `ManageAssets.tsx`
- Uses `getPrimarySymbol()` for displaying symbols in the UI (lines 204, 205, 206, 212)
- Uses `matchesSymbol()` for pre-selecting tokens that match wallet chains (line 107)

#### `SendModal.tsx`
- Uses `matchesSymbol()` for filtering compatible assets (line 67)
- Uses `matchesSymbol()` when finding node URL for transactions (line 220)
- This ensures both asset compatibility check and transaction creation work with aliases

#### `wallet_asset_manager.ts`
- Updated `isAssetCompatible()` to use `matchesSymbol()` (line 125)
- Updated `getCompatibleAsset()` to use `matchesSymbol()` (line 133)
- This ensures asset compatibility checks work with either alias

#### `RequestDialog.tsx`
- Converted `filterWallets` to async `filterWalletsAsync` function
- Loads token data from XML when filtering by assets
- Uses `matchesSymbol()` to check if requested and wallet symbols are aliases of the same token
- Example: Request with asset filter "STE" will match wallets containing "STR" (both are aliases in "STR/STE")
- Handles both direct matches and alias matches through token lookup

### 3. Fallback Data Updates
Updated fallback token data in:
- `token_loader.ts` - Changed `Symbol: 'STE'` to `Symbol: 'STR'`
- `wallet_asset_manager.ts` - Changed fallback symbol to `'STR'`
- `WalletUtils.ts` - Updated demo wallet symbol
- `Newtab.jsx` - Updated demo data symbol

### 4. Test/Demo Code Updates
Updated test files to use `STR` consistently:
- `Panel.tsx` - Updated all test transaction examples
- `curve_wallet_examples.ts` - Updated compatibility check examples

## Usage Examples

### For End Users
1. When adding Stellaris to a wallet, only "STR" is displayed
2. Transactions can be sent using the "STR" symbol
3. Existing wallets with "STE" continue to work

### For Developers

#### Displaying a symbol:
```typescript
import { getPrimarySymbol } from '../lib/token_loader';

const displaySymbol = getPrimarySymbol(token.Symbol); // "STR"
```

#### Matching symbols for transactions:
```typescript
import { matchesSymbol } from '../lib/token_loader';

// Find token by symbol (handles aliases)
const tokenData = tokens.find(token => matchesSymbol('STE', token.Symbol));
// This will find the token with Symbol "STR/STE"
```

#### Checking compatibility:
```typescript
// Both of these work:
await WalletAssetManager.isAssetCompatible(wallet, 'STR'); // true
await WalletAssetManager.isAssetCompatible(wallet, 'STE'); // true
```

## Backward Compatibility

- Existing wallets with chains using "STE" will continue to work
- The `matchesSymbol()` function ensures both "STR" and "STE" are recognized
- No migration of existing wallet data is required

## Testing

To verify the feature works:
1. Add Stellaris token to a wallet - should show as "STR"
2. Send a transaction using "STR" - should work
3. Send a transaction using "STE" - should also work (via matchesSymbol)
4. Check wallet balance display - should show "STR"

## Future Enhancements

To add more symbol aliases in the future:
1. Update `tokens.xml` with format: `<Symbol>PRIMARY/ALIAS1/ALIAS2</Symbol>`
2. The existing helper functions will automatically handle any number of aliases
3. Only the primary (first) symbol will be displayed in the UI
