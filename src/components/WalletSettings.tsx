import React, { useState, useRef, useEffect } from 'react';
import { SettingsIcon, CopyIcon, EyeIcon, EyeOffIcon, XIcon, EditIcon, SaveIcon, DownloadIcon, LockClosedIcon } from './Icons';
import { Wallet } from '../pages/Popup/DataTypes';
import { exportWallet, ExportOptions, validateExportOptions } from '../lib/wallet_export_utils';
import { encryptWallet, changeWalletPassword, lockWallet, getWalletCredentials, isWalletLocked, saveWallets, getStoredWallets } from '../pages/Popup/WalletUtils';
import { useTranslation, SUPPORTED_LANGUAGES } from '../lib/i18n';
import { testCrypto } from '../lib/crypto';
import { WalletUnlockModal } from './WalletUnlockModal';
import './WalletSettings.css';

interface WalletSettingsModalProps {
    wallet: Wallet;
    onClose: () => void;
    onSave: (updatedWallet: Wallet) => void;
    onDelete?: (wallet: Wallet) => void;
    allWallets?: Wallet[];
    onWalletsChange?: (wallets: Wallet[]) => void;
}

export const WalletSettingsModal: React.FC<WalletSettingsModalProps> = ({
    wallet,
    onClose,
    onSave,
    onDelete,
    allWallets,
    onWalletsChange
}) => {
    const { t, language, setLanguage } = useTranslation();
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

    // Delete wallet states
    const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
    const [deleteConfirmationText, setDeleteConfirmationText] = useState('');
    const [deleting, setDeleting] = useState(false);

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

    // Required phrase for private key access (always English for security)
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
            setError(t('walletSettings.incorrectPhrase'));
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
            setError(t('walletSettings.failedToExportWallet'));
        } finally {
            setExporting(false);
        }
    };

    const handleDeleteWallet = async () => {
        // Require exact wallet name confirmation
        const requiredText = wallet.name || 'Unnamed Wallet';
        if (deleteConfirmationText !== requiredText) {
            setError(t('walletSettings.typeWalletNameExactly'));
            return;
        }

        try {
            setDeleting(true);
            setError('');

            // Use onDelete callback if provided
            if (onDelete) {
                await onDelete(wallet);
            } else {
                // Fallback to direct wallet management
                let walletsToUpdate: Wallet[];

                if (allWallets && onWalletsChange) {
                    // Remove wallet from provided wallets array
                    walletsToUpdate = allWallets.filter((w: Wallet) => w.id !== wallet.id);
                    onWalletsChange(walletsToUpdate);
                } else {
                    // Get current wallets from storage and remove this wallet
                    const currentWallets = getStoredWallets();
                    walletsToUpdate = currentWallets.filter((w: Wallet) => w.id !== wallet.id);
                    saveWallets(walletsToUpdate);
                }
            }

            onClose(); // Close the modal after successful deletion
        } catch (error) {
            console.error('Delete failed:', error);
            setError(t('walletSettings.failedToDeleteWallet'));
        } finally {
            setDeleting(false);
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
                            {t('walletSettings.title')}
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
                            {t('walletSettings.walletName')}
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
                            {t('walletSettings.walletAddress')}
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
                                {t('walletSettings.publicKey')}
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
                            {t('walletSettings.privateKey')}
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
                                    title={walletIsLocked ? t('walletSettings.unlockToView') : t('walletSettings.viewPrivateKey')}
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
                                            {t('walletSettings.securityVerificationRequired')}
                                        </span>
                                    </div>
                                    <p style={{
                                        fontSize: '12px',
                                        color: '#9ca3af',
                                        margin: 0,
                                        lineHeight: '1.4'
                                    }}>
                                        {t('walletSettings.securityVerificationMessage')}
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
                                    placeholder={t('walletSettings.typePhraseExactly')}
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
                                        {t('walletSettings.verifyAndShowKey')}
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
                                        {t('walletSettings.cancel')}
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
                                            {t('walletSettings.warningPrivateKey')}
                                        </span>
                                    </div>
                                    <p style={{
                                        fontSize: '12px',
                                        color: '#9ca3af',
                                        margin: 0,
                                        lineHeight: '1.4'
                                    }}>
                                        {t('walletSettings.warningPrivateKeyMessage')}
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
                            {t('walletSettings.passwordProtection')}
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
                                        {wallet.isEncrypted ? t('walletSettings.passwordProtectionEnabled') : t('walletSettings.passwordProtectionDisabled')}
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
                                {t('walletSettings.passwordProtectionDescription')}
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

                    {/* Language Selection Section */}
                    <div style={{ marginBottom: '24px' }}>
                        <label style={{
                            display: 'block',
                            fontSize: '14px',
                            fontWeight: '500',
                            color: '#9ca3af',
                            marginBottom: '8px'
                        }}>
                            {t('walletSettings.language')}
                        </label>

                        <div style={{
                            background: '#1a1a1a',
                            border: '1px solid #3a3a3a',
                            borderRadius: '8px',
                            padding: '16px'
                        }}>
                            <p style={{
                                fontSize: '12px',
                                color: '#9ca3af',
                                margin: '0 0 12px 0',
                                lineHeight: '1.4'
                            }}>
                                {t('walletSettings.selectLanguage')}
                            </p>

                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(2, 1fr)',
                                gap: '8px'
                            }}>
                                {SUPPORTED_LANGUAGES.map((lang) => (
                                    <button
                                        key={lang.code}
                                        onClick={() => setLanguage(lang.code)}
                                        style={{
                                            background: language === lang.code ? '#8b5cf6' : '#2a2a2a',
                                            border: language === lang.code ? '2px solid #8b5cf6' : '1px solid #3a3a3a',
                                            borderRadius: '8px',
                                            padding: '12px',
                                            color: '#fff',
                                            fontSize: '14px',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s',
                                            textAlign: 'left',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            gap: '4px'
                                        }}
                                        onMouseEnter={(e) => {
                                            if (language !== lang.code) {
                                                e.currentTarget.style.borderColor = '#8b5cf6';
                                                e.currentTarget.style.background = '#333';
                                            }
                                        }}
                                        onMouseLeave={(e) => {
                                            if (language !== lang.code) {
                                                e.currentTarget.style.borderColor = '#3a3a3a';
                                                e.currentTarget.style.background = '#2a2a2a';
                                            }
                                        }}
                                    >
                                        <span style={{
                                            fontWeight: '600',
                                            fontSize: '14px',
                                            color: language === lang.code ? '#fff' : '#e5e7eb'
                                        }}>
                                            {lang.nativeName}
                                        </span>
                                        <span style={{
                                            fontSize: '11px',
                                            color: language === lang.code ? '#c4b5fd' : '#9ca3af'
                                        }}>
                                            {lang.name}
                                        </span>
                                    </button>
                                ))}
                            </div>
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
                            {t('walletSettings.exportWallet')}
                        </label>
                        <p style={{
                            fontSize: '12px',
                            color: '#6b7280',
                            margin: '0 0 12px 0',
                            lineHeight: '1.4'
                        }}>
                            {t('walletSettings.exportWalletDescription')}
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
                                <DownloadIcon /> {t('walletSettings.exportAsJSON')}
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

                    {/* Delete Wallet Section */}
                    <div style={{ marginBottom: '16px' }}>
                        <label style={{
                            display: 'block',
                            fontSize: '14px',
                            fontWeight: '500',
                            color: '#9ca3af',
                            marginBottom: '8px'
                        }}>
                            Danger Zone
                        </label>
                        <div style={{
                            background: '#1f1416',
                            border: '1px solid #7f1d1d',
                            borderRadius: '8px',
                            padding: '16px'
                        }}>
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                marginBottom: '8px'
                            }}>
                                <span style={{ fontSize: '16px' }}>🗑️</span>
                                <h4 style={{ margin: 0, fontSize: '14px', fontWeight: '600', color: '#ef4444' }}>
                                    {t('walletSettings.deleteWallet')}
                                </h4>
                            </div>
                            <p style={{
                                fontSize: '12px',
                                color: '#fca5a5',
                                margin: '0 0 16px 0',
                                lineHeight: '1.4'
                            }}>
                                {t('walletSettings.deleteWalletDescription')}
                            </p>

                            {!showDeleteConfirmation ? (
                                <button
                                    onClick={() => setShowDeleteConfirmation(true)}
                                    style={{
                                        background: '#dc2626',
                                        border: 'none',
                                        borderRadius: '8px',
                                        padding: '12px 16px',
                                        color: 'white',
                                        fontSize: '14px',
                                        fontWeight: '500',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s',
                                        width: '100%'
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.background = '#b91c1c'}
                                    onMouseLeave={(e) => e.currentTarget.style.background = '#dc2626'}
                                >
                                    {t('walletSettings.deleteWalletButton')}
                                </button>
                            ) : (
                                <div style={{
                                    background: '#7f1d1d',
                                    border: '1px solid #dc2626',
                                    borderRadius: '8px',
                                    padding: '16px'
                                }}>
                                    <h5 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: '600', color: '#fef2f2' }}>
                                        Confirm Wallet Deletion
                                    </h5>

                                    <p style={{
                                        fontSize: '12px',
                                        color: '#fca5a5',
                                        margin: '0 0 12px 0',
                                        lineHeight: '1.4'
                                    }}>
                                        To confirm deletion, type the wallet name exactly as shown below:
                                    </p>

                                    <div style={{
                                        background: '#1a1a1a',
                                        border: '1px solid #3a3a3a',
                                        borderRadius: '6px',
                                        padding: '8px 12px',
                                        marginBottom: '12px',
                                        textAlign: 'center'
                                    }}>
                                        <code style={{
                                            color: '#ef4444',
                                            fontSize: '14px',
                                            fontWeight: '600'
                                        }}>
                                            {wallet.name || 'Unnamed Wallet'}
                                        </code>
                                    </div>

                                    <input
                                        type="text"
                                        value={deleteConfirmationText}
                                        onChange={(e) => setDeleteConfirmationText(e.target.value)}
                                        placeholder="Type wallet name to confirm"
                                        style={{
                                            width: '100%',
                                            padding: '8px 12px',
                                            background: '#1a1a1a',
                                            border: error ? '1px solid #ef4444' : '1px solid #3a3a3a',
                                            borderRadius: '6px',
                                            color: '#fff',
                                            fontSize: '14px',
                                            outline: 'none',
                                            marginBottom: '12px'
                                        }}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') handleDeleteWallet();
                                            if (e.key === 'Escape') {
                                                setShowDeleteConfirmation(false);
                                                setDeleteConfirmationText('');
                                                setError('');
                                            }
                                        }}
                                    />

                                    {error && deleteConfirmationText && (
                                        <div style={{
                                            color: '#fca5a5',
                                            fontSize: '12px',
                                            marginBottom: '12px'
                                        }}>
                                            {error}
                                        </div>
                                    )}

                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <button
                                            onClick={handleDeleteWallet}
                                            disabled={deleting || deleteConfirmationText !== (wallet.name || 'Unnamed Wallet')}
                                            style={{
                                                background: deleting ? '#374151' : (deleteConfirmationText === (wallet.name || 'Unnamed Wallet') ? '#dc2626' : '#4b5563'),
                                                border: 'none',
                                                borderRadius: '6px',
                                                padding: '8px 16px',
                                                color: 'white',
                                                fontSize: '14px',
                                                fontWeight: '500',
                                                cursor: (deleting || deleteConfirmationText !== (wallet.name || 'Unnamed Wallet')) ? 'not-allowed' : 'pointer',
                                                transition: 'background 0.2s',
                                                flex: 1
                                            }}
                                        >
                                            {deleting ? 'Deleting...' : 'Delete Wallet Forever'}
                                        </button>
                                        <button
                                            onClick={() => {
                                                setShowDeleteConfirmation(false);
                                                setDeleteConfirmationText('');
                                                setError('');
                                            }}
                                            disabled={deleting}
                                            style={{
                                                background: 'none',
                                                border: '1px solid #4b5563',
                                                borderRadius: '6px',
                                                padding: '8px 16px',
                                                color: '#9ca3af',
                                                fontSize: '14px',
                                                fontWeight: '500',
                                                cursor: deleting ? 'not-allowed' : 'pointer',
                                                transition: 'all 0.2s'
                                            }}
                                            onMouseEnter={(e) => {
                                                if (!deleting) {
                                                    e.currentTarget.style.borderColor = '#6b7280';
                                                    e.currentTarget.style.color = '#e5e7eb';
                                                }
                                            }}
                                            onMouseLeave={(e) => {
                                                if (!deleting) {
                                                    e.currentTarget.style.borderColor = '#4b5563';
                                                    e.currentTarget.style.color = '#9ca3af';
                                                }
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