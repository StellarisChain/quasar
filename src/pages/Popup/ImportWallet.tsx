import React, { useState, useRef } from 'react';
import { BackIcon, KeyIcon, WalletIcon } from '../../components/Icons';
import { Wallet, JsonWallet } from '../Popup/DataTypes';
import { detectCurveFromWalletData } from '../../lib/curve_detection_utils';
import './Popup.css';

export interface ImportWalletProps {
    onBack: () => void;
    onImport: (wallet: Wallet) => void;
    fromFile?: boolean;
}

export const ImportWallet: React.FC<ImportWalletProps> = ({ onBack, onImport, fromFile }) => {
    const [walletData, setWalletData] = useState<Wallet | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [curveDetection, setCurveDetection] = useState<{ curve: string, confidence: number, method: string } | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) {
            // Don't close dialog if no file was selected (user cancelled)
            return;
        }

        if (!file.name.endsWith('.json')) {
            setError('Please select a valid .json file');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const text = await file.text();
            const walletJson = JSON.parse(text);


            const walletData: JsonWallet = walletJson as JsonWallet;

            // Only select the first entry
            const selectedWallet = walletData.wallet_data.entry_data.entries[0];

            // Automatically detect the curve from wallet data
            const curveDetectionResult = detectCurveFromWalletData({
                private_key: selectedWallet.private_key,
                public_key: selectedWallet.public_key,
                address: selectedWallet.address
            });

            // Store curve detection info for display
            setCurveDetection(curveDetectionResult);

            const wallet: Wallet = {
                id: selectedWallet.id || `imported-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                name: "Imported Wallet", // Default name
                address: selectedWallet.address,
                public_key: selectedWallet.public_key,
                private_key: selectedWallet.private_key,
                mnemonic: selectedWallet.mnemonic,
                curve: curveDetectionResult.curve
            };
            if (!wallet) {
                throw new Error('Invalid wallet data');
            }

            setWalletData(wallet);
        } catch (err) {
            setError('Failed to parse wallet file. Please check the file format.');
            console.error('Error parsing wallet file:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleImportWallet = () => {
        if (walletData) {
            onImport(walletData);
        }
    };

    const handleClearWallet = () => {
        setWalletData(null);
        setCurveDetection(null);
        setError(null);
    };

    if (fromFile) {
        return (
            <div className="popup-content import-wallet-page" style={{ overflow: 'auto', maxHeight: 'calc(100vh - 64px)' }}>
                <div className="import-wallet-header">
                    <button
                        className="back-btn back-btn-anim"
                        onClick={onBack}
                        style={{
                            background: 'none',
                            border: 'none',
                            color: '#9ca3af',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '8px',
                            borderRadius: '8px',
                            fontSize: '14px',
                            fontWeight: '500',
                            transition: 'all 0.2s',
                            marginBottom: '16px'
                        }}
                    >
                        <BackIcon />
                        <span>Back</span>
                    </button>

                    <div className="import-wallet-title">
                        <div className="wallet-icon-large" style={{
                            width: '48px',
                            height: '48px',
                            background: 'linear-gradient(135deg, #8b5cf6, #a855f7)',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto 16px',
                            boxShadow: '0 4px 16px rgba(139, 92, 246, 0.3)'
                        }}>
                            <KeyIcon />
                        </div>
                        <h2 style={{ fontSize: '24px', fontWeight: '600', textAlign: 'center', margin: '0 0 8px', color: 'white' }}>
                            Load Wallet from File
                        </h2>
                        <p style={{ fontSize: '14px', color: '#9ca3af', textAlign: 'center', margin: '0 0 32px', lineHeight: '1.5' }}>
                            Import your wallet using a .json file
                        </p>
                    </div>
                </div>

                {/* Wallet Details Container */}
                <div style={{
                    background: '#1f2937',
                    borderRadius: '12px',
                    padding: '24px',
                    margin: '0 24px 24px 24px',
                    border: '1px solid #374151'
                }}>
                    <h3 style={{ fontSize: '18px', fontWeight: '600', color: 'white', margin: '0 0 16px' }}>
                        Wallet Details
                    </h3>

                    {/* Error Display */}
                    {error && (
                        <div style={{
                            background: '#7f1d1d',
                            border: '1px solid #dc2626',
                            borderRadius: '8px',
                            padding: '12px',
                            color: '#fca5a5',
                            fontSize: '14px',
                            marginBottom: '16px'
                        }}>
                            {error}
                        </div>
                    )}

                    {/* Loading Indicator */}
                    {loading && (
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '20px',
                            background: '#111827',
                            border: '1px solid #374151',
                            borderRadius: '8px',
                            marginBottom: '16px'
                        }}>
                            <div style={{
                                display: 'inline-block',
                                width: '20px',
                                height: '20px',
                                border: '2px solid #374151',
                                borderTop: '2px solid #8b5cf6',
                                borderRadius: '50%',
                                animation: 'spin 1s linear infinite',
                                marginRight: '12px'
                            }}></div>
                            <span style={{ color: '#9ca3af', fontSize: '14px' }}>
                                Loading wallet...
                            </span>
                        </div>
                    )}

                    {!walletData ? (
                        <div style={{ textAlign: 'center', padding: '32px 0' }}>
                            <div style={{
                                width: '64px',
                                height: '64px',
                                background: '#374151',
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                margin: '0 auto 16px',
                                border: '2px dashed #6b7280'
                            }}>
                                <WalletIcon />
                            </div>
                            <p style={{ color: '#9ca3af', fontSize: '14px', margin: '0 0 16px' }}>
                                No wallet loaded
                            </p>
                            <label
                                htmlFor="wallet-file-input"
                                onClick={() => {
                                    if (fileInputRef.current) {
                                        fileInputRef.current.value = '';
                                    }
                                    setError(null);
                                }}
                                style={{
                                    background: '#8b5cf6',
                                    border: 'none',
                                    borderRadius: '8px',
                                    padding: '12px 24px',
                                    color: 'white',
                                    fontSize: '14px',
                                    fontWeight: '500',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    margin: '0 auto'
                                }}
                            >
                                Load from File
                            </label>
                        </div>
                    ) : (
                        <div>
                            <div style={{ marginBottom: '16px' }}>
                                <label style={{ display: 'block', fontSize: '12px', color: '#9ca3af', marginBottom: '4px' }}>
                                    Name
                                </label>
                                <input
                                    type="text"
                                    value={walletData.name || 'Unnamed Wallet'}
                                    onChange={(e) => {
                                        const wallet = { ...walletData, name: e.target.value };
                                        setWalletData(wallet);
                                    }}
                                    style={{
                                        background: '#111827',
                                        border: '1px solid #374151',
                                        borderRadius: '8px',
                                        padding: '12px',
                                        color: 'white',
                                        fontSize: '14px'
                                    }} />
                            </div>

                            <div style={{ marginBottom: '16px' }}>
                                <label style={{ display: 'block', fontSize: '12px', color: '#9ca3af', marginBottom: '4px' }}>
                                    Address
                                </label>
                                <div style={{
                                    background: '#111827',
                                    border: '1px solid #374151',
                                    borderRadius: '8px',
                                    padding: '12px',
                                    color: 'white',
                                    fontSize: '12px',
                                    fontFamily: 'monospace',
                                    wordBreak: 'break-all'
                                }}>
                                    {walletData.address}
                                </div>
                            </div>

                            <div style={{ marginBottom: '16px' }}>
                                <label style={{ display: 'block', fontSize: '12px', color: '#9ca3af', marginBottom: '4px' }}>
                                    Public Key
                                </label>
                                <div style={{
                                    background: '#111827',
                                    border: '1px solid #374151',
                                    borderRadius: '8px',
                                    padding: '12px',
                                    color: 'white',
                                    fontSize: '12px',
                                    fontFamily: 'monospace',
                                    wordBreak: 'break-all'
                                }}>
                                    {walletData.public_key}
                                </div>
                            </div>

                            {curveDetection && (
                                <div style={{ marginBottom: '16px' }}>
                                    <label style={{ display: 'block', fontSize: '12px', color: '#9ca3af', marginBottom: '4px' }}>
                                        Detected Curve
                                    </label>
                                    <div style={{
                                        background: '#111827',
                                        border: '1px solid #374151',
                                        borderRadius: '8px',
                                        padding: '12px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px'
                                    }}>
                                        <div style={{
                                            width: '8px',
                                            height: '8px',
                                            borderRadius: '50%',
                                            background: curveDetection.confidence > 0.8 ? '#10b981' :
                                                curveDetection.confidence > 0.6 ? '#f59e0b' : '#ef4444'
                                        }}></div>
                                        <span style={{ color: 'white', fontSize: '14px', fontWeight: '500' }}>
                                            {curveDetection.curve}
                                        </span>
                                        <span style={{ color: '#9ca3af', fontSize: '12px' }}>
                                            ({Math.round(curveDetection.confidence * 100)}% confidence)
                                        </span>
                                    </div>
                                    <p style={{
                                        fontSize: '11px',
                                        color: '#6b7280',
                                        margin: '4px 0 0 0',
                                        fontStyle: 'italic'
                                    }}>
                                        Detection method: {curveDetection.method.replace(/_/g, ' ')}
                                    </p>
                                </div>
                            )}

                            {walletData.chains && walletData.chains.length > 0 && (
                                <div style={{ marginBottom: '16px' }}>
                                    <label style={{ display: 'block', fontSize: '12px', color: '#9ca3af', marginBottom: '4px' }}>
                                        Supported Chains
                                    </label>
                                    <div style={{
                                        background: '#111827',
                                        border: '1px solid #374151',
                                        borderRadius: '8px',
                                        padding: '12px'
                                    }}>
                                        {walletData.chains.map((chain, index) => (
                                            <div key={index} style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '8px',
                                                marginBottom: index < walletData.chains!.length - 1 ? '8px' : '0'
                                            }}>
                                                <div style={{
                                                    width: '12px',
                                                    height: '12px',
                                                    borderRadius: '50%',
                                                    background: chain.color || '#8b5cf6'
                                                }}></div>
                                                <span style={{ color: 'white', fontSize: '14px' }}>
                                                    {chain.name} ({chain.symbol})
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
                                <button
                                    onClick={handleClearWallet}
                                    style={{
                                        background: '#374151',
                                        border: 'none',
                                        borderRadius: '8px',
                                        padding: '12px 16px',
                                        color: '#9ca3af',
                                        fontSize: '14px',
                                        fontWeight: '500',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s',
                                        flex: '1'
                                    }}
                                >
                                    Clear
                                </button>
                                <label
                                    htmlFor="wallet-file-input"
                                    onClick={() => {
                                        if (fileInputRef.current) {
                                            fileInputRef.current.value = '';
                                        }
                                        setError(null);
                                    }}
                                    style={{
                                        background: '#6b7280',
                                        border: 'none',
                                        borderRadius: '8px',
                                        padding: '12px 16px',
                                        color: 'white',
                                        fontSize: '14px',
                                        fontWeight: '500',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s',
                                        flex: '1',
                                        textAlign: 'center'
                                    }}
                                >
                                    Load Different File
                                </label>
                            </div>
                        </div>
                    )}
                </div>

                {/* Hidden file input for native file dialog */}
                <input
                    id="wallet-file-input"
                    ref={fileInputRef}
                    type="file"
                    accept=".json"
                    onChange={handleFileSelect}
                    style={{ display: 'none' }}
                />

                {/* Continue Button */}

                {/* Continue Button */}
                <div style={{ width: '100%', display: 'flex', justifyContent: 'center', marginTop: '16px', marginBottom: '0', flexShrink: 0, padding: '0 24px 24px 24px', background: 'transparent' }}>
                    <button
                        className="continue-btn continue-btn-anim fucking-retard-continue-button"
                        onClick={handleImportWallet}
                        disabled={!walletData}
                        style={{
                            width: '100%',
                            background: !walletData ? '#4b5563' : '#8b5cf6',
                            border: 'none',
                            borderRadius: '12px',
                            padding: '16px',
                            color: 'white',
                            fontSize: '16px',
                            fontWeight: '600',
                            cursor: !walletData ? 'not-allowed' : 'pointer',
                            transition: 'all 0.2s cubic-bezier(.4, 0, .2, 1)',
                            opacity: !walletData ? 0.6 : 1,
                            marginTop: '0',
                            marginBottom: '0',
                            boxSizing: 'border-box'
                        }}
                    >
                        {!walletData ? 'Load a wallet to continue' : 'Import Wallet'}
                    </button>
                </div>

                {/* Add CSS for spinner animation */}
                <style>{`
                    @keyframes spin {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
                    }
                `}</style>
            </div>
        );
    } else {
        return (
            <>
                <h1>Not Implemented</h1>
                <p>This feature is not yet available.</p>
            </>
        );
    }
};