import React, { useState, useEffect } from 'react';
import { BackIcon, KeyIcon, WalletIcon, ArrowUpRightIcon } from '../../components/Icons';
import { generateMnemonic, generate } from '../../lib/wallet_generation_utils';
import { Wallet } from '../Popup/DataTypes';
import './Popup.css';

interface NewWalletProps {
    onBack: () => void;
    onComplete: (wallet: Wallet) => void;
}

export const NewWallet: React.FC<NewWalletProps> = ({ onBack, onComplete }) => {
    const [step, setStep] = useState<'generate' | 'confirm' | 'name'>('generate');
    const [seedPhrase, setSeedPhrase] = useState<string[]>([]);
    const [confirmPhrase, setConfirmPhrase] = useState<string[]>(new Array(12).fill(''));
    const [walletName, setWalletName] = useState<string>('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [selectedWords, setSelectedWords] = useState<number[]>([]);

    // Generate seed phrase
    useEffect(() => {
        const generateSeedPhrase = () => {
            setIsGenerating(true);
            // Simulate generation delay
            setTimeout(() => {
                const phrase = generateMnemonic().trim().split(/\s+/);
                setSeedPhrase(phrase);
                setIsGenerating(false);
            }, 2000);
        };

        generateSeedPhrase();
    }, []);

    // Generate random positions for confirmation
    useEffect(() => {
        if (step === 'confirm' && selectedWords.length === 0) {
            const positions = Array.from({ length: 12 }, (_, i) => i)
                .sort(() => Math.random() - 0.5)
                .slice(0, 4)
                .sort((a, b) => a - b);
            setSelectedWords(positions);
        }
    }, [step, selectedWords.length]);

    const handleConfirmWord = (index: number, value: string) => {
        const newConfirmPhrase = [...confirmPhrase];
        newConfirmPhrase[index] = value;
        setConfirmPhrase(newConfirmPhrase);
    };

    const isConfirmationValid = () => {
        return selectedWords.every(pos => confirmPhrase[pos] === seedPhrase[pos]);
    };

    const handleComplete = () => {
        let newWallet: Wallet = generate({
            mnemonicPhrase: seedPhrase.join(' '),
            passphrase: '',
            index: Date.now() + Math.random(), // Ensure uniqueness
            deterministic: false,
            fields: ['mnemonic', 'id', 'private_key', 'public_key', 'address'],
            walletVersion: '0.2.3'
        });
        newWallet.name = walletName || 'My Wallet';
        onComplete(newWallet);
    };

    if (step === 'generate') {
        return (
            <div className="popup-content create-wallet-page" style={{ overflow: 'auto', maxHeight: 'calc(100vh - 64px)' }} /*style={{
                height: '100vh',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'flex-start',
                alignItems: 'stretch',
                boxSizing: 'border-box',
                paddingBottom: '0',
                overflow: 'hidden',
                //overflowY: 'auto',
                //maxHeight: '150vh',
                position: 'relative'
            }}*/>
                <div className="create-wallet-header">
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

                    <div className="create-wallet-title">
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
                            Your Secret Recovery Phrase
                        </h2>
                        <p style={{ fontSize: '14px', color: '#9ca3af', textAlign: 'center', margin: '0 0 32px', lineHeight: '1.5' }}>
                            This phrase is the only way to recover your wallet. Keep it secure and never share it.
                        </p>
                    </div>
                </div>

                {/* Seed Phrase Display */}
                <div className="seed-phrase-container" style={{ marginBottom: '0' }}>
                    {isGenerating ? (
                        <div className="generating-seed" style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '16px',
                            padding: '48px 24px',
                            background: '#2a2a2a',
                            borderRadius: '12px',
                            border: '1px solid #3a3a3a'
                        }}>
                            <div className="spinner" style={{
                                width: '32px',
                                height: '32px',
                                border: '3px solid #3a3a3a',
                                borderTop: '3px solid #8b5cf6',
                                borderRadius: '50%',
                                animation: 'spin 1s linear infinite'
                            }}></div>
                            <span style={{ color: '#9ca3af', fontSize: '14px' }}>Generating secure seed phrase...</span>
                        </div>
                    ) : (
                        <div className="seed-phrase-grid" style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(3, 1fr)',
                            gap: '12px',
                            padding: '24px',
                            background: '#2a2a2a',
                            borderRadius: '12px',
                            border: '1px solid #3a3a3a',
                            width: '100%',
                            boxSizing: 'border-box',
                            maxWidth: '400px',
                            margin: '0 auto',
                            wordBreak: 'normal'
                        }}>
                            {seedPhrase.map((word, index) => (
                                <div key={index} className="seed-word" style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '2px', // reduce gap between number and text
                                    padding: '12px',
                                    background: '#1a1a1a',
                                    borderRadius: '8px',
                                    border: '1px solid #3a3a3a',
                                    width: '100%',
                                    boxSizing: 'border-box',
                                    minWidth: 0,
                                    overflow: 'hidden',
                                    position: 'relative',
                                    zIndex: 1 // ensure button stays above expanded word
                                }}
                                    onMouseEnter={e => {
                                        const wordSpan = e.currentTarget.querySelector('.seed-word-text') as HTMLElement | null;
                                        if (wordSpan) {
                                            wordSpan.style.whiteSpace = 'normal';
                                            wordSpan.style.overflow = 'visible';
                                            wordSpan.style.textOverflow = 'clip';
                                            wordSpan.style.maxWidth = 'none';
                                            wordSpan.style.background = '#232323';
                                            wordSpan.style.zIndex = '10'; // ensure expanded word stays above other content but not above button
                                            wordSpan.style.padding = '2px 6px';
                                            wordSpan.style.borderRadius = '6px';
                                        }
                                    }}
                                    onMouseLeave={e => {
                                        const wordSpan = e.currentTarget.querySelector('.seed-word-text') as HTMLElement | null;
                                        if (wordSpan) {
                                            wordSpan.style.whiteSpace = 'nowrap';
                                            wordSpan.style.overflow = 'hidden';
                                            wordSpan.style.textOverflow = 'ellipsis';
                                            wordSpan.style.maxWidth = '90px';
                                            wordSpan.style.background = 'none';
                                            wordSpan.style.zIndex = '1';
                                            wordSpan.style.padding = '0';
                                            wordSpan.style.borderRadius = '0';
                                        }
                                    }}>
                                    <span style={{ color: '#9ca3af', fontSize: '12px', fontWeight: '500', minWidth: '20px' }}>
                                        {index + 1}.
                                    </span>
                                    <span style={{ color: 'white', fontSize: '14px', fontWeight: '500', wordBreak: 'break-word' }}>
                                        <span
                                            className="seed-word-text"
                                            style={{
                                                color: 'white',
                                                fontSize: '14px',
                                                fontWeight: '500',
                                                whiteSpace: 'nowrap',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                maxWidth: '90px',
                                                display: 'inline-block',
                                                transition: 'all 0.2s cubic-bezier(.4, 0, .2, 1)'
                                            }}
                                        >{word}</span>
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div style={{ width: '100%', display: 'flex', justifyContent: 'center', marginTop: '16px', marginBottom: '0', flexShrink: 0, padding: '0 24px 24px 24px', background: 'transparent' }}>
                    <button
                        className="continue-btn continue-btn-anim fucking-retard-continue-button"
                        onClick={() => setStep('confirm')}
                        disabled={isGenerating}
                        style={{
                            width: '100%',
                            background: isGenerating ? '#4b5563' : '#8b5cf6',
                            border: 'none',
                            borderRadius: '12px',
                            padding: '16px',
                            color: 'white',
                            fontSize: '16px',
                            fontWeight: '600',
                            cursor: isGenerating ? 'not-allowed' : 'pointer',
                            transition: 'all 0.2s cubic-bezier(.4, 0, .2, 1)',
                            opacity: isGenerating ? 0.6 : 1,
                            marginTop: '0',
                            marginBottom: '0',
                            boxSizing: 'border-box'
                        }}
                    >
                        {isGenerating ? 'Generating...' : 'I\'ve Written It Down'}
                    </button>
                </div>

                {/* Warning */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px', margin: '0 auto', maxWidth: '400px' }}>
                    {/*<div className="security-warning" style={{
                        padding: '16px',
                        background: '#fbbf24',
                        borderRadius: '8px',
                        marginBottom: 0,
                        border: '1px solid #f59e0b',
                        width: '100%',
                        opacity: 0.5,
                        pointerEvents: 'none'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                            <span style={{ fontSize: '16px' }}>⚠️</span>
                            <span style={{ color: '#92400e', fontSize: '14px', fontWeight: '600' }}>
                                Important Security Notice
                            </span>
                        </div>
                        <p style={{ color: '#92400e', fontSize: '12px', lineHeight: '1.4', margin: 0 }}>
                            Write down this phrase and store it in a secure location. Never share it with anyone or enter it on suspicious websites.
                        </p>
                    </div>*/}
                </div>
            </div>
        );
    }

    if (step === 'confirm') {
        return (
            <div className="popup-content create-wallet-page" style={{ overflow: 'auto', maxHeight: 'calc(100vh - 64px)' }}/*style={{ maxHeight: '100vh', overflowY: 'auto' }}*/>
                <div className="create-wallet-header">
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

                    <div className="create-wallet-title">
                        <div className="wallet-icon-large" style={{
                            width: '48px',
                            height: '48px',
                            background: 'linear-gradient(135deg, #10b981, #059669)',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto 16px',
                            boxShadow: '0 4px 16px rgba(16, 185, 129, 0.3)'
                        }}>
                            <KeyIcon />
                        </div>
                        <h2 style={{ fontSize: '24px', fontWeight: '600', textAlign: 'center', margin: '0 0 8px', color: 'white' }}>
                            Confirm Your Phrase
                        </h2>
                        <p style={{ fontSize: '14px', color: '#9ca3af', textAlign: 'center', margin: '0 0 32px', lineHeight: '1.5' }}>
                            Enter the missing words from your seed phrase to continue
                        </p>
                    </div>
                </div>

                {/* Confirmation Grid */}
                <div className="confirmation-grid" style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: '12px',
                    marginBottom: '32px'
                }}>
                    {seedPhrase.map((word, index) => (
                        <div key={index} className="confirm-word" style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '12px',
                            background: selectedWords.includes(index) ? '#2a2a2a' : '#1a1a1a',
                            borderRadius: '8px',
                            border: selectedWords.includes(index) ? '2px solid #8b5cf6' : '1px solid #3a3a3a'
                        }}>
                            <span style={{ color: '#9ca3af', fontSize: '12px', fontWeight: '500', minWidth: '20px' }}>
                                {index + 1}.
                            </span>
                            {selectedWords.includes(index) ? (
                                <input
                                    type="text"
                                    value={confirmPhrase[index]}
                                    onChange={(e) => handleConfirmWord(index, e.target.value)}
                                    placeholder="Enter word"
                                    style={{
                                        background: 'transparent',
                                        border: 'none',
                                        color: 'white',
                                        fontSize: '14px',
                                        fontWeight: '500',
                                        outline: 'none',
                                        width: '100%'
                                    }}
                                />
                            ) : (
                                <span style={{ color: 'white', fontSize: '14px', fontWeight: '500' }}>
                                    {word}
                                </span>
                            )}
                        </div>
                    ))}
                </div>

                {/* Continue Button */}
                <button
                    className="continue-btn continue-btn-anim"
                    onClick={() => setStep('name')}
                    disabled={!isConfirmationValid()}
                    style={{
                        width: '100%',
                        background: isConfirmationValid() ? '#8b5cf6' : '#4b5563',
                        border: 'none',
                        borderRadius: '12px',
                        padding: '16px',
                        color: 'white',
                        fontSize: '16px',
                        fontWeight: '600',
                        cursor: isConfirmationValid() ? 'pointer' : 'not-allowed',
                        transition: 'all 0.2s cubic-bezier(.4, 0, .2, 1)',
                        opacity: isConfirmationValid() ? 1 : 0.6
                    }}
                >
                    Continue
                </button>
            </div>
        );
    }

    if (step === 'name') {
        return (
            <div className="popup-content create-wallet-page" style={{ overflow: 'auto', maxHeight: 'calc(100vh - 64px)' }} /*style={{ maxHeight: '100vh', overflowY: 'auto' }}*/>
                <div className="create-wallet-header">
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

                    <div className="create-wallet-title">
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
                            <WalletIcon />
                        </div>
                        <h2 style={{ fontSize: '24px', fontWeight: '600', textAlign: 'center', margin: '0 0 8px', color: 'white' }}>
                            Name Your Wallet
                        </h2>
                        <p style={{ fontSize: '14px', color: '#9ca3af', textAlign: 'center', margin: '0 0 32px', lineHeight: '1.5' }}>
                            Give your wallet a memorable name
                        </p>
                    </div>
                </div>

                {/* Wallet Name Input */}
                <div className="wallet-name-section" style={{ marginBottom: '32px' }}>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: 'white', marginBottom: '8px' }}>
                        Wallet Name
                    </label>
                    <input
                        type="text"
                        value={walletName}
                        onChange={(e) => setWalletName(e.target.value)}
                        placeholder="My Wallet"
                        style={{
                            width: '100%',
                            padding: '16px',
                            background: '#2a2a2a',
                            border: '1px solid #3a3a3a',
                            borderRadius: '12px',
                            color: 'white',
                            fontSize: '16px',
                            outline: 'none',
                            transition: 'border-color 0.2s'
                        }}
                        onFocus={(e) => e.target.style.borderColor = '#8b5cf6'}
                        onBlur={(e) => e.target.style.borderColor = '#3a3a3a'}
                    />
                </div>

                {/* Success Message */}
                <div className="success-message" style={{
                    padding: '16px',
                    background: '#10b981',
                    borderRadius: '8px',
                    marginBottom: '32px',
                    border: '1px solid #059669'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                        <span style={{ fontSize: '16px' }}>✅</span>
                        <span style={{ color: 'white', fontSize: '14px', fontWeight: '600' }}>
                            Wallet Created Successfully!
                        </span>
                    </div>
                    <p style={{ color: 'white', fontSize: '12px', lineHeight: '1.4', margin: 0 }}>
                        Your wallet has been generated and is ready to use. You can now start managing your assets.
                    </p>
                </div>

                {/* Complete Button */}
                <button
                    className="continue-btn continue-btn-anim"
                    onClick={handleComplete}
                    style={{
                        width: '100%',
                        background: '#10b981',
                        border: 'none',
                        borderRadius: '12px',
                        padding: '16px',
                        color: 'white',
                        fontSize: '16px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        transition: 'all 0.2s cubic-bezier(.4, 0, .2, 1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px'
                    }}
                >
                    <span>Complete Setup</span>
                    <ArrowUpRightIcon />
                </button>
            </div>
        );
    }

    return null;
};