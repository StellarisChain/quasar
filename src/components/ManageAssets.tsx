import React, { useState, useEffect } from 'react';
import { loadTokensXmlAsJson, Chain, filterTokensByCurve, getPrimarySymbol, matchesSymbol } from '../lib/token_loader';
import { Wallet } from '../pages/Popup/DataTypes';
import { getTokenImagePath } from '../pages/Popup/TokenImageUtil';
import { ChevronDownIcon, CopyIcon, SettingsIcon } from './Icons';
import { useTranslation } from '../lib/i18n';
import './ManageAssets.css';

interface ManageAssetsProps {
    selectedWallet: Wallet | null;
    onClose: () => void;
    onSave: (selectedTokens: Chain[]) => void;
}

export const ManageAssets: React.FC<ManageAssetsProps> = ({ selectedWallet, onClose, onSave }) => {
    const { t } = useTranslation();
    const [availableTokens, setAvailableTokens] = useState<Chain[]>([]);
    const [selectedTokens, setSelectedTokens] = useState<Chain[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Asset icon component for tokens
    const AssetIcon: React.FC<{ symbol: string; alt: string; fallback: string; color: string }> = ({ symbol, alt, fallback, color }) => {
        const [imgSrc, setImgSrc] = useState<string | null>(null);
        const [isLoading, setIsLoading] = useState(true);
        const [hasError, setHasError] = useState(false);

        useEffect(() => {
            let isMounted = true;
            setIsLoading(true);
            setHasError(false);

            getTokenImagePath(symbol).then(path => {
                if (isMounted) {
                    setImgSrc(path);
                    setIsLoading(false);
                    if (!path) {
                        setHasError(true);
                    }
                }
            }).catch(() => {
                if (isMounted) {
                    setHasError(true);
                    setIsLoading(false);
                }
            });

            return () => { isMounted = false; };
        }, [symbol]);

        if (isLoading) {
            return (
                <div style={{
                    fontSize: '10px',
                    color: '#9ca3af',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '100%',
                    height: '100%'
                }}>
                    •••
                </div>
            );
        }

        return imgSrc && !hasError ? (
            <img
                src={imgSrc}
                alt={alt}
                style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    borderRadius: '50%'
                }}
                onError={() => setHasError(true)}
            />
        ) : (
            <span style={{
                fontSize: '12px',
                fontWeight: 'bold',
                color: 'white',
                textShadow: '0 1px 2px rgba(0,0,0,0.5)'
            }}>
                {fallback}
            </span>
        );
    };

    // Load available tokens from XML
    useEffect(() => {
        const loadTokens = async () => {
            try {
                setLoading(true);
                setError(null);
                const allTokens = await loadTokensXmlAsJson('tokens.xml');

                // Filter tokens by wallet's curve type
                const walletCurve = selectedWallet?.curve || 'secp256k1';
                const filteredTokens = filterTokensByCurve(allTokens, walletCurve);
                setAvailableTokens(filteredTokens);

                // Pre-select tokens that are already in the wallet
                if (selectedWallet?.chains) {
                    const walletTokenSymbols = selectedWallet.chains.map(chain => chain.symbol);
                    // Use matchesSymbol to handle aliases - e.g., wallet has "STR" but XML has "STR/STE"
                    const preSelected = filteredTokens.filter(token => 
                        walletTokenSymbols.some(walletSymbol => matchesSymbol(walletSymbol, token.Symbol))
                    );
                    setSelectedTokens(preSelected);
                }
            } catch (err) {
                setError('Failed to load available tokens');
                console.error('Error loading tokens:', err);
            } finally {
                setLoading(false);
            }
        };

        loadTokens();
    }, [selectedWallet]);

    // Toggle token selection
    const toggleToken = (token: Chain) => {
        setSelectedTokens(prev => {
            const isSelected = prev.some(t => t.Symbol === token.Symbol);
            if (isSelected) {
                return prev.filter(t => t.Symbol !== token.Symbol);
            } else {
                return [...prev, token];
            }
        });
    };

    // Check if token is selected
    const isTokenSelected = (token: Chain) => {
        return selectedTokens.some(t => t.Symbol === token.Symbol);
    };

    // Handle save
    const handleSave = () => {
        onSave(selectedTokens);
        onClose();
    };

    return (
        <div className="manage-assets-overlay">
            <div className="manage-assets-modal">
                <div className="manage-assets-header">
                    <div>
                        <h3>Manage Assets</h3>
                        {selectedWallet?.curve && (
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                fontSize: '12px',
                                color: '#9ca3af',
                                marginTop: '4px'
                            }}>
                                <span style={{
                                    width: '6px',
                                    height: '6px',
                                    borderRadius: '50%',
                                    background: selectedWallet.curve === 'secp256k1' ? '#10b981' : '#f59e0b'
                                }} />
                                <span>Showing {selectedWallet.curve.toUpperCase()} compatible assets</span>
                            </div>
                        )}
                    </div>
                    <button className="close-btn" onClick={onClose}>×</button>
                </div>

                <div className="manage-assets-content">
                    {loading && (
                        <div className="loading-state">
                            <div className="spinner"></div>
                            <p>{t('manageAssets.loading')}</p>
                        </div>
                    )}

                    {error && (
                        <div className="error-state">
                            <p>{error}</p>
                            <button onClick={() => window.location.reload()}>{t('common.retry')}</button>
                        </div>
                    )}

                    {!loading && !error && (
                        <>
                            <div className="selection-summary">
                                <p>{t('manageAssets.selectionSummary', { selected: selectedTokens.length, total: availableTokens.length })}</p>
                            </div>

                            <div className="tokens-grid">
                                {availableTokens.map((token) => (
                                    <div
                                        key={token.Symbol}
                                        className={`token-card ${isTokenSelected(token) ? 'selected' : ''}`}
                                        onClick={() => toggleToken(token)}
                                    >
                                        <div className="token-card-header">
                                            <div className="token-icon" style={{ backgroundColor: token.Color, overflow: 'hidden' }}>
                                                <AssetIcon
                                                    symbol={getPrimarySymbol(token.Symbol)}
                                                    alt={getPrimarySymbol(token.Symbol)}
                                                    fallback={getPrimarySymbol(token.Symbol).slice(0, 2)}
                                                    color={token.Color}
                                                />
                                            </div>
                                            <div className="token-details">
                                                <div className="token-name">{token.Name}</div>
                                                <div className="token-symbol">{getPrimarySymbol(token.Symbol)} • {token.Curve?.toUpperCase() || 'UNKNOWN'}</div>
                                            </div>
                                        </div>
                                        <div className="token-selection">
                                            <input
                                                type="checkbox"
                                                checked={isTokenSelected(token)}
                                                onChange={() => toggleToken(token)}
                                                onClick={(e) => e.stopPropagation()}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </div>

                <div className="manage-assets-footer">
                    <button className="cancel-btn" onClick={onClose}>{t('common.cancel')}</button>
                    <button
                        className="save-btn"
                        onClick={handleSave}
                        disabled={loading}
                    >
                        {t('common.saveChanges')}
                    </button>
                </div>
            </div>
        </div>
    );
};