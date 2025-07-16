import React, { useState, useEffect } from 'react';
import { loadTokensXmlAsJson, Chain } from '../lib/token_loader';
import { Wallet } from '../pages/Popup/DataTypes';
import { ChevronDownIcon, CopyIcon, SettingsIcon } from './Icons';
import './ManageAssets.css';

interface ManageAssetsProps {
    selectedWallet: Wallet | null;
    onClose: () => void;
    onSave: (selectedTokens: Chain[]) => void;
}

export const ManageAssets: React.FC<ManageAssetsProps> = ({ selectedWallet, onClose, onSave }) => {
    const [availableTokens, setAvailableTokens] = useState<Chain[]>([]);
    const [selectedTokens, setSelectedTokens] = useState<Chain[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Load available tokens from XML
    useEffect(() => {
        const loadTokens = async () => {
            try {
                setLoading(true);
                setError(null);
                const tokens = await loadTokensXmlAsJson('tokens.xml');
                setAvailableTokens(tokens);
                
                // Pre-select tokens that are already in the wallet
                if (selectedWallet?.chains) {
                    const walletTokenSymbols = selectedWallet.chains.map(chain => chain.symbol);
                    const preSelected = tokens.filter(token => walletTokenSymbols.includes(token.Symbol));
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
                    <h3>Manage Assets</h3>
                    <button className="close-btn" onClick={onClose}>×</button>
                </div>
                
                <div className="manage-assets-content">
                    {loading && (
                        <div className="loading-state">
                            <div className="spinner"></div>
                            <p>Loading available tokens...</p>
                        </div>
                    )}
                    
                    {error && (
                        <div className="error-state">
                            <p>{error}</p>
                            <button onClick={() => window.location.reload()}>Retry</button>
                        </div>
                    )}
                    
                    {!loading && !error && (
                        <>
                            <div className="selection-summary">
                                <p>{selectedTokens.length} of {availableTokens.length} assets selected</p>
                            </div>
                            
                            <div className="tokens-grid">
                                {availableTokens.map((token) => (
                                    <div
                                        key={token.Symbol}
                                        className={`token-card ${isTokenSelected(token) ? 'selected' : ''}`}
                                        onClick={() => toggleToken(token)}
                                    >
                                        <div className="token-card-header">
                                            <div className="token-icon" style={{ backgroundColor: token.Color }}>
                                                {token.Symbol.slice(0, 2)}
                                            </div>
                                            <div className="token-details">
                                                <div className="token-name">{token.Name}</div>
                                                <div className="token-symbol">{token.Symbol}</div>
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
                    <button className="cancel-btn" onClick={onClose}>Cancel</button>
                    <button 
                        className="save-btn" 
                        onClick={handleSave}
                        disabled={loading}
                    >
                        Save Changes
                    </button>
                </div>
            </div>
        </div>
    );
};