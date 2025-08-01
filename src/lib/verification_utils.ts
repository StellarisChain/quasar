// import axios from 'axios'; // Using fetch instead for browser compatibility
// import * as dataManipulationUtil from './data_manipulation_utils';
// import * as cryptographicUtil from './cryptographic_utils';
// Remove Node.js-only imports

export class Verification {
    /**
     * Generate a cryptographic hash of the password using PBKDF2 and then Scrypt.
     */
    static async hashPassword(password: string, salt: string | Uint8Array, walletVersion?: string): Promise<ArrayBuffer> {
        // First layer of hashing using PBKDF2 (matches Python implementation)
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

        // Second layer of hashing using Scrypt (N=2^14, r=8, p=1, key_len=32)
        // Note: This requires a scrypt implementation for browsers
        // For now, we'll use a simplified approach with another PBKDF2 round
        // In production, you should use a proper scrypt library like scrypt-js
        const scryptKey = await window.crypto.subtle.importKey(
            'raw',
            new Uint8Array(pbkdf2Bits),
            { name: 'PBKDF2' },
            false,
            ['deriveBits']
        );

        const result = await window.crypto.subtle.deriveBits(
            {
                name: 'PBKDF2',
                salt: saltBytes,
                iterations: 16384, // Approximating scrypt N=2^14
                hash: 'SHA-256'
            },
            scryptKey,
            256
        );

        // dataManipulationUtil.DataManipulation.secureDelete([password, salt]);
        return result;
    }

