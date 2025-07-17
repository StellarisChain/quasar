import React, { useState, useRef, useEffect } from 'react';
import Counter from '../../components/Counter';
import StarBorder from '../../components/StarBorder';
import Noise from '../../components/Noise';
import { ChevronDownIcon, WalletIcon, ArrowUpRightIcon, ArrowDownRightIcon, ArrowsRightLeftIcon, PlusIcon, CreditCardIcon, CopyIcon, SettingsIcon } from '../../components/Icons';
import { MiniChart } from '../../components/MiniChart';
import { Dropdown } from '../../components/Dropdown';
import { ChainCard } from '../../components/ChainCard';
import { Token, ChainData, Wallet } from './DataTypes';
import { WalletSelector } from '../../components/WalletSelector';
import { getStoredWallets, saveWallets } from './WalletUtils';
import { ManageAssets } from '../../components/ManageAssets';
import { WalletSettingsModal } from '../../components/WalletSettings';
import { loadTokensXmlAsJson, Chain as TokenFromXML } from '../../lib/token_loader';
import { getBalanceInfo } from '../../lib/wallet_client';
import './Popup.css';

// Utility to shorten address
function shortenAddress(address: string, chars = 6) {
    if (!address) return '';
    return address.slice(0, chars) + '...' + address.slice(-chars);
}

