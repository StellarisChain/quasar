import { Decimal } from 'decimal.js';
import { Transaction } from './transaction/transaction';
import { TransactionOutput } from './transaction/transaction_outputs';
import { TransactionInput } from './transaction/transaction_input';
import { stringToPoint, pointToString, SMALLEST, ENDIAN, ec } from './wallet_generation_utils';

// Helper for decimal math using decimal.js
function toDecimal(val: any): Decimal {
    if (val instanceof Decimal) return val;
    if (typeof val === 'number' || typeof val === 'string') return new Decimal(val);
    return new Decimal(0);
}

export async function getBalanceInfo(address: string, node: string): Promise<[number | null, number | null, boolean]> {
    try {
        // Send the request to the node
        const url = `${node}/get_address_info?address=${encodeURIComponent(address)}&show_pending=true`;
        const response = await fetch(url);
        if (!response.ok) {
            console.error(`HTTP error: ${response.status}`);
            return [null, null, true];
        }
        const data = await response.json();
        const result = data.result;
        if (!data.ok) {
            console.error(data.error);
            return [null, null, true];
        }
        if (!result) {
            console.error("Missing 'result' key in response");
            return [null, null, true];
        }
        const pendingTransactions = result.pending_transactions || [];
        const spendableOutputs = result.spendable_outputs || [];
        const spendableHashes = new Set<string>(spendableOutputs.map((output: any) => output.tx_hash));
        const totalBalance = toDecimal(result.balance);
        let pendingBalance = new Decimal(0);
        for (const transaction of pendingTransactions) {
            // Adjust the balance based on inputs
            for (const input of (transaction.inputs || [])) {
                if (input.address === address && spendableHashes.has(input.tx_hash)) {
                    const inputAmount = toDecimal(input.amount ?? '0');
                    pendingBalance = pendingBalance.minus(inputAmount);
                }
            }
            // Adjust the balance based on outputs
            for (const output of (transaction.outputs || [])) {
                if (output.address === address) {
                    const outputAmount = toDecimal(output.amount ?? '0');
                    pendingBalance = pendingBalance.plus(outputAmount);
                }
            }
        }
        // Format to 6 decimal places
        const formattedTotalBalance = Number(totalBalance.toFixed(6));
        const formattedPendingBalance = Number(pendingBalance.toFixed(6));
        const balanceData: [number, number, boolean] = [formattedTotalBalance, formattedPendingBalance, false];
        return balanceData;
    } catch (e) {
        console.error(e);
        return [null, null, true];
    }
}

export async function getAddressInfo(
    address: string,
    node: string
): Promise<[
    Decimal | null,
    TransactionInput[] | null,
    boolean | null,
    [string, number][] | null,
    string[] | null,
    boolean
]> {
    try {
        const url = `${node}/get_address_info?address=${encodeURIComponent(address)}&transactions_count_limit=0&show_pending=true`;
        const response = await fetch(url);
        if (!response.ok) {
            console.error(`HTTP error: ${response.status}`);
            return [null, null, null, null, null, true];
        }
        const data = await response.json();
        if (!data.ok) {
            console.error(data.error);
            return [null, null, null, null, null, true];
        }
        const result = data.result;
        if (!result) {
            console.error("Missing 'result' key in response");
            return [null, null, null, null, null, true];
        }
        let isPending = false;
        const txInputs: TransactionInput[] = [];
        const pendingSpentOutputs: [string, number][] = [];
        const pendingTransactionHashes: string[] = [];

        for (const value of result.pending_spent_outputs || []) {
            pendingSpentOutputs.push([value.tx_hash, value.index]);
        }

        for (const spendableTxInput of result.spendable_outputs || []) {
            const isOutputPending = pendingSpentOutputs.some(
                ([txHash, idx]) => txHash === spendableTxInput.tx_hash && idx === spendableTxInput.index
            );
            if (isOutputPending) {
                isPending = true;
                continue;
            }
            const txInput = new TransactionInput(spendableTxInput.tx_hash, spendableTxInput.index);
            txInput.amount = new Decimal(String(spendableTxInput.amount));
            txInput.publicKey = stringToPoint(address);
            txInputs.push(txInput);
        }

        if (isPending) {
            for (const value of result.pending_transactions || []) {
                pendingTransactionHashes.push(value.hash);
            }
        }

        const balance = new Decimal(String(result.balance));
        return [balance, txInputs, isPending, pendingSpentOutputs, pendingTransactionHashes, false];
    } catch (e) {
        console.error(e);
        return [null, null, null, null, null, true];
    }
}