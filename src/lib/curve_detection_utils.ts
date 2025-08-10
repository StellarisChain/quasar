/**
 * Curve detection utilities for automatic curve identification from wallet data
 * This module helps automatically detect cryptographic curves when importing wallets
 */

import { secp256k1 } from '@noble/curves/secp256k1';
import { p256 } from '@noble/curves/p256';
import { CurveType } from './wallet_generation_utils';

export interface CurveDetectionResult {
    curve: CurveType;
    confidence: number; // 0.0 to 1.0
    method: string;
}

/**
 * Attempts to detect the cryptographic curve used for a given private key
 * @param privateKeyHex - Private key in hexadecimal format
 * @param publicKeyHex - Optional public key for verification
 * @param address - Optional address for verification
 * @returns CurveDetectionResult with detected curve and confidence level
 */
export function detectCurveFromPrivateKey(
    privateKeyHex: string,
    publicKeyHex?: string,
    address?: string
): CurveDetectionResult {
    const results: CurveDetectionResult[] = [];

    // Test secp256k1
    try {
        const privateKeyInt = BigInt('0x' + privateKeyHex);
        // Verify the private key is valid for secp256k1
        secp256k1.ProjectivePoint.fromPrivateKey(privateKeyInt);

        if (publicKeyHex) {
            // Verify public key matches
            const derivedPublicKey = generatePublicKey(privateKeyHex, 'secp256k1');
            if (derivedPublicKey.toLowerCase() === publicKeyHex.toLowerCase()) {
                results.push({
                    curve: 'secp256k1',
                    confidence: 0.95,
                    method: 'public_key_match'
                });
            }
        }

        if (address) {
            // Verify address matches
            const derivedAddress = generateAddress(privateKeyHex, 'secp256k1');
            if (derivedAddress === address) {
                results.push({
                    curve: 'secp256k1',
                    confidence: 0.98,
                    method: 'address_match'
                });
            }
        }

        // If no verification data, just check if key is valid for curve
        if (!publicKeyHex && !address) {
            results.push({
                curve: 'secp256k1',
                confidence: 0.7,
                method: 'key_validity'
            });
        }
    } catch (error) {
        // secp256k1 failed, continue to next curve
    }

    // Test p256
    try {
        const privateKeyInt = BigInt('0x' + privateKeyHex);
        // Verify the private key is valid for p256
        p256.ProjectivePoint.fromPrivateKey(privateKeyInt);

        if (publicKeyHex) {
            // Verify public key matches
            const derivedPublicKey = generatePublicKey(privateKeyHex, 'p256');
            if (derivedPublicKey.toLowerCase() === publicKeyHex.toLowerCase()) {
                results.push({
                    curve: 'p256',
                    confidence: 0.95,
                    method: 'public_key_match'
                });
            }
        }

        if (address) {
            // Verify address matches
            const derivedAddress = generateAddress(privateKeyHex, 'p256');
            if (derivedAddress === address) {
                results.push({
                    curve: 'p256',
                    confidence: 0.98,
                    method: 'address_match'
                });
            }
        }

        // If no verification data, just check if key is valid for curve
        if (!publicKeyHex && !address) {
            results.push({
                curve: 'p256',
                confidence: 0.7,
                method: 'key_validity'
            });
        }
    } catch (error) {
        // p256 failed
    }

    // Return the result with highest confidence, or default to secp256k1
    if (results.length === 0) {
        return {
            curve: 'secp256k1',
            confidence: 0.5,
            method: 'default_fallback'
        };
    }

    return results.reduce((best, current) =>
        current.confidence > best.confidence ? current : best
    );
}

/**
 * Attempts to detect curve from public key characteristics
 * @param publicKeyHex - Public key in hexadecimal format
 * @returns CurveDetectionResult
 */
