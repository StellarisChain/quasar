import React, { useState } from 'react';
import { PlusIcon, ArrowDownRightIcon, WalletIcon, FileUploadIcon, BackIcon, KeyIcon } from '../../components/Icons';
import { useTranslation } from '../../lib/i18n';
import './Popup.css';

interface CreateWalletProps {
  onBack: () => void;
  onCreateWallet: (type: 'new' | 'import-file' | 'manual-import') => void;
}

export const CreateWallet: React.FC<CreateWalletProps> = ({ onBack, onCreateWallet }) => {
  const { t } = useTranslation();
  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  const walletOptions = [
    {
      id: 'new',
      icon: <PlusIcon />,
      title: t('createWallet.newWallet.title'),
      description: t('createWallet.newWallet.description'),
      color: '#8b5cf6'
    },
    {
      id: 'import-file',
      icon: <FileUploadIcon />,
      title: t('createWallet.importFile.title'),
      description: t('createWallet.importFile.description'),
      color: '#3b82f6'
    },
    {
      id: 'manual-import',
      icon: <KeyIcon />,
      title: t('createWallet.manualImport.title'),
      description: t('createWallet.manualImport.description'),
      color: '#10b981'
    }
  ];  return (
    <div className="popup-content create-wallet-page" style={{ overflow: 'auto', maxHeight: 'calc(100vh - 64px)' }}>
      {/* Header */}
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
            <WalletIcon />
          </div>
          <h2 style={{
            fontSize: '20px',
            fontWeight: '700',
            color: '#fff',
            textAlign: 'center',
            marginBottom: '8px'
          }}>
            {t('createWallet.title')}
          </h2>
          <p style={{
            fontSize: '14px',
            color: '#9ca3af',
            marginTop: '8px',
            marginBottom: '0'
          }}>
            {t('createWallet.subtitle')}
          </p>
        </div>
      </div>

      {/* Wallet Options */}
      <div className="wallet-options" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {walletOptions.map((option) => (
          <div
            key={option.id}
            className={`wallet-option wallet-option-anim ${selectedOption === option.id ? 'selected' : ''}`}
            onClick={() => setSelectedOption(option.id)}
            style={{
              background: selectedOption === option.id ? '#3a3a3a' : '#2a2a2a',
              border: selectedOption === option.id ? `2px solid ${option.color}` : '1px solid #3a3a3a',
              borderRadius: '12px',
              padding: '20px',
              cursor: 'pointer',
              transition: 'all 0.2s cubic-bezier(.4, 0, .2, 1)',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            {option.recommended && (
              <div className="recommended-badge" style={{
                position: 'absolute',
                top: '12px',
                right: '12px',
                background: '#10b981',
                color: 'white',
                fontSize: '10px',
                fontWeight: '600',
                padding: '4px 8px',
                borderRadius: '6px',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                Recommended
              </div>
            )}
            
            <div className="option-header" style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              marginBottom: '12px'
            }}>
              <div className="option-icon" style={{
                width: '32px',
                height: '32px',
                background: `${option.color}20`,
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: option.color,
                fontSize: '16px'
              }}>
                {option.icon}
              </div>
              <div className="option-title" style={{
                fontSize: '16px',
                fontWeight: '600',
                color: 'white'
              }}>
                {option.title}
              </div>
            </div>
            
            <div className="option-description" style={{
              fontSize: '14px',
              color: '#9ca3af',
              lineHeight: '1.4',
              marginLeft: '44px'
            }}>
              {option.description}
            </div>
          </div>
        ))}
      </div>

      {/* Continue Button */}
      <div className="create-wallet-footer" style={{ marginTop: '32px' }}>
        <button
          className="continue-btn continue-btn-anim"
          onClick={() => selectedOption && onCreateWallet(selectedOption as 'new' | 'import-file' | 'manual-import')}
          disabled={!selectedOption}
          style={{
            width: '100%',
            background: selectedOption ? '#8b5cf6' : '#4b5563',
            border: 'none',
            borderRadius: '12px',
            padding: '16px',
            color: 'white',
            fontSize: '16px',
            fontWeight: '600',
            cursor: selectedOption ? 'pointer' : 'not-allowed',
            transition: 'all 0.2s cubic-bezier(.4, 0, .2, 1)',
            opacity: selectedOption ? 1 : 0.6,
            transform: selectedOption ? 'scale(1)' : 'scale(0.98)'
          }}
        >
          Continue
        </button>
      </div>
    </div>
  );
};