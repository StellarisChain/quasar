import { Decimal } from 'decimal.js';
import { pointToString, bytesToString, sha256, ec as CURVE, SMALLEST } from '../wallet_generation_utils';
import { TransactionInput } from './transaction_input';
import { TransactionOutput } from './transaction_outputs';
import { CoinbaseTransaction } from './coinbase_transaction';

export class Transaction {
    inputs: TransactionInput[];
    outputs: TransactionOutput[];
    message?: Uint8Array;
    version: number;
    private _hex?: string;
    fees?: Decimal;
    tx_hash?: string;

    constructor(inputs: TransactionInput[], outputs: TransactionOutput[], message?: Uint8Array, version?: number) {
        if (inputs.length >= 256) {
            throw new Error(`You can spend max 255 inputs in a single transactions, not ${inputs.length}`);
        }
        if (outputs.length >= 256) {
            throw new Error(`You can have max 255 outputs in a single transactions, not ${outputs.length}`);
        }
        this.inputs = inputs;
        this.outputs = outputs;
        this.message = message;
        if (version === undefined) {
            if (outputs.every(tx_output => tx_output.addressBytes.length === 64)) {
                version = 1;
            } else if (outputs.every(tx_output => tx_output.addressBytes.length === 33)) {
                version = 3;
            } else {
                throw new Error('NotImplementedError');
            }
        }
        if (version > 3) {
            throw new Error('NotImplementedError');
        }
        this.version = version;
        this._hex = undefined;
        this.fees = undefined;
        this.tx_hash = undefined;
    }

    hex(full: boolean = true): string {
        const inputs = this.inputs, outputs = this.outputs;
        const hex_inputs = inputs.map(tx_input => Buffer.from(tx_input.toBytes()).toString('hex')).join('');
        const hex_outputs = outputs.map(tx_output => Buffer.from(tx_output.toBytes()).toString('hex')).join('');
        const version = this.version;

        let hex = '';
        hex += version.toString(16).padStart(2, '0');
        hex += inputs.length.toString(16).padStart(2, '0');
        hex += hex_inputs;
        hex += outputs.length.toString(16).padStart(2, '0');
        hex += hex_outputs;

        if (!full && (version <= 2 || !this.message)) {
            this._hex = hex;
            return hex;
        }

        if (this.message) {
            if (version <= 2) {
                hex += Buffer.from([1, this.message.length]).toString('hex');
            } else {
                hex += Buffer.from([1]).toString('hex');
                const lenBuf = Buffer.alloc(2);
                lenBuf.writeUInt16LE(this.message.length, 0);
                hex += lenBuf.toString('hex');
            }
            hex += Buffer.from(this.message).toString('hex');
            if (!full) {
                this._hex = hex;
                return hex;
            }
        } else {
            hex += Buffer.from([0]).toString('hex');
        }

        // Signatures
        const signatures: string[] = [];
        for (const tx_input of inputs) {
            const signed = tx_input.getSignature();
            if (signed && !signatures.includes(signed)) {
                signatures.push(signed);
                hex += signed;
            }
        }
        this._hex = hex;
        return hex;
    }


    async hash(): Promise<string> {
        if (!this.tx_hash) {
            this.tx_hash = await sha256(this.hex());
        }
        return this.tx_hash!;
    }


    _verify_double_spend_same_transaction(): boolean {
        const used_inputs: string[] = [];
        for (const tx_input of this.inputs) {
            const input_hash = `${tx_input.txHash}${tx_input.index}`;
            if (used_inputs.includes(input_hash)) {
                return false;
            }
            used_inputs.push(input_hash);
        }
        return true;
    }
    async _fill_transaction_inputs(txs?: Record<string, any>): Promise<void> {
        const check_inputs = this.inputs.filter(tx_input => tx_input.transaction == null && tx_input.transactionInfo == null).map(tx_input => tx_input.txHash);
        if (!check_inputs.length) return;
        // if (!txs) txs = await Database.instance.get_transactions_info(check_inputs);
        for (const tx_input of this.inputs) {
            const txHash = tx_input.txHash;
            if (txs && txHash in txs) {
                tx_input.transactionInfo = txs[txHash];
            }
        }
    }


    async _check_signature(): Promise<boolean> {
        const tx_hex = this.hex(false);
        const checked_signatures: Array<string> = [];
        for (const tx_input of this.inputs) {
            if (tx_input.signed == null) {
                console.log('not signed');
                return false;
            }
            await tx_input.getPublicKey();
            const signature = `${tx_input.publicKey}:${tx_input.signed}`;
            if (checked_signatures.includes(signature)) continue;
            if (!(await tx_input.verify(tx_hex))) {
                console.log('signature not valid');
                return false;
            }
            checked_signatures.push(signature);
        }
        return true;
    }
    /**
     * Verifies the outputs of the transaction.
     * Returns true if outputs are valid, or if this is the genesis transaction.
     */
    async verifyOutputs(): Promise<boolean> {
        const isGenesis = (await this.hash()) === '915ddf143e14647ba1e04c44cf61e57084254c44cd4454318240f359a414065c';
        return (this.outputs.length > 0 || isGenesis) && this.outputs.every(tx_output => tx_output.verify());
    }