    /**
     * Compares the provided password with the stored hash.
     */
    static async verifyPassword(storedPasswordHash: ArrayBuffer, providedPassword: string, salt: string | Uint8Array): Promise<[boolean, ArrayBuffer | null]> {
        // Generate hash of the provided password
        const verifier = await Verification.hashPassword(providedPassword, salt);
        // Securely compare the generated hash with the stored hash
        const isVerified = Verification.timingSafeEqual(new Uint8Array(verifier), new Uint8Array(storedPasswordHash));

        // Nullify verifier if not verified (matching Python behavior)
        const resultVerifier = isVerified ? verifier : null;
        const result: [boolean, ArrayBuffer | null] = [isVerified, resultVerifier];
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
        // Generate HMAC key using Scrypt-like approach (matching Python implementation)
        // In Python: hmac_key = scrypt(password.encode(), salt=hmac_salt, key_len=32, N=2**14, r=8, p=1)
        const enc = new TextEncoder();
        const keyMaterial = await window.crypto.subtle.importKey(
            'raw',
            enc.encode(password),
            { name: 'PBKDF2' },
            false,
            ['deriveKey']
        );
        const saltBytes = typeof hmacSalt === 'string' ? enc.encode(hmacSalt) : hmacSalt;

        // Using PBKDF2 to approximate scrypt behavior
        const hmacKey = await window.crypto.subtle.deriveKey(
            {
                name: 'PBKDF2',
                salt: saltBytes,
                iterations: 16384, // Approximating scrypt N=2^14
                hash: 'SHA-256'
            },
            keyMaterial,
            { name: 'HMAC', hash: 'SHA-256', length: 256 },
            false,
            ['sign', 'verify']
        );

        // Generate HMAC of the message
        const computedHmac = await window.crypto.subtle.sign('HMAC', hmacKey, hmacMsg);

        // If in verify mode, securely compare the computed HMAC with the stored HMAC
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
        // Decode base64 to ArrayBuffer (matching Python implementation)
        const storedVerifier = Verification.base64ToArrayBuffer(data.wallet_data.verifier);
        const [passwordVerified] = await Verification.verifyPassword(storedVerifier, password, verificationSalt);

        // Prepare and verify the HMAC message (matching Python logic exactly)
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
    static async verifyTotpSecret(password: string, totpSecret: string, hmacSalt: string | Uint8Array, verificationSalt: string | Uint8Array, storedVerifier: ArrayBuffer): Promise<[string, boolean]> {
        // Placeholder: implement browser-compatible decryptData and TOTP
        // This would require implementing the decrypt_data functionality from cryptographic_util
        // const decryptedTotpSecret = await cryptographicUtil.EncryptDecryptUtils.decryptData(totpSecret, password, "", hmacSalt, verificationSalt, storedVerifier);
        // const predictableTotpSecret = cryptographicUtil.TOTP.generateTotpSecret(true, verificationSalt);
        // if (decryptedTotpSecret !== predictableTotpSecret) {
        //     return [decryptedTotpSecret, true];
        // } else {
        //     return ['', false];
        // }

        // For now, return empty values - this should be implemented when cryptographic utilities are ready
        console.warn('TOTP secret verification not yet implemented in browser version');
        return ['', false];
    }

    /**
     * Validates the given Two-Factor Authentication code using the provided secret.
     */
    static validateTotpCode(secret: string, code: string): boolean {
        // Placeholder: implement browser-compatible TOTP validation
        // This would require a TOTP library that works in browsers
        // const totp = new TOTP(secret);
        // return totp.verify(code);

        console.warn('TOTP code validation not yet implemented in browser version');
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
    static async validateNodeAddress(node: [string, boolean | string | null], fromGui: boolean = false, checkConnection: boolean = false): Promise<[boolean, string | null, boolean, string]> {
        const nodeValidation = node[1] === true || node[1] === null || node[1] === "True";
        let nodeAddress = node[0].replace(/\/+$/, '').trim();

        // Determine protocol
        let chosenProtocol = 2;
        if (nodeAddress.startsWith('https://')) chosenProtocol = 0;
        else if (nodeAddress.startsWith('http://')) chosenProtocol = 1;

        // Clean up node address
        nodeAddress = nodeAddress.replace(/\s+/g, ' ').replace(' :', ':').replace(': ', ':');

        // Validate port if present
        const portNumberPresent = nodeAddress.match(/^(?:https?:\/\/)?(?:[\w\-.]+)(?::(\d+))/);
        if (portNumberPresent && portNumberPresent[1]) {
            const portMatch = nodeAddress.match(/:([0-9]{1,5})$/);
            if (portMatch) {
                if (!Verification.isValidPort(portMatch[1])) {
                    const returnMsg = "Invalid port number. Please enter a value between 1 and 65535.";
                    if (!fromGui) {
                        console.error(returnMsg);
                    }
                    return [false, null, false, "ERROR: " + returnMsg];
                }
            } else {
                const returnMsg = "Invalid port number. Please enter a value between 1 and 65535.";
                if (!fromGui) {
                    console.error(returnMsg);
                }
                return [false, null, false, "ERROR: " + returnMsg];
            }
        }

        // Validate address
        if (!Verification.isValidAddress(nodeAddress)) {
            const returnMsg = "Invalid node address. Please provide a valid IP Address or URL.";
            if (!fromGui) {
                console.error(returnMsg);
            }
            return [false, null, false, returnMsg];
        }

        // Attempt connection
        if (checkConnection) {
            const [success, validNode, resultMsg] = await Verification.tryRequest(nodeAddress, chosenProtocol, nodeValidation, fromGui);

            if (success) {
                const returnMsg = fromGui ? "Successfully established connection with node." : `Successfully established connection with valid node at: ${validNode}`;
                if (!fromGui) {
                    console.log(returnMsg);
                }
                return [true, validNode as string, true, returnMsg];
            } else {
                return [false, null, true, resultMsg];
            }
        } else {
            return [true, nodeAddress, true, ""];
        }
    }

    /**
     * Attempts to connect to a node and verify its blockchain data.
     */
    static async tryRequest(address: string, chosenProtocol: number, nodeValidation: boolean = true, fromGui: boolean = false): Promise<[boolean | null, string | false, string]> {
        const mainNodeUrl = 'stellaris-node.connor33341.dev';
        const protocols = ['https://', 'http://'];
        let protocolsToTry: string[];

        // Check if the address already includes a protocol
        if (/^https?:\/\//.test(address)) {
            protocolsToTry = [''];
        } else {
            protocolsToTry = chosenProtocol === 2 ? protocols : [protocols[chosenProtocol], protocols[1 - chosenProtocol]];
        }

        for (let index = 0; index < protocolsToTry.length; index++) {
            const protocol = protocolsToTry[index];
            const fullAddress = protocol + address;

            // Skip validation if connecting to main node
            const currentNodeValidation = fullAddress.replace('https://', '').replace('http://', '') === mainNodeUrl ? false : nodeValidation;

            try {
                if (currentNodeValidation) {
                    // Get the last block number from the main node
                    const mainResponse = await fetch(`https://${mainNodeUrl}/get_mining_info`, {
                        signal: AbortSignal.timeout(5000)
                    });

                    if (!mainResponse.ok) continue;

                    const mainData = await mainResponse.json();
                    const lastBlockInfo = mainData?.result?.last_block;
                    const lastBlockNumber = lastBlockInfo?.id;

                    if (lastBlockNumber == null) {
                        const returnMsg = "Node validation failed.";
                        if (!fromGui) {
                            console.warn(returnMsg);
                        }
                        continue;
                    }

                    // Generate a random block number
                    const randomBlockId = Math.floor(Math.random() * lastBlockNumber);

                    // Get the block hash from the main node
                    const mainBlockResponse = await fetch(`https://${mainNodeUrl}/get_block?block=${randomBlockId}`, {
                        signal: AbortSignal.timeout(5000)
                    });

                    if (!mainBlockResponse.ok) continue;

                    const mainBlockData = await mainBlockResponse.json();
                    const mainNodeBlockInfo = mainBlockData?.result?.block;
                    const mainNodeBlockHash = mainNodeBlockInfo?.hash;

                    if (mainNodeBlockHash == null) {
                        const returnMsg = "Node validation failed.";
                        if (!fromGui) {
                            console.error(returnMsg);
                        }
                        continue;
                    }

                    // Get the block hash from the user-specified node
                    const userBlockResponse = await fetch(`${fullAddress}/get_block?block=${randomBlockId}`, {
                        signal: AbortSignal.timeout(5000)
                    });

                    if (!userBlockResponse.ok) continue;

                    const userBlockData = await userBlockResponse.json();
                    const userNodeBlockInfo = userBlockData?.result?.block;
                    const userNodeBlockHash = userNodeBlockInfo?.hash;

                    if (userNodeBlockHash == null) {
                        const returnMsg = "Node validation failed.";
                        if (!fromGui) {
                            console.error(returnMsg);
                        }
                        continue;
                    }

                    // Compare the block hashes
                    if (mainNodeBlockHash === userNodeBlockHash) {
                        return [true, fullAddress, ""];
                    } else {
                        const returnMsg = `Node at ${fullAddress} has invalid blockchain data.`;
                        if (!fromGui) {
                            console.error(returnMsg);
                        }
                        continue;
                    }
                } else {
                    const mainResponse = await fetch(`${fullAddress}/get_mining_info`, {
                        signal: AbortSignal.timeout(5000)
                    });

                    if (!mainResponse.ok) continue;

                    const mainData = await mainResponse.json();
                    if (!mainData?.ok) {
                        continue;
                    } else {
                        return [true, fullAddress, ""];
                    }
                }

            } catch (e) {
                let returnMsg: string;
                if (index < protocolsToTry.length - 1) {
                    returnMsg = "Connection to node failed. Trying next protocol...";
                    if (!fromGui) {
                        console.error(returnMsg);
                    }
                } else {
                    returnMsg = "Connection to node failed.";
                    if (!fromGui) {
                        console.error(returnMsg);
                    }
                    returnMsg = "ERROR: " + returnMsg;
                }
                continue;
            }
        }

        return [null, false, "ERROR: Connection to node failed."];
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
