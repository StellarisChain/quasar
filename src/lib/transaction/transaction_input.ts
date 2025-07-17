
import { Decimal } from 'decimal.js';
//import { ec as EC } from 'elliptic';
import { stringToPoint, pointToString, SMALLEST, ENDIAN, ec } from '../wallet_generation_utils';

//const ec = new EC('secp256k1'); // or the curve you use

export class TransactionInput {
    txHash: string;
    index: number;
    privateKey?: string | number | bigint;
    transaction?: any;
    transactionInfo?: any;
    amount?: Decimal;
    publicKey?: ReturnType<typeof ec.keyFromPrivate> | any;
    signed?: { r: string; s: string };

    constructor(
        inputTxHash: string,
        index: number,
        privateKey?: string | number | bigint,
        transaction?: any,
        amount?: Decimal,
        publicKey?: ReturnType<typeof ec.keyFromPrivate> | any
    ) {
        this.txHash = inputTxHash;
        this.index = index;
        this.privateKey = privateKey;
        this.transaction = transaction;
        this.transactionInfo = undefined;
        this.amount = amount;
        this.publicKey = publicKey;
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

    sign(txHex: string, privateKey?: string | number | bigint) {
        const key = ec.keyFromPrivate((privateKey ?? this.privateKey) as string | Buffer);
        const msg = Buffer.from(txHex, 'hex');
        const signature = key.sign(msg);
        this.signed = { r: signature.r.toString('hex'), s: signature.s.toString('hex') };
    }

    async getPublicKey(): Promise<ReturnType<typeof ec.keyFromPrivate> | any | undefined> {
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
        // Accept both EC.KeyPair and EC.Point
        let key;
        if ('getPublic' in publicKey) {
            key = publicKey as ReturnType<typeof ec.keyFromPrivate>;
        } else {
            key = ec.keyFromPublic(publicKey as any);
        }
        return key.verify(msg, { r: this.signed.r, s: this.signed.s });
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