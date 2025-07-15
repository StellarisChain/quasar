import React, { useState, useRef, useEffect } from 'react';
import Counter from '../../components/Counter';
import StarBorder from '../../components/StarBorder';
import Noise from '../../components/Noise';
import { ChevronDownIcon, WalletIcon, ArrowUpRightIcon, ArrowDownRightIcon, ArrowsRightLeftIcon, PlusIcon, CreditCardIcon } from '../../components/Icons';
import { MiniChart } from '../../components/MiniChart';
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
      <div
        onClick={onToggle}
        className="dropdown-trigger dropdown-anim"
        tabIndex={0}
        role="button"
        aria-expanded={isOpen}
        style={{ cursor: 'pointer', outline: 'none', transition: 'background 0.2s' }}
      >
        {trigger}
      </div>
      <div
        className={`dropdown-content${isOpen ? ' open' : ''}`}
        style={{
          maxHeight: isOpen ? 500 : 0,
          opacity: isOpen ? 1 : 0,
          overflow: 'hidden',
          transition: 'max-height 0.3s cubic-bezier(.4,0,.2,1), opacity 0.2s',
        }}
      >
        {children}
      </div>
    </div>
  );
};

// Chain Card Component
export const ChainCard = ({ chain }: { chain: ChainData }) => {
  const [isTokenMenuOpen, setIsTokenMenuOpen] = useState(false);
  const isPositive = chain.change24h >= 0;

  return (
    <div className="chain-card chain-card-anim">
      {/* Header Section */}
      <div className="chain-header">
        <div className="chain-info">
          <div
            className="chain-icon"
            style={{ backgroundColor: chain.color, transition: 'box-shadow 0.2s' }}
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
          <div className={`change-value ${isPositive ? 'positive' : 'negative'}`} style={{ transition: 'color 0.2s' }}>
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
            <div key={idx} className="token-item token-anim">
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
        <div className="wallet-selector wallet-selector-anim">
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
            className={`wallet-item wallet-item-anim ${selectedWallet.id === wallet.id ? 'selected' : ''}`}
            tabIndex={0}
            role="button"
            style={{ transition: 'background 0.2s, box-shadow 0.2s' }}
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
    <div className="wallet-popup wallet-popup-anim" style={{ position: 'relative', overflow: 'hidden' }}>
      {/* Noise background */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }}>
        <Noise />
      </div>
      {/* Main content */}
      <div style={{ position: 'relative', zIndex: 1, height: '100%', minHeight: '100vh' }}>
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
        <div className="popup-content" style={{ overflow: 'auto', maxHeight: 'calc(100vh - 64px)' }}>
          {/* Total Balance */}
          <div className="balance-card balance-card-anim">
            <div className="balance-label">Total Portfolio Value</div>
            <div className="balance-amount" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {loadingPrices ? (
                <span>Loading...</span>
              ) : (
                <>
                  <span style={{ fontSize: 32, fontWeight: 600, color: 'white', marginRight: 1, fontFamily: 'Inter, Segoe UI, Arial, Helvetica, sans-serif' }}>$</span>
                  <Counter
                    value={totalValue}
                    fontSize={32}
                    padding={0}
                    gap={0.5}
                    textColor="white"
                    fontWeight={600}
                  />
                </>
              )}
            </div>
            <div className={`balance-change ${totalChange >= 0 ? 'positive' : 'negative'}`} style={{ transition: 'color 0.2s' }}>
              {totalChange >= 0 ? <ArrowUpRightIcon /> : <ArrowDownRightIcon />}
              <span>{totalChange >= 0 ? '+' : ''}{totalChange.toFixed(2)}% (24h)</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="action-buttons">
            <button className="action-btn action-btn-anim">
              <ArrowsRightLeftIcon />
              <span>Send</span>
            </button>
            <button className="action-btn action-btn-anim">
              <PlusIcon />
              <span>Receive</span>
            </button>
            <button className="action-btn action-btn-anim">
              <CreditCardIcon />
              <span>Buy</span>
            </button>
          </div>

          {/* Assets Section */}
          <div className="assets-section">
            <div className="assets-header">
              <span className="assets-label">Assets ({selectedWallet.chains.length})</span>
              <button className="manage-btn manage-btn-anim">Manage</button>
            </div>
            <div className="assets-list">
              {selectedWallet.chains.map((chain, idx) => (
                <ChainCard key={idx} chain={chain} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Popup;