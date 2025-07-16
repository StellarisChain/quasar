import crypto from 'crypto';
import * as base64js from 'base64-js';
import * as dataManipulationUtil from './data_manipulation_utils';
import * as verificationUtil from './verification_utils';

// Global variables
let FAILED_ATTEMPTS = 0;
const MAX_ATTEMPTS = 5;
let DIFFICULTY = 3;

export class ProofOfWork {
    /**
     * Handles proof-of-work generation and validation.
     */
    static generateProof(challenge: Buffer): number {
        let proof = 0;
        const target = '1'.repeat(DIFFICULTY);
        while (!crypto.createHash('sha256').update(Buffer.concat([challenge, Buffer.from(proof.toString())])).digest('hex').startsWith(target)) {
            proof++;
        }
        dataManipulationUtil.DataManipulation.secureDelete([proof]);
        return proof;
    }

    static isProofValid(proof: number, challenge: Buffer): boolean {
        const result = crypto.createHash('sha256').update(Buffer.concat([challenge, Buffer.from(proof.toString())])).digest('hex').startsWith('1'.repeat(DIFFICULTY));
        dataManipulationUtil.DataManipulation.secureDelete([result]);
        return result;
    }
}

export class TOTP {
    static generateTotpSecret(predictable: boolean, verificationSalt: Buffer): string {
        if (!predictable) {
            // Use a secure random base32 string generator for production
            // Here, we use 20 random bytes and encode as base32 (use a library for real base32)
            const result = crypto.randomBytes(20).toString('base64'); // Replace with base32 if needed
            dataManipulationUtil.DataManipulation.secureDelete([result]);
            return result;
        } else {
            const result = crypto.createHash('sha256').update(verificationSalt).digest('hex').slice(0, 16);
            dataManipulationUtil.DataManipulation.secureDelete([result]);
            return result;
        }
    }

    static generateTotpCode(secret: string): string {
        // Use a TOTP library for production, e.g. otplib
        const otplib = require('otplib');
        const totp = otplib.authenticator;
        totp.options = { step: 30, digits: 6 };
        const result = totp.generate(secret);
        dataManipulationUtil.DataManipulation.secureDelete([result]);
        return result;
    }
}

export class EncryptDecryptUtils {
    static aesGcmEncrypt(data: Buffer, key: Buffer, nonce: Buffer): { ciphertext: Buffer, tag: Buffer } {
        const cipher = crypto.createCipheriv('aes-256-gcm', key, nonce);
        const ciphertext = Buffer.concat([cipher.update(data), cipher.final()]);
        const tag = cipher.getAuthTag();
        const result = { ciphertext, tag };
        dataManipulationUtil.DataManipulation.secureDelete([result]);
        return result;
    }

    static aesGcmDecrypt(ciphertext: Buffer, tag: Buffer, key: Buffer, nonce: Buffer): Buffer {
        const decipher = crypto.createDecipheriv('aes-256-gcm', key, nonce);
        decipher.setAuthTag(tag);
        const result = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
        return result;
    }

    static chacha20Poly1305Encrypt(data: Buffer, key: Buffer): { nonce: Buffer, ciphertext: Buffer, tag: Buffer } {
        const nonce = crypto.randomBytes(12);
        const cipher = crypto.createCipheriv('chacha20-poly1305', key, nonce, { authTagLength: 16 });
        const ciphertext = Buffer.concat([cipher.update(data), cipher.final()]);
        const tag = cipher.getAuthTag();
        const result = { nonce, ciphertext, tag };
        dataManipulationUtil.DataManipulation.secureDelete([result]);
        return result;
    }

    static chacha20Poly1305Decrypt(nonce: Buffer, ciphertext: Buffer, tag: Buffer, decryptionKey: Buffer): Buffer {
        const decipher = crypto.createDecipheriv('chacha20-poly1305', decryptionKey, nonce, { authTagLength: 16 });
        decipher.setAuthTag(tag);
        let decryptedData: Buffer;
        try {
            decryptedData = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
            dataManipulationUtil.DataManipulation.secureDelete([decryptedData]);
            return decryptedData;
        } catch (e) {
            console.error('ChaCha20-Poly1305 tag verification failed. Data might be corrupted or tampered with.');
            dataManipulationUtil.DataManipulation.secureDelete([]);
            throw new Error('ChaCha20-Poly1305 tag verification failed. Data might be corrupted or tampered with.');
        }
    }

