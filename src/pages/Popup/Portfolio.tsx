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
import { getStoredWallets, saveWallets } from './WalletUtils';
import './Popup.css';

export const Portfolio = ({ wallets, selectedWallet }: {
    wallets: Wallet[];
    selectedWallet: Wallet;
}) => {
    // State
    //const [wallets, setWallets] = useState<Wallet[]>(getStoredWallets());
    //const [selectedWallet, setSelectedWallet] = useState<Wallet>(getStoredWallets()[0]);
    const [loadingPrices, setLoadingPrices] = useState(false);

    // Fetch price data from API
    React.useEffect(() => {
        const fetchPrices = async () => {
            setLoadingPrices(true);

            if (!wallets || wallets.length === 0) {
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
                //setWallets(updatedWallets);
                // If selectedWallet changed, update it too
                //setSelectedWallet(updatedWallets.find(w => w.id === selectedWallet.id) || updatedWallets[0]);
                saveWallets(updatedWallets);
                setLoadingPrices(false);
            }
        };
        fetchPrices();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Calculate total portfolio value
    const totalValue = selectedWallet ? selectedWallet.chains.reduce((sum, chain) => sum + chain.fiatValue, 0) : 0;
    const totalChange = selectedWallet ? selectedWallet.chains.reduce((sum, chain) =>
        sum + (chain.change24h * chain.fiatValue / (totalValue || 1)), 0
    ) : 0;

    return (
        <div className="popup-content" style={{ overflow: 'auto', maxHeight: 'calc(100vh - 64px)' }}>
            {/* Total Balance */}
            <div className="balance-card balance-card-anim">
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
                    <span className="assets-label">Assets ({selectedWallet ? selectedWallet.chains.length : 0})</span>
                    <button className="manage-btn manage-btn-anim">Manage</button>
                </div>
                <div className="assets-list">
                    {selectedWallet ? selectedWallet.chains.map((chain, idx) => (
                        <ChainCard key={idx} chain={chain} />
                    )) : null}
                </div>
            </div>
        </div>
    );
};