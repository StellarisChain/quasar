import { Decimal } from 'decimal.js';
import { stringToPoint, stringToBytes, byteLength, intToBytes, SMALLEST, ec } from '../wallet_generation_utils';

export class TransactionOutput {
    address: string;
    addressBytes: Uint8Array;
    publicKey: any; // Replace 'any' with the actual type if available
    amount: Decimal;

    constructor(address: string, amount: Decimal) {
        // Defensive: ensure address is not a Point (web: no runtime Point type, but check for object with x/y)
        if (typeof address === 'object' && address !== null && 'x' in address && 'y' in address) {
            throw new Error('TransactionOutput does not accept Point anymore. Pass the address string instead');
        }
        this.address = address;
        this.addressBytes = stringToBytes(address); // You may need to implement stringToBytes
        this.publicKey = stringToPoint(address);
        if (!this.amountIsValid(amount)) {
            throw new Error('too many decimal digits');
        }
        this.amount = amount;
    }

    private amountIsValid(amount: Decimal): boolean {
        // (amount * SMALLEST) % 1 == 0.0
        const scaled = amount.mul(SMALLEST);
        return scaled.mod(1).equals(0);
    }

    toBytes(): Uint8Array {
        const amountInt = this.amount.mul(SMALLEST).toNumber();
        const count = byteLength(amountInt);
        const countBytes = new Uint8Array([count]);
        // intToBytes uses ENDIAN internally
        const amountBytes = intToBytes(amountInt, count);
        // Concatenate addressBytes + countBytes + amountBytes
        const result = new Uint8Array(this.addressBytes.length + 1 + amountBytes.length);
        result.set(this.addressBytes, 0);
        result.set(countBytes, this.addressBytes.length);
        result.set(amountBytes, this.addressBytes.length + 1);
        return result;
    }

    verify(): boolean {
        // this.amount > 0 and ec.curve.isOnCurve(this.publicKey)
        return this.amount.gt(0) && ec.curve.isOnCurve(this.publicKey);
    }

    asDict(): Record<string, any> {
        // Return all properties except publicKey
        const { publicKey, ...rest } = this;
        return { ...rest };
    }
}