import axios from 'axios';
//import * as dataManipulationUtil from './data_manipulation';
//import * as cryptographicUtil from './cryptographic_util';
// Remove Node.js-only imports

export class Verification {
    /**
     * Generate a cryptographic hash of the password using PBKDF2 and then Scrypt.
     */
    static async hashPassword(password: string, salt: string | Uint8Array): Promise<ArrayBuffer> {
        // Use Web Crypto API for PBKDF2
        const enc = new TextEncoder();
        const pwKey = await window.crypto.subtle.importKey(
            'raw',
            enc.encode(password),
            { name: 'PBKDF2' },
            false,
            ['deriveBits', 'deriveKey']
        );
        const saltBytes = typeof salt === 'string' ? enc.encode(salt) : salt;
        const pbkdf2Bits = await window.crypto.subtle.deriveBits(
            {
                name: 'PBKDF2',
                salt: saltBytes,
                iterations: 100000,
                hash: 'SHA-256'
            },
            pwKey,
            256
        );
        // Scrypt is not natively supported in browsers; fallback to PBKDF2 only
        // If you need scrypt, use a JS implementation like scrypt-js
        // For now, return pbkdf2Bits
        // dataManipulationUtil.DataManipulation.secureDelete([password, salt]);
        return pbkdf2Bits;
    }

    /**
     * Compares the provided password with the stored hash.
     */
    static async verifyPassword(storedPasswordHash: ArrayBuffer, providedPassword: string, salt: string | Uint8Array): Promise<[boolean, ArrayBuffer | null]> {
        const verifier = await Verification.hashPassword(providedPassword, salt);
        const isVerified = Verification.timingSafeEqual(new Uint8Array(verifier), new Uint8Array(storedPasswordHash));
        const result: [boolean, ArrayBuffer | null] = [isVerified, isVerified ? verifier : null];
        // dataManipulationUtil.DataManipulation.secureDelete([verifier, storedPasswordHash, providedPassword, salt]);
        return result;
    }

    /**
     * Handle HMAC generation and verification.
     */
    static async hmacUtil({ password, hmacSalt, storedHmac, hmacMsg, verify = false }: {
        password: string,
        hmacSalt: string | Uint8Array,
        storedHmac?: ArrayBuffer,
        hmacMsg: Uint8Array,
        verify?: boolean
    }): Promise<ArrayBuffer | boolean> {
        // Use PBKDF2 for key derivation
        const enc = new TextEncoder();
        const keyMaterial = await window.crypto.subtle.importKey(
            'raw',
            enc.encode(password),
            { name: 'PBKDF2' },
            false,
            ['deriveKey']
        );
        const saltBytes = typeof hmacSalt === 'string' ? enc.encode(hmacSalt) : hmacSalt;
        const hmacKey = await window.crypto.subtle.deriveKey(
            {
                name: 'PBKDF2',
                salt: saltBytes,
                iterations: 100000,
                hash: 'SHA-256'
            },
            keyMaterial,
            { name: 'HMAC', hash: 'SHA-256', length: 256 },
            false,
            ['sign', 'verify']
        );
        const computedHmac = await window.crypto.subtle.sign('HMAC', hmacKey, hmacMsg);
        if (verify && storedHmac) {
            const result = Verification.timingSafeEqual(new Uint8Array(computedHmac), new Uint8Array(storedHmac));
            // dataManipulationUtil.DataManipulation.secureDelete([...]);
            return result;
        } else {
            // dataManipulationUtil.DataManipulation.secureDelete([...]);
            return computedHmac;
        }
    }

    /**
     * Verifies the given password and HMAC.
     */
    static async verifyPasswordAndHmac(data: any, password: string, hmacSalt: string | Uint8Array, verificationSalt: string | Uint8Array, deterministic: boolean): Promise<[boolean, boolean, ArrayBuffer]> {
        // Decode base64 to Uint8Array
        const storedVerifier = Verification.base64ToArrayBuffer(data.wallet_data.verifier);
        const [passwordVerified] = await Verification.verifyPassword(storedVerifier, password, verificationSalt);
        let hmacMsg = new TextEncoder().encode(JSON.stringify(data.wallet_data.entry_data.entries));
        if (data.wallet_data.entry_data.imported_entries) {
            const imported = new TextEncoder().encode(JSON.stringify(data.wallet_data.entry_data.imported_entries));
            hmacMsg = Verification.concatUint8Arrays(imported, hmacMsg);
        }
        if (deterministic) {
            const keyData = new TextEncoder().encode(JSON.stringify(data.wallet_data.entry_data.key_data));
            hmacMsg = Verification.concatUint8Arrays(hmacMsg, keyData);
        }
        const storedHmac = Verification.base64ToArrayBuffer(data.wallet_data.hmac);
        const hmacVerified = await Verification.hmacUtil({ password, hmacSalt, storedHmac, hmacMsg, verify: true }) as boolean;
        // dataManipulationUtil.DataManipulation.secureDelete([...]);
        return [passwordVerified, hmacVerified, storedVerifier];
    }

    /**
     * Validates the given Two-Factor Authentication secret token
     */
    // You must refactor cryptographicUtil.EncryptDecryptUtils.decryptData and TOTP for browser compatibility
    static async verifyTotpSecret(password: string, totpSecret: string, hmacSalt: string | Uint8Array, verificationSalt: string | Uint8Array, storedVerifier: ArrayBuffer): Promise<[string, boolean]> {
        // Placeholder: implement browser-compatible decryptData and TOTP
        // const decryptedTotpSecret = await cryptographicUtil.EncryptDecryptUtils.decryptData(...);
        // const predictableTotpSecret = cryptographicUtil.TOTP.generateTotpSecret(...);
        // if (decryptedTotpSecret !== predictableTotpSecret) {
        //     return [decryptedTotpSecret, true];
        // } else {
        //     return ['', false];
        // }
        return ['', false];
    }

