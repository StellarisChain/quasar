import React, { useState } from 'react';
import { XIcon, DownloadIcon } from './Icons';
import { Wallet } from '../pages/Popup/DataTypes';
import { exportWalletsBulk, ExportOptions, validateExportOptions } from '../lib/wallet_export_utils';

interface BulkExportModalProps {
    wallets: Wallet[];
    onClose: () => void;
}

export const BulkExportModal: React.FC<BulkExportModalProps> = ({ wallets, onClose }) => {
    const [selectedWallets, setSelectedWallets] = useState<Set<string | number>>(
        new Set(wallets.map(w => w.id))
    );
    const [exportOptions, setExportOptions] = useState<ExportOptions>({
        includePrivateKey: true,
        includeMnemonic: true
    });
    const [exporting, setExporting] = useState(false);
    const [error, setError] = useState('');

    const toggleWallet = (walletId: string | number) => {
        const newSelected = new Set(selectedWallets);
        if (newSelected.has(walletId)) {
            newSelected.delete(walletId);
        } else {
            newSelected.add(walletId);
        }
        setSelectedWallets(newSelected);
    };

    const toggleSelectAll = () => {
        if (selectedWallets.size === wallets.length) {
            setSelectedWallets(new Set());
        } else {
            setSelectedWallets(new Set(wallets.map(w => w.id)));
        }
    };

    const handleExport = async () => {
        if (selectedWallets.size === 0) {
            setError('Please select at least one wallet to export');
            return;
        }

        try {
            setExporting(true);
            setError('');

            const walletsToExport = wallets.filter(w => selectedWallets.has(w.id));
            const validation = validateExportOptions(exportOptions);

            if (validation.warnings.length > 0) {
                console.warn('Export warnings:', validation.warnings);
            }

            exportWalletsBulk(walletsToExport, exportOptions);
            onClose();
        } catch (error) {
            console.error('Bulk export failed:', error);
            setError('Failed to export wallets');
        } finally {
            setExporting(false);
        }
    };

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
                maxWidth: '500px',
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
                        <div style={{
                            width: '24px',
                            height: '24px',
                            background: '#10b981',
                            borderRadius: '6px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '12px'
                        }}>
                            <DownloadIcon />
                        </div>
                        <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: '#fff' }}>
                            Bulk Export Wallets
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
                    {/* Wallet Selection */}
                    <div style={{ marginBottom: '24px' }}>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            marginBottom: '12px'
                        }}>
                            <label style={{
                                fontSize: '14px',
                                fontWeight: '500',
                                color: '#9ca3af'
                            }}>
                                Select Wallets ({selectedWallets.size} of {wallets.length})
                            </label>
                            <button
                                onClick={toggleSelectAll}
                                style={{
                                    background: 'none',
                                    border: '1px solid #3a3a3a',
                                    borderRadius: '6px',
                                    padding: '4px 8px',
                                    color: '#8b5cf6',
                                    fontSize: '12px',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.borderColor = '#8b5cf6';
                                    e.currentTarget.style.background = 'rgba(139, 92, 246, 0.1)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.borderColor = '#3a3a3a';
                                    e.currentTarget.style.background = 'none';
                                }}
                            >
                                {selectedWallets.size === wallets.length ? 'Deselect All' : 'Select All'}
                            </button>
                        </div>

                        <div style={{
                            background: '#1a1a1a',
                            border: '1px solid #3a3a3a',
                            borderRadius: '8px',
                            maxHeight: '200px',
                            overflow: 'auto'
                        }}>
                            {wallets.map(wallet => (
                                <label
                                    key={wallet.id}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '12px',
                                        padding: '12px 16px',
                                        cursor: 'pointer',
                                        borderBottom: '1px solid #2a2a2a',
                                        transition: 'background 0.2s'
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.background = '#2a2a2a'}
                                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                >
                                    <input
                                        type="checkbox"
                                        checked={selectedWallets.has(wallet.id)}
                                        onChange={() => toggleWallet(wallet.id)}
                                        style={{ cursor: 'pointer' }}
                                    />
                                    <div style={{ flex: 1 }}>
                                        <div style={{
                                            fontSize: '14px',
                                            fontWeight: '500',
                                            color: '#fff',
                                            marginBottom: '2px'
                                        }}>
                                            {wallet.name || 'Unnamed Wallet'}
                                        </div>
                                        <div style={{
                                            fontSize: '12px',
                                            color: '#9ca3af',
                                            fontFamily: 'monospace'
                                        }}>
                                            {wallet.address.slice(0, 10)}...{wallet.address.slice(-8)}
                                        </div>
                                    </div>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Export Options */}
                    <div style={{ marginBottom: '24px' }}>
                        <label style={{
                            display: 'block',
                            fontSize: '14px',
                            fontWeight: '500',
                            color: '#9ca3af',
                            marginBottom: '12px'
                        }}>
                            Export Options
                        </label>

                        <div style={{ marginBottom: '12px' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                <input
                                    type="checkbox"
                                    checked={exportOptions.includePrivateKey}
                                    onChange={(e) => setExportOptions({
                                        ...exportOptions,
                                        includePrivateKey: e.target.checked
                                    })}
                                    style={{ cursor: 'pointer' }}
                                />
                                <span style={{ fontSize: '14px', color: '#e5e7eb' }}>Include Private Keys</span>
                            </label>
                            <p style={{ fontSize: '11px', color: '#9ca3af', margin: '4px 0 0 24px' }}>
                                Required to import and use the wallets
                            </p>
                        </div>

                        <div style={{ marginBottom: '16px' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                <input
                                    type="checkbox"
                                    checked={exportOptions.includeMnemonic}
                                    onChange={(e) => setExportOptions({
                                        ...exportOptions,
                                        includeMnemonic: e.target.checked
                                    })}
                                    style={{ cursor: 'pointer' }}
                                />
                                <span style={{ fontSize: '14px', color: '#e5e7eb' }}>Include Seed Phrases</span>
                            </label>
                            <p style={{ fontSize: '11px', color: '#9ca3af', margin: '4px 0 0 24px' }}>
                                Include mnemonic phrases when available
                            </p>
                        </div>

                        {!exportOptions.includePrivateKey && (
                            <div style={{
                                background: '#7f1d1d',
                                border: '1px solid #dc2626',
                                borderRadius: '6px',
                                padding: '8px 12px',
                                marginBottom: '12px'
                            }}>
                                <p style={{ fontSize: '12px', color: '#fca5a5', margin: 0 }}>
                                    ⚠️ Warning: Without private keys, this export will only contain public information and cannot be used to restore wallet functionality.
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Error Display */}
                    {error && (
                        <div style={{
                            background: '#7f1d1d',
                            border: '1px solid #dc2626',
                            borderRadius: '8px',
                            padding: '8px 12px',
                            color: '#fca5a5',
                            fontSize: '12px',
                            marginBottom: '16px'
                        }}>
                            {error}
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div style={{ display: 'flex', gap: '12px' }}>
                        <button
                            onClick={onClose}
                            style={{
                                background: 'none',
                                border: '1px solid #3a3a3a',
                                borderRadius: '8px',
                                padding: '12px 16px',
                                color: '#9ca3af',
                                fontSize: '14px',
                                fontWeight: '500',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                flex: 1
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.borderColor = '#6b7280';
                                e.currentTarget.style.color = '#e5e7eb';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.borderColor = '#3a3a3a';
                                e.currentTarget.style.color = '#9ca3af';
                            }}
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleExport}
                            disabled={exporting || selectedWallets.size === 0}
                            style={{
                                background: (exporting || selectedWallets.size === 0) ? '#4b5563' : '#10b981',
                                border: 'none',
                                borderRadius: '8px',
                                padding: '12px 16px',
                                color: 'white',
                                fontSize: '14px',
                                fontWeight: '500',
                                cursor: (exporting || selectedWallets.size === 0) ? 'not-allowed' : 'pointer',
                                transition: 'background 0.2s',
                                flex: 2
                            }}
                        >
                            {exporting ? 'Exporting...' : `Export ${selectedWallets.size} Wallet${selectedWallets.size !== 1 ? 's' : ''}`}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
