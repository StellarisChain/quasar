import { Wallet } from './DataTypes';
import { curves, sha256, CurveType } from '../../lib/wallet_generation_utils';
import { createTransaction } from '../../lib/wallet_client';
import { loadTokensXmlAsJson } from '../../lib/token_loader';
import { Decimal } from 'decimal.js';

export interface WalletOperation {
    signTransaction(wallet: Wallet, transactionRequest: any): Promise<string>;
    signMessage(wallet: Wallet, message: string): Promise<string>;
    getWalletAccounts(wallets: Wallet[]): Array<{
        id: string | number;
        name?: string;
        address: string;
        publicKey: string;
        curve: string;
    }>;
}

export class QuasarWalletOperations implements WalletOperation {
    async signTransaction(wallet: Wallet, transactionRequest: any): Promise<string> {
        if (!wallet.private_key) {
            throw new Error('Private key not available for signing');
        }

        const { to, amount, memo, asset } = transactionRequest;

        // Use the existing createTransaction function from wallet_client
        const curve: CurveType = wallet.curve as CurveType || 'secp256k1';
        const decimalAmount = new Decimal(amount);

        // Get node URL from token data
        let node: string | undefined;
        try {
            const tokenData = await loadTokensXmlAsJson('tokens.xml');
            node = tokenData.find(token => token.Symbol === asset)?.Node;
        } catch (error) {
            console.warn('Could not load token data, using fallback node:', error);
        }

        try {
            const transaction = await createTransaction(
                [wallet.private_key],  // privateKeys
                wallet.address,        // sender
                to,                   // receivingAddress
                decimalAmount,        // amount
                memo ? new TextEncoder().encode(memo) : undefined, // message
                wallet.address,       // sendBackAddress
                node,                 // node from token data
                curve                 // curve
            );

            if (!transaction) {
                throw new Error('Transaction failed');
            }

            // Return the transaction hash
            return await transaction.hash();

        } catch (error) {
            console.error('Transaction signing failed:', error);
            throw new Error(`Transaction failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    async signMessage(wallet: Wallet, message: string): Promise<string> {
        if (!wallet.private_key) {
            throw new Error('Private key not available for signing');
        }

        try {
            const curve: CurveType = wallet.curve as CurveType || 'secp256k1';
            const curveInstance = curves[curve];

            // Hash the message first (standard practice)
            const messageHash = await sha256(message);
            const hashBytes = new Uint8Array(Buffer.from(messageHash, 'hex'));

            // Sign the hash
            const signature = curveInstance.sign(hashBytes, wallet.private_key);

            // Return signature in hex format (r + s)
            const r = signature.r.toString(16).padStart(64, '0');
            const s = signature.s.toString(16).padStart(64, '0');

            return r + s;

        } catch (error) {
            console.error('Message signing failed:', error);
            throw new Error(`Message signing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    getWalletAccounts(wallets: Wallet[]): Array<{
        id: string | number;
        name?: string;
        address: string;
        publicKey: string;
        curve: string;
    }> {
        return wallets.map(wallet => ({
            id: wallet.id,
            name: wallet.name,
            address: wallet.address,
            publicKey: wallet.public_key,
            curve: wallet.curve || 'secp256k1'
        }));
    }
}

export const walletOperations = new QuasarWalletOperations();
