import * as crypto from 'crypto';
import * as base64 from 'base-64';
import * as pyotp from 'otplib';
import * as https from 'https';
import * as http from 'http';
import axios from 'axios';
import * as dataManipulationUtil from './data_manipulation';
import * as cryptographicUtil from './cryptographic_util';

export class Verification {
    /**
     * Generate a cryptographic hash of the password using PBKDF2 and then Scrypt.
     */
    static async hashPassword(password: string, salt: Buffer | string): Promise<Buffer> {
        const saltBytes = typeof salt === 'string' ? Buffer.from(salt, 'utf-8') : salt;
        // First layer of hashing using PBKDF2
        const pbkdf2Hash = crypto.pbkdf2Sync(password, saltBytes, 100000, 32, 'sha256');
        // Second layer of hashing using Scrypt
        const result = await new Promise<Buffer>((resolve, reject) => {
            crypto.scrypt(pbkdf2Hash, saltBytes, 32, { N: 16384, r: 8, p: 1 }, (err, derivedKey) => {
                if (err) reject(err);
                else resolve(derivedKey as Buffer);
            });
        });
        dataManipulationUtil.DataManipulation.secureDelete([pbkdf2Hash, saltBytes, password, salt]);
        return result;
    }

    /**
     * Compares the provided password with the stored hash.
     */
    static async verifyPassword(storedPasswordHash: Buffer, providedPassword: string, salt: Buffer | string): Promise<[boolean, Buffer | null]> {
        const verifier = await Verification.hashPassword(providedPassword, salt);
        const isVerified = crypto.timingSafeEqual(verifier, storedPasswordHash);
        const result: [boolean, Buffer | null] = [isVerified, isVerified ? verifier : null];
        dataManipulationUtil.DataManipulation.secureDelete([verifier, storedPasswordHash, providedPassword, salt]);
        return result;
    }

    /**
     * Handle HMAC generation and verification.
     */
    static async hmacUtil({ password, hmacSalt, storedHmac, hmacMsg, verify = false }: {
        password: string,
        hmacSalt: Buffer | string,
        storedHmac?: Buffer,
        hmacMsg: Buffer,
        verify?: boolean
    }): Promise<Buffer | boolean> {
        const saltBytes = typeof hmacSalt === 'string' ? Buffer.from(hmacSalt, 'utf-8') : hmacSalt;
        const hmacKey = await new Promise<Buffer>((resolve, reject) => {
            crypto.scrypt(password, saltBytes, 32, { N: 16384, r: 8, p: 1 }, (err, derivedKey) => {
                if (err) reject(err);
                else resolve(derivedKey as Buffer);
            });
        });
        const computedHmac = crypto.createHmac('sha256', hmacKey).update(hmacMsg).digest();
        if (verify && storedHmac) {
            const result = crypto.timingSafeEqual(computedHmac, storedHmac);
            dataManipulationUtil.DataManipulation.secureDelete([hmacKey, computedHmac, storedHmac, hmacMsg, password, hmacSalt]);
            return result;
        } else {
            dataManipulationUtil.DataManipulation.secureDelete([hmacKey, password, hmacSalt]);
            return computedHmac;
        }
    }

    /**
     * Verifies the given password and HMAC.
     */
    static async verifyPasswordAndHmac(data: any, password: string, hmacSalt: Buffer | string, verificationSalt: Buffer | string, deterministic: boolean): Promise<[boolean, boolean, Buffer]> {
        const storedVerifier = Buffer.from(data.wallet_data.verifier, 'base64');
        const [passwordVerified] = await Verification.verifyPassword(storedVerifier, password, verificationSalt);
        let hmacMsg = Buffer.from(JSON.stringify(data.wallet_data.entry_data.entries));
        if (data.wallet_data.entry_data.imported_entries) {
            hmacMsg = Buffer.concat([
                Buffer.from(JSON.stringify(data.wallet_data.entry_data.imported_entries)),
                hmacMsg
            ]);
        }
        if (deterministic) {
            hmacMsg = Buffer.concat([
                hmacMsg,
                Buffer.from(JSON.stringify(data.wallet_data.entry_data.key_data))
            ]);
        }
        const storedHmac = Buffer.from(data.wallet_data.hmac, 'base64');
        const hmacVerified = await Verification.hmacUtil({ password, hmacSalt, storedHmac, hmacMsg, verify: true }) as boolean;
        dataManipulationUtil.DataManipulation.secureDelete([storedVerifier, storedHmac, hmacMsg, password, hmacSalt, verificationSalt]);
        return [passwordVerified, hmacVerified, storedVerifier];
    }

