import { Wallet } from './DataTypes';
import { encryptData, decryptData, hashPassword, generateSalt, generateIV, verifyPassword, secureClear } from '../../lib/crypto';

// LocalStorage Keys
export const WALLET_STORAGE_KEY = 'quasar_wallets';
export const WALLET_SESSION_KEY = 'quasar_session';

// Session management for unlocked wallets
class WalletSession {
    private static instance: WalletSession;
    private unlockedWallets: Map<string, { privateKey?: string; mnemonic?: string; unlockedAt: number }> = new Map();
    private sessionTimeout = 30 * 1000; // 30 seconds for testing

    static getInstance(): WalletSession {
        if (!WalletSession.instance) {
            WalletSession.instance = new WalletSession();
        }
        return WalletSession.instance;
    }

    isWalletUnlocked(walletId: string): boolean {
        const session = this.unlockedWallets.get(walletId);
        if (!session) return false;

        // Check if session has expired
        if (Date.now() - session.unlockedAt > this.sessionTimeout) {
            this.lockWallet(walletId);
            return false;
        }

        return true;
    }

    unlockWallet(walletId: string, privateKey?: string, mnemonic?: string): void {
        this.unlockedWallets.set(walletId, {
            privateKey,
            mnemonic,
            unlockedAt: Date.now()
        });
    }

    lockWallet(walletId: string): void {
        const session = this.unlockedWallets.get(walletId);
        if (session) {
            // Securely clear sensitive data
            secureClear(session);
        }
        this.unlockedWallets.delete(walletId);
    }

    lockAllWallets(): void {
        const walletIds = Array.from(this.unlockedWallets.keys());
        for (const walletId of walletIds) {
            this.lockWallet(walletId);
        }
    }

    getWalletCredentials(walletId: string): { privateKey?: string; mnemonic?: string } | null {
        if (!this.isWalletUnlocked(walletId)) return null;

        const session = this.unlockedWallets.get(walletId);
        return session ? { privateKey: session.privateKey, mnemonic: session.mnemonic } : null;
    }

    extendSession(walletId: string): void {
        const session = this.unlockedWallets.get(walletId);
        if (session) {
            session.unlockedAt = Date.now();
        }
    }
}

export const walletSession = WalletSession.getInstance();

/**
 * Encrypt a wallet's sensitive data with password
 */
export async function encryptWallet(wallet: Wallet, password: string): Promise<Wallet> {
    const salt = generateSalt();
    const iv = generateIV();
    const passwordHash = await hashPassword(password, salt);

    const encryptedWallet: Wallet = {
        ...wallet,
        isEncrypted: true,
        passwordHash,
        salt,
        iv
    };

    // Encrypt private key if present
    if (wallet.private_key) {
        encryptedWallet.encryptedPrivateKey = await encryptData(wallet.private_key, password, salt, iv);
        delete encryptedWallet.private_key;
    }

    // Encrypt mnemonic if present
    if (wallet.mnemonic) {
        encryptedWallet.encryptedMnemonic = await encryptData(wallet.mnemonic, password, salt, iv);
        delete encryptedWallet.mnemonic;
    }

    return encryptedWallet;
}

/**
 * Decrypt a wallet's sensitive data with password
 */
export async function decryptWallet(wallet: Wallet, password: string): Promise<Wallet> {
    if (!wallet.isEncrypted || !wallet.passwordHash || !wallet.salt || !wallet.iv) {
        throw new Error('Wallet is not encrypted or missing encryption metadata');
    }

    // Verify password
    const isPasswordValid = await verifyPassword(password, wallet.passwordHash, wallet.salt);
    if (!isPasswordValid) {
        throw new Error('Invalid password');
    }

    const decryptedWallet: Wallet = { ...wallet };

    // Decrypt private key if present
    if (wallet.encryptedPrivateKey) {
        decryptedWallet.private_key = await decryptData(wallet.encryptedPrivateKey, password, wallet.salt, wallet.iv);
    }

    // Decrypt mnemonic if present
    if (wallet.encryptedMnemonic) {
        decryptedWallet.mnemonic = await decryptData(wallet.encryptedMnemonic, password, wallet.salt, wallet.iv);
    }

    // Remove encryption metadata from the decrypted version
    delete decryptedWallet.encryptedPrivateKey;
    delete decryptedWallet.encryptedMnemonic;
    delete decryptedWallet.isEncrypted;
    delete decryptedWallet.passwordHash;
    delete decryptedWallet.salt;
    delete decryptedWallet.iv;

    return decryptedWallet;
}

/**
 * Change wallet password
 */
export async function changeWalletPassword(wallet: Wallet, oldPassword: string, newPassword: string): Promise<Wallet> {
    // First decrypt with old password
    const decryptedWallet = await decryptWallet(wallet, oldPassword);

    // Then encrypt with new password
    return await encryptWallet(decryptedWallet, newPassword);
}

/**
 * Check if wallet requires password unlock
 */
