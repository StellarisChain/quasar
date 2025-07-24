import React, { useState, useEffect } from 'react';
import { BackIcon, KeyIcon, WalletIcon, ArrowUpRightIcon } from '../../components/Icons';
import { Wallet } from '../Popup/DataTypes';
import './Popup.css';

export interface ImportWalletProps {
    onBack: () => void;
    onImport: (wallet: Wallet) => void;
    fromFile?: boolean;
}

export const ImportWallet: React.FC<ImportWalletProps> = ({ onBack, onImport, fromFile }) => {
    const [fileSelected, setFileSelected] = useState<File | null>(null);
    const handleComplete = () => {
        //onImport()
    }

    // loading a .json wallet file
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
                            Requires a pre-generated .json file
                        </p>
                    </div>
                </div>

                <div style={{ width: '100%', display: 'flex', justifyContent: 'center', marginTop: '16px', marginBottom: '0', flexShrink: 0, padding: '0 24px 24px 24px', background: 'transparent' }}>
                    <button
                        className="continue-btn continue-btn-anim fucking-retard-continue-button"
                        //onClick={() => setStep('confirm')}
                        disabled={!fileSelected}
                        style={{
                            width: '100%',
                            background: !fileSelected ? '#4b5563' : '#8b5cf6',
                            border: 'none',
                            borderRadius: '12px',
                            padding: '16px',
                            color: 'white',
                            fontSize: '16px',
                            fontWeight: '600',
                            cursor: !fileSelected ? 'not-allowed' : 'pointer',
                            transition: 'all 0.2s cubic-bezier(.4, 0, .2, 1)',
                            opacity: !fileSelected ? 0.6 : 1,
                            marginTop: '0',
                            marginBottom: '0',
                            boxSizing: 'border-box'
                        }}
                    >
                        {!fileSelected ? 'Select a file to continue' : 'Continue'}
                    </button>
                </div>
            </div>
        )
    } else {
        return (
            <>
                <h1>Not Implemented</h1>
                <p>This feature is not yet available.</p>
            </>
        );
    }
}