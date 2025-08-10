import React from 'react';
import { loadTokensXmlAsJson, filterTokensByCurve, Chain } from './token_loader';
import { Wallet } from '../pages/Popup/DataTypes';

export interface AssetFilterResult {
    availableAssets: Chain[];
    compatibleCount: number;
    totalCount: number;
}

/**
 * Wallet Asset Manager
 * Handles filtering and managing assets based on wallet curve compatibility
 */
export class WalletAssetManager {
    private static tokensCache: Chain[] | null = null;

    /**
     * Load and cache tokens from tokens.xml
     */
    private static async loadTokens(): Promise<Chain[]> {
        if (this.tokensCache) {
            return this.tokensCache;
        }

        try {
            this.tokensCache = await loadTokensXmlAsJson('tokens.xml');
            return this.tokensCache;
        } catch (error) {
            console.error('Failed to load tokens.xml:', error);
            // Return default fallback tokens if loading fails
            this.tokensCache = [
                {
                    Name: 'Halogen',
                    Symbol: 'HAL',
                    Color: '#ff4545ff',
                    Node: 'https://halogen-node.connor33341.dev',
                    TokenSupport: true,
                    Curve: 'secp256k1',
                    SubTokens: []
                },
                {
                    Name: 'Stellaris',
                    Symbol: 'STE',
                    Color: '#9945FF',
                    Node: 'https://stellaris-node.connor33341.dev',
                    TokenSupport: true,
                    Curve: 'secp256k1',
                    SubTokens: []
                },
                {
                    Name: 'Classic Stellaris',
                    Symbol: 'cSTE',
                    Color: '#161616',
                    Node: 'https://cstellaris-node.connor33341.dev',
                    TokenSupport: false,
                    Curve: 'p256',
                    SubTokens: []
                },
                {
                    Name: 'Denaro',
                    Symbol: 'DNR',
                    Color: '#21a9af',
                    Node: 'https://denaro-node.gaetano.eu.org',
                    TokenSupport: false,
                    Curve: 'p256',
                    SubTokens: []
                }
            ];
            return this.tokensCache;
        }
    }

    /**
     * Get assets compatible with the wallet's curve
     */
    static async getCompatibleAssets(wallet: Wallet): Promise<AssetFilterResult> {
        const allTokens = await this.loadTokens();
        const walletCurve = wallet.curve || 'secp256k1';

        const compatibleAssets = filterTokensByCurve(allTokens, walletCurve);

        return {
            availableAssets: compatibleAssets,
            compatibleCount: compatibleAssets.length,
            totalCount: allTokens.length
        };
    }

    /**
     * Get assets compatible with a specific curve
     */
    static async getAssetsForCurve(curve: string): Promise<AssetFilterResult> {
        const allTokens = await this.loadTokens();
        const compatibleAssets = filterTokensByCurve(allTokens, curve);

        return {
            availableAssets: compatibleAssets,
            compatibleCount: compatibleAssets.length,
            totalCount: allTokens.length
        };
    }

    /**
     * Get all available curves from loaded tokens
     */
    static async getAvailableCurves(): Promise<string[]> {
        const tokens = await this.loadTokens();
        const curves = new Set<string>();

        tokens.forEach(token => {
            if (token.Curve) {
                curves.add(token.Curve);
            }
        });

        return Array.from(curves);
    }

    /**
     * Check if a specific asset is compatible with the wallet
     */
    static async isAssetCompatible(wallet: Wallet, assetSymbol: string): Promise<boolean> {
        const { availableAssets } = await this.getCompatibleAssets(wallet);
        return availableAssets.some(asset => asset.Symbol === assetSymbol);
    }

    /**
     * Get asset by symbol from compatible assets only
     */
    static async getCompatibleAsset(wallet: Wallet, assetSymbol: string): Promise<Chain | null> {
        const { availableAssets } = await this.getCompatibleAssets(wallet);
        return availableAssets.find(asset => asset.Symbol === assetSymbol) || null;
    }

    /**
     * Clear tokens cache (useful for testing or force reload)
     */
    static clearCache(): void {
        this.tokensCache = null;
    }
}

/**
 * React hook for managing wallet assets
 */
export function useWalletAssets(wallet: Wallet | null) {
    const [assetResult, setAssetResult] = React.useState<AssetFilterResult | null>(null);
    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);

    React.useEffect(() => {
        if (!wallet) {
            setAssetResult(null);
            return;
        }

        const loadAssets = async () => {
            setLoading(true);
            setError(null);

            try {
                const result = await WalletAssetManager.getCompatibleAssets(wallet);
                setAssetResult(result);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to load assets');
                setAssetResult(null);
            } finally {
                setLoading(false);
            }
        };

        loadAssets();
    }, [wallet]);

    return { assetResult, loading, error };
}
