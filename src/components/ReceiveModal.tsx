import React, { useState, useRef, useEffect } from 'react';
import { XIcon, CopyIcon } from './Icons';
import { Wallet, ReceiveQR } from '../pages/Popup/DataTypes';
import qrCode from 'qrcode-generator';
import './WalletSettings.css';

interface ReceiveModalProps {
    wallet: Wallet;
    onClose: () => void;
}

export const ReceiveModal: React.FC<ReceiveModalProps> = ({ wallet, onClose }) => {
    const [copied, setCopied] = useState(false);
    const copyTimeout = useRef<NodeJS.Timeout | null>(null);
    const qrCodeRef = useRef<HTMLDivElement>(null);

    // Generate QR code when component mounts
    useEffect(() => {
        if (qrCodeRef.current && wallet.address) {
            // Clear any existing QR code
            qrCodeRef.current.innerHTML = '';

            // Create ReceiveQR data
            const receiveData: ReceiveQR = {
                address: wallet.address,
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
    }, [wallet.address, wallet.name, wallet.curve]);

    // Copy address handler
    const handleCopyAddress = () => {
        if (wallet.address) {
            navigator.clipboard.writeText(wallet.address).then(() => {
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
                    <h2>Receive {wallet.curve || 'secp256k1'}</h2>
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
                            <label className="field-label">Wallet Address</label>
                            <div className="address-container">
                                <div className="address-display">
                                    <span className="address-text" title={wallet.address}>
                                        {formatAddress(wallet.address)}
                                    </span>
                                </div>
                                <button
                                    className={`copy-btn ${copied ? 'copied' : ''}`}
                                    onClick={handleCopyAddress}
                                    title="Copy address"
                                >
                                    <CopyIcon />
                                    <span className="copy-text">
                                        {copied ? 'Copied!' : 'Copy'}
                                    </span>
                                </button>
                            </div>
                            {copied && (
                                <div className="copy-feedback">
                                    Address copied to clipboard!
                                </div>
                            )}
                        </div>

                        <div className="qr-section">
                            <label className="field-label">QR Code</label>
                            <div className="qr-container">
                                <div ref={qrCodeRef} className="qr-code"></div>
                            </div>
                            <div className="qr-info">
                                Share this QR code to receive payments
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
