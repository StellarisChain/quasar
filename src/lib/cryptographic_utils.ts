// Browser-compatible cryptographic utilities
import { Verification } from './verification_utils';

// Global variables
let DIFFICULTY = 3;

export class ProofOfWork {
    static async generateProof(challenge: Uint8Array): Promise<number> {
        let proof = 0;
        const target = '1'.repeat(DIFFICULTY);
        const enc = new TextEncoder();
        while (true) {
            const input = new Uint8Array([...Array.from(challenge), ...Array.from(enc.encode(proof.toString()))]);
            const hashBuffer = await window.crypto.subtle.digest('SHA-256', input);
            const hashHex = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
            if (hashHex.startsWith(target)) break;
            proof++;
        }
        return proof;
    }

    static async isProofValid(proof: number, challenge: Uint8Array): Promise<boolean> {
        const enc = new TextEncoder();
        const input = new Uint8Array([...Array.from(challenge), ...Array.from(enc.encode(proof.toString()))]);
        const hashBuffer = await window.crypto.subtle.digest('SHA-256', input);
        const hashHex = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
        return hashHex.startsWith('1'.repeat(DIFFICULTY));
    }
}

export class TOTP {
    static async generateTotpSecret(predictable: boolean, verificationSalt: Uint8Array): Promise<string> {
        if (!predictable) {
            const randomBytes = window.crypto.getRandomValues(new Uint8Array(20));
            return btoa(String.fromCharCode(...Array.from(randomBytes)));
        } else {
            const hashBuffer = await window.crypto.subtle.digest('SHA-256', verificationSalt);
            const hashHex = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
            return hashHex.slice(0, 16);
        }
    }

    static generateTotpCode(secret: string): string {
        // Stub: implement browser-compatible TOTP or use a library
        return '';
    }
}

export class EncryptDecryptUtils {
    static async aesGcmEncrypt(data: Uint8Array, key: CryptoKey, nonce: Uint8Array): Promise<{ ciphertext: Uint8Array, tag: Uint8Array }> {
        const encrypted = await window.crypto.subtle.encrypt(
            { name: 'AES-GCM', iv: nonce },
            key,
            data
        );
        const encryptedBytes = new Uint8Array(encrypted);
        const tag = encryptedBytes.slice(-16);
        const ciphertext = encryptedBytes.slice(0, -16);
        return { ciphertext, tag };
    }

    static async aesGcmDecrypt(ciphertext: Uint8Array, tag: Uint8Array, key: CryptoKey, nonce: Uint8Array): Promise<Uint8Array> {
        const encrypted = new Uint8Array([...Array.from(ciphertext), ...Array.from(tag)]);
        const decrypted = await window.crypto.subtle.decrypt(
            { name: 'AES-GCM', iv: nonce },
            key,
            encrypted
        );
        return new Uint8Array(decrypted);
    }

    static chacha20Poly1305Encrypt(): void {
        throw new Error('ChaCha20-Poly1305 not supported in browser');
    }
    static chacha20Poly1305Decrypt(): void {
        throw new Error('ChaCha20-Poly1305 not supported in browser');
    }

    static async encryptData(
        data: string,
        password: string,
        totpSecret: string,
        hmacSalt: string | Uint8Array,
        verificationSalt: string | Uint8Array,
        storedPasswordHash: ArrayBuffer
    ): Promise<string> {
        const [passwordVerified, verifier] = await Verification.verifyPassword(storedPasswordHash, password, verificationSalt);
        if (!passwordVerified && !verifier) {
            throw new Error('Authentication failed or wallet data is corrupted.');
        }
        const enc = new TextEncoder();
        const keyMaterial = await window.crypto.subtle.importKey('raw', enc.encode(password), { name: 'PBKDF2' }, false, ['deriveKey']);
        const saltBytes = typeof verificationSalt === 'string' ? enc.encode(verificationSalt) : verificationSalt;
        const aesKey = await window.crypto.subtle.deriveKey(
            { name: 'PBKDF2', salt: saltBytes, iterations: 100000, hash: 'SHA-256' },
            keyMaterial,
            { name: 'AES-GCM', length: 256 },
            false,
            ['encrypt', 'decrypt']
        );
        const nonce = window.crypto.getRandomValues(new Uint8Array(12));
        const dataBytes = enc.encode(data);
        const { ciphertext, tag } = await EncryptDecryptUtils.aesGcmEncrypt(dataBytes, aesKey, nonce);
        const encrypted = new Uint8Array([
            ...Array.from(nonce),
            ...Array.from(ciphertext),
            ...Array.from(tag)
        ]);
        return btoa(String.fromCharCode(...Array.from(encrypted)));
    }

    static async decryptData(
        encryptedData: string,
        password: string,
        totpSecret: string,
        hmacSalt: string | Uint8Array,
        verificationSalt: string | Uint8Array,
        storedPasswordHash: ArrayBuffer
    ): Promise<string> {
        const encryptedBytes = Uint8Array.from(atob(encryptedData), c => c.charCodeAt(0));
        const [passwordVerified, verifier] = await Verification.verifyPassword(storedPasswordHash, password, verificationSalt);
        if (!passwordVerified && !verifier) {
            throw new Error('Authentication failed or wallet data is corrupted.');
        }
        const nonce = encryptedBytes.slice(0, 12);
        const ciphertext = encryptedBytes.slice(12, -16);
        const tag = encryptedBytes.slice(-16);
        const enc = new TextEncoder();
        const keyMaterial = await window.crypto.subtle.importKey('raw', enc.encode(password), { name: 'PBKDF2' }, false, ['deriveKey']);
        const saltBytes = typeof verificationSalt === 'string' ? enc.encode(verificationSalt) : verificationSalt;
        const aesKey = await window.crypto.subtle.deriveKey(
            { name: 'PBKDF2', salt: saltBytes, iterations: 100000, hash: 'SHA-256' },
            keyMaterial,
            { name: 'AES-GCM', length: 256 },
            false,
            ['encrypt', 'decrypt']
        );
        const decrypted = await EncryptDecryptUtils.aesGcmDecrypt(ciphertext, tag, aesKey, nonce);
        return new TextDecoder().decode(decrypted);
    }
}