    static async encryptData(
        data: string,
        password: string,
        totpSecret: string,
        hmacSalt: Buffer,
        verificationSalt: Buffer,
        storedPasswordHash: Buffer
    ): Promise<string> {
        // 1. Password Verification
        const [passwordVerified, verifier] = await verificationUtil.Verification.verifyPassword(storedPasswordHash, password, verificationSalt);
        if (!passwordVerified && !verifier) {
            dataManipulationUtil.DataManipulation.secureDelete([]);
            throw new Error('Authentication failed or wallet data is corrupted.');
        }

        // 2. AES-GCM Layer Encryption
        const aesChallengePortion = crypto.randomBytes(16);
        const aesChallengePortionProof = ProofOfWork.generateProof(aesChallengePortion);
        const scrambledAesChallengePortion = dataManipulationUtil.DataManipulation.scramble(aesChallengePortion, aesChallengePortionProof);
        const aesProof = ProofOfWork.generateProof(scrambledAesChallengePortion);
        const aesCommitment = crypto.createHash('sha256').update(Buffer.from(aesProof.toString())).digest();
        const aesCommitmentHex = aesCommitment.toString('hex');
        const scrambledParameters = [password, totpSecret, aesCommitmentHex, hmacSalt, verifier, verificationSalt].map(param =>
            dataManipulationUtil.DataManipulation.scramble(typeof param === 'string' ? Buffer.from(param) : (param ?? Buffer.alloc(0)), aesProof)
        );
        const aesEncryptionKey = crypto.scryptSync(Buffer.concat(scrambledParameters), scrambledParameters[scrambledParameters.length - 1], 32, { N: 16384, r: 8, p: 1 });
        const aesNonce = crypto.randomBytes(16);
        const scrambledData = dataManipulationUtil.DataManipulation.scramble(Buffer.from(data), aesProof);
        const { ciphertext: aesCtBytes, tag: aesTag } = EncryptDecryptUtils.aesGcmEncrypt(scrambledData, aesEncryptionKey, aesNonce);
        const scrambledAesCtBytes = dataManipulationUtil.DataManipulation.scramble(aesCtBytes, aesProof);
        const scrambledAesTag = dataManipulationUtil.DataManipulation.scramble(aesTag, aesProof);
        const hmac1 = await verificationUtil.Verification.hmacUtil({
            password: scrambledParameters[0].toString(),
            hmacSalt: scrambledParameters[3],
            hmacMsg: Buffer.concat([aesNonce, scrambledAesCtBytes, scrambledAesTag]),
            verify: false
        });

        // 3. ChaCha20-Poly1305 Layer Encryption
        const chachaChallengePortion = crypto.randomBytes(16);
        const chachaChallengePortionProof = ProofOfWork.generateProof(chachaChallengePortion);
        const scrambledChachaChallengePortion = dataManipulationUtil.DataManipulation.scramble(chachaChallengePortion, chachaChallengePortionProof);
        const chachaProof = ProofOfWork.generateProof(scrambledChachaChallengePortion);
        const chachaCommitment = crypto.createHash('sha256').update(Buffer.from(chachaProof.toString())).digest();
        const chachaCommitmentHex = chachaCommitment.toString('hex');
        const scrambledChachaParameters = [password, totpSecret, chachaCommitmentHex, hmacSalt, verifier, verificationSalt].map(param =>
            dataManipulationUtil.DataManipulation.scramble(typeof param === 'string' ? Buffer.from(param) : (param ?? Buffer.alloc(0)), chachaProof)
        );
        const chachaEncryptionKey = crypto.scryptSync(Buffer.concat(scrambledChachaParameters), scrambledChachaParameters[scrambledChachaParameters.length - 1], 32, { N: 16384, r: 8, p: 1 });
        const { nonce: chachaNonce, ciphertext: chachaCtBytes, tag: chachaTag } = EncryptDecryptUtils.chacha20Poly1305Encrypt(
            Buffer.concat([aesChallengePortion, aesNonce, scrambledAesCtBytes, scrambledAesTag, Buffer.isBuffer(hmac1) ? hmac1 : Buffer.alloc(32, 0)]),
            chachaEncryptionKey
        );
        const scrambledChachaCtBytes = dataManipulationUtil.DataManipulation.scramble(chachaCtBytes, chachaProof);
        const scrambledChachaTag = dataManipulationUtil.DataManipulation.scramble(chachaTag, chachaProof);
        const hmac2Raw = await verificationUtil.Verification.hmacUtil({
            password: chachaCommitmentHex,
            hmacSalt: scrambledChachaParameters[3],
            hmacMsg: Buffer.concat([chachaNonce, scrambledChachaCtBytes, scrambledChachaTag]),
            verify: false
        });
        // Ensure hmac2 is a Buffer, not a boolean
        const hmac2 = Buffer.isBuffer(hmac2Raw) ? hmac2Raw : Buffer.alloc(32, 0); // fallback to zeroed buffer if not a Buffer
        const failedAttempts = 0;
        const failedAttemptsBytes = Buffer.alloc(4);
        failedAttemptsBytes.writeUInt32BE(failedAttempts, 0);
        const scrambledBuffer = dataManipulationUtil.DataManipulation.scramble(Buffer.concat([
            chachaChallengePortion, chachaNonce, scrambledChachaCtBytes, scrambledChachaTag, hmac2
        ]), failedAttemptsBytes);

        // Ensure scrambledBuffer is a Uint8Array (Buffer) before passing to fromByteArray
        const resultBase64 = base64js.fromByteArray(
            (scrambledBuffer instanceof Uint8Array) ? scrambledBuffer : Buffer.from([])
        );
        dataManipulationUtil.DataManipulation.secureDelete([resultBase64]);
        return resultBase64;
    }

