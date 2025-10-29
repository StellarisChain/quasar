import React, { useState, useRef, useEffect } from 'react';
import { XIcon, CopyIcon } from './Icons';
import { Wallet, ReceiveQR } from '../pages/Popup/DataTypes';
import qrCode from 'qrcode-generator';
import { useTranslation } from '../lib/i18n';
import './WalletSettings.css';

interface ReceiveModalProps {
    wallet: Wallet;
    onClose: () => void;
}

export const ReceiveModal: React.FC<ReceiveModalProps> = ({ wallet, onClose }) => {
    const { t } = useTranslation();
    const [copied, setCopied] = useState(false);
    const [addressFormat, setAddressFormat] = useState<'stellaris' | 'ethereum'>('stellaris');
    const copyTimeout = useRef<NodeJS.Timeout | null>(null);
    const qrCodeRef = useRef<HTMLDivElement>(null);

    // Get the current address based on format selection
    const getCurrentAddress = () => {
        if (addressFormat === 'ethereum' && wallet.address_ethereum) {
            return wallet.address_ethereum;
        }
        if (addressFormat === 'stellaris' && wallet.address_stellaris) {
            return wallet.address_stellaris;
        }
        // Fallback to default address
        return wallet.address || '';
    };

    // Generate QR code when component mounts or address format changes
    useEffect(() => {
        const currentAddress = getCurrentAddress();
        if (qrCodeRef.current && currentAddress) {
            // Clear any existing QR code
            qrCodeRef.current.innerHTML = '';

            // Create ReceiveQR data
            const receiveData: ReceiveQR = {
                address: currentAddress,
                label: wallet.name || 'Wallet',
                curve: wallet.curve || 'secp256k1'
            };

            // Generate QR code
            const qr = qrCode(0, 'L');
            qr.addData(JSON.stringify(receiveData));
            qr.make();

            // Create QR code element with proper styling
            const qrElement = qr.createImgTag(8, 4);
            const parser = new DOMParser();
            const doc = parser.parseFromString(qrElement, 'text/html');
            const img = doc.querySelector('img');

            if (img) {
                img.style.width = '100%';
                img.style.height = 'auto';
                img.style.maxWidth = '200px';
                img.style.border = '8px solid white';
                img.style.borderRadius = '12px';
                qrCodeRef.current.appendChild(img);
            }
        }
    }, [wallet.address, wallet.address_ethereum, wallet.address_stellaris, wallet.name, wallet.curve, addressFormat]);

    // Copy address handler
    const handleCopyAddress = () => {
        const currentAddress = getCurrentAddress();
        if (currentAddress) {
            navigator.clipboard.writeText(currentAddress).then(() => {
                setCopied(true);

                // Clear any existing timeout
                if (copyTimeout.current) {
                    clearTimeout(copyTimeout.current);
                }

                // Reset copied state after 2 seconds
                copyTimeout.current = setTimeout(() => {
                    setCopied(false);
                }, 2000);
            }).catch(err => {
                console.error('Failed to copy address:', err);
            });
        }
    };

    // Cleanup timeout on unmount
    useEffect(() => {
        return () => {
            if (copyTimeout.current) {
                clearTimeout(copyTimeout.current);
            }
        };
    }, []);

    // Format address for display (show more characters than the shortened version)
    const formatAddress = (address: string) => {
        if (!address) return '';
        if (address.length <= 20) return address;
        return `${address.slice(0, 10)}...${address.slice(-10)}`;
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content receive-modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>{t('receiveModal.title', { curve: wallet.curve || 'secp256k1' })}</h2>
                    <button className="close-btn" onClick={onClose}>
                        <XIcon />
                    </button>
                </div>

                <div className="modal-body">
                    <div className="receive-content">
                        <div className="wallet-info">
                            <div className="wallet-name">
                                {wallet.name || `Wallet ${wallet.id}`}
                            </div>
                            <div className="curve-info">
                                Curve: {wallet.curve || 'secp256k1'}
                            </div>
                        </div>

                        <div className="address-section">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                <label className="field-label">{t('receiveModal.walletAddress')}</label>
                                {wallet.address_stellaris && wallet.address_ethereum && (
                                    <div style={{ display: 'flex', gap: '4px' }}>
                                        <button
                                            onClick={() => setAddressFormat('stellaris')}
                                            style={{
                                                padding: '4px 8px',
                                                fontSize: '11px',
                                                borderRadius: '4px',
                                                border: 'none',
                                                cursor: 'pointer',
                                                background: addressFormat === 'stellaris' ? '#3b82f6' : '#374151',
                                                color: 'white',
                                                transition: 'background 0.2s'
                                            }}
                                        >
                                            D/E
                                        </button>
                                        <button
                                            onClick={() => setAddressFormat('ethereum')}
                                            style={{
                                                padding: '4px 8px',
                                                fontSize: '11px',
                                                borderRadius: '4px',
                                                border: 'none',
                                                cursor: 'pointer',
                                                background: addressFormat === 'ethereum' ? '#3b82f6' : '#374151',
                                                color: 'white',
                                                transition: 'background 0.2s'
                                            }}
                                        >
                                            0x
                                        </button>
                                    </div>
                                )}
                            </div>
                            <div className="address-container">
                                <div className="address-display">
                                    <span className="address-text" title={getCurrentAddress()}>
                                        {formatAddress(getCurrentAddress())}
                                    </span>
                                </div>
                                <button
                                    className={`copy-btn ${copied ? 'copied' : ''}`}
                                    onClick={handleCopyAddress}
                                    title={t('receiveModal.copyAddress')}
                                >
                                    <CopyIcon />
                                    <span className="copy-text">
                                        {copied ? t('common.copied') : t('common.copy')}
                                    </span>
                                </button>
                            </div>
                            {copied && (
                                <div className="copy-feedback">
                                    {t('receiveModal.addressCopied')}
                                </div>
                            )}
                        </div>

                        <div className="qr-section">
                            <label className="field-label">{t('receiveModal.qrCode')}</label>
                            <div className="qr-container">
                                <div ref={qrCodeRef} className="qr-code"></div>
                            </div>
                            <div className="qr-info">
                                {t('receiveModal.qrInfo')}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
