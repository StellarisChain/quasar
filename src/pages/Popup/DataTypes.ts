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
  public_key: string;
  private_key?: string;
  mnemonic?: string;
  curve?: string; // Added curve support
  chains?: ChainData[];
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