    static async decryptData(
        encryptedData: string,
        password: string,
        totpSecret: string,
        hmacSalt: Buffer,
        verificationSalt: Buffer,
        storedPasswordHash: Buffer
    ): Promise<string> {
        // 1. Base64 Decoding
        let data = Buffer.from(encryptedData, 'base64');

        // 2. Password Verification
        const [passwordVerified, verifier] = await verificationUtil.Verification.verifyPassword(storedPasswordHash, password, verificationSalt);
        if (!passwordVerified && !verifier) {
            dataManipulationUtil.DataManipulation.secureDelete([]);
            throw new Error('Authentication failed or wallet data is corrupted.');
        } else {
            const failedAttempts = 0;
            const failedAttemptsBytes = Buffer.alloc(4);
            failedAttemptsBytes.writeUInt32BE(failedAttempts, 0);
            data = dataManipulationUtil.DataManipulation.descramble(data, failedAttemptsBytes);
        }

        // 3. ChaCha20-Poly1305 Layer Decryption
        const chachaChallengePortion = data.slice(0, 16);
        const chachaNonce = data.slice(16, 28);
        const scrambledChachaCtBytes = data.slice(28, -48);
        const scrambledChachaTag = data.slice(-48, -32);
        const storedChachaHmac = data.slice(-32);

        const chachaChallengePortionProof = ProofOfWork.generateProof(chachaChallengePortion);
        if (!ProofOfWork.isProofValid(chachaChallengePortionProof, chachaChallengePortion)) {
            FAILED_ATTEMPTS++;
            if (FAILED_ATTEMPTS >= MAX_ATTEMPTS) {
                dataManipulationUtil.DataManipulation.secureDelete([]);
                throw new Error('Too many failed attempts. Data deleted.');
            }
            DIFFICULTY++;
            dataManipulationUtil.DataManipulation.secureDelete([]);
            throw new Error('Invalid ChaCha Challenge proof. Try again.');
        }
        const scrambledChachaChallengePortion = dataManipulationUtil.DataManipulation.scramble(chachaChallengePortion, chachaChallengePortionProof);
        const chachaProof = ProofOfWork.generateProof(scrambledChachaChallengePortion);
        if (!ProofOfWork.isProofValid(chachaProof, scrambledChachaChallengePortion)) {
            FAILED_ATTEMPTS++;
            if (FAILED_ATTEMPTS >= MAX_ATTEMPTS) {
                dataManipulationUtil.DataManipulation.secureDelete([]);
                throw new Error('Too many failed attempts. Data deleted.');
            }
            DIFFICULTY++;
            dataManipulationUtil.DataManipulation.secureDelete([]);
            throw new Error('Invalid ChaCha proof. Try again.');
        }
        const chachaCommitmentHex = crypto.createHash('sha256').update(Buffer.from(chachaProof.toString())).digest('hex');
        const scrambledParameters = [password, totpSecret, chachaCommitmentHex, hmacSalt, verifier, verificationSalt].map(param =>
            dataManipulationUtil.DataManipulation.scramble(typeof param === 'string' ? Buffer.from(param) : (param ?? Buffer.alloc(0)), chachaProof)
        );
        if (!await verificationUtil.Verification.hmacUtil({
            password: chachaCommitmentHex,
            hmacSalt: scrambledParameters[3],
            storedHmac: storedChachaHmac,
            hmacMsg: Buffer.concat([chachaNonce, scrambledChachaCtBytes, scrambledChachaTag]),
            verify: true
        })) {
            dataManipulationUtil.DataManipulation.secureDelete([]);
            throw new Error('ChaCha layer data integrity check failed. Wallet data might be corrupted or tampered with.');
        }
        const chachaDecryptionKey = crypto.scryptSync(Buffer.concat(scrambledParameters), scrambledParameters[scrambledParameters.length - 1], 32, { N: 16384, r: 8, p: 1 });
        const chachaCtBytes = dataManipulationUtil.DataManipulation.descramble(scrambledChachaCtBytes, chachaProof);
        const chachaTag = dataManipulationUtil.DataManipulation.descramble(scrambledChachaTag, chachaProof);
        const chachaDecryptedData = EncryptDecryptUtils.chacha20Poly1305Decrypt(chachaNonce, chachaCtBytes, chachaTag, chachaDecryptionKey);

        // 4. AES-GCM Layer Decryption
        let offset = 0;
        const aesChallengePortion = chachaDecryptedData.slice(offset, offset + 16); offset += 16;
        const aesNonce = chachaDecryptedData.slice(offset, offset + 16); offset += 16;
        const scrambledAesCtBytes = chachaDecryptedData.slice(offset, chachaDecryptedData.length - 48);
        const scrambledAesTag = chachaDecryptedData.slice(chachaDecryptedData.length - 48, chachaDecryptedData.length - 32);
        const storedAesHmac = chachaDecryptedData.slice(chachaDecryptedData.length - 32);

        const aesChallengePortionProof = ProofOfWork.generateProof(aesChallengePortion);
        if (!ProofOfWork.isProofValid(aesChallengePortionProof, aesChallengePortion)) {
            FAILED_ATTEMPTS++;
            if (FAILED_ATTEMPTS >= MAX_ATTEMPTS) {
                dataManipulationUtil.DataManipulation.secureDelete([]);
                throw new Error('Too many failed attempts. Data deleted.');
            }
            DIFFICULTY++;
            dataManipulationUtil.DataManipulation.secureDelete([]);
            throw new Error('Invalid AES Challenge proof. Try again.');
        }
        const scrambledAesChallengePortion = dataManipulationUtil.DataManipulation.scramble(aesChallengePortion, aesChallengePortionProof);
        const aesProof = ProofOfWork.generateProof(scrambledAesChallengePortion);
        if (!ProofOfWork.isProofValid(aesProof, scrambledAesChallengePortion)) {
            FAILED_ATTEMPTS++;
            if (FAILED_ATTEMPTS >= MAX_ATTEMPTS) {
                dataManipulationUtil.DataManipulation.secureDelete([]);
                throw new Error('Too many failed attempts. Data deleted.');
            }
            DIFFICULTY++;
            dataManipulationUtil.DataManipulation.secureDelete([]);
            throw new Error('Invalid AES proof. Try again.');
        }
        const aesCommitmentHex = crypto.createHash('sha256').update(Buffer.from(aesProof.toString())).digest('hex');
        const aesScrambledParameters = [password, totpSecret, aesCommitmentHex, hmacSalt, verifier, verificationSalt].map(param =>
            dataManipulationUtil.DataManipulation.scramble(typeof param === 'string' ? Buffer.from(param) : (param ?? Buffer.alloc(0)), aesProof)
        );
        if (!await verificationUtil.Verification.hmacUtil({
                password: aesScrambledParameters[0].toString(),
                hmacSalt: aesScrambledParameters[3],
                storedHmac: storedAesHmac,
                hmacMsg: Buffer.concat([aesNonce, scrambledAesCtBytes, scrambledAesTag]),
                verify: true
            })
        ) {
            dataManipulationUtil.DataManipulation.secureDelete([]);
            throw new Error('AES layer data integrity check failed. Wallet data might be corrupted or tampered with.');
        }
        const aesDecryptionKey = crypto.scryptSync(Buffer.concat(aesScrambledParameters), aesScrambledParameters[aesScrambledParameters.length - 1], 32, { N: 16384, r: 8, p: 1 });
        const aesCtBytes = dataManipulationUtil.DataManipulation.descramble(scrambledAesCtBytes, aesProof);
        const aesTag = dataManipulationUtil.DataManipulation.descramble(scrambledAesTag, aesProof);
        let decryptedData = EncryptDecryptUtils.aesGcmDecrypt(aesCtBytes, aesTag, aesDecryptionKey, aesNonce);
        decryptedData = dataManipulationUtil.DataManipulation.descramble(decryptedData, aesProof);
        const result = decryptedData.toString('utf-8');
        dataManipulationUtil.DataManipulation.secureDelete([result]);
        return result;
    }

