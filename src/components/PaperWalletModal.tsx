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

        // Create the background pattern SVG
        const backgroundPattern = `
            <svg width="100%" height="100%" style="position: absolute; top: 0; left: 0; z-index: 0; opacity: 0.03;">
                <defs>
                    <pattern id="logoPattern" x="0" y="0" width="120" height="120" patternUnits="userSpaceOnUse">
                        <!-- Quasar-style hexagonal pattern -->
                        <path d="M60,10 L80,25 L80,55 L60,70 L40,55 L40,25 Z" 
                              stroke="#8b5cf6" stroke-width="1.5" fill="none" opacity="0.4"/>
                        <circle cx="60" cy="40" r="8" stroke="#8b5cf6" stroke-width="1" fill="none" opacity="0.6"/>
                        <path d="M60,32 L60,20 M52,40 L42,40 M68,40 L78,40 M60,48 L60,60" 
                              stroke="#8b5cf6" stroke-width="1" opacity="0.5"/>
                        <!-- Stellaris star pattern -->
                        <path d="M100,15 L102,20 L107,20 L103,23 L105,28 L100,25 L95,28 L97,23 L93,20 L98,20 Z" 
                              stroke="#10b981" stroke-width="1" fill="none" opacity="0.4"/>
                        <circle cx="20" cy="100" r="6" stroke="#10b981" stroke-width="1" fill="none" opacity="0.3"/>
                    </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#logoPattern)"/>
            </svg>
        `;

        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>${t('paperWallet.title')} - ${wallet.name}</title>
                <style>
                    * {
                        margin: 0;
                        padding: 0;
                        box-sizing: border-box;
                    }
                    body {
                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Inter', 'Roboto', sans-serif;
                        padding: 20px;
                        background: #ffffff;
                        color: #000000;
                    }
                    .paper-wallet {
                        max-width: 800px;
                        margin: 0 auto;
                        background: white;
                        border-radius: 24px;
                        overflow: hidden;
                        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
                        position: relative;
                    }
                    .background-pattern {
                        position: absolute;
                        top: 0;
                        left: 0;
                        right: 0;
                        bottom: 0;
                        z-index: 0;
                    }
                    .content {
                        position: relative;
                        z-index: 1;
                    }
                    .header {
                        background: linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%);
                        color: white;
                        padding: 40px 40px 30px;
                        text-align: center;
                        border-bottom: 4px solid #7c3aed;
                    }
                    .title {
                        font-size: 32px;
                        font-weight: 700;
                        margin-bottom: 8px;
                        letter-spacing: -0.5px;
                    }
                    .wallet-name {
                        font-size: 20px;
                        font-weight: 500;
                        margin-bottom: 8px;
                        opacity: 0.95;
                    }
                    .curve-badge {
                        display: inline-block;
                        background: rgba(255, 255, 255, 0.2);
                        padding: 6px 16px;
                        border-radius: 20px;
                        font-size: 13px;
                        font-weight: 600;
                        letter-spacing: 0.5px;
                        backdrop-filter: blur(10px);
                    }
                    .warning {
                        background: #fef3c7;
                        border-left: 4px solid #f59e0b;
                        padding: 20px 24px;
                        margin: 0;
                        font-size: 13px;
                        line-height: 1.6;
                    }
                    .warning-title {
                        font-weight: 700;
                        margin-bottom: 10px;
                        font-size: 15px;
                        color: #92400e;
                        display: flex;
                        align-items: center;
                        gap: 8px;
                    }
                    .warning-list {
                        list-style: none;
                        padding-left: 0;
                        color: #78350f;
                    }
                    .warning-list li {
                        padding-left: 20px;
                        position: relative;
                        margin-bottom: 6px;
                    }
                    .warning-list li:before {
                        content: "●";
                        position: absolute;
                        left: 6px;
                        color: #f59e0b;
                    }
                    .section {
                        margin: 0;
                        padding: 32px 40px;
                        border-bottom: 1px solid #e5e7eb;
                    }
                    .section:last-of-type {
                        border-bottom: none;
                    }
                    .section-header {
                        display: flex;
                        align-items: center;
                        gap: 12px;
                        margin-bottom: 24px;
                        padding-bottom: 12px;
                        border-bottom: 2px solid #e5e7eb;
                    }
                    .section-icon {
                        width: 32px;
                        height: 32px;
                        border-radius: 8px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-size: 18px;
                    }
                    .public-section .section-header {
                        border-bottom-color: #10b981;
                    }
                    .public-section .section-icon {
                        background: #d1fae5;
                        color: #059669;
                    }
                    .private-section .section-header {
                        border-bottom-color: #ef4444;
                    }
                    .private-section .section-icon {
                        background: #fee2e2;
                        color: #dc2626;
                    }
                    .section-title {
                        font-size: 18px;
                        font-weight: 700;
                        color: #111827;
                        letter-spacing: -0.3px;
                    }
                    .field {
                        margin-bottom: 24px;
                    }
                    .field:last-child {
                        margin-bottom: 0;
                    }
                    .field-label {
                        font-size: 12px;
                        font-weight: 600;
                        color: #6b7280;
                        text-transform: uppercase;
                        letter-spacing: 0.5px;
                        margin-bottom: 8px;
                    }
                    .field-value {
                        background: #f9fafb;
                        padding: 16px;
                        border-radius: 12px;
                        border: 1px solid #e5e7eb;
                        word-wrap: break-word;
                        font-size: 12px;
                        line-height: 1.7;
                        font-family: 'Monaco', 'Courier New', monospace;
                        color: #1f2937;
                    }
                    .qr-container {
                        display: flex;
                        justify-content: center;
                        margin-top: 20px;
                        padding: 20px;
                        background: #f9fafb;
                        border-radius: 12px;
                    }
                    .qr-code {
                        background: white;
                        padding: 16px;
                        border-radius: 12px;
                        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
                        display: inline-block;
                    }
                    .qr-code svg {
                        display: block;
                        width: 180px;
                        height: 180px;
                    }
                    .locked-message {
                        background: #fef2f2;
                        border: 2px dashed #fecaca;
                        border-radius: 12px;
                        padding: 24px;
                        text-align: center;
                        color: #991b1b;
                        font-size: 13px;
                        font-weight: 500;
                    }
                    .footer {
                        background: #f9fafb;
                        padding: 24px 40px;
                        text-align: center;
                        font-size: 12px;
                        color: #6b7280;
                        border-top: 1px solid #e5e7eb;
                    }
                    .footer-brand {
                        font-weight: 600;
                        color: #8b5cf6;
                        margin-bottom: 6px;
                    }
                    .footer-timestamp {
                        color: #9ca3af;
                    }
                    @media print {
                        body {
                            padding: 0;
                        }
                        .paper-wallet {
                            box-shadow: none;
                            page-break-inside: avoid;
                        }
                    }
                </style>
            </head>
            <body>
                ${backgroundPattern}
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
                        background: '#ffffff',
                        borderRadius: '24px',
                        overflow: 'hidden',
                        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
                        position: 'relative'
                    }}>
                        {/* Background Pattern */}
                        <svg width="100%" height="100%" style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            zIndex: 0,
                            opacity: 0.03
                        }}>
                            <defs>
                                <pattern id="logoPattern" x="0" y="0" width="120" height="120" patternUnits="userSpaceOnUse">
                                    {/* Quasar-style hexagonal pattern */}
                                    <path d="M60,10 L80,25 L80,55 L60,70 L40,55 L40,25 Z" 
                                          stroke="#8b5cf6" strokeWidth="1.5" fill="none" opacity="0.4"/>
                                    <circle cx="60" cy="40" r="8" stroke="#8b5cf6" strokeWidth="1" fill="none" opacity="0.6"/>
                                    <path d="M60,32 L60,20 M52,40 L42,40 M68,40 L78,40 M60,48 L60,60" 
                                          stroke="#8b5cf6" strokeWidth="1" opacity="0.5"/>
                                    {/* Stellaris star pattern */}
                                    <path d="M100,15 L102,20 L107,20 L103,23 L105,28 L100,25 L95,28 L97,23 L93,20 L98,20 Z" 
                                          stroke="#10b981" strokeWidth="1" fill="none" opacity="0.4"/>
                                    <circle cx="20" cy="100" r="6" stroke="#10b981" strokeWidth="1" fill="none" opacity="0.3"/>
                                </pattern>
                            </defs>
                            <rect width="100%" height="100%" fill="url(#logoPattern)"/>
                        </svg>

                        <div className="content" style={{ position: 'relative', zIndex: 1 }}>
                            {/* Header */}
                            <div className="header" style={{
                                background: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)',
                                color: 'white',
                                padding: '40px 40px 30px',
                                textAlign: 'center',
                                borderBottom: '4px solid #7c3aed'
                            }}>
                                <div className="title" style={{
                                    fontSize: '32px',
                                    fontWeight: '700',
                                    marginBottom: '8px',
                                    letterSpacing: '-0.5px'
                                }}>
                                    {t('paperWallet.header')}
                                </div>
                                <div className="wallet-name" style={{
                                    fontSize: '20px',
                                    fontWeight: '500',
                                    marginBottom: '8px',
                                    opacity: 0.95
                                }}>
                                    {wallet.name}
                                </div>
                                {wallet.curve && (
                                    <div className="curve-badge" style={{
                                        display: 'inline-block',
                                        background: 'rgba(255, 255, 255, 0.2)',
                                        padding: '6px 16px',
                                        borderRadius: '20px',
                                        fontSize: '13px',
                                        fontWeight: '600',
                                        letterSpacing: '0.5px'
                                    }}>
                                        {wallet.curve.toUpperCase()}
                                    </div>
                                )}
                            </div>

                            {/* Warning Box */}
                            <div className="warning" style={{
                                background: '#fef3c7',
                                borderLeft: '4px solid #f59e0b',
                                padding: '20px 24px',
                                margin: 0,
                                fontSize: '13px',
                                lineHeight: '1.6'
                            }}>
                                <div className="warning-title" style={{
                                    fontWeight: '700',
                                    marginBottom: '10px',
                                    fontSize: '15px',
                                    color: '#92400e',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px'
                                }}>
                                    <span>⚠️</span> {t('paperWallet.securityWarningTitle')}
                                </div>
                                <ul className="warning-list" style={{
                                    listStyle: 'none',
                                    paddingLeft: 0,
                                    color: '#78350f'
                                }}>
                                    <li>{t('paperWallet.securityWarning1')}</li>
                                    <li>{t('paperWallet.securityWarning2')}</li>
                                    <li>{t('paperWallet.securityWarning3')}</li>
                                </ul>
                            </div>

                            {/* Public Information Section */}
                            <div className="section public-section" style={{
                                margin: 0,
                                padding: '32px 40px',
                                borderBottom: '1px solid #e5e7eb'
                            }}>
                                <div className="section-header" style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '12px',
                                    marginBottom: '24px',
                                    paddingBottom: '12px',
                                    borderBottom: '2px solid #10b981'
                                }}>
                                    <div className="section-icon" style={{
                                        width: '32px',
                                        height: '32px',
                                        borderRadius: '8px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '18px',
                                        background: '#d1fae5',
                                        color: '#059669'
                                    }}>
                                        👁️
                                    </div>
                                    <div className="section-title" style={{
                                        fontSize: '18px',
                                        fontWeight: '700',
                                        color: '#111827',
                                        letterSpacing: '-0.3px'
                                    }}>
                                        {t('paperWallet.publicSection')}
                                    </div>
                                </div>
                                
                                <div className="field" style={{ marginBottom: '24px' }}>
                                    <div className="field-label" style={{
                                        fontSize: '12px',
                                        fontWeight: '600',
                                        color: '#6b7280',
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.5px',
                                        marginBottom: '8px'
                                    }}>
                                        {t('paperWallet.walletAddress')}
                                    </div>
                                    <div className="field-value" style={{
                                        background: '#f9fafb',
                                        padding: '16px',
                                        borderRadius: '12px',
                                        border: '1px solid #e5e7eb',
                                        wordWrap: 'break-word',
                                        fontSize: '12px',
                                        lineHeight: '1.7',
                                        fontFamily: '"Monaco", "Courier New", monospace',
                                        color: '#1f2937'
                                    }}>
                                        {wallet.address}
                                    </div>
                                </div>

                                {wallet.public_key && (
                                    <div className="field" style={{ marginBottom: '24px' }}>
                                        <div className="field-label" style={{
                                            fontSize: '12px',
                                            fontWeight: '600',
                                            color: '#6b7280',
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.5px',
                                            marginBottom: '8px'
                                        }}>
                                            {t('paperWallet.publicKey')}
                                        </div>
                                        <div className="field-value" style={{
                                            background: '#f9fafb',
                                            padding: '16px',
                                            borderRadius: '12px',
                                            border: '1px solid #e5e7eb',
                                            wordWrap: 'break-word',
                                            fontSize: '12px',
                                            lineHeight: '1.7',
                                            fontFamily: '"Monaco", "Courier New", monospace',
                                            color: '#1f2937'
                                        }}>
                                            {wallet.public_key}
                                        </div>
                                    </div>
                                )}

                                <div className="qr-container" style={{
                                    display: 'flex',
                                    justifyContent: 'center',
                                    marginTop: '20px',
                                    padding: '20px',
                                    background: '#f9fafb',
                                    borderRadius: '12px'
                                }}>
                                    <div className="qr-code" style={{
                                        background: 'white',
                                        padding: '16px',
                                        borderRadius: '12px',
                                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
                                        display: 'inline-block'
                                    }}>
                                        <div ref={qrCodeRef} style={{ lineHeight: 0 }}></div>
                                    </div>
                                </div>
                            </div>

                            {/* Private Information Section */}
                            <div className="section private-section" style={{
                                margin: 0,
                                padding: '32px 40px',
                                borderBottom: 'none'
                            }}>
                                <div className="section-header" style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '12px',
                                    marginBottom: '24px',
                                    paddingBottom: '12px',
                                    borderBottom: '2px solid #ef4444'
                                }}>
                                    <div className="section-icon" style={{
                                        width: '32px',
                                        height: '32px',
                                        borderRadius: '8px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '18px',
                                        background: '#fee2e2',
                                        color: '#dc2626'
                                    }}>
                                        🔐
                                    </div>
                                    <div className="section-title" style={{
                                        fontSize: '18px',
                                        fontWeight: '700',
                                        color: '#111827',
                                        letterSpacing: '-0.3px'
                                    }}>
                                        {t('paperWallet.privateSection')}
                                    </div>
                                </div>
                                
                                {!walletLocked && credentials?.privateKey ? (
                                    <>
                                        <div className="field" style={{ marginBottom: '24px' }}>
                                            <div className="field-label" style={{
                                                fontSize: '12px',
                                                fontWeight: '600',
                                                color: '#6b7280',
                                                textTransform: 'uppercase',
                                                letterSpacing: '0.5px',
                                                marginBottom: '8px'
                                            }}>
                                                {t('paperWallet.privateKey')}
                                            </div>
                                            <div className="field-value" style={{
                                                background: '#f9fafb',
                                                padding: '16px',
                                                borderRadius: '12px',
                                                border: '1px solid #e5e7eb',
                                                wordWrap: 'break-word',
                                                fontSize: '12px',
                                                lineHeight: '1.7',
                                                fontFamily: '"Monaco", "Courier New", monospace',
                                                color: '#1f2937'
                                            }}>
                                                {credentials.privateKey}
                                            </div>
                                        </div>

                                        {credentials.mnemonic && (
                                            <div className="field" style={{ marginBottom: 0 }}>
                                                <div className="field-label" style={{
                                                    fontSize: '12px',
                                                    fontWeight: '600',
                                                    color: '#6b7280',
                                                    textTransform: 'uppercase',
                                                    letterSpacing: '0.5px',
                                                    marginBottom: '8px'
                                                }}>
                                                    {t('paperWallet.mnemonicPhrase')}
                                                </div>
                                                <div className="field-value" style={{
                                                    background: '#f9fafb',
                                                    padding: '16px',
                                                    borderRadius: '12px',
                                                    border: '1px solid #e5e7eb',
                                                    wordWrap: 'break-word',
                                                    fontSize: '12px',
                                                    lineHeight: '1.7',
                                                    fontFamily: '"Monaco", "Courier New", monospace',
                                                    color: '#1f2937'
                                                }}>
                                                    {credentials.mnemonic}
                                                </div>
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <div className="locked-message" style={{
                                        background: '#fef2f2',
                                        border: '2px dashed #fecaca',
                                        borderRadius: '12px',
                                        padding: '24px',
                                        textAlign: 'center',
                                        color: '#991b1b',
                                        fontSize: '13px',
                                        fontWeight: '500'
                                    }}>
                                        🔒 {t('paperWallet.privateKeyNotAvailable')}
                                    </div>
                                )}
                            </div>

                            {/* Footer */}
                            <div className="footer" style={{
                                background: '#f9fafb',
                                padding: '24px 40px',
                                textAlign: 'center',
                                fontSize: '12px',
                                color: '#6b7280',
                                borderTop: '1px solid #e5e7eb'
                            }}>
                                <div className="footer-brand" style={{
                                    fontWeight: '600',
                                    color: '#8b5cf6',
                                    marginBottom: '6px'
                                }}>
                                    {t('paperWallet.generatedBy')} Quasar Wallet
                                </div>
                                <div className="footer-timestamp" style={{ color: '#9ca3af' }}>
                                    {new Date().toLocaleDateString()} {new Date().toLocaleTimeString()}
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
