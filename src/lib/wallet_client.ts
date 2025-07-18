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
    node: string,
    privateKey?: string
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
            // Always set publicKey from privateKey, never from address
            if (!privateKey) {
                throw new Error('privateKey is required to derive publicKey for transaction input');
            }
            txInput.publicKey = pointToString(ec.keyFromPrivate(privateKey).getPublic());
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


export async function createTransaction(
    privateKeys: string[],
    sender: string,
    receivingAddress: string,
    amount: Decimal | string | number,
    message?: Uint8Array | null,
    sendBackAddress?: string | null,
    node?: string
): Promise<Transaction | null> {
    const decAmount = toDecimal(amount);
    if (!sendBackAddress) sendBackAddress = sender;

    console.debug('createTransaction called with:', {
        privateKeys,
        sender,
        receivingAddress,
        amount: decAmount.toString(),
        message,
        sendBackAddress,
        node
    });

    let inputs: TransactionInput[] = [];
    let balance: Decimal | null = null;
    let isPending: boolean | null = null;
    let pendingTransactionHashes: string[] | null = null;

    for (const key of privateKeys) {
        const [bal, addressInputs, pending, _pendingSpent, pendingHashes, isError] = await getAddressInfo(sender, node!, key);
        console.debug('getAddressInfo result:', {
            key,
            bal: bal?.toString(),
            addressInputs,
            pending,
            pendingHashes,
            isError
        });
        if (isError) {
            return null;
        }
        balance = bal;
        isPending = pending;
        pendingTransactionHashes = pendingHashes;
        if (addressInputs) {
            for (const addressInput of addressInputs) {
                (addressInput as any).privateKey = key;
            }
            inputs = inputs.concat(addressInputs);
        }
        // Check if enough inputs have been gathered
        const sumInputs = inputs
            .sort((a, b) => {
                const aAmount = a.amount ?? new Decimal(0);
                const bAmount = b.amount ?? new Decimal(0);
                return aAmount.minus(bAmount).toNumber();
            })
            .slice(0, 255)
            .reduce((acc, input) => acc.plus(input.amount ?? new Decimal(0)), new Decimal(0));
        console.debug('Accumulated sumInputs:', sumInputs.toString(), 'inputs:', inputs);
        if (sumInputs.greaterThanOrEqualTo(decAmount)) {
            break;
        }
    }

    console.debug('Final gathered inputs:', inputs);

    if (!inputs.length) {
        if (isPending) {
            console.error("No spendable outputs. Please wait for pending transactions to be confirmed.");
            if (pendingTransactionHashes) {
                console.log("\nTransactions awaiting confirmation:");
                pendingTransactionHashes.forEach((tx, idx) => {
                    console.log(`${idx + 1}: ${tx}`);
                });
            }
        } else {
            console.error("No spendable outputs.");
            if (!(balance && balance.greaterThan(0))) {
                console.log("The associated address does not have enough funds.");
            }
        }
        return null;
    }

    // Check if accumulated inputs are sufficient
    const totalInput = inputs.reduce((acc, input) => acc.plus(input.amount ?? new Decimal(0)), new Decimal(0));
    console.debug('Total input amount:', totalInput.toString(), 'Required amount:', decAmount.toString());
    if (totalInput.lessThan(decAmount)) {
        console.error("The associated address does not have enough funds.");
        return null;
    }

    // Select appropriate transaction inputs
    const transactionInputs: TransactionInput[] = [];
    let runningSum = new Decimal(0);
    for (const txInput of inputs.sort((a, b) => {
        const aAmount = a.amount ?? new Decimal(0);
        const bAmount = b.amount ?? new Decimal(0);
        return aAmount.minus(bAmount).toNumber();
    })) {
        transactionInputs.push(txInput);
        runningSum = runningSum.plus(txInput.amount ?? new Decimal(0));
        if (runningSum.greaterThanOrEqualTo(decAmount)) {
            break;
        }
    }
    console.debug('Selected transactionInputs:', transactionInputs);

    // Ensure that the transaction amount is adequate
    const transactionAmount = transactionInputs.reduce((acc, input) => acc.plus(input.amount ?? new Decimal(0)), new Decimal(0));
    console.debug('transactionAmount:', transactionAmount.toString(), 'decAmount:', decAmount.toString());
    if (transactionAmount.lessThan(decAmount)) {
        console.error(`Consolidate outputs: send ${transactionAmount.toString()} stellaris to yourself`);
        return null;
    }

    // Create the transaction
    const outputs: TransactionOutput[] = [
        new TransactionOutput(receivingAddress, decAmount)
    ];
    if (transactionAmount.greaterThan(decAmount)) {
        outputs.push(new TransactionOutput(sendBackAddress!, transactionAmount.minus(decAmount)));
    }
    console.debug('Transaction outputs:', outputs);
    const tx = new Transaction(transactionInputs, outputs, message ?? undefined);

    // Sign and send the transaction
    tx.sign(privateKeys);
    console.debug('Transaction hex:', tx.hex());

    // Push transaction to node
    try {
        const response = await fetch(`${node}/push_tx`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tx_hex: tx.hex() }),
        });
        if (!response.ok) {
            const errorText = await response.text();
            console.error(`Error during request to node: ${errorText}`);
            return null;
        }
        const respJson = await response.json();
        if (!respJson.ok) {
            console.error(respJson.error);
            return null;
        }
        return tx;
    } catch (e) {
        console.error(`Error during request to node: ${e}`);
        return null;
    }
}