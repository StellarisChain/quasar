import React, { useRef, useEffect } from 'react';
import { Wallet, ReceiveQR } from '../pages/Popup/DataTypes';
import { useTranslation } from '../lib/i18n';
import { XIcon, PrinterIcon } from './Icons';
import { getWalletCredentials, isWalletLocked } from '../pages/Popup/WalletUtils';
import qrCode from 'qrcode-generator';

interface PaperWalletModalProps {
    wallet: Wallet;
    onClose: () => void;
}

export const PaperWalletModal: React.FC<PaperWalletModalProps> = ({ wallet, onClose }) => {
    const { t } = useTranslation();
    const printRef = useRef<HTMLDivElement>(null);
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
            const qr = qrCode(0, 'M'); // Medium error correction for printing
            qr.addData(JSON.stringify(receiveData));
            qr.make();

            // Create QR code as SVG for better print quality
            const size = 6;
            const moduleCount = qr.getModuleCount();
            const svgNS = 'http://www.w3.org/2000/svg';
            const svg = document.createElementNS(svgNS, 'svg');
            svg.setAttribute('width', String(moduleCount * size));
            svg.setAttribute('height', String(moduleCount * size));
            svg.setAttribute('viewBox', `0 0 ${moduleCount * size} ${moduleCount * size}`);

            for (let row = 0; row < moduleCount; row++) {
                for (let col = 0; col < moduleCount; col++) {
                    if (qr.isDark(row, col)) {
                        const rect = document.createElementNS(svgNS, 'rect');
                        rect.setAttribute('x', String(col * size));
                        rect.setAttribute('y', String(row * size));
                        rect.setAttribute('width', String(size));
                        rect.setAttribute('height', String(size));
                        rect.setAttribute('fill', '#000000');
                        svg.appendChild(rect);
                    }
                }
            }

            qrCodeRef.current.appendChild(svg);
        }
    }, [wallet.address, wallet.name, wallet.curve]);

    const handlePrint = () => {
        const printContent = printRef.current;
        if (!printContent) return;

        const printWindow = window.open('', '', 'width=800,height=600');
        if (!printWindow) {
            alert(t('paperWallet.printBlockedWarning'));
            return;
        }

        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>${t('paperWallet.title')} - ${wallet.name}</title>
                <style>
                    @page {
                        size: A4 landscape;
                        margin: 0;
                    }
                    * {
                        margin: 0;
                        padding: 0;
                        box-sizing: border-box;
                    }
                    body {
                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Inter', 'Roboto', sans-serif;
                        background: #ffffff;
                        padding: 0;
                        margin: 0;
                    }
                    .paper-wallet {
                        width: 297mm;
                        height: 105mm;
                        background: linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%);
                        border: 2px solid #8b5cf6;
                        position: relative;
                        display: flex;
                        align-items: stretch;
                        gap: 8mm;
                        padding: 6mm 8mm 6mm 15mm;
                        box-shadow: 0 0 30px rgba(139, 92, 246, 0.3);
                    }
                    .paper-wallet::before {
                        content: '';
                        position: absolute;
                        top: 0;
                        left: 0;
                        right: 0;
                        bottom: 0;
                        background-image: 
                            repeating-linear-gradient(
                                45deg,
                                transparent,
                                transparent 8px,
                                rgba(139, 92, 246, 0.03) 8px,
                                rgba(139, 92, 246, 0.03) 16px
                            ),
                            repeating-linear-gradient(
                                -45deg,
                                transparent,
                                transparent 8px,
                                rgba(139, 92, 246, 0.03) 8px,
                                rgba(139, 92, 246, 0.03) 16px
                            );
                        pointer-events: none;
                    }
                    .content {
                        position: relative;
                        z-index: 1;
                        display: flex;
                        width: 100%;
                        gap: 8mm;
                    }
                    .left-section {
                        flex: 1;
                        display: flex;
                        flex-direction: column;
                        gap: 3mm;
                        justify-content: space-between;
                    }
                    .header {
                        padding-bottom: 3mm;
                        border-bottom: 2px solid #8b5cf6;
                    }
                    .brand {
                        font-size: 24px;
                        font-weight: 600;
                        color: #8b5cf6;
                        letter-spacing: 1px;
                        margin-bottom: 2mm;
                    }
                    .wallet-name {
                        font-size: 13px;
                        color: #a78bfa;
                        font-weight: 400;
                    }
                    .info-section {
                        flex: 1;
                        display: grid;
                        grid-template-columns: 1fr 1fr 1fr;
                        gap: 2mm;
                    }
                    .info-block {
                        background: rgba(139, 92, 246, 0.08);
                        border: 1px solid #8b5cf6;
                        border-radius: 2px;
                        padding: 2mm;
                    }
                    .info-label {
                        font-size: 6px;
                        color: #a78bfa;
                        text-transform: uppercase;
                        letter-spacing: 0.3px;
                        margin-bottom: 1mm;
                        font-weight: 600;
                    }
                    .info-value {
                        font-size: 5px;
                        color: #e9d5ff;
                        word-break: break-all;
                        line-height: 1.2;
                        font-family: "Monaco", "Courier New", monospace;
                    }
                        color: #e9d5ff;
                        word-break: break-all;
                        line-height: 1.4;
                        font-family: 'Monaco', 'Courier New', monospace;
                    }
                    .qr-section {
                        padding: 3mm;
                        background: #ffffff;
                        border-radius: 4px;
                        box-shadow: 0 2px 8px rgba(139, 92, 246, 0.4);
                        display: flex;
                        align-items: center;
                        justify-content: center;
                    }
                    .qr-code svg {
                        display: block;
                        width: 35mm !important;
                        height: 35mm !important;
                    }
                    .footer {
                        position: absolute;
                        bottom: 3mm;
                        right: 5mm;
                        font-size: 6px;
                        color: #6b7280;
                    }
                    @media print {
                        body {
                            background: white;
                        }
                        .paper-wallet {
                            box-shadow: none;
                            page-break-inside: avoid;
                        }
                    }
                </style>
            </head>
            <body>
                ${printContent.innerHTML}
            </body>
            </html>
        `);

        printWindow.document.close();
        printWindow.focus();

        setTimeout(() => {
            printWindow.print();
            printWindow.close();
        }, 250);
    };

    const credentials = getWalletCredentials(wallet);
    const walletLocked = isWalletLocked(wallet);

    return (
        <div className="modal-overlay" style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.85)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2000,
            backdropFilter: 'blur(4px)'
        }}>
            <div className="modal-content" style={{
                background: '#2a2a2a',
                border: '1px solid #3a3a3a',
                borderRadius: '16px',
                width: '90%',
                maxWidth: '900px',
                maxHeight: '90vh',
                overflow: 'auto',
                position: 'relative'
            }}>
                {/* Header */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '20px 24px 16px',
                    borderBottom: '1px solid #3a3a3a',
                    position: 'sticky',
                    top: 0,
                    background: '#2a2a2a',
                    zIndex: 10
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <PrinterIcon />
                        <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: '#fff' }}>
                            {t('paperWallet.title')}
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

                {/* Preview Notice */}
                <div style={{ padding: '24px 24px 0' }}>
                    <div style={{
                        background: '#1a1a1a',
                        border: '1px solid #3a3a3a',
                        borderRadius: '8px',
                        padding: '16px',
                        marginBottom: '20px'
                    }}>
                        <p style={{
                            fontSize: '14px',
                            color: '#9ca3af',
                            margin: 0,
                            lineHeight: '1.5'
                        }}>
                            {t('paperWallet.previewDescription')}
                        </p>
                    </div>

                    {/* Warning if wallet is locked */}
                    {walletLocked && (
                        <div style={{
                            background: '#7f1d1d20',
                            border: '1px solid #ef4444',
                            borderRadius: '8px',
                            padding: '16px',
                            marginBottom: '20px'
                        }}>
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                marginBottom: '8px'
                            }}>
                                <span style={{ fontSize: '16px' }}>🔒</span>
                                <span style={{
                                    fontSize: '14px',
                                    fontWeight: '500',
                                    color: '#ef4444'
                                }}>
                                    {t('paperWallet.walletLockedWarning')}
                                </span>
                            </div>
                            <p style={{
                                fontSize: '12px',
                                color: '#9ca3af',
                                margin: 0,
                                lineHeight: '1.4'
                            }}>
                                {t('paperWallet.walletLockedMessage')}
                            </p>
                        </div>
                    )}
                </div>

                {/* Paper Wallet Preview */}
                <div style={{ padding: '0 24px 24px' }}>
                    <div ref={printRef} className="paper-wallet" style={{
                        width: '100%',
                        aspectRatio: '297/105',
                        background: 'linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%)',
                        border: '2px solid #8b5cf6',
                        position: 'relative',
                        display: 'flex',
                        flexDirection: 'column',
                        padding: '20px',
                        boxShadow: '0 0 30px rgba(139, 92, 246, 0.3)'
                    }}>
                        {/* Header */}
                        <div className="header" style={{
                            textAlign: 'center',
                            marginBottom: '20px'
                        }}>
                            <div className="brand" style={{
                                fontSize: '28px',
                                fontWeight: '700',
                                color: '#8b5cf6',
                                letterSpacing: '1px',
                                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Inter", "Roboto", sans-serif'
                            }}>
                                QUASAR WALLET
                            </div>
                            <div className="wallet-name" style={{
                                fontSize: '16px',
                                color: '#a78bfa',
                                fontWeight: '500',
                                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Inter", "Roboto", sans-serif'
                            }}>
                                {wallet.name}
                            </div>
                        </div>

                        {/* Content Section */}
                        <div className="content" style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            gap: '20px'
                        }}>
                            {/* Info Blocks */}
                            <div className="info-section" style={{
                                flex: 3,
                                display: 'grid',
                                gridTemplateColumns: '1fr 1fr 1fr',
                                gap: '10px'
                            }}>
                                {/* Address */}
                                <div className="info-block" style={{
                                    background: 'rgba(139, 92, 246, 0.08)',
                                    border: '1px solid #8b5cf6',
                                    borderRadius: '6px',
                                    padding: '10px'
                                }}>
                                    <div className="info-label" style={{
                                        fontSize: '10px',
                                        color: '#a78bfa',
                                        textTransform: 'uppercase',
                                        marginBottom: '6px',
                                        fontWeight: '600',
                                        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Inter", "Roboto", sans-serif'
                                    }}>
                                        Address
                                    </div>
                                    <div className="info-value" style={{
                                        fontSize: '9px',
                                        color: '#e9d5ff',
                                        wordBreak: 'break-word',
                                        lineHeight: '1.4',
                                        fontFamily: '"Monaco", "Courier New", monospace'
                                    }}>
                                        {wallet.address}
                                    </div>
                                </div>

                                {/* Private Key */}
                                {!walletLocked && credentials?.privateKey && (
                                    <div className="info-block" style={{
                                        background: 'rgba(139, 92, 246, 0.08)',
                                        border: '1px solid #8b5cf6',
                                        borderRadius: '6px',
                                        padding: '10px'
                                    }}>
                                        <div className="info-label" style={{
                                            fontSize: '10px',
                                            color: '#a78bfa',
                                            textTransform: 'uppercase',
                                            marginBottom: '6px',
                                            fontWeight: '600',
                                            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Inter", "Roboto", sans-serif'
                                        }}>
                                            Private Key
                                        </div>
                                        <div className="info-value" style={{
                                            fontSize: '9px',
                                            color: '#e9d5ff',
                                            wordBreak: 'break-word',
                                            lineHeight: '1.4',
                                            fontFamily: '"Monaco", "Courier New", monospace'
                                        }}>
                                            {credentials.privateKey}
                                        </div>
                                    </div>
                                )}

                                {/* Mnemonic */}
                                {!walletLocked && credentials?.mnemonic && (
                                    <div className="info-block" style={{
                                        background: 'rgba(139, 92, 246, 0.08)',
                                        border: '1px solid #8b5cf6',
                                        borderRadius: '6px',
                                        padding: '10px'
                                    }}>
                                        <div className="info-label" style={{
                                            fontSize: '10px',
                                            color: '#a78bfa',
                                            textTransform: 'uppercase',
                                            marginBottom: '6px',
                                            fontWeight: '600',
                                            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Inter", "Roboto", sans-serif'
                                        }}>
                                            Recovery Phrase
                                        </div>
                                        <div className="info-value" style={{
                                            fontSize: '9px',
                                            color: '#e9d5ff',
                                            wordBreak: 'break-word',
                                            lineHeight: '1.4',
                                            fontFamily: '"Monaco", "Courier New", monospace'
                                        }}>
                                            {credentials.mnemonic}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* QR Code Section */}
                            <div className="qr-section" style={{
                                flex: 1,
                                padding: '10px',
                                background: '#ffffff',
                                borderRadius: '6px',
                                boxShadow: '0 2px 8px rgba(139, 92, 246, 0.4)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}>
                                <div ref={qrCodeRef} style={{ lineHeight: 0 }}></div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="footer" style={{
                            textAlign: 'center',
                            marginTop: '20px',
                            fontSize: '8px',
                            color: '#6b7280',
                            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Inter", "Roboto", sans-serif'
                        }}>
                            {new Date().toLocaleDateString()} {new Date().toLocaleTimeString()}
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div style={{
                    padding: '16px 24px 24px',
                    display: 'flex',
                    gap: '12px',
                    position: 'sticky',
                    bottom: 0,
                    background: '#2a2a2a',
                    borderTop: '1px solid #3a3a3a'
                }}>
                    <button
                        onClick={handlePrint}
                        disabled={walletLocked}
                        style={{
                            flex: 1,
                            background: walletLocked ? '#374151' : '#8b5cf6',
                            border: 'none',
                            borderRadius: '8px',
                            padding: '12px 16px',
                            color: '#fff',
                            fontSize: '14px',
                            fontWeight: '500',
                            cursor: walletLocked ? 'not-allowed' : 'pointer',
                            transition: 'background 0.2s',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px'
                        }}
                        onMouseEnter={(e) => {
                            if (!walletLocked) e.currentTarget.style.background = '#7c3aed';
                        }}
                        onMouseLeave={(e) => {
                            if (!walletLocked) e.currentTarget.style.background = '#8b5cf6';
                        }}
                    >
                        <PrinterIcon />
                        {t('paperWallet.printButton')}
                    </button>
                    <button
                        onClick={onClose}
                        style={{
                            flex: 1,
                            background: 'none',
                            border: '1px solid #3a3a3a',
                            borderRadius: '8px',
                            padding: '12px 16px',
                            color: '#9ca3af',
                            fontSize: '14px',
                            fontWeight: '500',
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
                        {t('common.close')}
                    </button>
                </div>
            </div>
        </div>
    );
};