export const Portfolio = ({ wallets, selectedWallet, setSelectedWallet, setWallets }: {
    wallets: Wallet[];
    selectedWallet: Wallet | null;
    setSelectedWallet: (wallet: Wallet | null) => void;
    setWallets: (wallets: Wallet[]) => void;
}) => {
    // State
    const [loadingPrices, setLoadingPrices] = useState(false);
    const [lastFetch, setLastFetch] = useState<number | null>(null);
    const [showManageAssets, setShowManageAssets] = useState(false);

    // Copy address feedback state
    const [copied, setCopied] = useState(false);
    const copyTimeout = useRef<NodeJS.Timeout | null>(null);

    // Wallet settings modal state
    const [showWalletSettings, setShowWalletSettings] = useState(false);

    // Copy address handler
    const handleCopyAddress = () => {
        if (selectedWallet?.address) {
            navigator.clipboard.writeText(selectedWallet.address);
            setCopied(true);
            if (copyTimeout.current) clearTimeout(copyTimeout.current);
            copyTimeout.current = setTimeout(() => setCopied(false), 1200);
        }
    };

    // Handle saving selected tokens from ManageAssets
    const handleSaveSelectedTokens = (selectedTokens: TokenFromXML[]) => {
        if (!selectedWallet) return;

        // Convert selected tokens to ChainData format
        const newChains: ChainData[] = selectedTokens.map(token => ({
            name: token.Name,
            symbol: token.Symbol,
            balance: '0.00', // Default balance
            fiatValue: 0,
            change24h: 0,
            tokens: [], // Start with empty tokens array
            chartData: [], // Empty chart data
            color: token.Color // Add color property as required by ChainData
        }));

        // Update the selected wallet with new chains
        const updatedWallet = {
            ...selectedWallet,
            chains: newChains
        };

        // Update wallets array
        const updatedWallets = wallets.map(wallet =>
            wallet.id === selectedWallet.id ? updatedWallet : wallet
        );

        // Save to storage and update state
        saveWallets(updatedWallets);
        setWallets(updatedWallets);
        setSelectedWallet(updatedWallet);
    };

    // Fetch price data from API
    React.useEffect(() => {
        const fetchPrices = async () => {
            if (lastFetch && Date.now() - lastFetch < 600) {
                console.warn('Skipping fetch, last fetch was less than 600 milliseconds ago');
                return;
            }
            setLoadingPrices(true);
            setLastFetch(Date.now());
            if (wallets && wallets.length > 0) {
                // Collect all symbols to fetch
                const symbols = Array.from(new Set(wallets.flatMap(w => (w.chains ?? []).flatMap(c => [c.symbol, ...c.tokens.map(t => t.symbol)]))));
                if (symbols.length === 0) {
                    setLoadingPrices(false);
                    return;
                }
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
                            price: Math.random() * 100 + 1, // Random price between 1 and 100
                            change24h: (Math.random() - 0.5) * 2 //
                        };
                    });
                }
                // Update wallets with price info
                const updatedWallets = await Promise.all(wallets.map(async wallet => {
                    const chains = await Promise.all(
                        (wallet.chains ?? []).map(async chain => {
                            const chainPrice = priceData[chain.symbol]?.price ?? 0;
                            const chainChange = priceData[chain.symbol]?.change24h ?? 0;
                            const tokenData: TokenFromXML[] = await loadTokensXmlAsJson('tokens.xml');

                            // Load Balance
                            const [balance] = await getBalanceInfo(
                                selectedWallet?.address || '',
                                tokenData.find(token => token.Symbol === chain.symbol)?.Node || ''
                            );
                            chain.balance = (balance !== null && balance !== undefined) ? balance.toString() : '0.00'; // Ensure balance is a string
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
                    );
                    return {
                        ...wallet,
                        chains
                    };
                }));
                // If selectedWallet changed, update it too
                setSelectedWallet(
                    selectedWallet
                        ? updatedWallets.find(w => w.id === selectedWallet.id) || updatedWallets[0]
                        : updatedWallets[0]
                );
                saveWallets(updatedWallets);
                setLoadingPrices(false);
            } else {
                console.warn('No wallets found');
                setLoadingPrices(false);
            }
        };
        fetchPrices();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [wallets, selectedWallet]);

    // Calculate total portfolio value
    const totalValue = selectedWallet && selectedWallet.chains
        ? selectedWallet.chains.reduce((sum, chain) => sum + chain.fiatValue, 0)
        : 0;
    const totalChange = selectedWallet && selectedWallet.chains
        ? selectedWallet.chains.reduce((sum, chain) =>
            sum + (chain.change24h * chain.fiatValue / (totalValue || 1)), 0
        )
        : 0;

    return (
        <>
            <div className="popup-content" style={{ overflow: 'auto', maxHeight: 'calc(100vh - 64px)' }}>
                {/* Wallet Address Display */}
                {selectedWallet?.address && (
                    <div
                        className="wallet-address-container"
                        title={selectedWallet.address}
                        onClick={handleCopyAddress}
                    >
                        <span className={`wallet-address-span${copied ? ' copied' : ''}`}>
                            <span className="wallet-address-text">
                                {shortenAddress(selectedWallet.address, 6)}
                                <span className="wallet-address-full">{selectedWallet.address}</span>
                            </span>
                        </span>
                        <span className="wallet-copy-icon" style={{ opacity: 0.7, fontSize: 16, marginLeft: 8, display: 'flex', alignItems: 'center' }}>
                            {copied ? '✓' : <CopyIcon />}
                        </span>
                        <span
                            style={{
                                position: 'absolute',
                                top: '100%',
                                left: '50%',
                                transform: 'translateX(-50%)',
                                background: '#222',
                                color: '#fff',
                                fontSize: 12,
                                padding: '2px 8px',
                                borderRadius: 6,
                                marginTop: 2,
                                opacity: copied ? 1 : 0,
                                pointerEvents: 'none',
                                transition: 'opacity 0.2s',
                                zIndex: 10,
                            }}
                        >
                            Copied!
                        </span>
                    </div>
                )}
                {/* Total Balance */}
                <div className="balance-card balance-card-anim" style={{ position: 'relative' }}>
                    {/* Settings Gear Icon */}
                    <button
                        className="settings-gear-btn"
                        style={{
                            position: 'absolute',
                            top: 10,
                            right: 10,
                            background: 'none',
                            border: 'none',
                            padding: 0,
                            cursor: 'pointer',
                            zIndex: 2,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            opacity: 0.7,
                            transition: 'opacity 0.2s',
                        }}
                        title="Settings"
                        aria-label="Settings"
                        tabIndex={0}
                        onClick={() => setShowWalletSettings(true)}
                    >
                        <SettingsIcon />
                    </button>
                    <div className="balance-label">Total Portfolio Value</div>
                    <div className="balance-amount" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {loadingPrices ? (
                            <span>Loading...</span>
                        ) : (
                            <>
                                <span style={{ fontSize: 32, fontWeight: 600, color: 'white', marginRight: 0.5, fontFamily: 'Inter, Segoe UI, Arial, Helvetica, sans-serif' }}>$</span>
                                <Counter
                                    value={totalValue}
                                    fontSize={32}
                                    padding={0}
                                    gap={0.25}
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
                        <span className="assets-label">Assets ({selectedWallet && selectedWallet.chains ? selectedWallet.chains.length : 0})</span>
                        <button
                            className="manage-btn manage-btn-anim"
                            onClick={() => setShowManageAssets(true)}
                        >
                            Manage
                        </button>
                    </div>
                    <div className="assets-list">
                        {selectedWallet && selectedWallet.chains ? selectedWallet.chains.map((chain, idx) => (
                            <ChainCard key={idx} chain={chain} />
                        )) : null}
                    </div>
                </div>
            </div>

            {/* Manage Assets Modal */}
            {showManageAssets && (
                <ManageAssets
                    selectedWallet={selectedWallet}
                    onClose={() => setShowManageAssets(false)}
                    onSave={handleSaveSelectedTokens}
                />
            )}

            {/* Wallet Settings Modal */}
            {showWalletSettings && selectedWallet && (
                <WalletSettingsModal
                    wallet={selectedWallet}
                    onClose={() => setShowWalletSettings(false)}
                    onSave={() => { }}
                />
            )}
        </>
    );
};