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
                        size: A4;
                        margin: 0;
                    }
                    * {
                        margin: 0;
                        padding: 0;
                        box-sizing: border-box;
                    }
                    body {
                        font-family: 'Courier New', monospace;
                        background: #2d2d2d;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        min-height: 100vh;
                        padding: 20mm;
                    }
                    .paper-wallet {
                        width: 100%;
                        max-width: 170mm;
                        background: #2d2d2d;
                        border: 3px solid #1a1a1a;
                        border-radius: 8px;
                        padding: 20mm;
                        position: relative;
                        box-shadow: 0 0 30px rgba(0,0,0,0.3);
                    }
                    /* Professional diagonal lines pattern */
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
                                transparent 10px,
                                rgba(255,255,255,0.02) 10px,
                                rgba(255,255,255,0.02) 20px
                            ),
                            repeating-linear-gradient(
                                -45deg,
                                transparent,
                                transparent 10px,
                                rgba(255,255,255,0.02) 10px,
                                rgba(255,255,255,0.02) 20px
                            );
                        pointer-events: none;
                        border-radius: 6px;
                    }
                    .content {
                        position: relative;
                        z-index: 1;
                        text-align: center;
                    }
                    .header {
                        margin-bottom: 8mm;
                        padding-bottom: 6mm;
                        border-bottom: 2px solid #404040;
                    }
                    .brand {
                        font-size: 28px;
                        font-weight: bold;
                        color: #ffffff;
                        letter-spacing: 2px;
                        margin-bottom: 3mm;
                        text-transform: uppercase;
                    }
                    .wallet-name {
                        font-size: 14px;
                        color: #999;
                        letter-spacing: 1px;
                    }
                    .qr-section {
                        margin: 8mm 0;
                        padding: 6mm;
                        background: #ffffff;
                        border-radius: 6px;
                        display: inline-block;
                        box-shadow: 0 2px 10px rgba(0,0,0,0.5);
                    }
                    .qr-code svg {
                        display: block;
                        width: 50mm !important;
                        height: 50mm !important;
                    }
                    .address-section {
                        margin-top: 8mm;
                        padding: 5mm;
                        background: #1a1a1a;
                        border: 1px solid #404040;
                        border-radius: 4px;
                    }
                    .address-label {
                        font-size: 10px;
                        color: #888;
                        text-transform: uppercase;
                        letter-spacing: 1px;
                        margin-bottom: 3mm;
                    }
                    .address-value {
                        font-size: 9px;
                        color: #ffffff;
                        word-break: break-all;
                        line-height: 1.6;
                        font-family: 'Courier New', monospace;
                    }
                    .private-section {
                        margin-top: 6mm;
                        padding: 4mm;
                        background: #1a1a1a;
                        border: 1px dashed #666;
                        border-radius: 4px;
                    }
                    .private-label {
                        font-size: 9px;
                        color: #ff6b6b;
                        text-transform: uppercase;
                        letter-spacing: 1px;
                        margin-bottom: 2mm;
                        font-weight: bold;
                    }
                    .private-value {
                        font-size: 8px;
                        color: #ccc;
                        word-break: break-all;
                        line-height: 1.5;
                        font-family: 'Courier New', monospace;
                    }
                    .footer {
                        margin-top: 8mm;
                        padding-top: 4mm;
                        border-top: 1px solid #404040;
                        font-size: 8px;
                        color: #666;
                    }
                    .warning {
                        font-size: 7px;
                        color: #888;
                        margin-top: 2mm;
                        line-height: 1.4;
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
                        background: '#2d2d2d',
                        border: '3px solid #1a1a1a',
                        borderRadius: '8px',
                        padding: '40px',
                        position: 'relative',
                        boxShadow: '0 0 30px rgba(0,0,0,0.5)'
                    }}>
                        {/* Professional diagonal pattern overlay */}
                        <div style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            backgroundImage: `
                                repeating-linear-gradient(
                                    45deg,
                                    transparent,
                                    transparent 10px,
                                    rgba(255,255,255,0.02) 10px,
                                    rgba(255,255,255,0.02) 20px
                                ),
                                repeating-linear-gradient(
                                    -45deg,
                                    transparent,
                                    transparent 10px,
                                    rgba(255,255,255,0.02) 10px,
                                    rgba(255,255,255,0.02) 20px
                                )
                            `,
                            pointerEvents: 'none',
                            borderRadius: '6px'
                        }} />

                        <div className="content" style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
                            {/* Header */}
                            <div className="header" style={{
                                marginBottom: '16mm',
                                paddingBottom: '12mm',
                                borderBottom: '2px solid #404040'
                            }}>
                                <div className="brand" style={{
                                    fontSize: '28px',
                                    fontWeight: 'bold',
                                    color: '#ffffff',
                                    letterSpacing: '2px',
                                    marginBottom: '6mm',
                                    textTransform: 'uppercase',
                                    fontFamily: '"Courier New", monospace'
                                }}>
                                    QUASAR WALLET
                                </div>
                                <div className="wallet-name" style={{
                                    fontSize: '14px',
                                    color: '#999',
                                    letterSpacing: '1px',
                                    fontFamily: '"Courier New", monospace'
                                }}>
                                    {wallet.name}
                                </div>
                            </div>

                            {/* QR Code Section */}
                            <div className="qr-section" style={{
                                margin: '16mm auto',
                                padding: '12mm',
                                background: '#ffffff',
                                borderRadius: '6px',
                                display: 'inline-block',
                                boxShadow: '0 2px 10px rgba(0,0,0,0.5)'
                            }}>
                                <div ref={qrCodeRef} style={{ lineHeight: 0 }}></div>
                            </div>

                            {/* Address Section */}
                            <div className="address-section" style={{
                                marginTop: '16mm',
                                padding: '10mm',
                                background: '#1a1a1a',
                                border: '1px solid #404040',
                                borderRadius: '4px'
                            }}>
                                <div className="address-label" style={{
                                    fontSize: '10px',
                                    color: '#888',
                                    textTransform: 'uppercase',
                                    letterSpacing: '1px',
                                    marginBottom: '6mm',
                                    fontFamily: '"Courier New", monospace'
                                }}>
                                    Wallet Address
                                </div>
                                <div className="address-value" style={{
                                    fontSize: '9px',
                                    color: '#ffffff',
                                    wordBreak: 'break-all',
                                    lineHeight: '1.6',
                                    fontFamily: '"Courier New", monospace'
                                }}>
                                    {wallet.address}
                                </div>
                            </div>

                            {/* Private Key Section */}
                            {!walletLocked && credentials?.privateKey && (
                                <div className="private-section" style={{
                                    marginTop: '12mm',
                                    padding: '8mm',
                                    background: '#1a1a1a',
                                    border: '1px dashed #666',
                                    borderRadius: '4px'
                                }}>
                                    <div className="private-label" style={{
                                        fontSize: '9px',
                                        color: '#ff6b6b',
                                        textTransform: 'uppercase',
                                        letterSpacing: '1px',
                                        marginBottom: '4mm',
                                        fontWeight: 'bold',
                                        fontFamily: '"Courier New", monospace'
                                    }}>
                                        ⚠ Private Key (Keep Secret)
                                    </div>
                                    <div className="private-value" style={{
                                        fontSize: '8px',
                                        color: '#ccc',
                                        wordBreak: 'break-all',
                                        lineHeight: '1.5',
                                        fontFamily: '"Courier New", monospace'
                                    }}>
                                        {credentials.privateKey}
                                    </div>
                                    {credentials.mnemonic && (
                                        <>
                                            <div className="private-label" style={{
                                                fontSize: '9px',
                                                color: '#ff6b6b',
                                                textTransform: 'uppercase',
                                                letterSpacing: '1px',
                                                marginTop: '6mm',
                                                marginBottom: '4mm',
                                                fontWeight: 'bold',
                                                fontFamily: '"Courier New", monospace'
                                            }}>
                                                Recovery Phrase
                                            </div>
                                            <div className="private-value" style={{
                                                fontSize: '8px',
                                                color: '#ccc',
                                                wordBreak: 'break-all',
                                                lineHeight: '1.5',
                                                fontFamily: '"Courier New", monospace'
                                            }}>
                                                {credentials.mnemonic}
                                            </div>
                                        </>
                                    )}
                                </div>
                            )}

                            {/* Footer */}
                            <div className="footer" style={{
                                marginTop: '16mm',
                                paddingTop: '8mm',
                                borderTop: '1px solid #404040',
                                fontSize: '8px',
                                color: '#666',
                                fontFamily: '"Courier New", monospace'
                            }}>
                                <div>Generated: {new Date().toLocaleDateString()} {new Date().toLocaleTimeString()}</div>
                                <div className="warning" style={{
                                    fontSize: '7px',
                                    color: '#888',
                                    marginTop: '4mm',
                                    lineHeight: '1.4'
                                }}>
                                    Keep this paper wallet in a secure location. Anyone with access to the private key can control the funds.
                                </div>
                            </div>
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