    static async getFailedAttempts(data: Buffer, hmacSalt: Buffer): Promise<[Buffer, number]> {
        let numberOfAttempts = 0;
        let descrambledData: Buffer = data;
        for (let n = 0; n < 10; n++) {
            descrambledData = dataManipulationUtil.DataManipulation.descramble(data, Buffer.alloc(4, n));
            const chachaChallengePortion = descrambledData.slice(0, 16);
            const chachaNonce = descrambledData.slice(16, 28);
            const scrambledChachaCtBytes = descrambledData.slice(28, -48);
            const scrambledChachaTag = descrambledData.slice(-48, -32);
            const storedChachaHmac = descrambledData.slice(-32);
            const chachaChallengePortionProof = ProofOfWork.generateProof(chachaChallengePortion);
            const scrambledChachaChallengePortion = dataManipulationUtil.DataManipulation.scramble(chachaChallengePortion, chachaChallengePortionProof);
            const chachaProof = ProofOfWork.generateProof(scrambledChachaChallengePortion);
            const chachaCommitment = crypto.createHash('sha256').update(Buffer.from(chachaProof.toString())).digest();
            const chachaCommitmentHex = chachaCommitment.toString('hex');
            const hmacValid = await verificationUtil.Verification.hmacUtil({
                password: chachaCommitmentHex,
                hmacSalt: dataManipulationUtil.DataManipulation.scramble(hmacSalt, chachaProof),
                storedHmac: storedChachaHmac,
                hmacMsg: Buffer.concat([chachaNonce, scrambledChachaCtBytes, scrambledChachaTag]),
                verify: true
            });
            if (hmacValid) {
                numberOfAttempts = n;
                break;
            }
        }
        return [descrambledData, numberOfAttempts];
    }

