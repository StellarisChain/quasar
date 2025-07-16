// Browser-compatible data manipulation utility
export class DataManipulation {
    static async scramble(data: Uint8Array, seed: string | Uint8Array | number): Promise<Uint8Array> {
        let seedBytes: Uint8Array;
        if (typeof seed === 'number') {
            seedBytes = new TextEncoder().encode(seed.toString());
        } else if (typeof seed === 'string') {
            seedBytes = new TextEncoder().encode(seed);
        } else {
            seedBytes = seed;
        }
        const hashBuffer = await window.crypto.subtle.digest('SHA-256', seedBytes);
        const hash = new Uint8Array(hashBuffer);
        const indices = Array.from(Array(data.length).keys());
        for (let i = indices.length - 1; i > 0; i--) {
            const j = hash[i % hash.length] % (i + 1);
            [indices[i], indices[j]] = [indices[j], indices[i]];
        }
        const scrambledData = new Uint8Array(data.length);
        for (let i = 0; i < indices.length; i++) {
            scrambledData[indices[i]] = data[i];
        }
        return scrambledData;
    }

    static async descramble(scrambledData: Uint8Array, seed: string | Uint8Array | number): Promise<Uint8Array> {
        let seedBytes: Uint8Array;
        if (typeof seed === 'number') {
            seedBytes = new TextEncoder().encode(seed.toString());
        } else if (typeof seed === 'string') {
            seedBytes = new TextEncoder().encode(seed);
        } else {
            seedBytes = seed;
        }
        const hashBuffer = await window.crypto.subtle.digest('SHA-256', seedBytes);
        const hash = new Uint8Array(hashBuffer);
        const indices = Array.from(Array(scrambledData.length).keys());
        for (let i = indices.length - 1; i > 0; i--) {
            const j = hash[i % hash.length] % (i + 1);
            [indices[i], indices[j]] = [indices[j], indices[i]];
        }
        const data = new Uint8Array(scrambledData.length);
        for (let i = 0; i < indices.length; i++) {
            data[i] = scrambledData[indices[i]];
        }
        return data;
    }

    static async updateOrResetAttempts(
        data: any,
        hmacSalt: string,
        passwordVerified: boolean,
        deterministic: boolean
    ): Promise<any> {
        // Stub: implement browser logic for failed attempts tracking (e.g., in-memory or localStorage)
        return data;
    }

    static secureDelete(vars: any[]): void {
        // No-op in browser
    }
}