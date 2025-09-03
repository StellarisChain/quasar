# Quasar Wallet API Integration

This document describes the Quasar wallet API that gets injected into web pages, allowing websites to interact with the user's wallet through a secure interface.

## Overview

The Quasar extension injects a `window.quasar` object into web pages that provides a standardized wallet API. This allows web applications to:

- Connect to the user's wallet
- Request transaction approvals
- Sign messages
- View account balances and assets
- Switch between different chains

## API Reference

### Basic Connection

```javascript
// Check if wallet is available
if (window.quasar) {
    console.log('Quasar wallet detected!');
}

// Wait for wallet to be ready
window.addEventListener('quasar:ready', (event) => {
    const wallet = event.detail.wallet;
    console.log('Wallet ready:', wallet);
});
```

### Connection Management

#### `connect(address?: string): Promise<WalletAccount[]>`

Requests connection to the user's wallet. Shows a connection approval modal.

```javascript
// Connect to any available wallet
try {
    const accounts = await window.quasar.connect();
    console.log('Connected accounts:', accounts);
} catch (error) {
    console.error('Connection failed:', error);
}

// Connect to a specific wallet address
try {
    const accounts = await window.quasar.connect('0x1234567890abcdef...');
    console.log('Connected to specific wallet:', accounts);
} catch (error) {
    console.error('Connection to specific wallet failed:', error);
    // Error will be thrown if wallet with the address is not loaded in extension
}
```

**Parameters:**
- `address` (optional): Specific wallet address to connect to. If provided, only that wallet will be shown in the connection dialog. If the wallet is not loaded in the extension, an error will be shown.

#### `disconnect(): Promise<void>`

Disconnects the current session.

```javascript
await window.quasar.disconnect();
```

#### `getAccounts(): Promise<WalletAccount[]>`

Gets currently connected accounts.

```javascript
const accounts = await window.quasar.getAccounts();
```

### Asset Management

#### `getAssets(address?: string): Promise<Asset[]>`

Retrieves assets for the connected wallet or specific address.

```javascript
const assets = await window.quasar.getAssets();
console.log('Available assets:', assets);
```

### Transactions

#### `sendTransaction(request: TransactionRequest): Promise<TransactionResponse>`

Requests a transaction to be sent. Shows a transaction approval modal.

```javascript
const txRequest = {
    to: '0xRecipientAddress',
    amount: '1.5',
    asset: 'STE',
    memo: 'Payment for services',
    chain: 'Stellaris' // optional
};

try {
    const result = await window.quasar.sendTransaction(txRequest);
    console.log('Transaction sent:', result.txHash);
} catch (error) {
    console.error('Transaction failed:', error);
}
```

### Message Signing

#### `signMessage(message: string, address?: string): Promise<string>`

Requests the user to sign a message.

```javascript
const message = 'Please sign this message to verify your identity';
try {
    const signature = await window.quasar.signMessage(message);
    console.log('Message signed:', signature);
} catch (error) {
    console.error('Signing failed:', error);
}
```

### Chain Management

#### `switchChain(chainId: string): Promise<void>`

Requests to switch to a different blockchain.

```javascript
await window.quasar.switchChain('stellaris');
```

#### `addChain(chainConfig: any): Promise<void>`

Requests to add a new chain configuration.

```javascript
const chainConfig = {
    chainId: 'custom-chain',
    chainName: 'Custom Blockchain',
    rpcUrl: 'https://custom-node.example.com',
    nativeCurrency: {
        name: 'Custom Token',
        symbol: 'CUSTOM',
        decimals: 18
    }
};

await window.quasar.addChain(chainConfig);
```

### Events

#### Connection Events

```javascript
// Account changed
window.quasar.on('accountsChanged', (accounts) => {
    console.log('Accounts changed:', accounts);
});

// Chain changed
window.quasar.on('chainChanged', (chainId) => {
    console.log('Chain changed:', chainId);
});

// Connected
window.quasar.on('connect', () => {
    console.log('Wallet connected');
});

// Disconnected
window.quasar.on('disconnect', () => {
    console.log('Wallet disconnected');
});
```

### Properties

#### `connected: boolean`

Returns whether the wallet is currently connected.

```javascript
if (window.quasar.connected) {
    console.log('Wallet is connected');
}
```

#### `address: string | null`

Returns the current account address.

```javascript
console.log('Current address:', window.quasar.address);
```

#### `chainId: string | null`

Returns the current chain ID.

```javascript
console.log('Current chain:', window.quasar.chainId);
```

## Type Definitions

```typescript
interface WalletAccount {
    address: string;
    publicKey: string;
    curve: string;
}

interface Asset {
    symbol: string;
    name: string;
    balance: string;
    chain: string;
    curve: string;
}

interface TransactionRequest {
    to: string;
    amount: string;
    asset: string;
    memo?: string;
    chain?: string;
}

interface TransactionResponse {
    success: boolean;
    txHash?: string;
    error?: string;
}
```

## User Interface

When a website requests wallet interactions, Quasar shows modal dialogs to the user:

### Connection Modal
- Shows the requesting website
- Lists permissions being requested
- Allows user to approve or reject

### Transaction Modal
- Shows transaction details (recipient, amount, asset)
- Displays any memo/message
- Shows estimated fees
- Allows user to approve or reject

### Message Signing Modal
- Shows the message to be signed
- Displays the requesting website
- Allows user to approve or reject

## Security Features

- **Origin Validation**: All requests are validated against the requesting origin
- **User Approval**: All sensitive operations require explicit user approval
- **Session Management**: Connections are managed per-origin and can be revoked
- **Secure Communication**: All communication between page and extension is encrypted

## Development Tools

### DevTools Panel

The Quasar extension includes a DevTools panel for developers:

1. Open browser DevTools (F12)
2. Navigate to the "Quasar Devtools" tab
3. Use the test buttons to interact with the wallet API
4. View test results and debug information

### Test Page

A comprehensive test page is available at `test-page.html` which demonstrates all wallet API features:

- Connection management
- Asset retrieval
- Transaction sending
- Message signing
- Batch operations

### Test Interface Injection

The DevTools panel can inject a test interface directly into any webpage:

1. Open DevTools → Quasar tab
2. Click "Inject Test Interface"
3. A floating test panel appears on the page
4. Use the buttons to test wallet functionality

## Best Practices

### Error Handling

Always wrap wallet calls in try-catch blocks:

```javascript
try {
    const result = await window.quasar.sendTransaction(txRequest);
    // Handle success
} catch (error) {
    if (error.message === 'User rejected') {
        // Handle user rejection
    } else {
        // Handle other errors
    }
}
```

### Connection State

Check connection status before making requests:

```javascript
if (!window.quasar.connected) {
    await window.quasar.connect();
}
```

### Event Cleanup

Remove event listeners when no longer needed:

```javascript
const handleAccountChange = (accounts) => {
    // Handle account change
};

// Add listener
window.quasar.on('accountsChanged', handleAccountChange);

// Remove listener when done
window.quasar.off('accountsChanged');
```

## Browser Compatibility

- Chrome 88+
- Firefox 78+
- Edge 88+
- Safari 14+ (partial support)

## Examples

See the `test-page.html` file for comprehensive examples of all API features.

## Support

For technical support or questions about the Quasar wallet API, please:

1. Check the browser console for error messages
2. Use the DevTools panel for debugging
3. Refer to this documentation
4. File issues on the project repository
