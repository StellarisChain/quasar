# Request Dialog Implementation

## Overview

The popup now properly handles request data from the background script through a comprehensive dialog system. This enables the wallet to show appropriate prompts for connection requests, transaction signing, and message signing.

## Components Added

### 1. RequestDialog.tsx
A modal dialog component that handles different types of wallet requests:
- **CONNECT**: Shows site connection requests and prompts user approval
- **TRANSACTION**: Displays transaction details and allows user to approve/reject
- **SIGN_MESSAGE**: Shows message signing requests

### 2. RequestDialog.css
Styling for the request dialog with:
- Modern dark theme design
- Loading states and error handling
- Responsive layout
- Smooth animations

### 3. WalletOperations.ts
Utility class for wallet operations using the existing cryptographic library:
- **Transaction signing**: Uses `createTransaction` from `wallet_client.ts` 
- **Message signing**: Uses noble-curves cryptographic functions for ECDSA signing
- **Account retrieval**: Properly formats wallet account data
- **Real cryptographic operations**: No stubs - uses the same crypto functions as the rest of the app

## How It Works

### 1. Request Flow
1. Website calls `window.quasar.connect()` or similar API
2. Content script forwards request to background script
3. Background script stores request data and opens popup with request ID
4. Popup extracts request ID from URL parameters
5. Popup fetches full request data from background script
6. RequestDialog displays appropriate UI based on request type
7. User approves/rejects and response is sent back to background script
8. Background script resolves the promise to the website

### 2. URL Parameter Structure
The popup receives requests via URL parameters:
```
popup.html?request=ABC123DEF
```

### 3. Request Data Structure
```typescript
interface RequestData {
  type: 'CONNECT' | 'TRANSACTION' | 'SIGN_MESSAGE';
  origin: string;
  hostname: string;
  title: string;
  message: string;
  request?: any; // Additional data for transactions/messages
}
```

## Features

### User Experience
- ✅ Clear site identification with favicon and hostname
- ✅ Detailed request information display
- ✅ Intuitive approve/reject buttons
- ✅ Loading states during processing
- ✅ Error handling with user-friendly messages
- ✅ Wallet creation flow for new users

### Security
- ✅ Request validation and timeout handling
- ✅ Clear visual indication of requesting site
- ✅ Detailed transaction information display
- ✅ Secure wallet operation handling

### Developer Experience
- ✅ Type-safe interfaces
- ✅ Extensible architecture
- ✅ Clean separation of concerns
- ✅ Comprehensive error handling

## Usage

### For Users
1. When a website requests wallet access, a popup will appear
2. Review the requesting site and operation details
3. Click "Approve" to grant access or "Reject" to deny
4. For new users, create a wallet when prompted

### For Developers
The request dialog automatically handles all wallet operations. To extend:

1. Add new request types to `RequestData` interface
2. Implement handling in `RequestDialog.handleApprove()`
3. Add corresponding wallet operation in `WalletOperations.ts`
4. Update UI rendering for new request types

## Integration Points

### Background Script
- Stores pending requests in `pendingRequests` Map
- Provides `GET_PENDING_REQUEST` message handler
- Handles `RESOLVE_REQUEST` and `REJECT_REQUEST` responses

### Popup Component
- Detects request ID from URL parameters
- Shows RequestDialog when request is present
- Manages wallet creation flow for new users
- Passes selected wallet data to RequestDialog

### Wallet Operations
- Provides abstracted wallet functionality using existing crypto library
- Handles actual cryptographic operations with noble-curves and existing transaction system
- Supports secp256k1 and p256 curves 
- Integrates with existing Stellaris network infrastructure
- Type-safe operation interfaces

## Error Handling

The system includes comprehensive error handling:
- Network timeouts
- Invalid request data
- Missing wallet scenarios
- Cryptographic operation failures
- User cancellation flows

All errors are displayed to the user with clear, actionable messages.
