# Automatic Curve Detection for Wallet Import

This feature adds automatic cryptographic curve detection when importing JSON wallet files, eliminating the need for manual curve specification.

## Overview

When importing wallet files, the system now automatically detects the appropriate cryptographic curve (secp256k1 or p256) based on the wallet's cryptographic data. This ensures imported wallets work correctly with their intended blockchain networks.

## How It Works

The curve detection system uses multiple detection methods with confidence scoring:

### Detection Methods

1. **Private Key + Public Key/Address Verification** (Highest Confidence: 95-98%)
   - Derives public key/address from private key using different curves
   - Compares with provided data to find matching curve
   - Most reliable method when verification data is available

2. **Public Key Format Analysis** (Medium-High Confidence: 70-80%)
   - Analyzes public key format and length
   - Attempts to parse with different curve libraries
   - Works well with properly formatted keys

3. **Address Pattern Recognition** (Medium Confidence: 60-80%)
   - Recognizes address prefixes and patterns
   - Stellaris addresses starting with 'D' or 'E' typically indicate secp256k1
   - Heuristic-based approach

4. **Key Validity Testing** (Lower Confidence: 70%)
   - Tests if private key is valid for specific curves
   - Used when no verification data is available

5. **Default Fallback** (Lowest Confidence: 50%)
   - Falls back to secp256k1 when detection fails
   - Ensures compatibility with most common use cases

## Usage

### In Wallet Import
The feature is automatically enabled in the wallet import process. When you import a JSON wallet file:

1. The system extracts private key, public key, and address
2. Runs curve detection using available data
3. Displays the detected curve with confidence level
4. Uses the detected curve for wallet creation

### Confidence Indicators
- 🟢 Green dot: High confidence (>80%)
- 🟡 Yellow dot: Medium confidence (60-80%)
- 🔴 Red dot: Low confidence (<60%)

## Visual Feedback

The import interface shows:
- **Detected Curve**: The identified cryptographic curve
- **Confidence Level**: Percentage indicating detection reliability
- **Detection Method**: How the curve was identified

Example display:
```
Detected Curve
🟢 secp256k1 (95% confidence)
Detection method: public key match
```

## Supported Curves

- **secp256k1**: Bitcoin/Ethereum standard curve, most widely supported
- **p256**: NIST P-256 curve, used by specialized networks

## Error Handling

- If curve detection fails completely, defaults to secp256k1
- Low confidence detections are flagged with visual indicators
- Users can manually verify the detected curve is appropriate

## Technical Implementation

### Key Components

1. **`curve_detection_utils.ts`**: Core detection algorithms
2. **`ImportWallet.tsx`**: UI integration with visual feedback
3. **Detection Functions**:
   - `detectCurveFromWalletData()`: Main detection function
   - `detectCurveFromPrivateKey()`: Private key analysis
   - `detectCurveFromPublicKey()`: Public key analysis
   - `detectCurveFromAddress()`: Address pattern analysis

### Integration Points

The curve detection integrates with:
- JSON wallet file parsing
- Wallet object creation
- Asset compatibility checking
- User interface feedback

## Benefits

- **Automatic Detection**: No manual curve selection needed
- **Accuracy**: High confidence detection using multiple methods
- **User Feedback**: Clear indication of detection confidence
- **Fallback Safety**: Always provides a usable result
- **Compatibility**: Works with existing wallet formats

## Future Enhancements

- Support for additional curves (Ed25519, etc.)
- Machine learning-based pattern recognition
- Enhanced address pattern database
- Cross-validation between multiple detection methods
- User override options for low-confidence detections
