# Manual Import Feature

The manual import feature allows users to import wallets by entering either a seed phrase (mnemonic) or a private key directly, along with selecting the appropriate cryptographic curve.

## Features

### 1. Import Methods
- **Seed Phrase**: Import using a 12 or 24-word mnemonic phrase
- **Private Key**: Import using a 64-character hexadecimal private key

### 2. Cryptographic Curve Selection
- **secp256k1**: Standard Bitcoin/Ethereum curve (recommended)
- **P-256**: NIST P-256 curve for specialized networks

### 3. Automatic Curve Detection
When importing via private key, the system can automatically detect the appropriate curve:
- Confidence indicators show detection reliability
- Users can override auto-detection if needed
- Real-time feedback during curve detection

## User Interface

### Import Type Selection
Users can choose between two import methods:
- **Seed Phrase**: For importing from mnemonic words
- **Private Key**: For importing from raw private key

### Input Fields
- **Wallet Name**: Custom name for the imported wallet
- **Seed Phrase/Private Key**: The actual import data
- **Curve Selection**: Choose or auto-detect the cryptographic curve

### Validation
- Real-time validation of input format
- Mnemonic phrase validation using BIP39 standards
- Private key format validation (64 hex characters)
- Clear error messages for invalid inputs

### Visual Feedback
- Loading states during import process
- Color-coded confidence indicators for curve detection
- Clear success/error messaging

## Technical Implementation

### Key Components
1. **ManualImportPage**: Main component handling the import UI
2. **CurveSelector**: Component for curve selection
3. **Curve Detection**: Automatic curve identification
4. **Wallet Generation**: Create wallet objects from import data

### Security Features
- Input sanitization and validation
- Secure key generation using noble-curves
- No storage of sensitive data during import process

### Error Handling
- Comprehensive input validation
- Graceful error recovery
- Clear user feedback for all error states

## Usage Flow

1. **Select Import Method**: Choose between seed phrase or private key
2. **Enter Wallet Name**: Provide a custom name for the wallet
3. **Input Data**: Enter the seed phrase or private key
4. **Select Curve**: Choose curve (or use auto-detection for private key)
5. **Import**: Complete the import process

## Supported Formats

### Seed Phrase
- 12-word mnemonic phrases
- 24-word mnemonic phrases
- Space-separated words
- BIP39 compatible

### Private Key
- 64-character hexadecimal strings
- With or without '0x' prefix
- Both uppercase and lowercase accepted

## Integration

The manual import feature integrates seamlessly with:
- Existing wallet management system
- Asset compatibility checking
- Curve-based asset filtering
- Wallet storage and retrieval