    static async updateFailedAttempts(encryptedData: string[], hmacSalt: Buffer): Promise<[string[], number]> {
        const updatedData: string[] = [];
        let attemptsLeft = 10;
        for (const encryptedEntry of encryptedData) {
            const data = Buffer.from(encryptedEntry, 'base64');
            const [descrambledData, numberOfAttempts] = await EncryptDecryptUtils.getFailedAttempts(data, hmacSalt);
            const newAttempts = numberOfAttempts + 1;
            attemptsLeft = 10 - newAttempts;
            const rescrambledData = dataManipulationUtil.DataManipulation.scramble(descrambledData, Buffer.alloc(4, newAttempts));
            const updatedEncryptedDataBase64 = rescrambledData.toString('base64');
            updatedData.push(updatedEncryptedDataBase64);
        }
        dataManipulationUtil.DataManipulation.secureDelete([updatedData]);
        return [updatedData, attemptsLeft];
    }

    static async resetFailedAttempts(encryptedData: string[], hmacSalt: Buffer): Promise<[string[], null]> {
        const updatedData: string[] = [];
        for (const encryptedEntry of encryptedData) {
            const data = Buffer.from(encryptedEntry, 'base64');
            const [descrambledData, _numberOfAttempts] = await EncryptDecryptUtils.getFailedAttempts(data, hmacSalt);
            const rescrambledData = dataManipulationUtil.DataManipulation.scramble(descrambledData, Buffer.alloc(4, 0));
            const updatedEncryptedDataBase64 = rescrambledData.toString('base64');
            updatedData.push(updatedEncryptedDataBase64);
        }
        dataManipulationUtil.DataManipulation.secureDelete([updatedData]);
        return [updatedData, null];
    }
}