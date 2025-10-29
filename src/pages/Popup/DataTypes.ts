// Types
export interface Token {
  symbol: string;
  name: string;
  balance: string;
  price: number;
  change24h: number;
}

export interface ChainData {
  name: string;
  symbol: string;
  balance: string;
  fiatValue: number;
  change24h: number;
  tokenSupport: boolean;
  tokens: Token[];
  chartData: number[];
  color: string;
}

export interface Wallet {
  id: string | number;
  name?: string;
  address: string;
  address_ethereum?: string; // Ethereum-compatible address (0x prefix)
  address_stellaris?: string; // Stellaris native address (D/E prefix)
  public_key: string;
  private_key?: string;
  mnemonic?: string;
  curve?: string; // Added curve support
  chains?: ChainData[];
  // Password security fields
  isEncrypted?: boolean;
  passwordHash?: string;
  salt?: string;
  encryptedPrivateKey?: string;
  encryptedMnemonic?: string;
  iv?: string; // Initialization vector for encryption
}

export interface JsonWallet {
  wallet_data: {
    wallet_type: string;
    version: string;
    entry_data: {
      entries: Array<{
        id: string;
        mnemonic: string;
        private_key: string;
        public_key: string;
        address: string;
      }>;
    };
  };
}

export interface ReceiveQR {
  address: string;
  label?: string;
  curve: string;
}

export interface SitePermissions {
  returnPrivateKey?: boolean; // Whether private key access was granted
  filter?: {
    curves?: string[];
    assets?: string[];
    chains?: string[];
    minBalance?: number;
  };
  specificAddress?: string; // If connected to a specific address
}

export interface SiteConnection {
  origin: string; // Full origin (e.g., https://example.com)
  hostname: string; // Just the hostname (e.g., example.com)
  walletAddress: string; // The wallet address that was connected
  permissions: SitePermissions;
  connectedAt: number; // Timestamp
  lastUsed: number; // Timestamp
}