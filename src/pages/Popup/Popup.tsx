import React, { useState } from 'react';
import './Popup.css';

// Types
interface Token {
  symbol: string;
  name: string;
  balance: string;
  price: number;
  change24h: number;
}

interface ChainData {
  name: string;
  symbol: string;
  balance: string;
  fiatValue: number;
  change24h: number;
  tokens: Token[];
  chartData: number[];
  color: string;
}

interface Wallet {
  id: string;
  name: string;
  address: string;
  chains: ChainData[];
}

// SVG Icons
const ChevronDownIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
  </svg>
);

const WalletIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
  </svg>
);

const ArrowUpRightIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 17L17 7M17 7H7m10 0v10" />
  </svg>
);

const ArrowDownRightIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 7L7 17M7 17V7m0 10h10" />
  </svg>
);

const ArrowsRightLeftIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16l-4-4m0 0l4-4m-4 4h18m-4 4l4-4m0 0l-4-4" />
  </svg>
);

const PlusIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
);

const CreditCardIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
  </svg>
);

// Simple SVG Chart Component
const MiniChart = ({ data, color, positive }: { data: number[]; color: string; positive: boolean }) => {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min;
  const width = 240;
  const height = 40;

  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * width;
    const y = height - ((value - min) / range) * height;
    return `${x},${y}`;
  }).join(' ');

  return (
    <div className="mini-chart">
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        <defs>
          <linearGradient id={`gradient-${color}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style={{ stopColor: color, stopOpacity: 0.3 }} />
            <stop offset="100%" style={{ stopColor: color, stopOpacity: 0.1 }} />
          </linearGradient>
        </defs>
        <polyline
          fill="none"
          stroke={color}
          strokeWidth="2"
          points={points}
        />
        <polygon
          fill={`url(#gradient-${color})`}
          points={`0,${height} ${points} ${width},${height}`}
        />
      </svg>
    </div>
  );
};

// Dropdown Component
const Dropdown = ({
  trigger,
  children,
  isOpen,
  onToggle
}: {
  trigger: React.ReactNode;
  children: React.ReactNode;
  isOpen: boolean;
  onToggle: () => void;
}) => {
  return (
    <div className="dropdown">
      <div onClick={onToggle} className="dropdown-trigger">
        {trigger}
      </div>
      {isOpen && (
        <div className="dropdown-content">
          {children}
        </div>
      )}
    </div>
  );
};

// Chain Card Component
export const ChainCard = ({ chain }: { chain: ChainData }) => {
  const [isTokenMenuOpen, setIsTokenMenuOpen] = useState(false);
  const isPositive = chain.change24h >= 0;

  return (
    <div className="chain-card">
      {/* Header Section */}
      <div className="chain-header">
        <div className="chain-info">
          <div
            className="chain-icon"
            style={{ backgroundColor: chain.color }}
          >
            {chain.symbol.slice(0, 2)}
          </div>
          <div>
            <div className="chain-name">{chain.name}</div>
            <div className="chain-balance">{chain.balance} {chain.symbol}</div>
          </div>
        </div>
        <div className="chain-value">
          <div className="fiat-value">
            ${chain.fiatValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className={`change-value ${isPositive ? 'positive' : 'negative'}`}>
            {isPositive ? <ArrowUpRightIcon /> : <ArrowDownRightIcon />}
            <span>{isPositive ? '+' : ''}{chain.change24h.toFixed(2)}%</span>
          </div>
        </div>
      </div>

      {/* Chart Section */}
      <div className="chart-section">
        <MiniChart
          data={chain.chartData}
          color={chain.color}
          positive={isPositive}
        />
      </div>

      {/* Tokens Dropdown */}
      <Dropdown
        trigger={
          <div className="tokens-trigger">
            <span>View Tokens ({chain.tokens.length})</span>
            <ChevronDownIcon />
          </div>
        }
        isOpen={isTokenMenuOpen}
        onToggle={() => setIsTokenMenuOpen(!isTokenMenuOpen)}
      >
        <div className="tokens-list">
          {chain.tokens.map((token, idx) => (
            <div key={idx} className="token-item">
              <div className="token-info">
                <div className="token-icon">
                  {token.symbol.slice(0, 2)}
                </div>
                <div>
                  <div className="token-symbol">{token.symbol}</div>
                  <div className="token-name">{token.name}</div>
                </div>
              </div>
              <div className="token-value">
                <div className="token-balance">{token.balance}</div>
                <div className={`token-change ${token.change24h >= 0 ? 'positive' : 'negative'}`}>
                  {token.change24h >= 0 ? '+' : ''}{token.change24h.toFixed(2)}%
                </div>
              </div>
            </div>
          ))}
        </div>
      </Dropdown>
    </div>
  );
};

// Wallet Selector Component
export const WalletSelector = ({ wallets, selectedWallet, onWalletChange }: {
  wallets: Wallet[];
  selectedWallet: Wallet;
  onWalletChange: (wallet: Wallet) => void;
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Dropdown
      trigger={
        <div className="wallet-selector">
          <WalletIcon />
          <span className="wallet-name">{selectedWallet.name}</span>
          <ChevronDownIcon />
        </div>
      }
      isOpen={isOpen}
      onToggle={() => setIsOpen(!isOpen)}
    >
      <div className="wallet-list">
        {wallets.map((wallet) => (
          <div
            key={wallet.id}
            onClick={() => {
              onWalletChange(wallet);
              setIsOpen(false);
            }}
            className={`wallet-item ${selectedWallet.id === wallet.id ? 'selected' : ''}`}
          >
            <div className="wallet-name">{wallet.name}</div>
            <div className="wallet-address">{wallet.address}</div>
          </div>
        ))}
      </div>
    </Dropdown>
  );
};

const Popup = () => {

  // LocalStorage keys
  const WALLET_STORAGE_KEY = 'quasar_wallets';

  // Default wallet data (structure only, no price values)
  const defaultWallets: Wallet[] = [
    {
      id: '1',
      name: 'Main Wallet',
      address: '0xA1b2...C3d4',
      chains: [
        {
          name: 'Ethereum', symbol: 'ETH', balance: '2.345', fiatValue: 0, change24h: 0, color: '#627EEA', chartData: [2100, 2150, 2200, 2180, 2220, 2300, 2250, 2280, 2320, 2350, 2400, 2380], tokens: [
            { symbol: 'USDC', name: 'USD Coin', balance: '1,250.00', price: 0, change24h: 0 },
            { symbol: 'UNI', name: 'Uniswap', balance: '45.2', price: 0, change24h: 0 },
            { symbol: 'LINK', name: 'Chainlink', balance: '12.8', price: 0, change24h: 0 },
          ],
        },
        {
          name: 'Solana', symbol: 'SOL', balance: '15.67', fiatValue: 0, change24h: 0, color: '#9945FF', chartData: [80, 82, 78, 85, 88, 84, 86, 89, 87, 90, 88, 85], tokens: [
            { symbol: 'USDC', name: 'USD Coin (Solana)', balance: '500.00', price: 0, change24h: 0 },
            { symbol: 'RAY', name: 'Raydium', balance: '230.5', price: 0, change24h: 0 },
            { symbol: 'BONK', name: 'Bonk', balance: '1,000,000', price: 0, change24h: 0 },
          ],
        },
        {
          name: 'Stellaris', symbol: 'STE', balance: '158.67', fiatValue: 0, change24h: 0, color: '#9945FF', chartData: [80, 82, 78, 85, 88, 84, 86, 89, 87, 90, 88, 85], tokens: [],
        },
        {
          name: 'Halogen', symbol: 'HAL', balance: '2759.65', fiatValue: 0, change24h: 0, color: '#ff4545ff', chartData: [80, 60, 40, 150, 230, 184, 416, 380, 259, 210, 313, 185, 180], tokens: [],
        },
      ],
    },
    {
      id: '2',
      name: 'Trading Wallet',
      address: '0xF1e2...B3c4',
      chains: [
        {
          name: 'Ethereum', symbol: 'ETH', balance: '0.892', fiatValue: 0, change24h: 0, color: '#627EEA', chartData: [2100, 2150, 2200, 2180, 2220, 2300, 2250, 2280, 2320, 2350, 2400, 2380], tokens: [
            { symbol: 'WETH', name: 'Wrapped Ethereum', balance: '0.5', price: 0, change24h: 0 },
            { symbol: 'USDT', name: 'Tether', balance: '5,000.00', price: 0, change24h: 0 },
          ],
        },
      ],
    },
  ];

  // Load wallets from localStorage
  const getStoredWallets = () => {
    try {
      const raw = localStorage.getItem(WALLET_STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) { }
    return defaultWallets;
  };

  // Save wallets to localStorage
  const saveWallets = (wallets: Wallet[]) => {
    localStorage.setItem(WALLET_STORAGE_KEY, JSON.stringify(wallets));
  };

  // State
  const [wallets, setWallets] = useState<Wallet[]>(getStoredWallets());
  const [selectedWallet, setSelectedWallet] = useState<Wallet>(getStoredWallets()[0]);
  const [loadingPrices, setLoadingPrices] = useState(false);

  // Fetch price data from API
  React.useEffect(() => {
    const fetchPrices = async () => {
      setLoadingPrices(true);
      // Collect all symbols to fetch
      const symbols = Array.from(new Set(wallets.flatMap(w => w.chains.flatMap(c => [c.symbol, ...c.tokens.map(t => t.symbol)]))));
      let priceData: Record<string, { price: number; change24h: number }> = {};
      try {
        // Fetch prices for all symbols
        const res = await fetch(`https://api.cex.connor33341.dev/prices?symbols=${symbols.join(',')}`);
        priceData = await res.json();
        // If the stub returns nothing or invalid, fallback
        if (!priceData || typeof priceData !== 'object' || Object.keys(priceData).length === 0) {
          throw new Error('Stub API returned no data');
        }
      } catch (e) {
        // fallback: use default stub prices
        priceData = {};
        symbols.forEach(symbol => {
          priceData[symbol] = {
            price: 1.0,
            change24h: 0.5
          };
        });
      }
      // Update wallets with price info
      const updatedWallets = wallets.map(wallet => ({
        ...wallet,
        chains: wallet.chains.map(chain => {
          const chainPrice = priceData[chain.symbol]?.price ?? 0;
          const chainChange = priceData[chain.symbol]?.change24h ?? 0;
          // Calculate fiatValue for chain
          const fiatValue = chainPrice * parseFloat(chain.balance.replace(/,/g, ''));
          return {
            ...chain,
            fiatValue,
            change24h: chainChange,
            tokens: chain.tokens.map(token => {
              const tokenPrice = priceData[token.symbol]?.price ?? 0;
              const tokenChange = priceData[token.symbol]?.change24h ?? 0;
              return {
                ...token,
                price: tokenPrice,
                change24h: tokenChange,
              };
            })
          };
        })
      }));
      setWallets(updatedWallets);
      // If selectedWallet changed, update it too
      setSelectedWallet(updatedWallets.find(w => w.id === selectedWallet.id) || updatedWallets[0]);
      saveWallets(updatedWallets);
      setLoadingPrices(false);
    };
    fetchPrices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Calculate total portfolio value
  const totalValue = selectedWallet.chains.reduce((sum, chain) => sum + chain.fiatValue, 0);
  const totalChange = selectedWallet.chains.reduce((sum, chain) =>
    sum + (chain.change24h * chain.fiatValue / (totalValue || 1)), 0
  );

  return (
    <div className="wallet-popup">
      {/* Header */}
      <div className="popup-header">
        <div className="brand">
          <div className="brand-icon"><img src="icon-34.png" alt="Brand Icon" /></div>
          <span className="brand-name">Quasar</span>
        </div>
        <WalletSelector
          wallets={wallets}
          selectedWallet={selectedWallet}
          onWalletChange={wallet => {
            setSelectedWallet(wallet);
            saveWallets(wallets);
          }}
        />
      </div>

      {/* Content */}
      <div className="popup-content">
        {/* Total Balance */}
        <div className="balance-card">
          <div className="balance-label">Total Portfolio Value</div>
          <div className="balance-amount">
            {loadingPrices ? <span>Loading...</span> : `$${totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          </div>
          <div className={`balance-change ${totalChange >= 0 ? 'positive' : 'negative'}`}>
            {totalChange >= 0 ? <ArrowUpRightIcon /> : <ArrowDownRightIcon />}
            <span>{totalChange >= 0 ? '+' : ''}{totalChange.toFixed(2)}% (24h)</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="action-buttons">
          <button className="action-btn">
            <ArrowsRightLeftIcon />
            <span>Send</span>
          </button>
          <button className="action-btn">
            <PlusIcon />
            <span>Receive</span>
          </button>
          <button className="action-btn">
            <CreditCardIcon />
            <span>Buy</span>
          </button>
        </div>

        {/* Assets Section */}
        <div className="assets-section">
          <div className="assets-header">
            <span className="assets-label">Assets ({selectedWallet.chains.length})</span>
            <button className="manage-btn">Manage</button>
          </div>
          <div className="assets-list">
            {selectedWallet.chains.map((chain, idx) => (
              <ChainCard key={idx} chain={chain} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Popup;