    /**
     * Verifies the transaction, including double spend, signatures, outputs, and fees.
     * @param checkDoubleSpend Whether to check for double spend within the transaction.
     */
    async verify(checkDoubleSpend: boolean = true): Promise<boolean> {
        if (checkDoubleSpend && !this._verify_double_spend_same_transaction()) {
            console.log('double spend inside same transaction');
            return false;
        }
        // if (checkDoubleSpend && !(await this.verify_double_spend())) { ... }
        await this._fill_transaction_inputs();
        if (!(await this._check_signature())) return false;
        if (!(await this.verifyOutputs())) {
            console.log('invalid outputs');
            return false;
        }
        if ((await this.get_fees()).lt(0)) {
            console.log('We are not the Federal Reserve');
            return false;
        }
        return true;
    }

    sign(privateKeys: any[] = []): this {
        for (const privateKey of privateKeys) {
            // noble/curves: get public key as Uint8Array, then hex
            const pubKeyBytes = CURVE.getPublicKey(privateKey, false); // uncompressed
            const pubKeyHex = Buffer.from(pubKeyBytes).toString('hex');
            for (const input of this.inputs) {
                if (input.privateKey == null && (input.publicKey || input.transaction)) {
                    const inputPublicKey = input.publicKey || (input.transaction && input.transaction.outputs[input.index].publicKey);
                    if (inputPublicKey && pubKeyHex === inputPublicKey) {
                        input.privateKey = privateKey;
                    }
                }
            }
        }
        for (const input of this.inputs) {
            if (input.privateKey != null) {
                input.sign(this.hex(false));
            }
        }
        return this;
    }


    async get_fees(): Promise<Decimal> {
        let input_amount = new Decimal(0);
        for (const tx_input of this.inputs) {
            const amt = await tx_input.getAmount();
            if (amt === undefined) {
                throw new Error('Input amount is undefined');
            }
            input_amount = input_amount.plus(amt);
        }
        const output_amount = this.outputs.reduce((sum, tx_output) => sum.plus(tx_output.amount), new Decimal(0));
        this.fees = input_amount.minus(output_amount);
        if (!this.fees.times(SMALLEST).mod(1).eq(0)) {
            throw new Error('Fee is not integer in smallest units');
        }
        return this.fees;
    }

    static async from_hex(hexstring: string, check_signatures: boolean = true): Promise<Transaction | CoinbaseTransaction> {
        const buf = Buffer.from(hexstring, 'hex');
        let offset = 0;
        const read = (n: number) => {
            const out = buf.slice(offset, offset + n);
            offset += n;
            return out;
        };
        const readInt = (n: number) => {
            const out = buf.readUIntLE(offset, n);
            offset += n;
            return out;
        };
        const version = readInt(1);
        if (version > 3) throw new Error('NotImplementedError');
        const inputs_count = readInt(1);
        const inputs: TransactionInput[] = [];
        for (let i = 0; i < inputs_count; i++) {
            const tx_hex = read(32).toString('hex');
            const tx_index = readInt(1);
            inputs.push(new TransactionInput(tx_hex, tx_index));
        }
        const outputs_count = readInt(1);
        const outputs: TransactionOutput[] = [];
        for (let i = 0; i < outputs_count; i++) {
            const pubkey = read(version === 1 ? 64 : 33);
            const amount_length = readInt(1);
            const amount = new Decimal(buf.readUIntLE(offset, amount_length)).div(SMALLEST);
            offset += amount_length;
            outputs.push(new TransactionOutput(bytesToString(pubkey), amount));
        }
        const specifier = readInt(1);
        if (specifier === 36) {
            if (inputs.length !== 1 || outputs.length !== 1) throw new Error('Invalid coinbase tx');
            return new CoinbaseTransaction(inputs[0].txHash, outputs[0].address, outputs[0].amount);
        } else {
            let message: Uint8Array | undefined = undefined;
            if (specifier === 1) {
                const message_length = version <= 2 ? readInt(1) : readInt(2);
                message = read(message_length);
            } else {
                if (specifier !== 0) throw new Error('Invalid specifier');
            }
            const signatures: { r: string; s: string }[] = [];
            while (true) {
                const rBuf = read(32);
                const sBuf = read(32);
                // If r is all zeros, break (end of signatures)
                if (rBuf.every(b => b === 0)) break;
                signatures.push({ r: rBuf.toString('hex'), s: sBuf.toString('hex') });
            }
            if (signatures.length === 1) {
                for (const tx_input of inputs) tx_input.signed = signatures[0];
            } else if (inputs.length === signatures.length) {
                for (let i = 0; i < inputs.length; i++) inputs[i].signed = signatures[i];
            } else {
                if (!check_signatures) return new Transaction(inputs, outputs, message, version);
                const index: Record<string, TransactionInput[]> = {};
                for (const tx_input of inputs) {
                    const public_key = pointToString(await tx_input.getPublicKey());
                    if (!(public_key in index)) index[public_key] = [];
                    index[public_key].push(tx_input);
                }
                Object.keys(index).forEach((key, i) => {
                    for (const tx_input of index[key]) {
                        tx_input.signed = signatures[i];
                    }
                });
            }
            return new Transaction(inputs, outputs, message, version);
        }
    }

    /**
     * Checks if another transaction is equal to this one by comparing their hex representations.
     */
    equals(other: any): boolean {
        if (other instanceof Transaction) {
            return this.hex() === other.hex();
        }
        return false;
    }
}