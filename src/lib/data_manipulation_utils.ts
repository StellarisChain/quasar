// data_manipulation_util.ts

import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import * as logging from 'winston'; // Use winston for logging
import { FileLock } from 'proper-lockfile'; // npm install proper-lockfile
import { EncryptDecryptUtils, TOTP } from './cryptographic_util';
import { Verification } from './verification_utils';

export class DataManipulation {
    static dotCount = 0;
    static iterationCount = 0;

    /**
     * Handles data scrambling and descrambling.
     */
    static scramble(data: Buffer, seed: Buffer | number): Buffer {
        if (typeof seed === 'number') {
            seed = Buffer.from(seed.toString());
        }
        const hash = crypto.createHash('sha256').update(seed).digest();
        const rng = crypto.createHash('sha256').update(hash).digest();
        const indices = Array.from(Array(data.length).keys());
        // Shuffle indices using Fisher-Yates
        for (let i = indices.length - 1; i > 0; i--) {
            const j = rng[i % rng.length] % (i + 1);
            [indices[i], indices[j]] = [indices[j], indices[i]];
        }
        const scrambledData = Buffer.alloc(data.length);
        for (let i = 0; i < indices.length; i++) {
            scrambledData[indices[i]] = data[i];
        }
        DataManipulation.secureDelete([data, seed, indices, rng]);
        return scrambledData;
    }

    static descramble(scrambledData: Buffer, seed: Buffer | number): Buffer {
        if (typeof seed === 'number') {
            seed = Buffer.from(seed.toString());
        }
        const hash = crypto.createHash('sha256').update(seed).digest();
        const rng = crypto.createHash('sha256').update(hash).digest();
        const indices = Array.from(Array(scrambledData.length).keys());
        for (let i = indices.length - 1; i > 0; i--) {
            const j = rng[i % rng.length] % (i + 1);
            [indices[i], indices[j]] = [indices[j], indices[i]];
        }
        const data = Buffer.alloc(scrambledData.length);
        for (let i = 0; i < indices.length; i++) {
            data[i] = scrambledData[indices[i]];
        }
        DataManipulation.secureDelete([scrambledData, seed, indices, rng]);
        return data;
    }

    static async updateOrResetAttempts(
        data: any,
        filename: string,
        hmacSalt: string,
        passwordVerified: boolean,
        deterministic: boolean
    ): Promise<any> {
        // Determine the appropriate function to update or reset attempts
        const updateOrReset = passwordVerified
            ? EncryptDecryptUtils.resetFailedAttempts
            : EncryptDecryptUtils.updateFailedAttempts;

        // Define keys to update or reset based on deterministic flag
        const keyList: Array<Array<string>> = [['entry_data', 'entries'], ['totp_secret']];
        if (data.wallet_data.entry_data.imported_entries) {
            keyList.push(['entry_data', 'imported_entries']);
        }
        if (deterministic) {
            keyList.push(['entry_data', 'key_data']);
        }

        let attemptsLeft = 0;
        for (const key of keyList) {
            let targetData = data.wallet_data;
            for (const k of key) {
                targetData = targetData[k] || {};
            }
            if (!Array.isArray(targetData)) {
                targetData = [targetData];
            }
            targetData = targetData.map((entry: any) => Buffer.from(String(entry)));
            const [updatedData, left] = await updateOrReset(targetData, Buffer.from(hmacSalt));
            attemptsLeft = left ?? 0;
            if (key.length === 1) {
                data.wallet_data[key[0]] = updatedData;
            } else {
                data.wallet_data[key[0]][key[1]] = updatedData;
            }
        }

        data.wallet_data.totp_secret = data.wallet_data.totp_secret[0];
        if (!passwordVerified) {
            if (attemptsLeft) {
                console.log(`\nPassword Attempts Left: ${attemptsLeft}`);
            }
            if (attemptsLeft <= 5 && attemptsLeft > 3 && attemptsLeft !== 0) {
                logging.warn(
                    'Password attempts are approaching 0, afterwards any existing wallet data will be erased and potentially unrecoverable!!'
                );
            }
            if (attemptsLeft <= 3 && attemptsLeft !== 0) {
                logging.error(
                    'PASSWORD ATTEMPTS ARE APPROACHING 0, AFTERWARDS ANY EXISTING WALLET DATA WILL BE ERASED AND POTENTIALLY UNRECOVERABLE!!'
                );
            }
            if (attemptsLeft === 0) {
                console.log(`\nPassword Attempts Left: ${attemptsLeft}`);
                await DataManipulation.deleteWallet(filename, data);
                console.log('Wallet data has been permanently erased.');
                await new Promise((resolve) => setTimeout(resolve, 500));
                data = null;
            }
        }
        DataManipulation.secureDelete([data, filename, hmacSalt, passwordVerified, deterministic]);
        return data;
    }

    static secureDelete(vars: any[]): void {
        for (let v of vars) {
            if (Buffer.isBuffer(v)) {
                v.fill(0);
            } else if (typeof v === 'string') {
                v = '0'.repeat(v.length);
            } else if (Array.isArray(v)) {
                v.fill(0);
            } else if (typeof v === 'object' && v !== null) {
                for (const key in v) {
                    v[key] = 0;
                }
            } else {
                v = 0;
            }
        }
    }

