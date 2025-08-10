# Wallet Password Protection System

This implementation adds password-based security to the Quasar wallet extension, similar to the stellaris-wallet system but optimized for the browser environment.

## Features

### 🔐 Password Protection
- **AES-GCM Encryption**: Uses Web Crypto API for strong encryption
- **PBKDF2 Key Derivation**: 100,000 iterations with SHA-256
- **Secure Storage**: Private keys and mnemonics are encrypted before storage
- **Session Management**: Wallets remain unlocked for 15 minutes during active sessions

### 🛡️ Security Features
- **Auto-lock Timer**: Wallets automatically lock after 15 minutes of inactivity
- **Session Extension**: User activity extends the session automatically
- **Visual Indicators**: Lock icon shows when wallet is protected/locked
- **Memory Clearing**: Best-effort secure clearing of sensitive data

### 🔄 User Experience
- **Modal Unlock**: Clean unlock interface with password verification
- **Password Management**: Change passwords through wallet settings
- **Lock Controls**: Manual lock option and lock-all functionality
- **Error Handling**: Clear error messages for invalid passwords

## Usage

### For Users

#### Setting up Password Protection
1. Open wallet settings (gear icon)
2. Navigate to "Password Protection" section
3. Click "Enable Protection" 
4. Enter and confirm your password (minimum 8 characters)
5. Click "Set Password"

#### Unlocking a Wallet
1. When accessing protected features (like Send), unlock modal appears
2. Enter your password
3. Wallet remains unlocked for 15 minutes
4. Manual lock available in settings

#### Changing Password
1. Open wallet settings
2. In "Password Protection" section, click "Change Password"
3. Enter current password and new password
4. Confirm the change

#### Manual Lock
- Click "Lock Now" in wallet settings
- Or use the lock-all function for multiple wallets

### For Developers

#### Core Functions

```typescript
// Encrypt a wallet with password
const encryptedWallet = await encryptWallet(wallet, password);

// Decrypt a wallet with password
const decryptedWallet = await decryptWallet(wallet, password);

// Check if wallet is locked
const isLocked = isWalletLocked(wallet);

// Unlock wallet for session
await unlockWallet(wallet, password);

// Get credentials if unlocked
const credentials = getWalletCredentials(wallet);
```

#### Session Management

```typescript
// Check if wallet is unlocked in current session
walletSession.isWalletUnlocked(walletId);

// Extend session on user activity
walletSession.extendSession(walletId);

// Lock specific wallet
walletSession.lockWallet(walletId);

// Lock all wallets
walletSession.lockAllWallets();
```

#### Integration Example

```typescript
// Before performing sensitive operations
if (isWalletLocked(selectedWallet)) {
    // Show unlock modal
    setShowUnlockModal(true);
    return;
}

// Get credentials for operations
const credentials = getWalletCredentials(selectedWallet);
if (!credentials?.privateKey) {
    throw new Error('Unable to access wallet credentials');
}

// Proceed with operation...
```

## Security Architecture

### Encryption Flow
1. **Key Derivation**: Password + salt → PBKDF2 → 256-bit key
2. **Data Encryption**: AES-GCM with random IV
3. **Storage**: Encrypted data + metadata stored in localStorage
4. **Memory Security**: Sensitive data cleared after use

### Session Security
- **15-minute timeout**: Configurable session duration
- **Activity tracking**: Mouse, keyboard, and scroll events extend session
- **Secure clearing**: Memory is cleared when sessions expire
- **Wallet isolation**: Each wallet has independent session state

### Browser Compatibility
- **Web Crypto API**: Modern browser encryption standard
- **localStorage**: Encrypted wallet data persistence
- **Memory Management**: Best-effort cleanup in JavaScript environment

## Migration Path

Existing unencrypted wallets can be upgraded to use password protection without losing data:

1. Wallet settings detect unencrypted wallets
2. "Enable Protection" option becomes available
3. User sets password, wallet is encrypted in-place
4. Original plaintext data is securely cleared

## Best Practices

### For Users
- Use strong, unique passwords (minimum 8 characters)
- Don't share passwords or store them insecurely
- Regularly change passwords if concerned about security
- Use the manual lock feature when stepping away

### For Developers
- Always check wallet lock status before sensitive operations
- Implement unlock flows for user-initiated actions
- Handle password errors gracefully with clear messaging
- Test session timeout and extension behavior

## Troubleshooting

### Common Issues

**"Invalid password" errors**
- Verify correct password entry
- Check for caps lock or keyboard layout issues
- Try typing password in a text field first to verify

**Session expiring unexpectedly**
- Check for JavaScript errors preventing activity tracking
- Verify 15-minute timeout is appropriate for use case
- Consider manual session extension for long operations

**Unlock modal not appearing**
- Verify wallet is actually encrypted (`wallet.isEncrypted`)
- Check modal state management and event handlers
- Review error console for JavaScript issues

### Development Debugging

```typescript
// Check wallet encryption status
console.log('Wallet encrypted:', wallet.isEncrypted);
console.log('Wallet locked:', isWalletLocked(wallet));

// Session debugging
console.log('Session active:', walletSession.isWalletUnlocked(wallet.id));

// Crypto debugging (use carefully in development only)
console.log('Password hash:', wallet.passwordHash);
console.log('Salt:', wallet.salt);
```

## Future Enhancements

Potential improvements to consider:

1. **Hardware Key Support**: WebAuthn integration for additional security
2. **Biometric Unlock**: Browser biometric API where available
3. **Multi-factor Authentication**: TOTP or SMS-based 2FA
4. **Key Derivation Options**: Argon2 when available in browsers
5. **Backup Recovery**: Secure key backup and recovery mechanisms
6. **Audit Logging**: Transaction and unlock event logging
7. **Advanced Session Management**: Per-operation permissions

This password protection system provides a solid foundation for securing wallet operations while maintaining a smooth user experience.
