import React, { useState, useRef, useEffect } from 'react';
import { SettingsIcon, CopyIcon, EyeIcon, EyeOffIcon, XIcon, EditIcon, SaveIcon, DownloadIcon, LockClosedIcon } from './Icons';
import { Wallet } from '../pages/Popup/DataTypes';
import { exportWallet, ExportOptions, validateExportOptions } from '../lib/wallet_export_utils';
import { encryptWallet, changeWalletPassword, lockWallet, getWalletCredentials, isWalletLocked } from '../pages/Popup/WalletUtils';
import { testCrypto } from '../lib/crypto';
import { WalletUnlockModal } from './WalletUnlockModal';
import './WalletSettings.css';

interface WalletSettingsModalProps {
    wallet: Wallet;
    onClose: () => void;
    onSave: (updatedWallet: Wallet) => void;
}

export const WalletSettingsModal: React.FC<WalletSettingsModalProps> = ({ wallet, onClose, onSave }) => {
    const [editingName, setEditingName] = useState(false);
    const [walletName, setWalletName] = useState<string>(wallet.name ?? '');
    const [showPrivateKey, setShowPrivateKey] = useState(false);
    const [verificationPhrase, setVerificationPhrase] = useState('');
    const [showVerificationInput, setShowVerificationInput] = useState(false);
    const [copied, setCopied] = useState(false);
    const [error, setError] = useState('');
    const [showExportModal, setShowExportModal] = useState(false);
    const [exportOptions, setExportOptions] = useState<ExportOptions>({
        includePrivateKey: true,
        includeMnemonic: true
    });
    const [exporting, setExporting] = useState(false);

    // Password protection states
    const [showPasswordSection, setShowPasswordSection] = useState(false);
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [settingPassword, setSettingPassword] = useState(false);
    const [passwordError, setPasswordError] = useState('');
    const [passwordSuccess, setPasswordSuccess] = useState('');

    // Wallet unlock states
    const [showUnlockModal, setShowUnlockModal] = useState(false);
    const [walletIsLocked, setWalletIsLocked] = useState(false);

    const copyTimeout = useRef<NodeJS.Timeout | null>(null);
    const nameInputRef = useRef<HTMLInputElement>(null);
    const verificationInputRef = useRef<HTMLInputElement>(null);

    // Check wallet lock status
    useEffect(() => {
        const checkLockStatus = () => {
            setWalletIsLocked(isWalletLocked(wallet));
        };

        checkLockStatus();

        // Check lock status periodically
        const interval = setInterval(checkLockStatus, 1000);

        return () => clearInterval(interval);
    }, [wallet]);

    // Required phrase for private key access
    const REQUIRED_PHRASE = "I understand the risks";

    // Focus input when editing starts
    useEffect(() => {
        if (editingName && nameInputRef.current) {
            nameInputRef.current.focus();
            nameInputRef.current.select();
        }
    }, [editingName]);

    useEffect(() => {
        if (showVerificationInput && verificationInputRef.current) {
            verificationInputRef.current.focus();
        }
    }, [showVerificationInput]);

    const handleSaveName = () => {
        if (walletName.trim()) {
            onSave({ ...wallet, name: walletName.trim() });
            setEditingName(false);
        }
    };

    const handleCancelEdit = () => {
        setWalletName(wallet.name ?? '');
        setEditingName(false);
    };

    const handleVerifyPhrase = () => {
        if (verificationPhrase === REQUIRED_PHRASE) {
            setShowPrivateKey(true);
            setShowVerificationInput(false);
            setError('');
        } else {
            setError('Incorrect phrase. Please try again.');
        }
    };

    const handleCopyPrivateKey = () => {
        // Check if wallet is locked before copying private key
        if (walletIsLocked) {
            setShowUnlockModal(true);
            return;
        }
        const credentials = getWalletCredentials(wallet);
        if (credentials?.privateKey) {
            navigator.clipboard.writeText(credentials.privateKey);
            setCopied(true);
            if (copyTimeout.current) clearTimeout(copyTimeout.current);
            copyTimeout.current = setTimeout(() => setCopied(false), 2000);
        }
    };

    const handleRequestPrivateKey = () => {
        // Check if wallet is locked before showing private key
        if (walletIsLocked) {
            setShowUnlockModal(true);
            return;
        }
        setShowVerificationInput(true);
        setVerificationPhrase('');
        setError('');
    };

    const maskPrivateKey = (key: string) => {
        if (!key) return '';
        if (key.length <= 4) return '•'.repeat(key.length);
        // Show only first 2 and last 2 chars
        return key.slice(0, 2) + '•'.repeat(Math.round((key.length - 4) / 3)) + key.slice(-2);
    };

    const handleExportWallet = async () => {
        try {
            // Check if wallet is locked and private key export is requested
            if (walletIsLocked && exportOptions.includePrivateKey) {
                setShowUnlockModal(true);
                return;
            }

            setExporting(true);
            const validation = validateExportOptions(exportOptions);

            if (validation.warnings.length > 0) {
                // Show warnings in console for now
                console.warn('Export warnings:', validation.warnings);
            }

            exportWallet(wallet, exportOptions);
            setShowExportModal(false);
        } catch (error) {
            console.error('Export failed:', error);
            setError('Failed to export wallet');
        } finally {
            setExporting(false);
        }
    };

    return (
        <div className="modal-overlay" style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            backdropFilter: 'blur(4px)'
        }}>
            <div className="modal-content" style={{
                background: '#2a2a2a',
                border: '1px solid #3a3a3a',
                borderRadius: '16px',
                width: '90%',
                maxWidth: '400px',
                maxHeight: '80vh',
                overflow: 'auto',
                position: 'relative'
            }}>
                {/* Header */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '20px 24px 16px',
                    borderBottom: '1px solid #3a3a3a'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <SettingsIcon />
                        <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: '#fff' }}>
                            Wallet Settings
                        </h2>
                    </div>
                    <button
                        onClick={onClose}
                        style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            padding: '4px',
                            borderRadius: '6px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'background 0.2s',
                            color: '#9ca3af'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = '#3a3a3a'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                    >
                        <XIcon />
                    </button>
                </div>

                {/* Content */}
                <div style={{ padding: '24px' }}>
                    {/* Wallet Name */}
                    <div style={{ marginBottom: '24px' }}>
                        <label style={{
                            display: 'block',
                            fontSize: '14px',
                            fontWeight: '500',
                            color: '#9ca3af',
                            marginBottom: '8px'
                        }}>
                            Wallet Name
                        </label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {editingName ? (
                                <>
                                    <input
                                        ref={nameInputRef}
                                        type="text"
                                        value={walletName}
                                        onChange={(e) => setWalletName(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') handleSaveName();
                                            if (e.key === 'Escape') handleCancelEdit();
                                        }}
                                        style={{
                                            flex: 1,
                                            background: '#1a1a1a',
                                            border: '1px solid #8b5cf6',
                                            borderRadius: '8px',
                                            padding: '8px 12px',
                                            color: '#fff',
                                            fontSize: '14px',
                                            outline: 'none'
                                        }}
                                    />
                                    <button
                                        onClick={handleSaveName}
                                        style={{
                                            background: '#8b5cf6',
                                            border: 'none',
                                            borderRadius: '6px',
                                            padding: '8px',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            transition: 'background 0.2s'
                                        }}
                                        onMouseEnter={(e) => e.currentTarget.style.background = '#7c3aed'}
                                        onMouseLeave={(e) => e.currentTarget.style.background = '#8b5cf6'}
                                    >
                                        <SaveIcon />
                                    </button>
                                </>
                            ) : (
                                <>
                                    <span style={{
                                        flex: 1,
                                        padding: '8px 12px',
                                        background: '#1a1a1a',
                                        border: '1px solid #3a3a3a',
                                        borderRadius: '8px',
                                        color: '#fff',
                                        fontSize: '14px'
                                    }}>
                                        {wallet.name}
                                    </span>
                                    <button
                                        onClick={() => setEditingName(true)}
                                        style={{
                                            background: 'none',
                                            border: '1px solid #3a3a3a',
                                            borderRadius: '6px',
                                            padding: '8px',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            transition: 'all 0.2s',
                                            color: '#9ca3af'
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.borderColor = '#8b5cf6';
                                            e.currentTarget.style.color = '#fff';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.borderColor = '#3a3a3a';
                                            e.currentTarget.style.color = '#9ca3af';
                                        }}
                                    >
                                        <EditIcon />
                                    </button>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Wallet Address */}
                    <div style={{ marginBottom: '16px' }}>
                        <label style={{
                            display: 'block',
                            fontSize: '14px',
                            fontWeight: '500',
                            color: '#9ca3af',
                            marginBottom: '8px'
                        }}>
                            Wallet Address
                        </label>
                        <div style={{
                            background: '#1a1a1a',
                            border: '1px solid #3a3a3a',
                            borderRadius: '8px',
                            padding: '8px 12px',
                            fontFamily: 'monospace',
                            fontSize: '12px',
                            color: '#fff',
                            wordBreak: 'break-all',
                            lineHeight: '1.4'
                        }}>
                            {wallet.address}
                        </div>
                    </div>

                    {/* Public Key */}
                    {wallet.public_key && (
                        <div style={{ marginBottom: '24px' }}>
                            <label style={{
                                display: 'block',
                                fontSize: '14px',
                                fontWeight: '500',
                                color: '#9ca3af',
                                marginBottom: '8px'
                            }}>
                                Public Key
                            </label>
                            <div style={{
                                background: '#1a1a1a',
                                border: '1px solid #3a3a3a',
                                borderRadius: '8px',
                                padding: '8px 12px',
                                fontFamily: 'monospace',
                                fontSize: '12px',
                                color: '#fff',
                                wordBreak: 'break-all',
                                lineHeight: '1.4'
                            }}>
                                {wallet.public_key}
                            </div>
                        </div>
                    )}

                    {/* Private Key */}
                    <div>
                        <label style={{
                            display: 'block',
                            fontSize: '14px',
                            fontWeight: '500',
                            color: '#9ca3af',
                            marginBottom: '8px'
                        }}>
                            Private Key
                        </label>

                        {!showPrivateKey && !showVerificationInput && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <div style={{
                                    flex: 1,
                                    background: '#1a1a1a',
                                    border: '1px solid #3a3a3a',
                                    borderRadius: '8px',
                                    padding: '8px 12px',
                                    fontFamily: 'monospace',
                                    fontSize: '12px',
                                    color: '#9ca3af',
                                    filter: 'blur(1px)',
                                    userSelect: 'none'
                                }}>
                                    {maskPrivateKey(walletIsLocked ? '' : (getWalletCredentials(wallet)?.privateKey || ''))}
                                </div>
                                <button
                                    onClick={handleRequestPrivateKey}
                                    style={{
                                        background: '#8b5cf6',
                                        border: 'none',
                                        borderRadius: '6px',
                                        padding: '8px',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        transition: 'background 0.2s'
                                    }}
                                    title={walletIsLocked ? "Unlock wallet to view private key" : "View private key"}
                                    onMouseEnter={(e) => e.currentTarget.style.background = '#7c3aed'}
                                    onMouseLeave={(e) => e.currentTarget.style.background = '#8b5cf6'}
                                >
                                    {walletIsLocked ? <LockClosedIcon /> : <EyeIcon />}
                                </button>
                            </div>
                        )}

                        {showVerificationInput && (
                            <div>
                                <div style={{
                                    background: '#1a1a1a',
                                    border: '1px solid #f59e0b',
                                    borderRadius: '8px',
                                    padding: '12px',
                                    marginBottom: '12px'
                                }}>
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        marginBottom: '8px'
                                    }}>
                                        <span style={{ fontSize: '16px' }}>⚠️</span>
                                        <span style={{
                                            fontSize: '14px',
                                            fontWeight: '500',
                                            color: '#f59e0b'
                                        }}>
                                            Security Verification Required
                                        </span>
                                    </div>
                                    <p style={{
                                        fontSize: '12px',
                                        color: '#9ca3af',
                                        margin: 0,
                                        lineHeight: '1.4'
                                    }}>
                                        To view your private key, type the exact phrase below to confirm you understand the security implications:
                                    </p>
                                </div>

                                <div style={{
                                    background: '#1a1a1a',
                                    border: '1px solid #3a3a3a',
                                    borderRadius: '8px',
                                    padding: '12px',
                                    marginBottom: '12px',
                                    textAlign: 'center'
                                }}>
                                    <code style={{
                                        color: '#8b5cf6',
                                        fontSize: '14px',
                                        fontWeight: '500'
                                    }}>
                                        {REQUIRED_PHRASE}
                                    </code>
                                </div>

                                <input
                                    ref={verificationInputRef}
                                    type="text"
                                    value={verificationPhrase}
                                    onChange={(e) => setVerificationPhrase(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') handleVerifyPhrase();
                                        if (e.key === 'Escape') setShowVerificationInput(false);
                                    }}
                                    placeholder="Type the phrase exactly as shown above"
                                    style={{
                                        width: '100%',
                                        background: '#1a1a1a',
                                        border: error ? '1px solid #ef4444' : '1px solid #3a3a3a',
                                        borderRadius: '8px',
                                        padding: '8px 12px',
                                        color: '#fff',
                                        fontSize: '14px',
                                        outline: 'none',
                                        marginBottom: '12px'
                                    }}
                                />

                                {error && (
                                    <div style={{
                                        color: '#ef4444',
                                        fontSize: '12px',
                                        marginBottom: '12px'
                                    }}>
                                        {error}
                                    </div>
                                )}

                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <button
                                        onClick={handleVerifyPhrase}
                                        disabled={verificationPhrase !== REQUIRED_PHRASE}
                                        style={{
                                            flex: 1,
                                            background: verificationPhrase === REQUIRED_PHRASE ? '#8b5cf6' : '#374151',
                                            border: 'none',
                                            borderRadius: '8px',
                                            padding: '8px 16px',
                                            color: '#fff',
                                            fontSize: '14px',
                                            cursor: verificationPhrase === REQUIRED_PHRASE ? 'pointer' : 'not-allowed',
                                            transition: 'background 0.2s'
                                        }}
                                    >
                                        Verify & Show Key
                                    </button>
                                    <button
                                        onClick={() => setShowVerificationInput(false)}
                                        style={{
                                            background: 'none',
                                            border: '1px solid #3a3a3a',
                                            borderRadius: '8px',
                                            padding: '8px 16px',
                                            color: '#9ca3af',
                                            fontSize: '14px',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s'
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.borderColor = '#ef4444';
                                            e.currentTarget.style.color = '#ef4444';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.borderColor = '#3a3a3a';
                                            e.currentTarget.style.color = '#9ca3af';
                                        }}
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        )}

                        {showPrivateKey && (
                            <div>
                                <div style={{
                                    background: '#1a1a1a',
                                    border: '1px solid #ef4444',
                                    borderRadius: '8px',
                                    padding: '12px',
                                    marginBottom: '12px'
                                }}>
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        marginBottom: '8px'
                                    }}>
                                        <span style={{ fontSize: '16px' }}>🔑</span>
                                        <span style={{
                                            fontSize: '14px',
                                            fontWeight: '500',
                                            color: '#ef4444'
                                        }}>
                                            Private Key Revealed
                                        </span>
                                    </div>
                                    <p style={{
                                        fontSize: '12px',
                                        color: '#9ca3af',
                                        margin: 0,
                                        lineHeight: '1.4'
                                    }}>
                                        Never share your private key with anyone. Anyone with access to this key can control your wallet.
                                    </p>
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <div style={{
                                        flex: 1,
                                        background: '#1a1a1a',
                                        border: '1px solid #3a3a3a',
                                        borderRadius: '8px',
                                        padding: '8px 12px',
                                        fontFamily: 'monospace',
                                        fontSize: '12px',
                                        color: '#fff',
                                        wordBreak: 'break-all',
                                        lineHeight: '1.4'
                                    }}>
                                        {walletIsLocked ? 'Wallet is locked - unlock to view private key' : (getWalletCredentials(wallet)?.privateKey || 'Private key not accessible')}
                                    </div>
                                    <button
                                        onClick={handleCopyPrivateKey}
                                        style={{
                                            background: copied ? '#10b981' : '#8b5cf6',
                                            border: 'none',
                                            borderRadius: '6px',
                                            padding: '8px',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            transition: 'background 0.2s'
                                        }}
                                    >
                                        {copied ? '✓' : <CopyIcon />}
                                    </button>
                                    <button
                                        onClick={() => setShowPrivateKey(false)}
                                        style={{
                                            background: 'none',
                                            border: '1px solid #3a3a3a',
                                            borderRadius: '6px',
                                            padding: '8px',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            transition: 'all 0.2s',
                                            color: '#9ca3af'
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.borderColor = '#8b5cf6';
                                            e.currentTarget.style.color = '#fff';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.borderColor = '#3a3a3a';
                                            e.currentTarget.style.color = '#9ca3af';
                                        }}
                                    >
                                        <EyeOffIcon />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Password Protection Section */}
                    <div style={{ marginBottom: '24px' }}>
                        <label style={{
                            display: 'block',
                            fontSize: '14px',
                            fontWeight: '500',
                            color: '#9ca3af',
                            marginBottom: '8px'
                        }}>
                            Password Protection
                        </label>

                        <div style={{
                            background: '#1a1a1a',
                            border: '1px solid #3a3a3a',
                            borderRadius: '8px',
                            padding: '16px'
                        }}>
                            {/* Current Status */}
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                marginBottom: '12px'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <LockClosedIcon />
                                    <span style={{ color: '#e5e7eb', fontSize: '14px' }}>
                                        {wallet.isEncrypted ? 'Protected' : 'Unprotected'}
                                    </span>
                                </div>
                                <div style={{
                                    padding: '4px 8px',
                                    borderRadius: '12px',
                                    fontSize: '12px',
                                    fontWeight: '500',
                                    background: wallet.isEncrypted ? '#10b98120' : '#f5940b20',
                                    color: wallet.isEncrypted ? '#10b981' : '#f59e0b'
                                }}>
                                    {wallet.isEncrypted ? 'Encrypted' : 'Plaintext'}
                                </div>
                            </div>

                            {/* Description */}
                            <p style={{
                                fontSize: '12px',
                                color: '#9ca3af',
                                margin: '0 0 16px 0',
                                lineHeight: '1.4'
                            }}>
                                {wallet.isEncrypted
                                    ? 'Your wallet is protected with password encryption. Private keys are stored securely.'
                                    : 'Your wallet is currently unprotected. Enable password protection to secure your private keys.'
                                }
                            </p>

                            {/* Actions */}
                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                {!wallet.isEncrypted ? (
                                    <>
                                        <button
                                            onClick={() => setShowPasswordSection(!showPasswordSection)}
                                            style={{
                                                background: '#10b981',
                                                border: 'none',
                                                borderRadius: '6px',
                                                padding: '8px 12px',
                                                color: 'white',
                                                fontSize: '12px',
                                                fontWeight: '500',
                                                cursor: 'pointer',
                                                transition: 'background 0.2s'
                                            }}
                                            onMouseEnter={(e) => e.currentTarget.style.background = '#059669'}
                                            onMouseLeave={(e) => e.currentTarget.style.background = '#10b981'}
                                        >
                                            Enable Protection
                                        </button>
                                        <button
                                            onClick={async () => {
                                                console.log('Testing crypto functionality...');
                                                const result = await testCrypto();
                                                alert(result ? 'Crypto test passed!' : 'Crypto test failed - check console');
                                            }}
                                            style={{
                                                background: '#6b7280',
                                                border: 'none',
                                                borderRadius: '6px',
                                                padding: '8px 12px',
                                                color: 'white',
                                                fontSize: '12px',
                                                fontWeight: '500',
                                                cursor: 'pointer',
                                                transition: 'background 0.2s'
                                            }}
                                            onMouseEnter={(e) => e.currentTarget.style.background = '#4b5563'}
                                            onMouseLeave={(e) => e.currentTarget.style.background = '#6b7280'}
                                        >
                                            Test Crypto
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <button
                                            onClick={() => setShowPasswordSection(!showPasswordSection)}
                                            style={{
                                                background: '#3b82f6',
                                                border: 'none',
                                                borderRadius: '6px',
                                                padding: '8px 12px',
                                                color: 'white',
                                                fontSize: '12px',
                                                fontWeight: '500',
                                                cursor: 'pointer',
                                                transition: 'background 0.2s'
                                            }}
                                            onMouseEnter={(e) => e.currentTarget.style.background = '#2563eb'}
                                            onMouseLeave={(e) => e.currentTarget.style.background = '#3b82f6'}
                                        >
                                            Change Password
                                        </button>
                                        {walletIsLocked ? (
                                            <button
                                                onClick={() => setShowUnlockModal(true)}
                                                style={{
                                                    background: '#10b981',
                                                    border: 'none',
                                                    borderRadius: '6px',
                                                    padding: '8px 12px',
                                                    color: 'white',
                                                    fontSize: '12px',
                                                    fontWeight: '500',
                                                    cursor: 'pointer',
                                                    transition: 'background 0.2s'
                                                }}
                                                onMouseEnter={(e) => e.currentTarget.style.background = '#059669'}
                                                onMouseLeave={(e) => e.currentTarget.style.background = '#10b981'}
                                            >
                                                Unlock Wallet
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => lockWallet(wallet)}
                                                style={{
                                                    background: '#f59e0b',
                                                    border: 'none',
                                                    borderRadius: '6px',
                                                    padding: '8px 12px',
                                                    color: 'white',
                                                    fontSize: '12px',
                                                    fontWeight: '500',
                                                    cursor: 'pointer',
                                                    transition: 'background 0.2s'
                                                }}
                                                onMouseEnter={(e) => e.currentTarget.style.background = '#d97706'}
                                                onMouseLeave={(e) => e.currentTarget.style.background = '#f59e0b'}
                                            >
                                                Lock Now
                                            </button>
                                        )}
                                    </>
                                )}
                            </div>

                            {/* Password Form */}
                            {showPasswordSection && (
                                <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #3a3a3a' }}>
                                    {passwordError && (
                                        <div style={{
                                            background: '#fef2f2',
                                            border: '1px solid #fecaca',
                                            borderRadius: '6px',
                                            padding: '8px 12px',
                                            marginBottom: '12px'
                                        }}>
                                            <p style={{ fontSize: '12px', color: '#dc2626', margin: 0 }}>
                                                {passwordError}
                                            </p>
                                        </div>
                                    )}

                                    {passwordSuccess && (
                                        <div style={{
                                            background: '#f0fdf4',
                                            border: '1px solid #bbf7d0',
                                            borderRadius: '6px',
                                            padding: '8px 12px',
                                            marginBottom: '12px'
                                        }}>
                                            <p style={{ fontSize: '12px', color: '#15803d', margin: 0 }}>
                                                {passwordSuccess}
                                            </p>
                                        </div>
                                    )}

                                    {wallet.isEncrypted && (
                                        <div style={{ marginBottom: '12px' }}>
                                            <label style={{
                                                display: 'block',
                                                fontSize: '12px',
                                                color: '#9ca3af',
                                                marginBottom: '4px'
                                            }}>
                                                Current Password
                                            </label>
                                            <input
                                                type="password"
                                                value={currentPassword}
                                                onChange={(e) => setCurrentPassword(e.target.value)}
                                                style={{
                                                    width: '100%',
                                                    padding: '8px 12px',
                                                    background: '#374151',
                                                    border: '1px solid #4b5563',
                                                    borderRadius: '6px',
                                                    color: '#e5e7eb',
                                                    fontSize: '14px',
                                                    outline: 'none'
                                                }}
                                                placeholder="Enter current password"
                                            />
                                        </div>
                                    )}

                                    <div style={{ marginBottom: '12px' }}>
                                        <label style={{
                                            display: 'block',
                                            fontSize: '12px',
                                            color: '#9ca3af',
                                            marginBottom: '4px'
                                        }}>
                                            {wallet.isEncrypted ? 'New Password' : 'Password'}
                                        </label>
                                        <input
                                            type="password"
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            style={{
                                                width: '100%',
                                                padding: '8px 12px',
                                                background: '#374151',
                                                border: '1px solid #4b5563',
                                                borderRadius: '6px',
                                                color: '#e5e7eb',
                                                fontSize: '14px',
                                                outline: 'none'
                                            }}
                                            placeholder="Enter password"
                                        />
                                    </div>

                                    <div style={{ marginBottom: '16px' }}>
                                        <label style={{
                                            display: 'block',
                                            fontSize: '12px',
                                            color: '#9ca3af',
                                            marginBottom: '4px'
                                        }}>
                                            Confirm Password
                                        </label>
                                        <input
                                            type="password"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            style={{
                                                width: '100%',
                                                padding: '8px 12px',
                                                background: '#374151',
                                                border: '1px solid #4b5563',
                                                borderRadius: '6px',
                                                color: '#e5e7eb',
                                                fontSize: '14px',
                                                outline: 'none'
                                            }}
                                            placeholder="Confirm password"
                                        />
                                    </div>

                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <button
                                            onClick={async () => {
                                                console.log('Set password button clicked');

                                                if (!newPassword || !confirmPassword) {
                                                    setPasswordError('Please fill in all fields');
                                                    return;
                                                }

                                                if (newPassword !== confirmPassword) {
                                                    setPasswordError('Passwords do not match');
                                                    return;
                                                }

                                                if (newPassword.length < 8) {
                                                    setPasswordError('Password must be at least 8 characters');
                                                    return;
                                                }

                                                setSettingPassword(true);
                                                setPasswordError('');
                                                setPasswordSuccess('');

                                                console.log('Starting password encryption...');

                                                try {
                                                    let updatedWallet;
                                                    if (wallet.isEncrypted) {
                                                        if (!currentPassword) {
                                                            setPasswordError('Current password is required');
                                                            setSettingPassword(false);
                                                            return;
                                                        }
                                                        console.log('Changing existing password...');
                                                        updatedWallet = await changeWalletPassword(wallet, currentPassword, newPassword);
                                                    } else {
                                                        console.log('Encrypting wallet for first time...');
                                                        updatedWallet = await encryptWallet(wallet, newPassword);
                                                    }

                                                    console.log('Password set successfully, calling onSave...');
                                                    onSave(updatedWallet);
                                                    setPasswordSuccess('Password protection enabled successfully!');
                                                    setShowPasswordSection(false);
                                                    setCurrentPassword('');
                                                    setNewPassword('');
                                                    setConfirmPassword('');
                                                    console.log('Password setup complete');

                                                    // Clear success message after 3 seconds
                                                    setTimeout(() => setPasswordSuccess(''), 3000);
                                                } catch (error) {
                                                    console.error('Error setting password:', error);
                                                    setPasswordError(error instanceof Error ? error.message : 'Failed to set password');
                                                } finally {
                                                    setSettingPassword(false);
                                                }
                                            }}
                                            disabled={settingPassword}
                                            style={{
                                                background: settingPassword ? '#374151' : '#10b981',
                                                border: 'none',
                                                borderRadius: '6px',
                                                padding: '8px 12px',
                                                color: 'white',
                                                fontSize: '12px',
                                                fontWeight: '500',
                                                cursor: settingPassword ? 'not-allowed' : 'pointer',
                                                transition: 'background 0.2s'
                                            }}
                                        >
                                            {settingPassword ? 'Setting...' : wallet.isEncrypted ? 'Change Password' : 'Set Password'}
                                        </button>
                                        <button
                                            onClick={() => {
                                                setShowPasswordSection(false);
                                                setCurrentPassword('');
                                                setNewPassword('');
                                                setConfirmPassword('');
                                                setPasswordError('');
                                            }}
                                            style={{
                                                background: 'none',
                                                border: '1px solid #4b5563',
                                                borderRadius: '6px',
                                                padding: '8px 12px',
                                                color: '#9ca3af',
                                                fontSize: '12px',
                                                fontWeight: '500',
                                                cursor: 'pointer',
                                                transition: 'all 0.2s'
                                            }}
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Export Section */}
                    <div style={{ marginBottom: '16px' }}>
                        <label style={{
                            display: 'block',
                            fontSize: '14px',
                            fontWeight: '500',
                            color: '#9ca3af',
                            marginBottom: '8px'
                        }}>
                            Export Wallet
                        </label>
                        <p style={{
                            fontSize: '12px',
                            color: '#6b7280',
                            margin: '0 0 12px 0',
                            lineHeight: '1.4'
                        }}>
                            Download your wallet as a JSON file for backup or transfer purposes.
                        </p>

                        {!showExportModal ? (
                            <button
                                onClick={() => setShowExportModal(true)}
                                style={{
                                    background: '#10b981',
                                    border: 'none',
                                    borderRadius: '8px',
                                    padding: '12px 16px',
                                    color: 'white',
                                    fontSize: '14px',
                                    fontWeight: '500',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                    width: '100%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '8px'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.background = '#059669'}
                                onMouseLeave={(e) => e.currentTarget.style.background = '#10b981'}
                            >
                                <DownloadIcon /> Export Wallet to JSON
                            </button>
                        ) : (
                            <div style={{
                                background: '#1f2937',
                                border: '1px solid #374151',
                                borderRadius: '8px',
                                padding: '16px'
                            }}>
                                <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: '600', color: '#fff' }}>
                                    Export Options
                                </h4>

                                <div style={{ marginBottom: '12px' }}>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                        <input
                                            type="checkbox"
                                            checked={exportOptions.includePrivateKey}
                                            onChange={(e) => setExportOptions({
                                                ...exportOptions,
                                                includePrivateKey: e.target.checked
                                            })}
                                            style={{ cursor: 'pointer' }}
                                        />
                                        <span style={{ fontSize: '14px', color: '#e5e7eb' }}>Include Private Key</span>
                                    </label>
                                    <p style={{ fontSize: '11px', color: '#9ca3af', margin: '4px 0 0 24px' }}>
                                        Required to import and use the wallet
                                    </p>
                                </div>

                                <div style={{ marginBottom: '16px' }}>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                        <input
                                            type="checkbox"
                                            checked={exportOptions.includeMnemonic}
                                            onChange={(e) => setExportOptions({
                                                ...exportOptions,
                                                includeMnemonic: e.target.checked
                                            })}
                                            style={{ cursor: 'pointer' }}
                                        />
                                        <span style={{ fontSize: '14px', color: '#e5e7eb' }}>Include Seed Phrase</span>
                                    </label>
                                    <p style={{ fontSize: '11px', color: '#9ca3af', margin: '4px 0 0 24px' }}>
                                        Include mnemonic phrase if available
                                    </p>
                                </div>

                                {!exportOptions.includePrivateKey && (
                                    <div style={{
                                        background: '#7f1d1d',
                                        border: '1px solid #dc2626',
                                        borderRadius: '6px',
                                        padding: '8px 12px',
                                        marginBottom: '12px'
                                    }}>
                                        <p style={{ fontSize: '12px', color: '#fca5a5', margin: 0 }}>
                                            ⚠️ Warning: Without the private key, this export will only contain public information and cannot be used to restore wallet functionality.
                                        </p>
                                    </div>
                                )}

                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <button
                                        onClick={handleExportWallet}
                                        disabled={exporting}
                                        style={{
                                            background: exporting ? '#4b5563' : '#10b981',
                                            border: 'none',
                                            borderRadius: '6px',
                                            padding: '8px 16px',
                                            color: 'white',
                                            fontSize: '14px',
                                            fontWeight: '500',
                                            cursor: exporting ? 'not-allowed' : 'pointer',
                                            transition: 'background 0.2s',
                                            flex: 1
                                        }}
                                    >
                                        {exporting ? 'Exporting...' : 'Export'}
                                    </button>
                                    <button
                                        onClick={() => setShowExportModal(false)}
                                        style={{
                                            background: 'none',
                                            border: '1px solid #374151',
                                            borderRadius: '6px',
                                            padding: '8px 16px',
                                            color: '#9ca3af',
                                            fontSize: '14px',
                                            fontWeight: '500',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s'
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.borderColor = '#6b7280';
                                            e.currentTarget.style.color = '#e5e7eb';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.borderColor = '#374151';
                                            e.currentTarget.style.color = '#9ca3af';
                                        }}
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Wallet Unlock Modal */}
            {showUnlockModal && wallet.isEncrypted && (
                <WalletUnlockModal
                    wallet={wallet}
                    onUnlock={() => {
                        setShowUnlockModal(false);
                        // Force a re-check of lock status immediately
                        setTimeout(() => {
                            setWalletIsLocked(isWalletLocked(wallet));
                        }, 100);
                    }}
                    onClose={() => setShowUnlockModal(false)}
                    autoShow={false}
                />
            )}
        </div>
    );
};