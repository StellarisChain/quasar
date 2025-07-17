import React, { useState, useRef, useEffect } from 'react';
import { SettingsIcon, CopyIcon, EyeIcon, EyeOffIcon, XIcon, EditIcon, SaveIcon } from './Icons';
import { Wallet } from '../pages/Popup/DataTypes';

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

    const copyTimeout = useRef<NodeJS.Timeout | null>(null);
    const nameInputRef = useRef<HTMLInputElement>(null);
    const verificationInputRef = useRef<HTMLInputElement>(null);

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
        if (wallet.private_key) {
            navigator.clipboard.writeText(wallet.private_key);
            setCopied(true);
            if (copyTimeout.current) clearTimeout(copyTimeout.current);
            copyTimeout.current = setTimeout(() => setCopied(false), 2000);
        }
    };

    const handleRequestPrivateKey = () => {
        setShowVerificationInput(true);
        setVerificationPhrase('');
        setError('');
    };

    const maskPrivateKey = (key: string) => {
        if (!key) return '';
        if (key.length <= 4) return '•'.repeat(key.length);
        // Show only first 2 and last 2 chars
        return key.slice(0, 2) + '•'.repeat(key.length - 4) + key.slice(-2);
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
                                    {maskPrivateKey(wallet.private_key || '')}
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
                                    onMouseEnter={(e) => e.currentTarget.style.background = '#7c3aed'}
                                    onMouseLeave={(e) => e.currentTarget.style.background = '#8b5cf6'}
                                >
                                    <EyeIcon />
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
                                        {wallet.private_key}
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
                </div>
            </div>
        </div>
    );
};