# Connected Sites Management Feature

## Overview

The Quasar wallet extension now includes a comprehensive connected sites management system that allows users to view and manage which websites are connected to each wallet, along with the specific permissions granted to each site.

## Features

### 1. Per-Wallet Site Connections

The system now tracks site connections on a per-wallet basis, rather than globally. This means:
- Each wallet can have its own set of connected sites
- Sites can be connected to multiple wallets simultaneously
- Disconnecting a site from one wallet doesn't affect other wallets

### 2. Permission Tracking

When a site connects to a wallet, the system stores:
- **Origin**: The full origin URL (e.g., `https://example.com`)
- **Hostname**: The friendly hostname (e.g., `example.com`)
- **Wallet Address**: Which wallet was connected
- **Permissions**: What permissions were granted, including:
  - Private key access (if requested and granted)
  - Wallet filters (curve, assets, chains, minimum balance)
  - Specific address requests
- **Timestamps**: When the connection was created and last used

### 3. User Interface

#### Wallet Settings Integration

A new "Connected Sites" section appears in the wallet settings modal, displaying:

- **Site List**: All sites connected to the current wallet
- **Site Details**: For each connection:
  - Site icon and hostname
  - Full origin URL
  - Granted permissions summary
  - Connection timestamp
  - Last used timestamp
  - Disconnect button

#### Empty State

When no sites are connected, a friendly empty state is displayed with:
- Globe icon
- Message indicating no connections
- Information about when sites will appear

### 4. Disconnect Functionality

Users can disconnect individual sites from their wallets:
1. Click the "Disconnect" button next to any connected site
2. Confirm the disconnection in the dialog
3. The site is immediately removed from the wallet's connected sites
4. The site will need to request connection again to access the wallet

## Technical Implementation

### Data Structure

```typescript
interface SitePermissions {
  returnPrivateKey?: boolean;
  filter?: {
    curves?: string[];
    assets?: string[];
    chains?: string[];
    minBalance?: number;
  };
  specificAddress?: string;
}

interface SiteConnection {
  origin: string;
  hostname: string;
  walletAddress: string;
  permissions: SitePermissions;
  connectedAt: number;
  lastUsed: number;
}
```

### Storage

Site connections are stored in the browser extension's local storage:
- Key: `walletSiteConnections`
- Format: JSON-serialized nested object structure
- Structure: `{ [walletAddress]: { [origin]: SiteConnection } }`

### Background Script API

Three new message types are supported:

#### 1. GET_WALLET_SITE_CONNECTIONS
Get all site connections for a specific wallet.

```javascript
chrome.runtime.sendMessage({
  type: 'GET_WALLET_SITE_CONNECTIONS',
  walletAddress: '0x123...'
}, (response) => {
  if (response.success) {
    console.log('Connections:', response.connections);
  }
});
```

#### 2. REMOVE_WALLET_SITE_CONNECTION
Remove a specific site connection from a wallet.

```javascript
chrome.runtime.sendMessage({
  type: 'REMOVE_WALLET_SITE_CONNECTION',
  walletAddress: '0x123...',
  origin: 'https://example.com'
}, (response) => {
  if (response.success) {
    console.log('Disconnected successfully');
  }
});
```

#### 3. STORE_SITE_CONNECTION
Store a new site connection (called automatically on approval).

```javascript
chrome.runtime.sendMessage({
  type: 'STORE_SITE_CONNECTION',
  walletAddress: '0x123...',
  origin: 'https://example.com',
  hostname: 'example.com',
  permissions: {
    returnPrivateKey: false,
    filter: { curves: ['secp256k1'] }
  }
});
```

## Security Considerations

1. **Per-Wallet Isolation**: Each wallet maintains its own set of connected sites, preventing cross-wallet information leakage
2. **Permission Visibility**: Users can see exactly what permissions each site has been granted
3. **Easy Revocation**: Users can disconnect sites at any time without needing to navigate to the site
4. **Timestamp Tracking**: Users can see when sites last accessed their wallet
5. **Explicit Consent**: The system stores only what was explicitly granted during the connection process

## Usage Example

### As a User

1. **Open Wallet Settings**:
   - Click the settings icon next to your wallet name in the popup
   
2. **View Connected Sites**:
   - Scroll to the "Connected Sites" section
   - See all sites connected to this wallet
   
3. **Review Permissions**:
   - For each site, review:
     - What permissions were granted
     - When it was connected
     - When it was last used
   
4. **Disconnect a Site**:
   - Click "Disconnect" next to the site
   - Confirm the disconnection
   - The site is immediately disconnected

### As a Developer

When your dApp connects to a Quasar wallet, the connection and permissions are automatically tracked:

```javascript
// Request connection with filters
const accounts = await window.quasar.connect({
  filter: {
    curves: ['secp256k1'],
    assets: ['ETH', 'BTC']
  }
});

// The connection is now stored with these permissions
// Users can view and manage it in their wallet settings
```

## Future Enhancements

Potential future improvements include:
- Permission editing (allow users to modify permissions without reconnecting)
- Connection notifications (notify users when sites access their wallet)
- Connection expiry (auto-disconnect sites after a period of inactivity)
- Bulk operations (disconnect multiple sites at once)
- Connection history (track all past connections, not just active ones)
- Export/import connection settings

## Compatibility

This feature is:
- ✅ Compatible with existing connected sites (backward compatible)
- ✅ Compatible with all browsers (Chrome, Firefox)
- ✅ Compatible with all wallet types (secp256k1, P256, Ed25519)
- ✅ Compatible with existing dApps (no dApp changes required)

## Testing

To test the feature:

1. Build the extension: `pnpm esbuild:chrome`
2. Load the extension in Chrome
3. Create or import a wallet
4. Visit a test page (e.g., `tests/connect-with-address-test.html`)
5. Connect the wallet to the test page
6. Open wallet settings
7. Verify the connection appears in "Connected Sites"
8. Test disconnecting the site
9. Verify the connection is removed

## Files Modified

- `/workspaces/quasar/src/pages/Popup/DataTypes.ts` - Added `SiteConnection` and `SitePermissions` types
- `/workspaces/quasar/src/pages/Background/index.js` - Added per-wallet connection tracking
- `/workspaces/quasar/src/components/ConnectedSites.tsx` - New component for UI
- `/workspaces/quasar/src/components/WalletSettings.tsx` - Integrated ConnectedSites component
- `/workspaces/quasar/src/components/Icons.tsx` - Added new icons (GlobeIcon, ShieldIcon, ClockIcon, TrashIcon)
- `/workspaces/quasar/src/pages/Popup/RequestDialog.tsx` - Modified to include wallet address in approval
