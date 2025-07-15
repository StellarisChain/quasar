import React, { useState, useEffect } from 'react';
import '../../assets/img/logo.svg';
import './Newtab.css';
import './Newtab.scss';
import { WalletSelector, ChainCard } from '../Popup/Popup';

// Inline the defaultWallets from Popup
const defaultWallets = [
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

const Newtab = () => {
  const [wallets, setWallets] = useState(defaultWallets);
  const [selectedWallet, setSelectedWallet] = useState(defaultWallets[0]);
  const [loadingPrices, setLoadingPrices] = useState(false);

  // Load saved links from localStorage or use defaults
  const [links, setLinks] = useState(() => {
    const saved = JSON.parse(localStorage.getItem('quasar-saved-links') || '[]');
    return saved.length > 0 ? saved : [
      { url: 'https://stellarischain.com', label: 'StellarisChain' },
      { url: 'https://quasarwallet.io', label: 'Quasar Wallet' },
      { url: 'https://github.com/StellarisChain/quasar', label: 'Quasar GitHub' },
    ];
  });
  
  const [search, setSearch] = useState('');
  const [newLink, setNewLink] = useState('');
  const [newLabel, setNewLabel] = useState('');

  // Save links to localStorage whenever links change
  useEffect(() => {
    localStorage.setItem('quasar-saved-links', JSON.stringify(links));
  }, [links]);

  // Function to get favicon URL
  const getFaviconUrl = (url) => {
    try {
      const domain = new URL(url).hostname;
      return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
    } catch (e) {
      return `https://www.google.com/s2/favicons?domain=example.com&sz=32`;
    }
  };

  // Simulate price fetching (stub)
  useEffect(() => {
    setLoadingPrices(true);
    setTimeout(() => {
      // Simulate price update
      const updatedWallets = wallets.map(wallet => ({
        ...wallet,
        chains: wallet.chains.map(chain => {
          const chainPrice = 1000 + Math.random() * 1000;
          const chainChange = Math.random() * 2 - 1;
          const fiatValue = chainPrice * parseFloat(chain.balance.replace(/,/g, ''));
          return {
            ...chain,
            fiatValue,
            change24h: chainChange,
            tokens: chain.tokens.map(token => {
              const tokenPrice = 1 + Math.random() * 10;
              const tokenChange = Math.random() * 2 - 1;
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
      setSelectedWallet(updatedWallets.find(w => w.id === selectedWallet.id) || updatedWallets[0]);
      setLoadingPrices(false);
    }, 800);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Calculate total portfolio value
  const totalValue = selectedWallet.chains.reduce((sum, chain) => sum + chain.fiatValue, 0);
  const totalChange = selectedWallet.chains.reduce((sum, chain) =>
    sum + (chain.change24h * chain.fiatValue / (totalValue || 1)), 0
  );

  // Search submit handler
  const handleSearch = (e) => {
    e.preventDefault();
    if (search.trim()) {
      window.open(`https://www.google.com/search?q=${encodeURIComponent(search)}`, '_blank');
      setSearch('');
    }
  };

  // Add link handler
  const handleAddLink = (e) => {
    e.preventDefault();
    if (newLink.trim() && newLabel.trim()) {
      const newLinkObj = { url: newLink, label: newLabel };
      setLinks([...links, newLinkObj]);
      setNewLink('');
      setNewLabel('');
    }
  };

  // Remove link handler
  const handleRemoveLink = (idx) => {
    setLinks(links.filter((_, i) => i !== idx));
  };

  return (
    <div className="newtab-root">
      <header className="newtab-header">
        <div className="brand">
          <img src="/icon-128.png" alt="Quasar Logo" className="brand-logo" />
          <span className="brand-title">Quasar New Tab</span>
        </div>
        <form className="search-form" onSubmit={handleSearch}>
          <input
            type="text"
            className="search-input"
            placeholder="Search Google or type a URL"
            value={search}
            onChange={e => setSearch(e.target.value)}
            autoFocus
          />
          <button type="submit" className="search-btn">Search</button>
        </form>
      </header>

      <main className="newtab-main">
        <section className="links-section">
          <h2>Saved Links</h2>
          <ul className="links-list">
            {links.map((link, idx) => (
              <li key={idx} className="link-item">
                <img 
                  src={getFaviconUrl(link.url)} 
                  alt={`${link.label} favicon`} 
                  className="link-favicon"
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
                <a href={link.url} target="_blank" rel="noopener noreferrer">{link.label}</a>
                <button className="remove-link-btn" onClick={() => handleRemoveLink(idx)} title="Remove">×</button>
              </li>
            ))}
          </ul>
          <form className="add-link-form" onSubmit={handleAddLink}>
            <input
              type="text"
              className="add-link-input"
              placeholder="Label"
              value={newLabel}
              onChange={e => setNewLabel(e.target.value)}
            />
            <input
              type="url"
              className="add-link-input"
              placeholder="https://example.com"
              value={newLink}
              onChange={e => setNewLink(e.target.value)}
            />
            <button type="submit" className="add-link-btn">Add</button>
          </form>
        </section>

        <section className="portfolio-section">
          <h2>Portfolio</h2>
          <div className="portfolio-card">
            <WalletSelector
              wallets={wallets}
              selectedWallet={selectedWallet}
              onWalletChange={wallet => {
                setSelectedWallet(wallet);
              }}
            />
            <div className="balance-card">
              <div className="balance-label">Total Portfolio Value</div>
              <div className="balance-amount">
                {loadingPrices ? <span>Loading...</span> : `$${totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
              </div>
              <div className={`balance-change ${totalChange >= 0 ? 'positive' : 'negative'}`}>
                <span>{totalChange >= 0 ? '+' : ''}{totalChange.toFixed(2)}% (24h)</span>
              </div>
            </div>
            <div className="assets-section">
              <div className="assets-header">
                <span className="assets-label">Assets ({selectedWallet.chains.length})</span>
                <button className="manage-btn" disabled>Manage</button>
              </div>
              <div className="assets-list">
                {selectedWallet.chains.map((chain, idx) => (
                  <ChainCard key={idx} chain={chain} />
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Newtab;