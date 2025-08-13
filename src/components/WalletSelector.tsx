import React, { useState, useRef, useEffect } from 'react';
import { Token, ChainData, Wallet } from '../pages/Popup/DataTypes';
import { Dropdown } from './Dropdown';
import { ChevronDownIcon, ArrowUpRightIcon, ArrowDownRightIcon, WalletIcon, PlusIcon } from './Icons';
import { defaultWallets } from '../pages/Popup/WalletUtils';
import { saveWallets } from '../pages/Popup/WalletUtils';
import './WalletSelector.css';

// Config
export let demoMode = false; // Set to false in production

// Wallet Selector Component
export const WalletSelector = ({ wallets, selectedWallet, onWalletChange, onCreateWallet, setWallets }: {
  wallets: Wallet[];
  selectedWallet: Wallet | null;
  onWalletChange: (wallet: Wallet | null) => void;
  onCreateWallet?: () => void;
  setWallets?: (wallets: Wallet[]) => void;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  // Defensive: treat falsy, non-array, or empty array as no wallets
  const walletList = Array.isArray(wallets) && wallets ? wallets.filter(Boolean) : [];
  console.warn('Wallet list length:', walletList.length, 'wallets:', wallets);

  return (
    <Dropdown
      trigger={
        <div className="wallet-selector wallet-selector-anim">
          <WalletIcon />
          <span className="wallet-name">{selectedWallet && selectedWallet.name ? selectedWallet.name : 'No Wallets'}</span>
          <ChevronDownIcon />
        </div>
      }
      isOpen={isOpen}
      onToggle={() => setIsOpen(!isOpen)}
    >
      <div className="wallet-list">
        {
          walletList.map((wallet, idx) => {
            // Use id if present and unique, else fallback to address or index
            let key = wallet.id;
            if (!key || walletList.filter(w => w.id === key).length > 1) {
              key = wallet.address ? `address-${wallet.address}-${idx}` : `idx-${idx}`;
            }
            return (
              <div
                key={key}
                onClick={() => {
                  onWalletChange(wallet);
                  setIsOpen(false);
                }}
                className={`wallet-item wallet-item-anim ${selectedWallet && selectedWallet.id === wallet.id ? 'selected' : ''}`}
                tabIndex={0}
                role="button"
                style={{ transition: 'background 0.2s, box-shadow 0.2s' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                  <div>
                    <div className="wallet-name">{wallet.name}</div>
                    <div className="wallet-address">{wallet.address}</div>
                  </div>
                  {/* Curve name display */}
                  {wallet.curve && (
                    <div style={{
                      fontSize: '11px',
                      color: '#9ca3af',
                      fontWeight: '500',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      flexShrink: 0,
                      marginLeft: '8px'
                    }}>
                      {wallet.curve}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        <div
          key="create-wallet"
          className="wallet-item wallet-item-anim create-wallet"
          tabIndex={0}
          role="button"
          onClick={typeof onCreateWallet === 'function' ? () => {
            onCreateWallet();
            setIsOpen(false);
          } : undefined}
          style={{ transition: 'background 0.2s, box-shadow 0.2s' }}
        >
          <PlusIcon />
          <div className="wallet-name">New Wallet</div>
        </div>
        {/* Demo Mode: AT NO POINT USE THIS WITH PRODUCTION WALLETS */}
        {demoMode && walletList.length === 0 && (
          <div
            key="demo-wallet"
            className={`wallet-item wallet-item-anim create-wallet ${selectedWallet && selectedWallet.id === defaultWallets[0].id ? 'selected' : ''}`}
            tabIndex={0}
            role="button"
            onClick={() => {
              if (selectedWallet === defaultWallets[0] && setWallets) {
                setWallets([]); // Unselect the wallet
                onWalletChange(null);
                saveWallets([]); // Clear wallets
                setIsOpen(false);
                localStorage.clear(); // Clear local storage
                return
              }
              onWalletChange(defaultWallets[0]);
              if (setWallets) setWallets(defaultWallets);
              setIsOpen(false);
            }}
            style={{ transition: 'background 0.2s, box-shadow 0.2s' }}
          >
            <PlusIcon />
            <div className="wallet-name">Demo</div>
          </div>
        )}
      </div>
    </Dropdown>
  );
};