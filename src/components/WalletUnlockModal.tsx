import React, { useState, useRef, useEffect } from 'react';
import { Wallet } from '../pages/Popup/DataTypes';
import { unlockWallet, isWalletLocked } from '../pages/Popup/WalletUtils';
import { EyeIcon, EyeSlashIcon, LockClosedIcon } from './Icons';

interface WalletUnlockModalProps {
    wallet: Wallet;
    onUnlock: () => void;
    onClose: () => void;
    autoShow?: boolean;
}

export const WalletUnlockModal: React.FC<WalletUnlockModalProps> = ({
    wallet,
    onUnlock,
    onClose,
    autoShow = true
}) => {
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isUnlocking, setIsUnlocking] = useState(false);
    const [error, setError] = useState('');
    const [isVisible, setIsVisible] = useState(false);
    const passwordInputRef = useRef<HTMLInputElement>(null);

    // Check if wallet is actually locked
    const walletIsLocked = isWalletLocked(wallet);

    useEffect(() => {
        if (autoShow && walletIsLocked) {
            setIsVisible(true);
        } else if (autoShow && !walletIsLocked) {
            onUnlock();
        }

        // If autoShow is false, the parent component controls visibility
        if (!autoShow) {
            setIsVisible(true);
        }
    }, [autoShow, walletIsLocked, onUnlock]);

    useEffect(() => {
        if (isVisible && passwordInputRef.current) {
            // Focus password input when modal becomes visible
            setTimeout(() => passwordInputRef.current?.focus(), 100);
        }
    }, [isVisible]);

    const handleUnlock = async () => {
        if (!password.trim()) {
            setError('Please enter your password');
            return;
        }

        setIsUnlocking(true);
        setError('');

        try {
            await unlockWallet(wallet, password);
            setPassword(''); // Clear password
            setIsVisible(false);
            onUnlock();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Invalid password');
        } finally {
            setIsUnlocking(false);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        handleUnlock();
    };

    const handleClose = () => {
        setPassword('');
        setError('');
        setIsVisible(false);
        onClose();
    };

    // Don't render if wallet is not encrypted or not locked
    if (!wallet.isEncrypted || !walletIsLocked || !isVisible) {
        return null;
    }

    return (
        <div
            className="modal-overlay"
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.75)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1000,
                backdropFilter: 'blur(4px)'
            }}
            onClick={(e) => e.target === e.currentTarget && handleClose()}
        >
            <div
                className="wallet-unlock-modal modal-slide-in"
                style={{
                    background: 'linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%)',
                    border: '1px solid #3a3a3a',
                    borderRadius: '16px',
                    padding: '32px',
                    width: '400px',
                    maxWidth: '90vw',
                    boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)'
                }}
            >
                {/* Header */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    marginBottom: '24px',
                    gap: '12px'
                }}>
                    <div style={{
                        width: '48px',
                        height: '48px',
                        background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
                        borderRadius: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white'
                    }}>
                        <LockClosedIcon />
                    </div>
                    <div>
                        <h3 style={{
                            color: '#e5e7eb',
                            fontSize: '20px',
                            fontWeight: '600',
                            margin: 0,
                            marginBottom: '4px'
                        }}>
                            Unlock Wallet
                        </h3>
                        <p style={{
                            color: '#9ca3af',
                            fontSize: '14px',
                            margin: 0
                        }}>
                            {wallet.name || `Wallet ${wallet.id}`}
                        </p>
                    </div>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: '24px' }}>
                        <label style={{
                            display: 'block',
                            color: '#e5e7eb',
                            fontSize: '14px',
                            fontWeight: '500',
                            marginBottom: '8px'
                        }}>
                            Password
                        </label>
                        <div style={{ position: 'relative' }}>
                            <input
                                ref={passwordInputRef}
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={(e) => {
                                    setPassword(e.target.value);
                                    setError(''); // Clear error on input
                                }}
                                placeholder="Enter your wallet password"
                                style={{
                                    width: '100%',
                                    padding: '12px 48px 12px 16px',
                                    background: '#374151',
                                    border: error ? '2px solid #ef4444' : '1px solid #4b5563',
                                    borderRadius: '8px',
                                    color: '#e5e7eb',
                                    fontSize: '16px',
                                    outline: 'none',
                                    transition: 'border-color 0.2s',
                                    boxSizing: 'border-box'
                                }}
                                onFocus={(e) => {
                                    if (!error) {
                                        e.target.style.borderColor = '#10b981';
                                    }
                                }}
                                onBlur={(e) => {
                                    if (!error) {
                                        e.target.style.borderColor = '#4b5563';
                                    }
                                }}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                style={{
                                    position: 'absolute',
                                    right: '12px',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    background: 'none',
                                    border: 'none',
                                    color: '#9ca3af',
                                    cursor: 'pointer',
                                    padding: '4px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}
                                title={showPassword ? 'Hide password' : 'Show password'}
                            >
                                {showPassword ? <EyeSlashIcon /> : <EyeIcon />}
                            </button>
                        </div>
                        {error && (
                            <p style={{
                                color: '#ef4444',
                                fontSize: '12px',
                                marginTop: '6px',
                                margin: '6px 0 0 0'
                            }}>
                                {error}
                            </p>
                        )}
                    </div>

                    {/* Action Buttons */}
                    <div style={{
                        display: 'flex',
                        gap: '12px',
                        justifyContent: 'flex-end'
                    }}>
                        <button
                            type="button"
                            onClick={handleClose}
                            disabled={isUnlocking}
                            style={{
                                padding: '12px 20px',
                                background: 'transparent',
                                border: '1px solid #4b5563',
                                borderRadius: '8px',
                                color: '#9ca3af',
                                fontSize: '14px',
                                fontWeight: '500',
                                cursor: isUnlocking ? 'not-allowed' : 'pointer',
                                opacity: isUnlocking ? 0.5 : 1,
                                transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => {
                                if (!isUnlocking) {
                                    e.currentTarget.style.borderColor = '#6b7280';
                                    e.currentTarget.style.color = '#e5e7eb';
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (!isUnlocking) {
                                    e.currentTarget.style.borderColor = '#4b5563';
                                    e.currentTarget.style.color = '#9ca3af';
                                }
                            }}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isUnlocking || !password.trim()}
                            style={{
                                padding: '12px 20px',
                                background: isUnlocking || !password.trim() ? '#374151' : '#10b981',
                                border: 'none',
                                borderRadius: '8px',
                                color: 'white',
                                fontSize: '14px',
                                fontWeight: '500',
                                cursor: isUnlocking || !password.trim() ? 'not-allowed' : 'pointer',
                                transition: 'background 0.2s',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px'
                            }}
                            onMouseEnter={(e) => {
                                if (!isUnlocking && password.trim()) {
                                    e.currentTarget.style.background = '#059669';
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (!isUnlocking && password.trim()) {
                                    e.currentTarget.style.background = '#10b981';
                                }
                            }}
                        >
                            {isUnlocking ? (
                                <>
                                    <span className="spinner" style={{
                                        width: '16px',
                                        height: '16px',
                                        border: '2px solid #ffffff40',
                                        borderTop: '2px solid #ffffff',
                                        borderRadius: '50%',
                                        animation: 'spin 1s linear infinite'
                                    }} />
                                    Unlocking...
                                </>
                            ) : (
                                'Unlock'
                            )}
                        </button>
                    </div>
                </form>

                {/* Security Note */}
                <div style={{
                    marginTop: '24px',
                    padding: '12px',
                    background: 'rgba(59, 130, 246, 0.1)',
                    border: '1px solid rgba(59, 130, 246, 0.2)',
                    borderRadius: '8px'
                }}>
                    <p style={{
                        color: '#93c5fd',
                        fontSize: '12px',
                        margin: 0,
                        lineHeight: '1.4'
                    }}>
                        🔒 Your wallet will remain unlocked for 15 minutes during this session.
                    </p>
                </div>
            </div>
        </div>
    );
};
