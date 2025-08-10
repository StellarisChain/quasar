import React, { useState, useRef, useEffect } from 'react';
import { Decimal } from 'decimal.js'
// TODO: Create ArrowRightIcon
import { ArrowsRightLeftIcon, XIcon, ChevronDownIcon, ArrowUpRightIcon as ArrowRightIcon } from './Icons';
import { Wallet, ChainData } from '../pages/Popup/DataTypes';
import { getTokenImagePath } from '../pages/Popup/TokenImageUtil';
import { createTransaction } from '../lib/wallet_client';
import { Transaction } from '../lib/transaction/transaction';
import { loadTokensXmlAsJson, filterTokensByCurve } from '../lib/token_loader';
import { CurveType } from '../lib/wallet_generation_utils';
import { getWalletCredentials, isWalletLocked } from '../pages/Popup/WalletUtils';
import './WalletSettings.css';

interface SendModalProps {
    wallet: Wallet;
    onClose: () => void;
}

type SendStep = 'select-asset' | 'enter-details' | 'confirm' | 'success';

export const SendModal: React.FC<SendModalProps> = ({ wallet, onClose }) => {
    const [step, setStep] = useState<SendStep>('select-asset');
    const [selectedAsset, setSelectedAsset] = useState<ChainData | null>(null);
    const [recipientAddress, setRecipientAddress] = useState('');
    const [amount, setAmount] = useState('');
    const [memo, setMemo] = useState('');
    const [showAssetDropdown, setShowAssetDropdown] = useState(false);
    const [errors, setErrors] = useState<{ [key: string]: string }>({});
    const [isProcessing, setIsProcessing] = useState(false);
    const [transactionHash, setTransactionHash] = useState('');
    const [transactionFee, setTransactionFee] = useState<Decimal>();
    const [availableAssets, setAvailableAssets] = useState<ChainData[]>([]);

    const amountInputRef = useRef<HTMLInputElement>(null);
    const addressInputRef = useRef<HTMLInputElement>(null);

    // Check if wallet is locked
    const walletLocked = isWalletLocked(wallet);

    // If wallet is locked, close the modal
    useEffect(() => {
        if (walletLocked) {
            onClose();
            return;
        }
    }, [walletLocked, onClose]);

    // Filter assets by curve compatibility on component mount
    useEffect(() => {
        const filterAssetsByCurve = async () => {
            if (!wallet.chains || wallet.chains.length === 0) {
                setAvailableAssets([]);
                return;
            }

            try {
                const allTokens = await loadTokensXmlAsJson('tokens.xml');
                const walletCurve = wallet.curve || 'secp256k1';
                const compatibleTokenSymbols = filterTokensByCurve(allTokens, walletCurve).map(token => token.Symbol);

                // Filter wallet chains to only include compatible ones
                const compatibleAssets = wallet.chains.filter(chain =>
                    compatibleTokenSymbols.includes(chain.symbol)
                );

                setAvailableAssets(compatibleAssets);
            } catch (error) {
                console.warn('Could not filter assets by curve, showing all:', error);
                setAvailableAssets(wallet.chains || []);
            }
        };

        filterAssetsByCurve();
    }, [wallet]);

    // Focus inputs when step changes
    useEffect(() => {
        if (step === 'enter-details') {
            setTimeout(() => {
                if (addressInputRef.current) {
                    addressInputRef.current.focus();
                }
            }, 100);
        }
    }, [step]);

    // Don't render if wallet is locked
    if (walletLocked) {
        return null;
    }

    const validateAddress = (address: string) => {
        if (!address) return 'Address is required';
        if (address.length < 20) return 'Invalid address format';
        if (address === wallet.address) return 'Cannot send to your own address';
        return '';
    };

    const validateAmount = (amount: string) => {
        if (!amount) return 'Amount is required';
        const numAmount = parseFloat(amount);
        if (isNaN(numAmount) || numAmount <= 0) return 'Amount must be greater than 0';
        if (selectedAsset && numAmount > parseFloat(selectedAsset.balance.replace(/,/g, ''))) {
            return 'Insufficient balance';
        }
        return '';
    };

    const handleNext = () => {
        if (step === 'select-asset' && selectedAsset) {
            setStep('enter-details');
        } else if (step === 'enter-details') {
            const newErrors: { [key: string]: string } = {};

            const addressError = validateAddress(recipientAddress);
            if (addressError) newErrors.address = addressError;

            const amountError = validateAmount(amount);
            if (amountError) newErrors.amount = amountError;

            if (Object.keys(newErrors).length > 0) {
                setErrors(newErrors);
                return;
            }

            setErrors({});
            setStep('confirm');
        } else if (step === 'confirm') {
            handleSend();
        }
    };

    const handleSend = async () => {
        setIsProcessing(true);

        try {
            // Check if wallet is locked before attempting to get credentials
            if (isWalletLocked(wallet)) {
                throw new Error('Wallet is locked. Please unlock your wallet and try again.');
            }

            // Get wallet credentials (handles both encrypted and unencrypted wallets)
            const credentials = getWalletCredentials(wallet);
            if (!credentials?.privateKey) {
                throw new Error('Unable to access wallet private key. Please unlock your wallet and try again.');
            }

            // Simulate transaction processing
            const tokenData = await loadTokensXmlAsJson("tokens.xml");
            const result: Transaction | null = await createTransaction(
                [credentials.privateKey],
                wallet.address,
                recipientAddress,
                amount,
                memo ? new TextEncoder().encode(memo) : null,
                null,
                tokenData ? tokenData.find(token => token.Symbol === selectedAsset?.symbol)?.Node ?? undefined : undefined,
                (wallet.curve ?? 'secp256k1') as CurveType
            );
            //await new Promise(resolve => setTimeout(resolve, 2000));
            setTransactionHash(result?.tx_hash ?? 'n0x' + Math.random().toString(16).substring(2, 66));
            setTransactionFee(result?.fees ?? new Decimal(0));
            setIsProcessing(false);
            setStep('success');
        } catch (error) {
            setIsProcessing(false);
            setErrors({
                general: error instanceof Error ? error.message : 'Failed to send transaction'
            });
        }
    };

    const handleBack = () => {
        if (step === 'enter-details') {
            setStep('select-asset');
        } else if (step === 'confirm') {
            setStep('enter-details');
        }
    };

    const renderStepIndicator = () => {
        const steps = ['select-asset', 'enter-details', 'confirm', 'success'];
        const currentIndex = steps.indexOf(step);

        return (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}>
                {steps.slice(0, 3).map((stepName, index) => (
                    <React.Fragment key={stepName}>
                        <div style={{
                            width: '24px',
                            height: '24px',
                            borderRadius: '50%',
                            background: index <= currentIndex ? '#8b5cf6' : '#374151',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#fff',
                            fontSize: '12px',
                            fontWeight: '600',
                            transition: 'background 0.2s'
                        }}>
                            {index < currentIndex ? '✓' : index + 1}
                        </div>
                        {index < 2 && (
                            <div style={{
                                flex: 1,
                                height: '2px',
                                background: index < currentIndex ? '#8b5cf6' : '#374151',
                                transition: 'background 0.2s'
                            }} />
                        )}
                    </React.Fragment>
                ))}
            </div>
        );
    };

    // Helper component to handle async image loading for each asset
    const AssetIcon: React.FC<{ symbol: string; alt: string; fallback: string; }> = ({ symbol, alt, fallback }) => {
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
                fontSize: '10px',
                fontWeight: 'bold',
                color: 'white',
                textShadow: '0 1px 2px rgba(0,0,0,0.5)'
            }}>
                {fallback}
            </span>
        );
    };

    const renderSelectAsset = () => (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#fff', margin: 0 }}>
                    Select Asset to Send
                </h3>
                {wallet.curve && (
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontSize: '11px',
                        color: '#9ca3af',
                        background: '#2a2a2a',
                        padding: '4px 8px',
                        borderRadius: '6px',
                        border: '1px solid #3a3a3a'
                    }}>
                        <span style={{
                            width: '4px',
                            height: '4px',
                            borderRadius: '50%',
                            background: wallet.curve === 'secp256k1' ? '#10b981' : '#f59e0b'
                        }} />
                        <span>{wallet.curve.toUpperCase()}</span>
                    </div>
                )}
            </div>

            {availableAssets.length === 0 ? (
                <div style={{
                    textAlign: 'center',
                    padding: '40px 20px',
                    background: '#1a1a1a',
                    border: '1px solid #3a3a3a',
                    borderRadius: '12px',
                    color: '#9ca3af'
                }}>
                    <p style={{ margin: '0 0 8px', fontSize: '14px' }}>No compatible assets found</p>
                    <p style={{ margin: 0, fontSize: '12px' }}>
                        This wallet uses {wallet.curve?.toUpperCase() || 'UNKNOWN'} curve, but no assets support this curve type.
                    </p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {availableAssets.map((chain, index) => (
                        <div
                            key={index}
                            onClick={() => setSelectedAsset(chain)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                background: selectedAsset === chain ? '#2a2a2a' : '#1a1a1a',
                                border: `1px solid ${selectedAsset === chain ? '#8b5cf6' : '#3a3a3a'}`,
                                borderRadius: '12px',
                                padding: '16px',
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{
                                    width: '32px',
                                    height: '32px',
                                    borderRadius: '50%',
                                    background: chain.color || '#6b7280',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: '#fff',
                                    fontSize: '12px',
                                    fontWeight: '600',
                                    overflow: 'hidden'
                                }}>
                                    <AssetIcon symbol={chain.symbol} alt={chain.symbol} fallback={chain.symbol.substring(0, 2).toUpperCase()} />
                                </div>
                                <div>
                                    <div style={{ fontSize: '14px', fontWeight: '600', color: '#fff' }}>
                                        {chain.name}
                                    </div>
                                    <div style={{ fontSize: '12px', color: '#9ca3af' }}>
                                        {chain.balance} {chain.symbol}
                                    </div>
                                </div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <div style={{ fontSize: '14px', fontWeight: '600', color: '#fff' }}>
                                    ${chain.fiatValue.toFixed(2)}
                                </div>
                                <div style={{
                                    fontSize: '12px',
                                    color: chain.change24h >= 0 ? '#10b981' : '#ef4444'
                                }}>
                                    {chain.change24h >= 0 ? '+' : ''}{chain.change24h.toFixed(2)}%
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );

    const renderEnterDetails = () => (
        <div>
            <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#fff', marginBottom: '16px' }}>
                Send {selectedAsset?.name}
            </h3>

            {/* Selected Asset Display */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                background: '#1a1a1a',
                border: '1px solid #3a3a3a',
                borderRadius: '8px',
                padding: '12px',
                marginBottom: '20px'
            }}>
                <div style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    background: selectedAsset?.color || '#6b7280',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    fontSize: '10px',
                    fontWeight: '600',
                    overflow: 'hidden'
                }}>
                    <AssetIcon
                        symbol={selectedAsset?.symbol || ''}
                        alt={selectedAsset?.symbol || ''}
                        fallback={(selectedAsset?.symbol && selectedAsset.symbol.substring(0, 2).toUpperCase()) || ''}
                    />
                </div>
                <div>
                    <div style={{ fontSize: '14px', fontWeight: '600', color: '#fff' }}>
                        {selectedAsset?.name}
                    </div>
                    <div style={{ fontSize: '12px', color: '#9ca3af' }}>
                        Balance: {selectedAsset?.balance} {selectedAsset?.symbol}
                    </div>
                </div>
            </div>

            {/* Recipient Address */}
            <div style={{ marginBottom: '20px' }}>
                <label style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#9ca3af',
                    marginBottom: '8px'
                }}>
                    Recipient Address
                </label>
                <input
                    ref={addressInputRef}
                    type="text"
                    value={recipientAddress}
                    onChange={(e) => {
                        setRecipientAddress(e.target.value);
                        if (errors.address) {
                            setErrors({ ...errors, address: '' });
                        }
                    }}
                    placeholder="Enter recipient address"
                    style={{
                        width: '100%',
                        background: '#1a1a1a',
                        border: `1px solid ${errors.address ? '#ef4444' : '#3a3a3a'}`,
                        borderRadius: '8px',
                        padding: '12px',
                        color: '#fff',
                        fontSize: '14px',
                        fontFamily: 'monospace',
                        outline: 'none',
                        transition: 'border-color 0.2s'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#8b5cf6'}
                    onBlur={(e) => e.target.style.borderColor = errors.address ? '#ef4444' : '#3a3a3a'}
                />
                {errors.address && (
                    <div style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>
                        {errors.address}
                    </div>
                )}
            </div>

            {/* Amount */}
            <div style={{ marginBottom: '20px' }}>
                <label style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#9ca3af',
                    marginBottom: '8px'
                }}>
                    Amount
                </label>
                <div style={{ position: 'relative' }}>
                    <input
                        ref={amountInputRef}
                        type="number"
                        value={amount}
                        onChange={(e) => {
                            setAmount(e.target.value);
                            if (errors.amount) {
                                setErrors({ ...errors, amount: '' });
                            }
                        }}
                        placeholder="0.00"
                        style={{
                            width: '100%',
                            background: '#1a1a1a',
                            border: `1px solid ${errors.amount ? '#ef4444' : '#3a3a3a'}`,
                            borderRadius: '8px',
                            padding: '12px',
                            paddingRight: '60px',
                            color: '#fff',
                            fontSize: '14px',
                            outline: 'none',
                            transition: 'border-color 0.2s'
                        }}
                        onFocus={(e) => e.target.style.borderColor = '#8b5cf6'}
                        onBlur={(e) => e.target.style.borderColor = errors.amount ? '#ef4444' : '#3a3a3a'}
                    />
                    <div style={{
                        position: 'absolute',
                        right: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        fontSize: '14px',
                        color: '#9ca3af',
                        fontWeight: '500'
                    }}>
                        {selectedAsset?.symbol}
                    </div>
                </div>
                {errors.amount && (
                    <div style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>
                        {errors.amount}
                    </div>
                )}
                <button
                    onClick={() => setAmount(selectedAsset?.balance.replace(/,/g, '') || '')}
                    style={{
                        background: 'none',
                        border: 'none',
                        color: '#8b5cf6',
                        fontSize: '12px',
                        cursor: 'pointer',
                        marginTop: '4px',
                        padding: '0'
                    }}
                >
                    Use Max
                </button>
            </div>

            {/* Memo (Optional) */}
            <div style={{ marginBottom: '20px' }}>
                <label style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#9ca3af',
                    marginBottom: '8px'
                }}>
                    Memo (Optional)
                </label>
                <input
                    type="text"
                    value={memo}
                    onChange={(e) => setMemo(e.target.value)}
                    placeholder="Add a note"
                    style={{
                        width: '100%',
                        background: '#1a1a1a',
                        border: '1px solid #3a3a3a',
                        borderRadius: '8px',
                        padding: '12px',
                        color: '#fff',
                        fontSize: '14px',
                        outline: 'none',
                        transition: 'border-color 0.2s'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#8b5cf6'}
                    onBlur={(e) => e.target.style.borderColor = '#3a3a3a'}
                />
            </div>
        </div>
    );

    const renderConfirm = () => (
        <div>
            <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#fff', marginBottom: '16px' }}>
                Confirm Transaction
            </h3>

            <div style={{
                background: '#1a1a1a',
                border: '1px solid #3a3a3a',
                borderRadius: '12px',
                padding: '16px',
                marginBottom: '20px'
            }}>
                <div style={{ marginBottom: '16px' }}>
                    <div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '4px' }}>
                        You're sending
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{
                            width: '20px',
                            height: '20px',
                            borderRadius: '50%',
                            background: selectedAsset?.color || '#6b7280',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#fff',
                            fontSize: '10px',
                            fontWeight: '600'
                        }}>
                            <AssetIcon
                                symbol={selectedAsset?.symbol || ''}
                                alt={selectedAsset?.symbol || ''}
                                fallback={(selectedAsset?.symbol && selectedAsset.symbol.charAt(0)) || ''}
                            />
                        </div>
                        <span style={{ fontSize: '16px', fontWeight: '600', color: '#fff' }}>
                            {amount} {selectedAsset?.symbol}
                        </span>
                    </div>
                </div>

                <div style={{ marginBottom: '16px' }}>
                    <div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '4px' }}>
                        To
                    </div>
                    <div style={{
                        fontSize: '14px',
                        color: '#fff',
                        fontFamily: 'monospace',
                        wordBreak: 'break-all'
                    }}>
                        {recipientAddress}
                    </div>
                </div>

                {memo && (
                    <div style={{ marginBottom: '16px' }}>
                        <div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '4px' }}>
                            Memo
                        </div>
                        <div style={{ fontSize: '14px', color: '#fff' }}>
                            {memo}
                        </div>
                    </div>
                )}

                <div style={{
                    borderTop: '1px solid #3a3a3a',
                    paddingTop: '16px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}>
                    <span style={{ fontSize: '14px', color: '#9ca3af' }}>
                        Network Fee
                    </span>
                    <span style={{ fontSize: '14px', color: '#fff' }}>
                        {transactionFee?.toString() ?? 'NO FEE'} {selectedAsset?.symbol}
                    </span>
                </div>
            </div>

            <div style={{
                background: '#1a1a1a',
                border: '1px solid #f59e0b',
                borderRadius: '8px',
                padding: '12px',
                marginBottom: '20px'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '16px' }}>⚠️</span>
                    <span style={{ fontSize: '14px', color: '#f59e0b', fontWeight: '500' }}>
                        Transaction cannot be undone
                    </span>
                </div>
            </div>
        </div>
    );

    const renderSuccess = () => (
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: '#10b981',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 20px',
                color: '#fff',
                fontSize: '24px'
            }}>
                ✓
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#fff', marginBottom: '8px' }}>
                Transaction Sent!
            </h3>
            <p style={{ fontSize: '14px', color: '#9ca3af', marginBottom: '20px' }}>
                Your transaction has been broadcast to the network
            </p>

            <div style={{
                background: '#1a1a1a',
                border: '1px solid #3a3a3a',
                borderRadius: '8px',
                padding: '12px',
                marginBottom: '20px'
            }}>
                <div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '4px' }}>
                    Transaction Hash
                </div>
                <div style={{
                    fontSize: '12px',
                    color: '#8b5cf6',
                    fontFamily: 'monospace',
                    wordBreak: 'break-all'
                }}>
                    {transactionHash}
                </div>
            </div>
        </div>
    );

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
                        <ArrowsRightLeftIcon />
                        <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: '#fff' }}>
                            Send Crypto
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
                    {step !== 'success' && renderStepIndicator()}

                    {step === 'select-asset' && renderSelectAsset()}
                    {step === 'enter-details' && renderEnterDetails()}
                    {step === 'confirm' && renderConfirm()}
                    {step === 'success' && renderSuccess()}
                </div>

                {/* General Error Display */}
                {errors.general && (
                    <div style={{
                        margin: '0 24px 16px',
                        padding: '12px',
                        background: '#1f2937',
                        border: '1px solid #ef4444',
                        borderRadius: '8px',
                        color: '#fca5a5',
                        fontSize: '14px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                    }}>
                        <span style={{ fontSize: '16px' }}>⚠️</span>
                        {errors.general}
                    </div>
                )}

                {/* Footer */}
                <div style={{
                    padding: '16px 24px',
                    borderTop: '1px solid #3a3a3a',
                    display: 'flex',
                    gap: '8px'
                }}>
                    {step !== 'select-asset' && step !== 'success' && (
                        <button
                            onClick={handleBack}
                            style={{
                                flex: 1,
                                background: 'none',
                                border: '1px solid #3a3a3a',
                                borderRadius: '8px',
                                padding: '10px 16px',
                                color: '#9ca3af',
                                fontSize: '14px',
                                cursor: 'pointer',
                                transition: 'all 0.2s'
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
                            Back
                        </button>
                    )}

                    {step === 'success' ? (
                        <button
                            onClick={onClose}
                            style={{
                                flex: 1,
                                background: '#8b5cf6',
                                border: 'none',
                                borderRadius: '8px',
                                padding: '10px 16px',
                                color: '#fff',
                                fontSize: '14px',
                                fontWeight: '500',
                                cursor: 'pointer',
                                transition: 'background 0.2s'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.background = '#7c3aed'}
                            onMouseLeave={(e) => e.currentTarget.style.background = '#8b5cf6'}
                        >
                            Done
                        </button>
                    ) : (
                        <button
                            onClick={handleNext}
                            disabled={
                                (step === 'select-asset' && (!selectedAsset || availableAssets.length === 0)) ||
                                (step === 'confirm' && isProcessing)
                            }
                            style={{
                                flex: 1,
                                background: (step === 'select-asset' && (!selectedAsset || availableAssets.length === 0)) ||
                                    (step === 'confirm' && isProcessing) ? '#374151' : '#8b5cf6',
                                border: 'none',
                                borderRadius: '8px',
                                padding: '10px 16px',
                                color: '#fff',
                                fontSize: '14px',
                                fontWeight: '500',
                                cursor: (step === 'select-asset' && !selectedAsset) ||
                                    (step === 'confirm' && isProcessing) ? 'not-allowed' : 'pointer',
                                transition: 'background 0.2s',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px'
                            }}
                            onMouseEnter={(e) => {
                                if (!e.currentTarget.disabled) {
                                    e.currentTarget.style.background = '#7c3aed';
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (!e.currentTarget.disabled) {
                                    e.currentTarget.style.background = '#8b5cf6';
                                }
                            }}
                        >
                            {isProcessing ? (
                                <>
                                    <div style={{
                                        width: '16px',
                                        height: '16px',
                                        border: '2px solid #fff',
                                        borderTop: '2px solid transparent',
                                        borderRadius: '50%',
                                        animation: 'spin 1s linear infinite'
                                    }} />
                                    Processing...
                                </>
                            ) : (
                                <>
                                    {step === 'select-asset' && 'Continue'}
                                    {step === 'enter-details' && 'Review'}
                                    {step === 'confirm' && 'Send'}
                                    <ArrowRightIcon />
                                </>
                            )}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};