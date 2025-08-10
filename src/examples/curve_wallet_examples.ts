/**
 * Example usage of curve-based wallet generation and asset filtering
 * This file demonstrates how to use the new multi-curve wallet features
 */

import { generate, generateFromPrivateKey, CurveType } from '../lib/wallet_generation_utils';
import { WalletAssetManager } from '../lib/wallet_asset_manager';
import { Wallet } from '../pages/Popup/DataTypes';

/**
 * Example 1: Create a wallet with secp256k1 curve
 */
export async function createSecp256k1Wallet(): Promise<Wallet> {
    const wallet = generate({
        curve: 'secp256k1',
        deterministic: false,
        fields: ['mnemonic', 'id', 'private_key', 'public_key', 'address'],
        walletVersion: '0.2.3'
    });

    wallet.name = 'My secp256k1 Wallet';

    // Get compatible assets for this wallet
    const assetInfo = await WalletAssetManager.getCompatibleAssets(wallet);
    console.log(`Wallet supports ${assetInfo.compatibleCount} out of ${assetInfo.totalCount} assets`);
    console.log('Compatible assets:', assetInfo.availableAssets.map(a => a.Symbol).join(', '));

    return wallet;
}

/**
 * Example 2: Create a wallet with p256 curve
 */
export async function createP256Wallet(): Promise<Wallet> {
    const wallet = generate({
        curve: 'p256',
        deterministic: false,
        fields: ['mnemonic', 'id', 'private_key', 'public_key', 'address'],
        walletVersion: '0.2.3'
    });

    wallet.name = 'My P-256 Wallet';

    // Get compatible assets for this wallet
    const assetInfo = await WalletAssetManager.getCompatibleAssets(wallet);
    console.log(`Wallet supports ${assetInfo.compatibleCount} out of ${assetInfo.totalCount} assets`);
    console.log('Compatible assets:', assetInfo.availableAssets.map(a => a.Symbol).join(', '));

    return wallet;
}

/**
 * Example 3: Import wallet from private key with specific curve
 */
export async function importWalletWithCurve(privateKey: string, curve: CurveType): Promise<Wallet> {
    const walletData = generateFromPrivateKey(privateKey, ['private_key', 'public_key', 'address'], curve);

    const wallet: Wallet = {
        id: `imported-${Date.now()}`,
        name: `Imported ${curve} Wallet`,
        address: walletData.address,
        public_key: walletData.public_key,
        private_key: walletData.private_key,
        curve: curve
    };

    return wallet;
}

/**
 * Example 4: Check asset compatibility before transaction
 */
export async function canTransactAsset(wallet: Wallet, assetSymbol: string): Promise<boolean> {
    return await WalletAssetManager.isAssetCompatible(wallet, assetSymbol);
}

/**
 * Example 5: Get all assets for a specific curve
 */
export async function getAssetsForCurve(curve: string) {
    const result = await WalletAssetManager.getAssetsForCurve(curve);
    return result.availableAssets;
}

/**
 * Example 6: Display curve selection options
 */
export async function getCurveSelectionData() {
    const availableCurves = await WalletAssetManager.getAvailableCurves();

    const curveData = await Promise.all(
        availableCurves.map(async (curve) => {
            const assets = await getAssetsForCurve(curve);
            return {
                curve,
                assetCount: assets.length,
                assets: assets.map(a => ({ symbol: a.Symbol, name: a.Name, color: a.Color }))
            };
        })
    );

    return curveData;
}

/**
 * Example 7: Filter existing wallet list by curve compatibility
 */
export async function filterWalletsByAssetSupport(wallets: Wallet[], requiredAsset: string): Promise<Wallet[]> {
    const compatibleWallets: Wallet[] = [];

    for (const wallet of wallets) {
        const isCompatible = await WalletAssetManager.isAssetCompatible(wallet, requiredAsset);
        if (isCompatible) {
            compatibleWallets.push(wallet);
        }
    }

    return compatibleWallets;
}

/**
 * Example 8: Deterministic wallet generation with curve
 */
export async function createDeterministicWallet(curve: CurveType, mnemonic?: string): Promise<Wallet> {
    const wallet = generate({
        mnemonicPhrase: mnemonic,
        curve: curve,
        deterministic: true,
        index: 0,
        fields: ['mnemonic', 'id', 'private_key', 'public_key', 'address'],
        walletVersion: '0.2.3'
    });

    wallet.name = `Deterministic ${curve} Wallet`;
    return wallet;
}

/**
 * Example usage in a React component
 */
export const ExampleUsage = {
    // Create wallets with different curves
    async createWallets() {
        const secp256k1Wallet = await createSecp256k1Wallet();
        const p256Wallet = await createP256Wallet();

        console.log('Created wallets:', {
            secp256k1: {
                address: secp256k1Wallet.address,
                curve: secp256k1Wallet.curve
            },
            p256: {
                address: p256Wallet.address,
                curve: p256Wallet.curve
            }
        });

        return { secp256k1Wallet, p256Wallet };
    },

    // Check compatibility
    async checkCompatibility(wallet: Wallet) {
        const canUseHAL = await canTransactAsset(wallet, 'HAL');
        const canUseSTE = await canTransactAsset(wallet, 'STE');
        const canUseDNR = await canTransactAsset(wallet, 'DNR');

        console.log(`Wallet ${wallet.name} compatibility:`, {
            HAL: canUseHAL,
            STE: canUseSTE,
            DNR: canUseDNR
        });

        return { HAL: canUseHAL, STE: canUseSTE, DNR: canUseDNR };
    },

    // Display curve options
    async displayCurveOptions() {
        const curveData = await getCurveSelectionData();

        console.log('Available curves and their supported assets:');
        curveData.forEach(({ curve, assetCount, assets }) => {
            console.log(`${curve}: ${assetCount} assets`);
            assets.forEach(asset => {
                console.log(`  - ${asset.symbol} (${asset.name})`);
            });
        });

        return curveData;
    }
};
