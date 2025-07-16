import React, { useState, useRef, useEffect } from 'react';
import Counter from '../../components/Counter';
import StarBorder from '../../components/StarBorder';
import Noise from '../../components/Noise';
import { ChevronDownIcon, WalletIcon, ArrowUpRightIcon, ArrowDownRightIcon, ArrowsRightLeftIcon, PlusIcon, CreditCardIcon } from '../../components/Icons';
import { MiniChart } from '../../components/MiniChart';
import { Dropdown } from '../../components/Dropdown';
import { ChainCard } from '../../components/ChainCard';
import { Token, ChainData, Wallet } from './DataTypes';
import { WalletSelector } from '../../components/WalletSelector';
import { Portfolio } from './Portfolio';
import { getStoredWallets, saveWallets, defaultWallets } from './WalletUtils';
import { CreateWallet } from './CreateWallet';
import './Popup.css';

const Popup = () => {
  // State
  const [page, setPage] = useState<'main' | 'create-wallet'>('main');
  const [wallets, setWallets] = useState<Wallet[]>(getStoredWallets());
  const [selectedWallet, setSelectedWallet] = useState<Wallet | null>(getStoredWallets()[0]);
  const [loadingPrices, setLoadingPrices] = useState(false);

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
          <div className="brand" onClick={() => setPage('main')}>
            <div className="brand-icon"><img src="icon-34.png" alt="Brand Icon" /></div>
            <span className="brand-name">Quasar</span>
          </div>
          <WalletSelector
            wallets={wallets} // If no wallets are loaded, this will default to []
            selectedWallet={selectedWallet}
            onWalletChange={wallet => {
              setSelectedWallet(wallet);
              saveWallets(wallets);
            }}
            onCreateWallet={() => setPage('create-wallet')}
            setWallets={setWallets}
          />
        </div>

        {/* Popup Page */}
        <div className="popup-page">
          {page === 'main' && <Portfolio wallets={wallets} selectedWallet={selectedWallet ? selectedWallet : null} />}
          {page === 'create-wallet' && <CreateWallet onBack={() => setPage('main')} onCreateWallet={(type) => {
            // Handle wallet creation
            setPage('main');
          }} />}
        </div>
      </div>
    </div>
  );
};

export default Popup;