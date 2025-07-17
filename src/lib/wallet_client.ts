
// Helper for decimal math (use native JS number for now, or use a library like decimal.js if needed)

function toDecimal(val: any): number {
    if (typeof val === 'number') return val;
    if (typeof val === 'string') return parseFloat(val);
    return 0;
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
        let pendingBalance = 0;
        for (const transaction of pendingTransactions) {
            // Adjust the balance based on inputs
            for (const input of (transaction.inputs || [])) {
                if (input.address === address && spendableHashes.has(input.tx_hash)) {
                    const inputAmount = toDecimal(input.amount ?? '0');
                    pendingBalance -= inputAmount;
                }
            }
            // Adjust the balance based on outputs
            for (const output of (transaction.outputs || [])) {
                if (output.address === address) {
                    const outputAmount = toDecimal(output.amount ?? '0');
                    pendingBalance += outputAmount;
                }
            }
        }
        // Format to 6 decimal places
        const formattedTotalBalance = Math.floor(totalBalance * 1e6) / 1e6;
        const formattedPendingBalance = Math.floor(pendingBalance * 1e6) / 1e6;
        const balanceData: [number, number, boolean] = [formattedTotalBalance, formattedPendingBalance, false];
        return balanceData;
    } catch (e) {
        console.error(e);
        return [null, null, true];
    }
}

