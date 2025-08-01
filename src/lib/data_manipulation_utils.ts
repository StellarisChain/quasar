// Browser-compatible data manipulation utility
export class DataManipulation {
    static dotCount = 0;
    static iterationCount = 0;

    static async scramble(data: Uint8Array, seed: string | Uint8Array | number): Promise<Uint8Array> {
        let seedBytes: Uint8Array;
        if (typeof seed === 'number') {
            // Convert number to bytes (big endian)
            const hex = seed.toString(16);
            const paddedHex = hex.length % 2 === 0 ? hex : '0' + hex;
            seedBytes = new Uint8Array(paddedHex.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)));
        } else if (typeof seed === 'string') {
            seedBytes = new TextEncoder().encode(seed);
        } else {
            seedBytes = seed;
        }

        // Generate hash for seeding the randomization
        const hashBuffer = await window.crypto.subtle.digest('SHA-256', seedBytes);
        const hash = new Uint8Array(hashBuffer);

        // Create indices array and shuffle using hash-based pseudo-random
        const indices = Array.from(Array(data.length).keys());
        let hashIndex = 0;

        // Fisher-Yates shuffle using hash values
        for (let i = indices.length - 1; i > 0; i--) {
            const hashValue = hash[hashIndex % hash.length];
            hashIndex++;
            const j = hashValue % (i + 1);
            [indices[i], indices[j]] = [indices[j], indices[i]];
        }

        // Create scrambled data
        const scrambledData = new Uint8Array(data.length);
        for (let i = 0; i < indices.length; i++) {
            scrambledData[indices[i]] = data[i];
        }

        return scrambledData;
    }

    static async descramble(scrambledData: Uint8Array, seed: string | Uint8Array | number): Promise<Uint8Array> {
        let seedBytes: Uint8Array;
        if (typeof seed === 'number') {
            // Convert number to bytes (big endian)
            const hex = seed.toString(16);
            const paddedHex = hex.length % 2 === 0 ? hex : '0' + hex;
            seedBytes = new Uint8Array(paddedHex.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)));
        } else if (typeof seed === 'string') {
            seedBytes = new TextEncoder().encode(seed);
        } else {
            seedBytes = seed;
        }

        // Generate hash for seeding the randomization
        const hashBuffer = await window.crypto.subtle.digest('SHA-256', seedBytes);
        const hash = new Uint8Array(hashBuffer);

        // Recreate the same shuffle pattern
        const indices = Array.from(Array(scrambledData.length).keys());
        let hashIndex = 0;

        // Fisher-Yates shuffle using hash values (same as scramble)
        for (let i = indices.length - 1; i > 0; i--) {
            const hashValue = hash[hashIndex % hash.length];
            hashIndex++;
            const j = hashValue % (i + 1);
            [indices[i], indices[j]] = [indices[j], indices[i]];
        }

        // Reverse the scrambling
        const data = new Uint8Array(scrambledData.length);
        for (let i = 0; i < indices.length; i++) {
            data[i] = scrambledData[indices[i]];
        }

        return data;
    }

    static async updateOrResetAttempts(
        data: any,
        filename: string,
        hmacSalt: string | Uint8Array,
        passwordVerified: boolean,
        deterministic: boolean
    ): Promise<[any, number]> {
        // In browser environment, we'll use localStorage to track failed attempts
        // This is a simplified version - in production you might want more sophisticated tracking

        const attemptKey = `stellaris_attempts_${filename}`;
        let attemptsLeft = 5; // MAX_ATTEMPTS = 5 from Python

        if (!passwordVerified) {
            // Increment failed attempts
            const currentAttempts = parseInt(localStorage.getItem(attemptKey) || '0');
            const newAttempts = currentAttempts + 1;
            localStorage.setItem(attemptKey, newAttempts.toString());
            attemptsLeft = Math.max(0, 5 - newAttempts);

            if (attemptsLeft <= 0) {
                console.error('Maximum login attempts exceeded');
                // In Python version, this would trigger wallet lockout/scrambling
            }
        } else {
            // Reset failed attempts on successful verification
            localStorage.removeItem(attemptKey);
            attemptsLeft = 5;
        }

        // Define keys to update or reset based on deterministic flag (matching Python logic)
        const keyList: string[][] = [["entry_data", "entries"], ["totp_secret"]];
        if (data.wallet_data.entry_data.imported_entries) {
            keyList.push(["entry_data", "imported_entries"]);
        }
        if (deterministic) {
            keyList.push(["entry_data", "key_data"]);
        }

        // In browser version, we don't actually encrypt/decrypt the data like Python
        // This is a placeholder for where that logic would go
        console.warn('Attempt tracking implemented, but data encryption/decryption not yet available in browser version');

        return [data, attemptsLeft];
    }

    static secureDelete(vars: any[]): void {
        // In browser environment, we can't truly secure delete memory
        // This is a no-op but kept for API compatibility with Python version
        // In the Python version, this would overwrite memory with random data

        // For TypeScript/JavaScript, we can at least null out the references
        for (let i = 0; i < vars.length; i++) {
            if (vars[i] && typeof vars[i] === 'object') {
                try {
                    if (vars[i] instanceof Uint8Array || vars[i] instanceof ArrayBuffer) {
                        // For typed arrays, we can at least fill with zeros
                        if (vars[i] instanceof Uint8Array) {
                            vars[i].fill(0);
                        }
                    }
                    vars[i] = null;
                } catch (e) {
                    // Ignore errors during cleanup
                }
            }
        }
    }
}