export function detectCurveFromPublicKey(publicKeyHex: string): CurveDetectionResult {
    // Remove any prefix if present
    const cleanPublicKey = publicKeyHex.replace(/^0x/, '');

    // Check key length patterns
    if (cleanPublicKey.length === 66 && (cleanPublicKey.startsWith('02') || cleanPublicKey.startsWith('03'))) {
        // Compressed public key format - likely secp256k1 or p256
        // Try to determine which one by attempting to parse
        try {
            const keyBytes = Buffer.from(cleanPublicKey, 'hex');

            // Try secp256k1 first (more common)
            try {
                secp256k1.ProjectivePoint.fromHex(keyBytes);
                return {
                    curve: 'secp256k1',
                    confidence: 0.8,
                    method: 'compressed_key_format'
                };
            } catch {
                // Try p256
                try {
                    p256.ProjectivePoint.fromHex(keyBytes);
                    return {
                        curve: 'p256',
                        confidence: 0.8,
                        method: 'compressed_key_format'
                    };
                } catch {
                    // Neither worked
                }
            }
        } catch {
            // Parsing failed
        }
    } else if (cleanPublicKey.length === 130 && cleanPublicKey.startsWith('04')) {
        // Uncompressed public key format
        return {
            curve: 'secp256k1', // More likely for uncompressed format
            confidence: 0.7,
            method: 'uncompressed_key_format'
        };
    }

    // Default fallback
    return {
        curve: 'secp256k1',
        confidence: 0.5,
        method: 'default_fallback'
    };
}

/**
 * Attempts to detect curve from address characteristics
 * @param address - Wallet address
 * @returns CurveDetectionResult
 */
export function detectCurveFromAddress(address: string): CurveDetectionResult {
    // Stellaris addresses typically start with 'D' or 'E' for secp256k1
    // This is based on the base58 encoding with specific prefixes
    if (address.startsWith('D') || address.startsWith('E')) {
        return {
            curve: 'secp256k1',
            confidence: 0.8,
            method: 'address_prefix_pattern'
        };
    }

    // Other address patterns could be added here for p256 or other curves
    // For now, default to secp256k1 as it's most common
    return {
        curve: 'secp256k1',
        confidence: 0.6,
        method: 'address_heuristic'
    };
}

/**
 * Comprehensive curve detection using all available wallet data
 * @param walletData - Object containing private_key, public_key, and/or address
 * @returns CurveDetectionResult with best guess
 */
export function detectCurveFromWalletData(walletData: {
    private_key?: string;
    public_key?: string;
    address?: string;
}): CurveDetectionResult {
    const results: CurveDetectionResult[] = [];

    // Try private key detection if available (most reliable)
    if (walletData.private_key) {
        const privateKeyResult = detectCurveFromPrivateKey(
            walletData.private_key,
            walletData.public_key,
            walletData.address
        );
        results.push(privateKeyResult);
    }

    // Try public key detection
    if (walletData.public_key) {
        const publicKeyResult = detectCurveFromPublicKey(walletData.public_key);
        results.push(publicKeyResult);
    }

    // Try address detection
    if (walletData.address) {
        const addressResult = detectCurveFromAddress(walletData.address);
        results.push(addressResult);
    }

    // If no data available, return default
    if (results.length === 0) {
        return {
            curve: 'secp256k1',
            confidence: 0.5,
            method: 'no_data_default'
        };
    }

    // Return the result with highest confidence
    return results.reduce((best, current) =>
        current.confidence > best.confidence ? current : best
    );
}

// Helper functions for key derivation and verification
function generatePublicKey(privateKeyHex: string, curve: CurveType): string {
    try {
        const privateKeyInt = BigInt('0x' + privateKeyHex);

        if (curve === 'secp256k1') {
            const point = secp256k1.ProjectivePoint.fromPrivateKey(privateKeyInt);
            const x = point.x;
            const y = point.y;
            const prefix = (y % BigInt(2) === BigInt(0)) ? '02' : '03';
            const xHex = x.toString(16).padStart(64, '0');
            return prefix + xHex;
        } else if (curve === 'p256') {
            const point = p256.ProjectivePoint.fromPrivateKey(privateKeyInt);
            const x = point.x;
            const y = point.y;
            const prefix = (y % BigInt(2) === BigInt(0)) ? '02' : '03';
            const xHex = x.toString(16).padStart(64, '0');
            return prefix + xHex;
        }
    } catch (error) {
        // Generation failed
    }

    return '';
}

function generateAddress(privateKeyHex: string, curve: CurveType): string {
    // This would need to use the actual address generation logic
    // For now, return empty string as we'd need to import the full generation utils
    // which might create circular dependencies
    return '';
}
