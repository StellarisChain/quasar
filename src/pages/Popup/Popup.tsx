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
import { NewWallet } from './NewWallet';
import { ImportWallet, ImportWalletProps } from './ImportWallet';
import { RequestDialog } from './RequestDialog';
import './Popup.css';

const Popup = () => {
  // State
  const [page, setPage] = useState<'main' | 'create-wallet' | 'new-wallet' | 'import-wallet'>('main');
  const [wallets, setWallets] = useState<Wallet[]>(getStoredWallets());
  const [selectedWallet, setSelectedWallet] = useState<Wallet | null>(getStoredWallets()[0]);
  const [loadingPrices, setLoadingPrices] = useState(false);
  const [importWalletFile, setImportWalletFile] = useState<boolean>(false);
  const [requestId, setRequestId] = useState<string | null>(null);
  const [showRequestDialog, setShowRequestDialog] = useState(false);

  // Check for request ID in URL params on mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const reqId = urlParams.get('request');

    if (reqId) {
      setRequestId(reqId);
      setShowRequestDialog(true);
    }
  }, []);

  React.useEffect(() => {
    if (wallets) {
      saveWallets(wallets);
    }
  }, [wallets]);

  const handleRequestApprove = (result: any) => {
    setShowRequestDialog(false);
    // Close the popup window after approval
    window.close();
  };

  const handleRequestReject = (reason?: string) => {
    setShowRequestDialog(false);
    // Close the popup window after rejection
    window.close();
  };

  const handleRequestClose = () => {
    setShowRequestDialog(false);
    // If there's no wallet and this was a CONNECT request, don't close the popup
    // Let the user create a wallet instead
    if (!selectedWallet && requestId) {
      // Just hide the dialog, don't close the popup
      return;
    }
    // Otherwise close the popup window when closed without action
    window.close();
  };

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
              setWallets(wallets);
            }}
            onCreateWallet={() => setPage('create-wallet')}
            setWallets={setWallets}
          />
        </div>

        {/* Popup Page */}
        <div className="popup-page">
          {page === 'main' && <Portfolio wallets={wallets} selectedWallet={selectedWallet ? selectedWallet : null} setSelectedWallet={setSelectedWallet} setWallets={setWallets} />}
          {page === 'create-wallet' && <CreateWallet onBack={() => setPage('main')} onCreateWallet={(type) => {
            // Handle wallet creation
            if (type === "new") {
              setPage('new-wallet');
              return;
            } else if (type === "import-file") {
              setImportWalletFile(true);
            } else if (type === "manual-import") {
              setImportWalletFile(false);
            } else {
              console.error("Unknown wallet creation type:", type);
              setPage('main');
            }
            setPage('import-wallet');
            return;
          }} />}
          {page === 'new-wallet' && <NewWallet onBack={() => setPage('create-wallet')} onComplete={(wallet: Wallet) => {
            setWallets([...wallets, wallet]);
            setSelectedWallet(wallet);
            // If there's a pending request, show it again after wallet creation
            if (requestId) {
              setShowRequestDialog(true);
            } else {
              setPage('main');
            }
          }} />}
          {page === "import-wallet" && <ImportWallet onBack={() => setPage('create-wallet')} fromFile={importWalletFile} onImport={(wallet: Wallet) => {
            setWallets([...wallets, wallet]);
            setSelectedWallet(wallet);
            // If there's a pending request, show it again after wallet import
            if (requestId) {
              setShowRequestDialog(true);
            } else {
              setPage('main');
            }
          }} />}
        </div>
      </div>

      {/* Request Dialog */}
      {showRequestDialog && requestId && (
        <RequestDialog
          requestId={requestId}
          selectedWallet={selectedWallet}
          wallets={wallets}
          onApprove={handleRequestApprove}
          onReject={handleRequestReject}
          onClose={handleRequestClose}
        />
      )}
    </div>
  );
};

export default Popup;