    static saveData(filename: string, data: any): void {
        try {
            if (data) {
                fs.writeFileSync(filename, JSON.stringify(data, null, 4));
                DataManipulation.secureDelete([filename, data]);
            } else {
                DataManipulation.secureDelete([filename, data]);
            }
        } catch (e) {
            logging.error(`Error saving data to file: ${e}`);
            DataManipulation.secureDelete([filename, data]);
        }
    }

    static backupWallet(filename: string, directory?: string): boolean | undefined {
        const baseFilename = path.basename(filename);
        const backupName = path.parse(baseFilename).name;
        const backupDir = directory || './wallets/wallet_backups';
        const backupPath =
            path.join(
                backupDir,
                `${backupName}_backup_${new Date().toISOString().replace(/[:.]/g, '-')}.json`
            );
        try {
            fs.copyFileSync(filename, backupPath);
            console.log(`Backup created at: ${backupPath}`);
            DataManipulation.secureDelete([filename, backupPath]);
            return true;
        } catch (e) {
            logging.error(`Could not create backup: ${e}\n`);
            DataManipulation.secureDelete([filename, backupPath]);
            return;
        }
    }

    static overwriteWithPattern(file: fs.WriteStream, pattern: Buffer, fileSize: number): void {
        try {
            let bytesWritten = 0;
            const updateInterval = Math.max(1, fileSize);

            // Get the file descriptor from the WriteStream
            const fd = (file as any).fd;
            if (typeof fd !== 'number') {
                throw new Error('Invalid file descriptor');
            }

            while (bytesWritten < fileSize) {
                const writeSize = Math.min(fileSize - bytesWritten, pattern.length);
                fs.writeSync(fd, pattern, 0, writeSize, bytesWritten);
                bytesWritten += writeSize;

                if (bytesWritten % updateInterval === 0 || bytesWritten === fileSize) {
                    DataManipulation.dotCount += 1;
                    if (DataManipulation.dotCount >= 4) {
                        DataManipulation.dotCount = 0;
                        DataManipulation.iterationCount += 1;
                        if (DataManipulation.iterationCount > 4) {
                            DataManipulation.iterationCount = 1;
                        }
                    }
                    process.stdout.write('\r' + ' '.repeat(50));
                    process.stdout.write(
                        '\rWallet Annihilation in progress' +
                            '.'.repeat(DataManipulation.iterationCount)
                    );
                }
            }
            fs.fsyncSync(fd);
        } catch (e) {
            console.log();
            logging.error(`IOError during file overwrite: ${e}`);
        }
    }

    static DoD_5220_22_M_wipe(file: fs.WriteStream, fileSize: number): void {
        try {
            for (let i = 1; i <= 6; i++) {
                if ([1, 4, 5].includes(i)) {
                    DataManipulation.overwriteWithPattern(
                        file,
                        Buffer.alloc(fileSize, 0x00),
                        fileSize
                    );
                }
                if ([2, 6].includes(i)) {
                    DataManipulation.overwriteWithPattern(
                        file,
                        Buffer.alloc(fileSize, 0xff),
                        fileSize
                    );
                }
                if ([3, 7].includes(i)) {
                    const randomBytes = crypto.randomBytes(fileSize);
                    DataManipulation.overwriteWithPattern(file, randomBytes, fileSize);
                    DataManipulation.overwriteWithPattern(file, crypto.randomBytes(64), fileSize);
                }
            }
        } catch (e) {
            console.log();
            logging.error(`Error during DoD 5220.22-M Wipe: ${e}`);
        }
    }

    static Schneier_wipe(file: fs.WriteStream, fileSize: number): void {
        try {
            for (let i = 1; i <= 6; i++) {
                if (i === 1) {
                    DataManipulation.overwriteWithPattern(
                        file,
                        Buffer.alloc(fileSize, 0x00),
                        fileSize
                    );
                }
                if (i === 2) {
                    DataManipulation.overwriteWithPattern(
                        file,
                        Buffer.alloc(fileSize, 0xff),
                        fileSize
                    );
                }
                if ([3, 4, 5, 6, 7].includes(i)) {
                    const randomBytes = crypto.randomBytes(fileSize);
                    DataManipulation.overwriteWithPattern(file, randomBytes, fileSize);
                    DataManipulation.overwriteWithPattern(file, crypto.randomBytes(64), fileSize);
                }
            }
        } catch (e) {
            console.log();
            logging.error(`Error during Schneier Wipe: ${e}`);
        }
    }

