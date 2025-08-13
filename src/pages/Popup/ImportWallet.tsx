import React, { useState, useRef, useEffect } from 'react';
import { BackIcon, KeyIcon, WalletIcon } from '../../components/Icons';
import { Wallet, JsonWallet } from '../Popup/DataTypes';
import { detectCurveFromWalletData } from '../../lib/curve_detection_utils';
import { CurveSelector } from '../../components/CurveSelector';
import { generate, generateFromPrivateKey, isValidMnemonic, CurveType } from '../../lib/wallet_generation_utils';
import { loadTokensXmlAsJson, getAvailableCurves } from '../../lib/token_loader';
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
        return <ManualImportPage onBack={onBack} onImport={onImport} />;
    }
};

// Manual Import Component
interface ManualImportPageProps {
    onBack: () => void;
    onImport: (wallet: Wallet) => void;
}

const ManualImportPage: React.FC<ManualImportPageProps> = ({ onBack, onImport }) => {
    const [importType, setImportType] = useState<'mnemonic' | 'private-key'>('mnemonic');
    const [mnemonicInput, setMnemonicInput] = useState('');
    const [privateKeyInput, setPrivateKeyInput] = useState('');
    const [walletName, setWalletName] = useState('');
    const [selectedCurve, setSelectedCurve] = useState<CurveType>('secp256k1');
    const [availableCurves, setAvailableCurves] = useState<string[]>(['secp256k1', 'p256']);
    const [error, setError] = useState<string | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [autoDetectCurve, setAutoDetectCurve] = useState(true);
    const [detectedCurve, setDetectedCurve] = useState<{ curve: string, confidence: number, method: string } | null>(null);

    // Load available curves
    useEffect(() => {
        const loadCurves = async () => {
            try {
                const tokens = await loadTokensXmlAsJson('tokens.xml');
                const curves = getAvailableCurves(tokens);
                setAvailableCurves(curves.length > 0 ? curves : ['secp256k1', 'p256']);
            } catch (error) {
                console.warn('Could not load tokens.xml, using default curves:', error);
                setAvailableCurves(['secp256k1', 'p256']);
            }
        };
        loadCurves();
    }, []);

    // Auto-detect curve when private key changes
    useEffect(() => {
        if (importType === 'private-key' && privateKeyInput.trim() && autoDetectCurve) {
            try {
                const cleanPrivateKey = privateKeyInput.trim().replace(/^0x/, '');
                if (cleanPrivateKey.length === 64) {
                    const curveDetectionResult = detectCurveFromWalletData({
                        private_key: cleanPrivateKey
                    });
                    setDetectedCurve(curveDetectionResult);
                    setSelectedCurve(curveDetectionResult.curve as CurveType);
                }
            } catch (error) {
                setDetectedCurve(null);
            }
        } else {
            setDetectedCurve(null);
        }
    }, [privateKeyInput, importType, autoDetectCurve]);

    const validateInput = (): boolean => {
        setError(null);

        if (!walletName.trim()) {
            setError('Please enter a wallet name');
            return false;
        }

        if (importType === 'mnemonic') {
            const cleanMnemonic = mnemonicInput.trim();
            if (!cleanMnemonic) {
                setError('Please enter a mnemonic phrase');
                return false;
            }

            if (!isValidMnemonic(cleanMnemonic)) {
                setError('Invalid mnemonic phrase. Please check your words and try again.');
                return false;
            }
        } else {
            const cleanPrivateKey = privateKeyInput.trim().replace(/^0x/, '');
            if (!cleanPrivateKey) {
                setError('Please enter a private key');
                return false;
            }

            if (!/^[a-fA-F0-9]{64}$/.test(cleanPrivateKey)) {
                setError('Invalid private key format. Must be 64 hexadecimal characters.');
                return false;
            }
        }

        return true;
    };

    const handleImport = async () => {
        if (!validateInput()) return;

        setIsGenerating(true);
        setError(null);

        try {
            let wallet: Wallet;

            if (importType === 'mnemonic') {
                const cleanMnemonic = mnemonicInput.trim();
                const generatedWallet = generate({
                    mnemonicPhrase: cleanMnemonic,
                    curve: selectedCurve,
                    deterministic: false,
                    fields: ['mnemonic', 'id', 'private_key', 'public_key', 'address'],
                    walletVersion: '0.2.3'
                });

                wallet = {
                    id: generatedWallet.id!,
                    name: walletName.trim(),
                    address: generatedWallet.address!,
                    public_key: generatedWallet.public_key!,
                    private_key: generatedWallet.private_key!,
                    mnemonic: generatedWallet.mnemonic!,
                    curve: selectedCurve
                };
            } else {
                const cleanPrivateKey = privateKeyInput.trim().replace(/^0x/, '');
                const generatedData = generateFromPrivateKey(
                    cleanPrivateKey,
                    ['private_key', 'public_key', 'address'],
                    selectedCurve
                );

                wallet = {
                    id: `imported-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                    name: walletName.trim(),
                    address: generatedData.address,
                    public_key: generatedData.public_key,
                    private_key: generatedData.private_key,
                    curve: selectedCurve
                };
            }

            onImport(wallet);
        } catch (error) {
            console.error('Error importing wallet:', error);
            setError(`Failed to import wallet: ${error instanceof Error ? error.message : 'Unknown error'}`);
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="popup-content import-wallet-page" style={{ overflow: 'auto', maxHeight: 'calc(100vh - 64px)' }}>
            {/* Header */}
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
                        background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 16px',
                        boxShadow: '0 4px 16px rgba(245, 158, 11, 0.3)'
                    }}>
                        <KeyIcon />
                    </div>
                    <h2 style={{ fontSize: '24px', fontWeight: '600', textAlign: 'center', margin: '0 0 8px', color: 'white' }}>
                        Manual Import
                    </h2>
                    <p style={{ fontSize: '14px', color: '#9ca3af', textAlign: 'center', margin: '0 0 32px', lineHeight: '1.5' }}>
                        Import your wallet using a seed phrase or private key
                    </p>
                </div>
            </div>

            <div style={{ padding: '0 24px 24px 24px' }}>
                {/* Import Type Selection */}
                <div style={{ marginBottom: '24px' }}>
                    <label style={{
                        display: 'block',
                        fontSize: '14px',
                        fontWeight: '600',
                        color: '#e5e7eb',
                        marginBottom: '12px'
                    }}>
                        Import Method
                    </label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                            onClick={() => {
                                setImportType('mnemonic');
                                setError(null);
                                setDetectedCurve(null);
                            }}
                            style={{
                                flex: 1,
                                background: importType === 'mnemonic' ? '#8b5cf6' : '#374151',
                                border: 'none',
                                borderRadius: '8px',
                                padding: '12px',
                                color: 'white',
                                fontSize: '14px',
                                fontWeight: '500',
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                            }}
                        >
                            Seed Phrase
                        </button>
                        <button
                            onClick={() => {
                                setImportType('private-key');
                                setError(null);
                            }}
                            style={{
                                flex: 1,
                                background: importType === 'private-key' ? '#8b5cf6' : '#374151',
                                border: 'none',
                                borderRadius: '8px',
                                padding: '12px',
                                color: 'white',
                                fontSize: '14px',
                                fontWeight: '500',
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                            }}
                        >
                            Private Key
                        </button>
                    </div>
                </div>

                {/* Wallet Name Input */}
                <div style={{ marginBottom: '24px' }}>
                    <label style={{
                        display: 'block',
                        fontSize: '14px',
                        fontWeight: '600',
                        color: '#e5e7eb',
                        marginBottom: '8px'
                    }}>
                        Wallet Name
                    </label>
                    <input
                        type="text"
                        value={walletName}
                        onChange={(e) => setWalletName(e.target.value)}
                        placeholder="Enter a name for your wallet"
                        style={{
                            width: '100%',
                            background: '#111827',
                            border: '1px solid #374151',
                            borderRadius: '8px',
                            padding: '12px',
                            color: 'white',
                            fontSize: '14px',
                            boxSizing: 'border-box'
                        }}
                    />
                </div>

                {/* Input Field */}
                {importType === 'mnemonic' ? (
                    <div style={{ marginBottom: '24px' }}>
                        <label style={{
                            display: 'block',
                            fontSize: '14px',
                            fontWeight: '600',
                            color: '#e5e7eb',
                            marginBottom: '8px'
                        }}>
                            Seed Phrase
                        </label>
                        <p style={{
                            fontSize: '12px',
                            color: '#9ca3af',
                            marginBottom: '8px'
                        }}>
                            Enter your 12 or 24 word seed phrase. Words should be separated by spaces.
                        </p>
                        <textarea
                            value={mnemonicInput}
                            onChange={(e) => setMnemonicInput(e.target.value)}
                            placeholder="Enter your seed phrase here..."
                            rows={4}
                            style={{
                                width: '100%',
                                background: '#111827',
                                border: '1px solid #374151',
                                borderRadius: '8px',
                                padding: '12px',
                                color: 'white',
                                fontSize: '14px',
                                fontFamily: 'monospace',
                                resize: 'vertical',
                                boxSizing: 'border-box'
                            }}
                        />
                    </div>
                ) : (
                    <div style={{ marginBottom: '24px' }}>
                        <label style={{
                            display: 'block',
                            fontSize: '14px',
                            fontWeight: '600',
                            color: '#e5e7eb',
                            marginBottom: '8px'
                        }}>
                            Private Key
                        </label>
                        <p style={{
                            fontSize: '12px',
                            color: '#9ca3af',
                            marginBottom: '8px'
                        }}>
                            Enter your 64-character hexadecimal private key (with or without 0x prefix).
                        </p>
                        <input
                            type="text"
                            value={privateKeyInput}
                            onChange={(e) => setPrivateKeyInput(e.target.value)}
                            placeholder="Enter your private key here..."
                            style={{
                                width: '100%',
                                background: '#111827',
                                border: '1px solid #374151',
                                borderRadius: '8px',
                                padding: '12px',
                                color: 'white',
                                fontSize: '14px',
                                fontFamily: 'monospace',
                                boxSizing: 'border-box'
                            }}
                        />
                    </div>
                )}

                {/* Auto-detect Toggle for Private Key */}
                {importType === 'private-key' && (
                    <div style={{ marginBottom: '16px' }}>
                        <label style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            cursor: 'pointer',
                            fontSize: '14px',
                            color: '#e5e7eb'
                        }}>
                            <input
                                type="checkbox"
                                checked={autoDetectCurve}
                                onChange={(e) => setAutoDetectCurve(e.target.checked)}
                                style={{
                                    accentColor: '#8b5cf6'
                                }}
                            />
                            Auto-detect curve from private key
                        </label>
                    </div>
                )}

                {/* Curve Detection Display */}
                {detectedCurve && importType === 'private-key' && (
                    <div style={{ marginBottom: '16px' }}>
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
                                background: detectedCurve.confidence > 0.8 ? '#10b981' :
                                    detectedCurve.confidence > 0.6 ? '#f59e0b' : '#ef4444'
                            }}></div>
                            <span style={{ color: 'white', fontSize: '14px', fontWeight: '500' }}>
                                Detected: {detectedCurve.curve}
                            </span>
                            <span style={{ color: '#9ca3af', fontSize: '12px' }}>
                                ({Math.round(detectedCurve.confidence * 100)}% confidence)
                            </span>
                        </div>
                        <p style={{
                            fontSize: '11px',
                            color: '#6b7280',
                            margin: '4px 0 0 0',
                            fontStyle: 'italic'
                        }}>
                            Detection method: {detectedCurve.method.replace(/_/g, ' ')}
                        </p>
                    </div>
                )}

                {/* Curve Selector */}
                <CurveSelector
                    selectedCurve={selectedCurve}
                    onCurveChange={(curve) => setSelectedCurve(curve as CurveType)}
                    availableCurves={availableCurves}
                    disabled={autoDetectCurve && importType === 'private-key' && detectedCurve !== null}
                />

                {/* Error Display */}
                {error && (
                    <div style={{
                        background: '#7f1d1d',
                        border: '1px solid #dc2626',
                        borderRadius: '8px',
                        padding: '12px',
                        color: '#fca5a5',
                        fontSize: '14px',
                        marginBottom: '24px'
                    }}>
                        {error}
                    </div>
                )}

                {/* Import Button */}
                <button
                    onClick={handleImport}
                    disabled={isGenerating}
                    style={{
                        width: '100%',
                        background: isGenerating ? '#4b5563' : '#f59e0b',
                        border: 'none',
                        borderRadius: '12px',
                        padding: '16px',
                        color: 'white',
                        fontSize: '16px',
                        fontWeight: '600',
                        cursor: isGenerating ? 'not-allowed' : 'pointer',
                        transition: 'all 0.2s cubic-bezier(.4, 0, .2, 1)',
                        opacity: isGenerating ? 0.6 : 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px'
                    }}
                >
                    {isGenerating && (
                        <div style={{
                            width: '16px',
                            height: '16px',
                            border: '2px solid transparent',
                            borderTop: '2px solid white',
                            borderRadius: '50%',
                            animation: 'spin 1s linear infinite'
                        }}></div>
                    )}
                    {isGenerating ? 'Importing...' : 'Import Wallet'}
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
}