// Inprogress: Switching to @noble/curves/p256
import { Decimal } from 'decimal.js';
import { stringToPoint, pointToString, SMALLEST, ENDIAN, intToBytes, bytesToInt, curves, CurveType, sha256 } from '../wallet_generation_utils';

export class TransactionInput {
    txHash: string;
    index: number;
    privateKey?: string;
    transaction?: any;
    transactionInfo?: any;
    amount?: Decimal;
    publicKey?: Uint8Array;
    signed?: { r: string; s: string };
    curve: CurveType;

    constructor(
        inputTxHash: string,
        index: number,
        privateKey?: string,
        transaction?: any,
        amount?: Decimal,
        publicKey?: Uint8Array,
        curve: CurveType = 'secp256k1'
    ) {
        this.txHash = inputTxHash;
        this.index = index;
        this.privateKey = privateKey;
        this.transaction = transaction;
        this.transactionInfo = undefined;
        this.amount = amount;
        this.publicKey = publicKey;
        this.curve = curve;
        if (transaction && amount === undefined) {
            this.getRelatedOutput();
        }
    }

    async getTransaction(): Promise<any> {
        return this.transaction;
    }

    async getTransactionInfo(): Promise<any> {
        if (!this.transactionInfo) throw new Error('transactionInfo is not set');
        return this.transactionInfo;
    }

    async getRelatedOutput(): Promise<any> {
        const tx = await this.getTransaction();
        const relatedOutput = tx.outputs[this.index];
        this.amount = relatedOutput.amount;
        return relatedOutput;
    }

    async getRelatedOutputInfo(): Promise<any> {
        const tx = await this.getTransactionInfo();
        const relatedOutput = {
            address: tx.outputs_addresses[this.index],
            amount: new Decimal(tx.outputs_amounts[this.index]).div(SMALLEST),
        };
        this.amount = relatedOutput.amount;
        return relatedOutput;
    }

    async getAmount(): Promise<Decimal | undefined> {
        if (this.amount === undefined) {
            if (this.transaction) {
                return this.transaction.outputs[this.index].amount;
            } else {
                await this.getRelatedOutputInfo();
            }
        }
        return this.amount;
    }

    async getAddress(): Promise<string> {
        if (this.transaction) {
            return (await this.getRelatedOutput()).address;
        }
        return (await this.getRelatedOutputInfo()).address;
    }

    async sign(txHex: string, privateKey?: string) {
        const priv = privateKey ?? this.privateKey;
        if (priv === undefined) {
            throw new Error('Private key is required for signing');
        }
        console.debug('Signing with txHex:', txHex);
        console.debug('Private key length:', priv.length, 'Public key:', this.publicKey ? Buffer.from(this.publicKey).toString('hex') : 'none');

        const curveInstance = curves[this.curve];

        // Try signing the SHA256 hash of the transaction (common in blockchain systems)
        const hashHex = await sha256(txHex);
        const hashUint8 = new Uint8Array(Buffer.from(hashHex, 'hex'));
        console.debug('Signing SHA256 hash:', hashHex);

        const signature = curveInstance.sign(hashUint8, priv);

        console.debug('Noble-curves signature r:', signature.r.toString(16), 's:', signature.s.toString(16));

        // Apply low-s normalization to match Python fastecdsa behavior
        const n = BigInt('0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364141');
        let r = signature.r;
        let s = signature.s;

        // If s > n/2, use n - s instead (low-s normalization)
        if (s > n / BigInt(2)) {
            s = n - s;
            console.debug('Applied low-s normalization, new s:', s.toString(16));
        }

        // Store signature in little-endian format (32 bytes each) to match Python implementation  
        this.signed = {
            r: Buffer.from(intToBytes(r, 32)).toString('hex'),
            s: Buffer.from(intToBytes(s, 32)).toString('hex')
        };

        console.debug('Generated signature r:', this.signed.r, 's:', this.signed.s);

        if (this.publicKey) {
            console.debug('Public key bytes:', Buffer.from(this.publicKey).toString('hex'));

            try {
                const pubKeyUint8 = new Uint8Array(this.publicKey);

                // Test signature verification with the normalized signature
                const normalizedSig = { r, s };
                const verifyResult = curveInstance.verify(normalizedSig, hashUint8, pubKeyUint8);
                console.debug('Signature verification test:', verifyResult);
            } catch (err) {
                console.debug('Signature verification error:', err);
            }
        }
    }

    async getPublicKey(): Promise<Uint8Array | any | undefined> {
        if (this.publicKey) return this.publicKey;
        const address = await this.getAddress();
        return stringToPoint(address);
    }

    toBytes(): Uint8Array {
        const hashBytes = Buffer.from(this.txHash, 'hex');
        const indexBytes = Buffer.alloc(1);
        if (ENDIAN === 'le') {
            indexBytes.writeUInt8(this.index, 0);
        } else {
            indexBytes.writeUInt8(this.index, 0);
        }
        return Buffer.concat([hashBytes, indexBytes]);
    }

    getSignature(): string | undefined {
        if (!this.signed) return undefined;
        // r and s are hex strings, pad to 32 bytes
        const r = this.signed.r.padStart(64, '0');
        const s = this.signed.s.padStart(64, '0');
        return r + s;
    }

    async verify(inputTx: string): Promise<boolean> {
        let publicKey;
        try {
            publicKey = await this.getPublicKey();
        } catch (e) {
            return false;
        }
        if (!this.signed) return false;

        try {
            const curveInstance = curves[this.curve];

            // Hash the transaction the same way we do during signing
            const hashHex = await sha256(inputTx);
            const msg = new Uint8Array(Buffer.from(hashHex, 'hex'));
            const pubKey = new Uint8Array(publicKey);

            // The signature was stored in little-endian format (matching Python implementation)
            // Convert from little-endian hex strings to BigInt
            const rBytes = Buffer.from(this.signed.r, 'hex');
            const sBytes = Buffer.from(this.signed.s, 'hex');

            // Convert little-endian bytes to BigInt
            const r = bytesToInt(rBytes);
            const s = bytesToInt(sBytes);

            const signature = { r, s };

            return curveInstance.verify(signature, msg, pubKey);
        } catch (e) {
            console.error('Signature verification error:', e);
            return false;
        }
    }

    get asDict(): Record<string, any> {
        const selfDict: Record<string, any> = { ...this };
        selfDict.signed = !!selfDict.signed;
        if ('publicKey' in selfDict && selfDict.publicKey) selfDict.publicKey = pointToString(selfDict.publicKey);
        if ('transaction' in selfDict) delete selfDict.transaction;
        if ('privateKey' in selfDict) delete selfDict.privateKey;
        return selfDict;
    }

    equals(other: TransactionInput): boolean {
        return this.txHash === other.txHash && this.index === other.index;
    }
}