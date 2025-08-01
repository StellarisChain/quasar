/**
 * Stellaris Wallet Library - Browser Compatible Version
 * 
 * This library provides browser-compatible implementations of the Stellaris wallet
 * utilities, matching the logic from the Python stellaris-wallet implementation.
 */

// Core verification utilities
export { Verification } from './verification_utils';

// Cryptographic utilities
export {
    ProofOfWork,
    TOTP,
    EncryptDecryptUtils,
    CryptoUtils,
    FAILED_ATTEMPTS,
    MAX_ATTEMPTS
} from './cryptographic_utils';

// Data manipulation utilities
export { DataManipulation } from './data_manipulation_utils';

// Re-export other utilities
export * from './wallet_generation_utils';
export * from './wallet_client';

// Note: Some functionality like secure memory deletion and full encryption/decryption
// is not available in browser environments and uses placeholder implementations.