    /**
     * Validates the given Two-Factor Authentication code using the provided secret.
     */
    // You must refactor TOTP validation for browser compatibility
    static validateTotpCode(secret: string, code: string): boolean {
        // Placeholder: implement browser-compatible TOTP validation
        return false;
    }

    /**
     * Validates if the address is a valid IP, domain, or localhost (with optional port)
     */
    static isValidAddress(address: string): boolean {
        const ipv4WithOptionalPort = /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)(?::([0-5]?[0-9]{1,4}|6[0-4][0-9]{3}|65[0-4][0-9]{2}|655[0-2][0-9]|6553[0-5]))?$/;
        const urlWithTldOptionalPort = /^(?!(http:\/\/|https:\/\/))[a-zA-Z0-9-]+(\.[a-zA-Z0-9-]+)*\.[a-zA-Z]{2,}(?::([0-5]?[0-9]{1,4}|6[0-4][0-9]{3}|65[0-4][0-9]{2}|655[0-2][0-9]|6553[0-5]))?$/;
        const localhostWithOptionalPort = /^localhost(:([1-9]\d{0,3}|[1-5]\d{4}|6[0-4]\d{3}|65[0-4]\d{2}|655[0-2]\d|6553[0-5]))?$/;
        const strippedAddress = address.replace(/^https?:\/\//, '');
        if (urlWithTldOptionalPort.test(strippedAddress)) return true;
        if (ipv4WithOptionalPort.test(strippedAddress)) return true;
        if (localhostWithOptionalPort.test(strippedAddress)) return true;
        return false;
    }

    /**
     * Validates if the port is a valid number between 1 and 65535
     */
    static isValidPort(port: string | number): boolean {
        try {
            const portNum = typeof port === 'string' ? parseInt(port, 10) : port;
            return portNum >= 1 && portNum <= 65535;
        } catch {
            return false;
        }
    }

    /**
     * Validates a node address and attempts to connect to it.
     */
    static async validateNodeAddress(node: string): Promise<[boolean, string | null]> {
        node = node.replace(/\/+$/, '');
        let chosenProtocol = 2;
        if (node.startsWith('https://')) chosenProtocol = 0;
        else if (node.startsWith('http://')) chosenProtocol = 1;
        if (!Verification.isValidAddress(node)) {
            return [false, null];
        }
        node = node.replace(/\s+/g, ' ');
        node = node.replace(' :', ':').replace(': ', ':');
        const portMatch = node.match(/:([0-9]{1,5})/);
        if (portMatch && !Verification.isValidPort(portMatch[1])) {
            return [false, null];
        }
        const strippedAddress = node.replace(/^https?:\/\//, '');
        const [success, validNode] = await Verification.tryRequest(strippedAddress, chosenProtocol);
        if (success) {
            return [true, validNode as string];
        }
        return [false, null];
    }

    /**
     * Attempts to connect to a node and verify its blockchain data.
     */
    static async tryRequest(address: string, chosenProtocol: number): Promise<[boolean | null, string | false]> {
        const mainNodeUrl = 'https://stellaris-node.connor33341.dev';
        const protocols = ['https://', 'http://'];
        let protocolsToTry: string[];
        if (/^https?:\/\//.test(address)) {
            protocolsToTry = [''];
        } else {
            protocolsToTry = chosenProtocol === 2 ? protocols : [protocols[chosenProtocol], protocols[1 - chosenProtocol]];
        }
        for (let i = 0; i < protocolsToTry.length; i++) {
            const protocol = protocolsToTry[i];
            const fullAddress = protocol + address;
            try {
                const mainResponse = await axios.get(`${mainNodeUrl}/get_mining_info`, { timeout: 5000 });
                const lastBlockNumber = mainResponse.data?.result?.last_block?.id;
                if (lastBlockNumber == null) continue;
                const randomBlockId = Math.floor(Math.random() * lastBlockNumber);
                const mainBlockResponse = await axios.get(`${mainNodeUrl}/get_block?block=${randomBlockId}`, { timeout: 5000 });
                const mainNodeBlockHash = mainBlockResponse.data?.result?.block?.hash;
                if (!mainNodeBlockHash) continue;
                const userBlockResponse = await axios.get(`${fullAddress}/get_block?block=${randomBlockId}`, { timeout: 5000 });
                const userNodeBlockHash = userBlockResponse.data?.result?.block?.hash;
                if (!userNodeBlockHash) continue;
                if (mainNodeBlockHash === userNodeBlockHash) {
                    return [true, fullAddress];
                } else {
                    continue;
                }
            } catch (e) {
                continue;
            }
        }
        return [null, false];
    }
    // Utility: timing-safe comparison for Uint8Array
    static timingSafeEqual(a: Uint8Array, b: Uint8Array): boolean {
        if (a.length !== b.length) return false;
        let result = 0;
        for (let i = 0; i < a.length; i++) {
            result |= a[i] ^ b[i];
        }
        return result === 0;
    }

    // Utility: base64 to ArrayBuffer
    static base64ToArrayBuffer(base64: string): ArrayBuffer {
        const binary = atob(base64);
        const len = binary.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
            bytes[i] = binary.charCodeAt(i);
        }
        return bytes.buffer;
    }

    // Utility: concat Uint8Arrays
    static concatUint8Arrays(a: Uint8Array, b: Uint8Array): Uint8Array {
        const c = new Uint8Array(a.length + b.length);
        c.set(a, 0);
        c.set(b, a.length);
        return c;
    }
}
