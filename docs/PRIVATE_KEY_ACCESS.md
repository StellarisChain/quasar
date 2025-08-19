# Quasar Private Key Access Feature

## Overview

The Quasar wallet now supports requesting private key access during connection. This is a **high-security feature** that should only be used when absolutely necessary and with trusted applications.

## API Changes

### Updated `connect()` Method

The `connect()` method now accepts a `QuasarConnectionParams` object:

```typescript
interface QuasarConnectionParams {
    address?: string;           // Connect to specific wallet address
    return_private_key?: boolean; // Request private key access
}

// New signature
async connect(params?: QuasarConnectionParams | string): Promise<WalletAccount[]>
```

### Backward Compatibility

The method maintains backward compatibility. You can still pass a string as the address:

```javascript
// Old way (still works)
await quasar.connect("0x1234567890abcdef...");

// New way
await quasar.connect({
    address: "0x1234567890abcdef...",
    return_private_key: false
});
```

## Usage Examples

### Basic Connection
```javascript
// Connect normally (no changes needed)
const accounts = await quasar.connect();
```

### Connect with Private Key Access
```javascript
// Request private key access
const result = await quasar.connect({
    return_private_key: true
});

// Private key will be included in the response
console.log('Private key:', result.privateKey);
```

### Connect to Specific Address with Private Key
```javascript
// Connect to specific wallet and request private key
const result = await quasar.connect({
    address: "0x1234567890abcdef...",
    return_private_key: true
});
```

## Security Features

When `return_private_key: true` is requested:

### 1. Security Warning Dialog
- A prominent warning is displayed to the user
- Clear indication of the security implications
- Visual emphasis on the risks

### 2. Confirmation Phrase Requirement
- User must type the exact phrase: **"I understand the security risks"**
- Prevents accidental approval
- Ensures user awareness of the implications

### 3. Visual Indicators
- Red color scheme for private key requests
- Warning icons and messages
- Disabled approve button until phrase is correctly entered

## Security Best Practices

### For Developers
1. **Only request private key access when absolutely necessary**
2. **Never store private keys in logs or persistent storage**
3. **Use private key access only for legitimate cryptographic operations**
4. **Implement proper key handling and memory cleanup**
5. **Test only with development/test wallets**

### For Users
1. **Only approve private key requests from trusted applications**
2. **Verify the website URL before entering the confirmation phrase**
3. **Never approve private key requests from unknown websites**
4. **Use separate test wallets for development**

## Response Format

When private key access is granted, the response includes additional fields:

```javascript
{
}
```

## Error Handling

```javascript

```

## Testing

Use the provided test page: `tests/private-key-test.html`

This page includes:
- Normal connection test
- Private key access test
- Multi-parameter connection test
- Security warning demonstrations

## Implementation Details

### Files Modified
- `src/lib/browser/wallet-injection.ts` - Updated connect method signature
- `src/pages/Background/index.js` - Enhanced connection parameter handling
- `src/pages/Popup/RequestDialog.tsx` - Added security warning UI and validation
- `src/pages/Popup/RequestDialog.css` - Styled security warning components
- `src/pages/Panel/Panel.tsx` - Updated dev tools to support new parameters

### Security Measures Implemented
1. **Phrase verification** - Exact match required for confirmation
2. **Visual warnings** - Red color scheme and warning icons
3. **Disabled controls** - Approval disabled until phrase is entered
4. **Clear messaging** - Explicit security warnings and implications
5. **Parameter validation** - Proper handling of connection parameters

## Migration Guide

### From v5.4.30 and earlier
```javascript
// Old code
const accounts = await quasar.connect();
const accountsWithAddress = await quasar.connect("0x123...");

// New code (backward compatible)
const accounts = await quasar.connect();
const accountsWithAddress = await quasar.connect("0x123...");

// Or use new parameter object
const accounts = await quasar.connect({});
const accountsWithAddress = await quasar.connect({
    address: "0x123..."
});

// New private key access
const result = await quasar.connect({
    return_private_key: true
});
```

No breaking changes - all existing code continues to work unchanged.
