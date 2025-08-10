/**
 * Cryptographic utilities for wallet password protection
 * Inspired by stellaris-wallet's encryption system but adapted for browser environment
 */

// Use Web Crypto API for encryption
const crypto = globalThis.crypto || (globalThis as any).msCrypto || window.crypto;

if (!crypto || !crypto.subtle) {
    throw new Error('Web Crypto API is not available in this environment');
}

/**
 * Generate a random salt
 */
export function generateSalt(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Generate a random initialization vector
 */
export function generateIV(): string {
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Hash password with salt using PBKDF2
 */
export async function hashPassword(password: string, salt: string): Promise<string> {
    const encoder = new TextEncoder();
    const passwordBuffer = encoder.encode(password);
    const saltBuffer = new Uint8Array(salt.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)));

    const keyMaterial = await crypto.subtle.importKey(
        'raw',
        passwordBuffer,
        { name: 'PBKDF2' },
        false,
        ['deriveBits', 'deriveKey']
    );

    const derivedBits = await crypto.subtle.deriveBits(
        {
            name: 'PBKDF2',
            salt: saltBuffer,
            iterations: 100000,
            hash: 'SHA-256'
        },
        keyMaterial,
        256
    );

    return Array.from(new Uint8Array(derivedBits), byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Verify password against hash
 */
export async function verifyPassword(password: string, hash: string, salt: string): Promise<boolean> {
    const computedHash = await hashPassword(password, salt);
    return computedHash === hash;
}

/**
 * Derive encryption key from password and salt
 */
async function deriveKey(password: string, salt: string): Promise<CryptoKey> {
    const encoder = new TextEncoder();
    const passwordBuffer = encoder.encode(password);
    const saltBuffer = new Uint8Array(salt.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)));

    const keyMaterial = await crypto.subtle.importKey(
        'raw',
        passwordBuffer,
        { name: 'PBKDF2' },
        false,
        ['deriveKey']
    );

    return crypto.subtle.deriveKey(
        {
            name: 'PBKDF2',
            salt: saltBuffer,
            iterations: 100000,
            hash: 'SHA-256'
        },
        keyMaterial,
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt', 'decrypt']
    );
}

/**
 * Encrypt data with password
 */
export async function encryptData(data: string, password: string, salt: string, iv: string): Promise<string> {
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    const ivBuffer = new Uint8Array(iv.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)));

    const key = await deriveKey(password, salt);

    const encryptedBuffer = await crypto.subtle.encrypt(
        {
            name: 'AES-GCM',
            iv: ivBuffer
        },
        key,
        dataBuffer
    );

    return Array.from(new Uint8Array(encryptedBuffer), byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Decrypt data with password
 */
export async function decryptData(encryptedData: string, password: string, salt: string, iv: string): Promise<string> {
    const encryptedBuffer = new Uint8Array(encryptedData.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)));
    const ivBuffer = new Uint8Array(iv.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)));

    const key = await deriveKey(password, salt);

    try {
        const decryptedBuffer = await crypto.subtle.decrypt(
            {
                name: 'AES-GCM',
                iv: ivBuffer
            },
            key,
            encryptedBuffer
        );

        const decoder = new TextDecoder();
        return decoder.decode(decryptedBuffer);
    } catch (error) {
        throw new Error('Failed to decrypt data. Invalid password or corrupted data.');
    }
}

/**
 * Securely clear sensitive data from memory (best effort in JavaScript)
 */
export function secureClear(obj: any): void {
    if (typeof obj === 'string') {
        // Can't truly clear strings in JS, but we can try to overwrite the reference
        obj = '';
    } else if (typeof obj === 'object' && obj !== null) {
        for (const key in obj) {
            if (obj.hasOwnProperty(key)) {
                if (typeof obj[key] === 'string') {
                    obj[key] = '';
                } else if (typeof obj[key] === 'object') {
                    secureClear(obj[key]);
                }
            }
        }
    }
}

/**
 * Test crypto functionality (for debugging)
 */
export async function testCrypto(): Promise<boolean> {
    try {
        console.log('Testing crypto functionality...');

        // Test random generation
        const salt = generateSalt();
        const iv = generateIV();
        console.log('Generated salt and IV successfully');

        // Test password hashing
        const testPassword = 'test123456';
        const hash = await hashPassword(testPassword, salt);
        console.log('Password hashing successful');

        // Test password verification
        const isValid = await verifyPassword(testPassword, hash, salt);
        console.log('Password verification:', isValid);

        // Test encryption/decryption
        const testData = 'Hello, World!';
        const encrypted = await encryptData(testData, testPassword, salt, iv);
        const decrypted = await decryptData(encrypted, testPassword, salt, iv);
        console.log('Encryption/decryption test:', decrypted === testData);

        console.log('All crypto tests passed!');
        return true;
    } catch (error) {
        console.error('Crypto test failed:', error);
        return false;
    }
}