    static Gutmann_wipe(file: fs.WriteStream, fileSize: number): void {
        try {
            for (let i = 1; i <= 34; i++) {
                let pattern: Buffer;
                if ([1, 2, 3, 4, 32, 33, 34, 35].includes(i)) {
                    pattern = crypto.randomBytes(fileSize);
                } else {
                    const patterns = [
                        Buffer.from([0x55, 0x55, 0x55]),
                        Buffer.from([0xaa, 0xaa, 0xaa]),
                        Buffer.from([0x92, 0x49, 0x24]),
                        Buffer.from([0x49, 0x24, 0x92]),
                        Buffer.from([0x24, 0x92, 0x49]),
                        Buffer.from([0x00, 0x00, 0x00]),
                        Buffer.from([0x11, 0x11, 0x11]),
                        Buffer.from([0x22, 0x22, 0x22]),
                        Buffer.from([0x33, 0x33, 0x33]),
                        Buffer.from([0x44, 0x44, 0x44]),
                        Buffer.from([0x55, 0x55, 0x55]),
                        Buffer.from([0x66, 0x66, 0x66]),
                        Buffer.from([0x77, 0x77, 0x77]),
                        Buffer.from([0x88, 0x88, 0x88]),
                        Buffer.from([0x99, 0x99, 0x99]),
                        Buffer.from([0xaa, 0xaa, 0xaa]),
                        Buffer.from([0xbb, 0xbb, 0xbb]),
                        Buffer.from([0xcc, 0xcc, 0xcc]),
                        Buffer.from([0xdd, 0xdd, 0xdd]),
                        Buffer.from([0xee, 0xee, 0xee]),
                        Buffer.from([0xff, 0xff, 0xff]),
                        Buffer.from([0x92, 0x49, 0x24]),
                        Buffer.from([0x49, 0x24, 0x92]),
                        Buffer.from([0x24, 0x92, 0x49]),
                        Buffer.from([0x6d, 0xb6, 0xdb]),
                        Buffer.from([0xb6, 0xdb, 0x6d]),
                        Buffer.from([0xdb, 0x6d, 0xb6]),
                    ];
                    pattern = patterns[i - 5];
                }
                const patternLength = pattern.length;
                const repeatCount = Math.floor(fileSize / patternLength);
                const remainder = fileSize % patternLength;
                const finalPattern = Buffer.concat([
                    Buffer.alloc(repeatCount * patternLength, pattern),
                    pattern.slice(0, remainder),
                ]);
                DataManipulation.overwriteWithPattern(file, finalPattern, fileSize);
            }
        } catch (e) {
            console.log();
            logging.error(`Error during Gutmann Wipe: ${e}`);
        }
    }

    static async walletAnnihilation(
        filename: string,
        file: fs.WriteStream,
        data: any,
        fileSize: number
    ): Promise<void> {
        try {
            const hmacSalt = crypto.createHash('sha3-512').digest();
            const verificationSalt = crypto.createHash('sha3-512').digest();
            const password = crypto.createHash('sha3-512').digest('hex');
            const verifier = await Verification.hashPassword(password, verificationSalt);
            const totpSecret = TOTP.generateTotpSecret(true, Buffer.from(verificationSalt));
            const encryptedData = await EncryptDecryptUtils.encryptData(
                String(data),
                password,
                totpSecret,
                hmacSalt,
                verificationSalt,
                verifier
            );
            DataManipulation.saveData(filename, encryptedData);
            await new Promise((resolve) => setTimeout(resolve, 500));

            const randomBytes = crypto.randomBytes(fileSize);
            DataManipulation.overwriteWithPattern(file, randomBytes, fileSize);
            await new Promise((resolve) => setTimeout(resolve, 100));

            DataManipulation.DoD_5220_22_M_wipe(file, fileSize);
            await new Promise((resolve) => setTimeout(resolve, 100));

            DataManipulation.Schneier_wipe(file, fileSize);
            await new Promise((resolve) => setTimeout(resolve, 100));

            DataManipulation.Gutmann_wipe(file, fileSize);
        } catch (e) {
            console.log();
            logging.error(`Error during Wallet Annihilation: ${e}`);
        }
    }

    static async deleteWallet(filePath: string, data: any, passes = 1): Promise<void> {
        if (!fs.existsSync(filePath)) {
            throw new Error('File does not exist');
        }
        const lockPath = filePath + '.lock';
        try {
            FileLock.lockSync(filePath);
            const file = fs.openSync(filePath, 'r+');
            const fileSize = fs.statSync(filePath).size;
            if (fileSize === 0) {
                throw new Error('File is empty');
            }
            for (let i = 0; i < passes; i++) {
                await DataManipulation.walletAnnihilation(filePath, fs.createWriteStream(filePath), data, fileSize);
                fs.fsyncSync(file);
            }
            fs.truncateSync(filePath, 0);
            FileLock.unlockSync(filePath);
        } catch (e) {
            console.log();
            logging.error(`Error during file overwrite: ${e}`);
        } finally {
            FileLock.unlockSync(filePath);
        }
        try {
            await new Promise((resolve) => setTimeout(resolve, 500));
            fs.unlinkSync(filePath);
            if (fs.existsSync(lockPath)) {
                fs.unlinkSync(lockPath);
            }
            process.stdout.write('\rWallet Annihilation in progress....');
            console.log();
        } catch (e) {
            console.log();
            logging.error(`Error while removing file: ${e}`);
        }
    }
}