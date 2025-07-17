import { Decimal } from 'decimal.js';

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

