import { Wallet, JsonWallet } from '../pages/Popup/DataTypes';

/**
 * Utility functions for exporting wallets to JSON files
 */

export interface ExportOptions {
    includePrivateKey?: boolean;
    includeMnemonic?: boolean;
    filename?: string;
}

/**
 * Convert a wallet to the JsonWallet format used by the import functionality
 */
export function walletToJsonWallet(wallet: Wallet, options: ExportOptions = {}): JsonWallet {
    const { includePrivateKey = true, includeMnemonic = true } = options;
    
    const entry = {
        id: wallet.id.toString(),
        address: wallet.address,
        public_key: wallet.public_key,
        private_key: includePrivateKey ? (wallet.private_key || '') : '',
        mnemonic: includeMnemonic ? (wallet.mnemonic || '') : '',
    };

    return {
        wallet_data: {
            wallet_type: 'quasar_export',
            version: '1.0.0',
            entry_data: {
                entries: [entry]
            }
        }
    };
}

/**
 * Convert multiple wallets to a bulk export format
 */
export function walletsToJsonWallet(wallets: Wallet[], options: ExportOptions = {}): JsonWallet {
    const { includePrivateKey = true, includeMnemonic = true } = options;
    
    const entries = wallets.map(wallet => ({
        id: wallet.id.toString(),
        address: wallet.address,
        public_key: wallet.public_key,
        private_key: includePrivateKey ? (wallet.private_key || '') : '',
        mnemonic: includeMnemonic ? (wallet.mnemonic || '') : '',
    }));

    return {
        wallet_data: {
            wallet_type: 'quasar_bulk_export',
            version: '1.0.0',
            entry_data: {
                entries
            }
        }
    };
}

/**
 * Generate a filename for wallet export
 */
export function generateExportFilename(wallet: Wallet | null, isBulk: boolean = false): string {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    
    if (isBulk) {
        return `quasar-wallets-bulk-export-${timestamp}.json`;
    }
    
    if (wallet?.name) {
        const safeName = wallet.name.replace(/[^a-zA-Z0-9-_]/g, '_').toLowerCase();
        return `quasar-wallet-${safeName}-${timestamp}.json`;
    }
    
    return `quasar-wallet-export-${timestamp}.json`;
}

/**
 * Download a JSON file with wallet data
 */
export function downloadWalletJson(data: JsonWallet, filename: string): void {
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up the URL object
    URL.revokeObjectURL(url);
}

/**
 * Export a single wallet to JSON file
 */
export function exportWallet(wallet: Wallet, options: ExportOptions = {}): void {
    const filename = options.filename || generateExportFilename(wallet);
    const jsonWallet = walletToJsonWallet(wallet, options);
    downloadWalletJson(jsonWallet, filename);
}

/**
 * Export multiple wallets to a single JSON file
 */
export function exportWalletsBulk(wallets: Wallet[], options: ExportOptions = {}): void {
    const filename = options.filename || generateExportFilename(null, true);
    const jsonWallet = walletsToJsonWallet(wallets, options);
    downloadWalletJson(jsonWallet, filename);
}

/**
 * Validate export options and show warnings if necessary
 */
export function validateExportOptions(options: ExportOptions): { isValid: boolean; warnings: string[] } {
    const warnings: string[] = [];
    
    if (!options.includePrivateKey) {
        warnings.push('Private keys will not be included in the export. You will not be able to import and use these wallets.');
    }
    
    if (!options.includeMnemonic) {
        warnings.push('Mnemonic phrases will not be included in the export.');
    }
    
    return {
        isValid: true, // Currently always valid, but can be extended
        warnings
    };
}
