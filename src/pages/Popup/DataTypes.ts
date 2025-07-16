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
  chains?: ChainData[];
}