export function isWalletLocked(wallet: Wallet): boolean {
    if (!wallet || !wallet.isEncrypted) return false;
    const walletId = wallet.id.toString();
    const isUnlocked = walletSession.isWalletUnlocked(walletId);
    console.log('isWalletLocked check:', {
        walletId,
        isEncrypted: wallet.isEncrypted,
        isUnlocked,
        isLocked: !isUnlocked
    });
    return !isUnlocked;
}

/**
 * Unlock wallet for current session
 */
export async function unlockWallet(wallet: Wallet, password: string): Promise<void> {
    const decryptedWallet = await decryptWallet(wallet, password);
    walletSession.unlockWallet(
        wallet.id.toString(),
        decryptedWallet.private_key,
        decryptedWallet.mnemonic
    );

    // Securely clear decrypted data
    secureClear(decryptedWallet);
}

/**
 * Get wallet credentials if unlocked
 */
export function getWalletCredentials(wallet: Wallet): { privateKey?: string; mnemonic?: string } | null {
    if (!wallet.isEncrypted) {
        return {
            privateKey: wallet.private_key,
            mnemonic: wallet.mnemonic
        };
    }

    return walletSession.getWalletCredentials(wallet.id.toString());
}

/**
 * Lock specific wallet
 */
export function lockWallet(wallet: Wallet): void {
    const walletId = wallet.id.toString();
    console.log('Locking wallet:', walletId);
    walletSession.lockWallet(walletId);
}

/**
 * Lock all wallets
 */
export function lockAllWallets(): void {
    walletSession.lockAllWallets();
}

// Default Wallet Data (just for testing)
export let useDefaultWallets = false;
export const defaultWallets: Wallet[] = [
    {
        id: '1',
        name: 'Main Wallet',
        address: '0xA1b2...C3d4',
        public_key: '0xA1b2...C3d4_PUBLIC',
        chains: [
            {
                name: 'Ethereum', symbol: 'ETH', balance: '2.345', fiatValue: 0, change24h: 0, color: '#627EEA', tokenSupport: true, chartData: [2100, 2150, 2200, 2180, 2220, 2300, 2250, 2280, 2320, 2350, 2400, 2380], tokens: [
                    { symbol: 'USDC', name: 'USD Coin', balance: '1,250.00', price: 0, change24h: 0 },
                    { symbol: 'UNI', name: 'Uniswap', balance: '45.2', price: 0, change24h: 0 },
                    { symbol: 'LINK', name: 'Chainlink', balance: '12.8', price: 0, change24h: 0 },
                ],
            },
            {
                name: 'Solana', symbol: 'SOL', balance: '15.67', fiatValue: 0, change24h: 0, color: '#9945FF', tokenSupport: true, chartData: [80, 82, 78, 85, 88, 84, 86, 89, 87, 90, 88, 85], tokens: [
                    { symbol: 'USDC', name: 'USD Coin (Solana)', balance: '500.00', price: 0, change24h: 0 },
                    { symbol: 'RAY', name: 'Raydium', balance: '230.5', price: 0, change24h: 0 },
                    { symbol: 'BONK', name: 'Bonk', balance: '1,000,000', price: 0, change24h: 0 },
                ],
            },
            {
                name: 'Stellaris', symbol: 'STE', balance: '158.67', fiatValue: 0, change24h: 0, color: '#9945FF', tokenSupport: false, chartData: [80, 82, 78, 85, 88, 84, 86, 89, 87, 90, 88, 85], tokens: [],
            },
            {
                name: 'Halogen', symbol: 'HAL', balance: '2759.65', fiatValue: 0, change24h: 0, color: '#ff4545ff', tokenSupport: false, chartData: [80, 60, 40, 150, 230, 184, 416, 380, 259, 210, 313, 185, 180], tokens: [],
            },
        ],
    },
    {
        id: '2',
        name: 'Trading Wallet',
        address: '0xF1e2...B3c4',
        public_key: '0xF1e2...B3c4_PUBLIC',
        chains: [
            {
                name: 'Ethereum', symbol: 'ETH', balance: '0.892', fiatValue: 0, change24h: 0, color: '#627EEA', tokenSupport: true, chartData: [2100, 2150, 2200, 2180, 2220, 2300, 2250, 2280, 2320, 2350, 2400, 2380], tokens: [
                    { symbol: 'WETH', name: 'Wrapped Ethereum', balance: '0.5', price: 0, change24h: 0 },
                    { symbol: 'USDT', name: 'Tether', balance: '5,000.00', price: 0, change24h: 0 },
                ],
            },
        ],
    },
];

// Load wallets from localStorage
export const getStoredWallets = () => {
    try {
        const raw = localStorage.getItem(WALLET_STORAGE_KEY);
        if (raw) return JSON.parse(raw);
    } catch (e) { }
    console.warn('No wallets found in localStorage, using default wallets');
    return useDefaultWallets ? defaultWallets : [];
};

// Save wallets to localStorage
export const saveWallets = (wallets: Wallet[]) => {
    localStorage.setItem(WALLET_STORAGE_KEY, JSON.stringify(wallets));
};