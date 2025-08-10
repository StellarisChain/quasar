// Inprogress: Switching to @noble/curves/p256
import { Decimal } from 'decimal.js';
import { stringToPoint, pointToString, SMALLEST, ENDIAN, intToBytes, curves, CurveType } from '../wallet_generation_utils';

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

    sign(txHex: string, privateKey?: string) {
        const priv = privateKey ?? this.privateKey;
        if (priv === undefined) {
            throw new Error('Private key is required for signing');
        }
        const msg = Buffer.from(txHex, 'hex');
        const curveInstance = curves[this.curve];
        const signature = curveInstance.sign(msg, priv);
        this.signed = {
            r: Buffer.from(intToBytes(signature.r, 32)).toString('hex'),
            s: Buffer.from(intToBytes(signature.s, 32)).toString('hex')
        };
    }

    async getPublicKey(): Promise<Uint8Array | any | undefined> {
        if (this.publicKey) return this.publicKey;
        const address = await this.getAddress();
        return stringToPoint(address);
    }

    toBytes(): Uint8Array {
        const hashBytes = Buffer.from(this.txHash, 'hex');
        const indexBytes = Buffer.alloc(4);
        if (ENDIAN === 'le') {
            indexBytes.writeUInt32LE(this.index, 0);
        } else {
            indexBytes.writeUInt32BE(this.index, 0);
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
        const msg = Buffer.from(inputTx, 'hex');
        // noble-curves expects signature as { r, s } or a 64-byte Uint8Array
        const r = BigInt('0x' + this.signed.r);
        const s = BigInt('0x' + this.signed.s);
        // Convert r and s to 32-byte big-endian Uint8Arrays and concatenate
        const rBytes = Buffer.from(r.toString(16).padStart(64, '0'), 'hex');
        const sBytes = Buffer.from(s.toString(16).padStart(64, '0'), 'hex');
        const signature = Buffer.concat([rBytes, sBytes]);
        try {
            const curveInstance = curves[this.curve];
            return curveInstance.verify(msg, signature, publicKey);
        } catch {
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