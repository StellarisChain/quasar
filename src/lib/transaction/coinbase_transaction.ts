
import { sha256, ENDIAN } from '../wallet_generation_utils';
import { TransactionOutput } from './transaction_outputs';
import { Decimal } from 'decimal.js';

export class CoinbaseTransaction {
    private _hex: string | null = null;
    public blockHash: string;
    public address: string;
    public amount: Decimal;
    public outputs: TransactionOutput[];

    constructor(blockHash: string, address: string, amount: Decimal) {
        this.blockHash = blockHash;
        this.address = address;
        this.amount = amount;
        this.outputs = [new TransactionOutput(address, amount)];
    }

    // async verify() {
    //     // Implement verification logic if needed
    // }

    hex(): string {
        if (this._hex !== null) {
            return this._hex;
        }
        // Convert blockHash (hex string) to bytes, append 0 as 1 byte (ENDIAN)
        const blockHashBytes = Buffer.from(this.blockHash, 'hex');
        // Use ENDIAN for the zero byte
        let zeroByte: Buffer;
        if (ENDIAN === 'le') {
            zeroByte = Buffer.from([0]);
        } else {
            zeroByte = Buffer.from([0]); // For 'be', still a single zero byte, but logic can be extended for multi-byte
        }
        const inputBytes = Buffer.concat([blockHashBytes, zeroByte]);
        const hexInputs = inputBytes.toString('hex');
        const hexOutputs = this.outputs.map(txOutput => Buffer.from(txOutput.toBytes()).toString('hex')).join('');

        let version: number;
        if (this.outputs.every(txOutput => txOutput.addressBytes.length === 64)) {
            version = 1;
        } else if (this.outputs.every(txOutput => txOutput.addressBytes.length === 33)) {
            version = 2;
        } else {
            throw new Error('NotImplementedError');
        }

        // Use ENDIAN for integer to buffer conversions
        const versionHex = Buffer.alloc(1);
        versionHex.writeUInt8(version, 0);
        const oneHex = Buffer.alloc(1);
        oneHex.writeUInt8(1, 0);
        const thirtySixHex = Buffer.alloc(1);
        thirtySixHex.writeUInt8(36, 0);

        this._hex = [
            versionHex.toString('hex'),
            oneHex.toString('hex'),
            hexInputs,
            oneHex.toString('hex'),
            hexOutputs,
            thirtySixHex.toString('hex'),
        ].join('');

        return this._hex;
    }

    async hash(): Promise<string> {
        return await sha256(this.hex());
    }
}