    /**
     * Validates the given Two-Factor Authentication secret token
     */
    static async verifyTotpSecret(password: string, totpSecret: string, hmacSalt: Buffer | string, verificationSalt: Buffer | string, storedVerifier: Buffer): Promise<[string, boolean]> {
        const decryptedTotpSecret = await cryptographicUtil.EncryptDecryptUtils.decryptData(
            totpSecret,
            password,
            '',
            typeof hmacSalt === 'string' ? Buffer.from(hmacSalt, 'utf-8') : hmacSalt,
            typeof verificationSalt === 'string' ? Buffer.from(verificationSalt, 'utf-8') : verificationSalt,
            storedVerifier
        );
        const predictableTotpSecret = cryptographicUtil.TOTP.generateTotpSecret(
            true,
            typeof verificationSalt === 'string' ? Buffer.from(verificationSalt, 'utf-8') : verificationSalt
        );
        if (decryptedTotpSecret !== predictableTotpSecret) {
            dataManipulationUtil.DataManipulation.secureDelete([decryptedTotpSecret, predictableTotpSecret, password, totpSecret, hmacSalt, verificationSalt, storedVerifier]);
            return [decryptedTotpSecret, true];
        } else {
            dataManipulationUtil.DataManipulation.secureDelete([decryptedTotpSecret, predictableTotpSecret, password, totpSecret, hmacSalt, verificationSalt, storedVerifier]);
            return ['', false];
        }
    }

    /**
     * Validates the given Two-Factor Authentication code using the provided secret.
     */
    static validateTotpCode(secret: string, code: string): boolean {
        const result = pyotp.authenticator.check(code, secret);
        dataManipulationUtil.DataManipulation.secureDelete([secret, code]);
        return result;
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
        dataManipulationUtil.DataManipulation.secureDelete([address]);
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
            dataManipulationUtil.DataManipulation.secureDelete([port]);
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
            console.error('Invalid node address. Please provide a valid IP Address or URL.');
            dataManipulationUtil.DataManipulation.secureDelete([node]);
            return [false, null];
        }
        node = node.replace(/\s+/g, ' ');
        node = node.replace(' :', ':').replace(': ', ':');
        const portMatch = node.match(/:([0-9]{1,5})/);
        if (portMatch && !Verification.isValidPort(portMatch[1])) {
            console.error('Invalid port number. Please enter a value between 1 and 65535.');
            dataManipulationUtil.DataManipulation.secureDelete([node]);
            return [false, null];
        }
        const strippedAddress = node.replace(/^https?:\/\//, '');
        const [success, validNode] = await Verification.tryRequest(strippedAddress, chosenProtocol);
        if (success) {
            console.log(`Successfully established connection with valid Denaro node at: ${validNode}\n`);
            return [true, validNode as string];
        }
        dataManipulationUtil.DataManipulation.secureDelete([node]);
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
                const mainResponse = await axios.get(`${mainNodeUrl}/get_mining_info`, { timeout: 5000, httpsAgent: new https.Agent({ rejectUnauthorized: false }) });
                const lastBlockNumber = mainResponse.data?.result?.last_block?.id;
                if (lastBlockNumber == null) continue;
                const randomBlockId = Math.floor(Math.random() * lastBlockNumber);
                const mainBlockResponse = await axios.get(`${mainNodeUrl}/get_block?block=${randomBlockId}`, { timeout: 5000, httpsAgent: new https.Agent({ rejectUnauthorized: false }) });
                const mainNodeBlockHash = mainBlockResponse.data?.result?.block?.hash;
                if (!mainNodeBlockHash) continue;
                const userBlockResponse = await axios.get(`${fullAddress}/get_block?block=${randomBlockId}`, { timeout: 5000, httpsAgent: new https.Agent({ rejectUnauthorized: false }) });
                const userNodeBlockHash = userBlockResponse.data?.result?.block?.hash;
                if (!userNodeBlockHash) continue;
                if (mainNodeBlockHash === userNodeBlockHash) {
                    dataManipulationUtil.DataManipulation.secureDelete([address, fullAddress, mainNodeBlockHash, userNodeBlockHash]);
                    return [true, fullAddress];
                } else {
                    continue;
                }
            } catch (e) {
                if (i < protocolsToTry.length - 1) {
                    // Try next protocol
                } else {
                    // Last protocol failed
                }
                continue;
            }
        }
        dataManipulationUtil.DataManipulation.secureDelete([address]);
        return [null, false];
    }
}
