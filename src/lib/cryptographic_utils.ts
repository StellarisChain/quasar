/**
 * Cryptographic utilities for the Stellaris wallet - Browser compatible versions
 * This module provides the browser-compatible equivalents of the Python cryptographic utilities
 */

// Global variables (matching Python implementation)
export let FAILED_ATTEMPTS = 0;
export const MAX_ATTEMPTS = 5;
const DIFFICULTY = 3;

export class ProofOfWork {
    /**
     * Handles proof-of-work generation and validation.
     */
    static async generateProof(challenge: Uint8Array): Promise<number> {
        let proof = 0;
        const target = "1".repeat(DIFFICULTY);
        
        while (true) {
            const input = new Uint8Array(challenge.length + proof.toString().length);
            input.set(challenge, 0);
            input.set(new TextEncoder().encode(proof.toString()), challenge.length);
            
            const hash = await crypto.subtle.digest('SHA-256', input);
            const hashHex = Array.from(new Uint8Array(hash))
                .map(b => b.toString(16).padStart(2, '0'))
                .join('');
            
            if (hashHex.startsWith(target)) {
                break;
            }
            proof++;
        }
        
        return proof;
    }

    static async isProofValid(proof: number, challenge: Uint8Array): Promise<boolean> {
        const input = new Uint8Array(challenge.length + proof.toString().length);
        input.set(challenge, 0);
        input.set(new TextEncoder().encode(proof.toString()), challenge.length);
        
        const hash = await crypto.subtle.digest('SHA-256', input);
        const hashHex = Array.from(new Uint8Array(hash))
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');
        
        return hashHex.startsWith("1".repeat(DIFFICULTY));
    }
}

export class TOTP {
    /**
     * Generate a new TOTP secret.
     */
    static async generateTotpSecret(predictable: boolean, verificationSalt: Uint8Array): Promise<string> {
        if (!predictable) {
            // Generate random base32 secret
            const bytes = new Uint8Array(20);
            crypto.getRandomValues(bytes);
            return Array.from(bytes, byte => 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'[byte % 32]).join('');
        } else {
            // Generate predictable secret using SHA-256 hash of verification salt
            const hash = await crypto.subtle.digest('SHA-256', verificationSalt);
            const hashHex = Array.from(new Uint8Array(hash))
                .map(b => b.toString(16).padStart(2, '0'))
                .join('');
            return hashHex.substring(0, 16);
        }
    }

    /**
     * Generate a Two-Factor Authentication code using the given secret.
     * Note: This is a placeholder - you'll need a proper TOTP library for production use
     */
    static generateTotpCode(secret: string): string {
        // Placeholder implementation - in production, use a proper TOTP library
        console.warn('TOTP code generation not fully implemented - use a TOTP library');
        return '000000';
    }
}

export class EncryptDecryptUtils {
    /**
     * Handles encryption and decryption tasks using Web Crypto API.
     */
    
    static async aesGcmEncrypt(data: Uint8Array, key: CryptoKey, nonce: Uint8Array): Promise<[Uint8Array, Uint8Array]> {
        // Set the nonce as IV for AES-GCM
        const encrypted = await crypto.subtle.encrypt(
            { name: 'AES-GCM', iv: nonce },
            key,
            data
        );
        
        // AES-GCM returns ciphertext + tag combined
        const encryptedArray = new Uint8Array(encrypted);
        const ciphertext = encryptedArray.slice(0, -16); // Last 16 bytes are the tag
        const tag = encryptedArray.slice(-16);
        
        return [ciphertext, tag];
    }

    static async aesGcmDecrypt(ciphertext: Uint8Array, tag: Uint8Array, key: CryptoKey, nonce: Uint8Array): Promise<Uint8Array> {
        // Combine ciphertext and tag for AES-GCM
        const combined = new Uint8Array(ciphertext.length + tag.length);
        combined.set(ciphertext, 0);
        combined.set(tag, ciphertext.length);
        
        const decrypted = await crypto.subtle.decrypt(
            { name: 'AES-GCM', iv: nonce },
            key,
            combined
        );
        
        return new Uint8Array(decrypted);
    }

    /**
     * ChaCha20-Poly1305 encryption - placeholder implementation
     * Note: ChaCha20-Poly1305 is not natively supported in Web Crypto API
     * You would need a JavaScript implementation like @stablelib/chacha20poly1305
     */
    static async chacha20Poly1305Encrypt(data: Uint8Array, key: Uint8Array): Promise<[Uint8Array, Uint8Array, Uint8Array]> {
        // Placeholder - implement with a ChaCha20-Poly1305 library
        console.warn('ChaCha20-Poly1305 encryption not implemented - use a dedicated library');
        const nonce = new Uint8Array(12);
        crypto.getRandomValues(nonce);
        return [nonce, data, new Uint8Array(16)]; // Placeholder return
    }

    static async chacha20Poly1305Decrypt(nonce: Uint8Array, ciphertext: Uint8Array, tag: Uint8Array, decryptionKey: Uint8Array): Promise<Uint8Array> {
        // Placeholder - implement with a ChaCha20-Poly1305 library
        console.warn('ChaCha20-Poly1305 decryption not implemented - use a dedicated library');
        throw new Error('ChaCha20-Poly1305 decryption not implemented');
    }

    /**
     * Placeholder for data encryption matching Python implementation
     */
    static async encryptData(data: string, password: string, additionalData: string, hmacSalt: Uint8Array, verificationSalt: Uint8Array, storedVerifier: ArrayBuffer): Promise<string> {
        console.warn('Data encryption not yet implemented in browser version');
        return '';
    }

    /**
     * Placeholder for data decryption matching Python implementation
     */
    static async decryptData(encryptedData: string, password: string, additionalData: string, hmacSalt: Uint8Array, verificationSalt: Uint8Array, storedVerifier: ArrayBuffer): Promise<string> {
        console.warn('Data decryption not yet implemented in browser version');
        return '';
    }
}

// Utility functions
export class CryptoUtils {
    /**
     * Generate a cryptographically secure random salt
     */
    static generateSalt(length: number = 32): Uint8Array {
        const salt = new Uint8Array(length);
        crypto.getRandomValues(salt);
        return salt;
    }

    /**
     * Convert ArrayBuffer to base64 string
     */
    static arrayBufferToBase64(buffer: ArrayBuffer): string {
        const bytes = new Uint8Array(buffer);
        const binary = Array.from(bytes, byte => String.fromCharCode(byte)).join('');
        return btoa(binary);
    }

    /**
     * Convert base64 string to ArrayBuffer
     */
    static base64ToArrayBuffer(base64: string): ArrayBuffer {
        const binary = atob(base64);
        const len = binary.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
            bytes[i] = binary.charCodeAt(i);
        }
        return bytes.buffer;
    }
}
