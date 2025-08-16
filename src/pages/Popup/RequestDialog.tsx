import React, { useState, useEffect } from 'react';
import { XIcon, CheckIcon } from '../../components/Icons';
import { walletOperations } from './WalletOperations';
import './RequestDialog.css';

export interface RequestData {
    type: 'CONNECT' | 'TRANSACTION' | 'SIGN_MESSAGE' | 'GET_WALLET_DATA';
    origin: string;
    hostname: string;
    title: string;
    message: string;
    request?: any;
}

interface RequestDialogProps {
    requestId: string;
    selectedWallet?: any; // Will receive wallet from parent
    wallets: any[]; // All available wallets
    onApprove: (result: any) => void;
    onReject: (reason?: string) => void;
    onClose: () => void;
}

export const RequestDialog: React.FC<RequestDialogProps> = ({
    requestId,
    selectedWallet,
    wallets,
    onApprove,
    onReject,
    onClose
}) => {
    const [requestData, setRequestData] = useState<RequestData | null>(null);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedWalletForRequest, setSelectedWalletForRequest] = useState(selectedWallet);

    // Initialize selected wallet for request based on the type and available wallets
    useEffect(() => {
        if (requestData) {
            if (requestData.type === 'CONNECT' || requestData.type === 'GET_WALLET_DATA') {
                // For CONNECT and GET_WALLET_DATA, we can use the default selected wallet or first available
                setSelectedWalletForRequest(selectedWallet || (wallets.length > 0 ? wallets[0] : null));
            } else {
                // For TRANSACTION/SIGN_MESSAGE, use selected wallet or first available
                setSelectedWalletForRequest(selectedWallet || (wallets.length > 0 ? wallets[0] : null));
            }
        }
    }, [requestData, selectedWallet, wallets]);

    useEffect(() => {
        if (!requestId) return;

        // Fetch request data from background script
        chrome.runtime.sendMessage({
            type: 'GET_PENDING_REQUEST',
            requestId: requestId
        }, (response) => {
            setLoading(false);
            if (response.success) {
                setRequestData(response.request);
            } else {
                setError(response.error || 'Failed to load request data');
            }
        });
    }, [requestId]);

    const handleApprove = async () => {
        if (!requestData || processing) return;

        setProcessing(true);
        setError(null);

        try {
            let result;
            switch (requestData.type) {
                case 'CONNECT':
                case 'GET_WALLET_DATA':
                    // For CONNECT and GET_WALLET_DATA requests, return wallet data
                    if (!wallets || wallets.length === 0) {
                        throw new Error('No wallets available. Please create a wallet first.');
                    }

                    // Use selected wallet or first available
                    const walletToReturn = selectedWalletForRequest || wallets[0];

                    // Get accounts data
                    const accounts = walletOperations.getWalletAccounts([walletToReturn]);

                    // Get assets data
                    const assets = walletToReturn.chains?.flatMap((chain: any) =>
                        [
                            {
                                symbol: chain.symbol,
                                name: chain.name,
                                balance: chain.balance,
                                chain: chain.name,
                                curve: walletToReturn.curve || 'secp256k1'
                            },
                            ...(chain.tokens || []).map((token: any) => ({
                                symbol: token.symbol,
                                name: token.name,
                                balance: token.balance,
                                chain: chain.name,
                                curve: walletToReturn.curve || 'secp256k1'
                            }))
                        ]
                    ) || [];

                    result = {
                        success: true,
                        accounts: accounts,
                        walletData: {
                            accounts: accounts,
                            assets: assets
                        }
                    };
                    break;

                case 'TRANSACTION':
                    if (!selectedWalletForRequest) {
                        throw new Error('No wallet selected for transaction.');
                    }

                    // Perform actual transaction signing
                    const txHash = await walletOperations.signTransaction(selectedWalletForRequest, requestData.request);

                    result = {
                        success: true,
                        txHash: txHash
                    };
                    break;

                case 'SIGN_MESSAGE':
                    if (!selectedWalletForRequest) {
                        throw new Error('No wallet selected for signing.');
                    }

                    // Perform actual message signing
                    const signature = await walletOperations.signMessage(selectedWalletForRequest, requestData.request.message);

                    result = {
                        success: true,
                        signature: signature
                    };
                    break;

                default:
                    throw new Error('Unknown request type');
            }

            // Send approval to background script
            chrome.runtime.sendMessage({
                type: 'RESOLVE_REQUEST',
                requestId: requestId,
                result: result
            }, () => {
                onApprove(result);
            });

        } catch (error) {
            console.error('Error processing request:', error);
            setError(error instanceof Error ? error.message : 'Unknown error occurred');
            setProcessing(false);
        }
    };

    const handleReject = () => {
        // Send rejection to background script
        chrome.runtime.sendMessage({
            type: 'REJECT_REQUEST',
            requestId: requestId,
            reason: 'User rejected the request'
        }, () => {
            onReject('User rejected the request');
        });
    };

    if (loading) {
        return (
            <div className="request-dialog-overlay">
                <div className="request-dialog">
                    <div className="request-loading">
                        <div className="spinner"></div>
                        <p>Loading request...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="request-dialog-overlay">
                <div className="request-dialog">
                    <div className="request-error">
                        <p>Error: {error}</p>
                        <button onClick={onClose} className="btn btn-secondary">
                            Close
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (!requestData) {
        return null;
    }

    // Special handling for CONNECT requests when no wallet is available
    if ((requestData.type === 'CONNECT' || requestData.type === 'GET_WALLET_DATA') && !selectedWallet) {
        return (
            <div className="request-dialog-overlay">
                <div className="request-dialog">
                    <div className="request-header">
                        <h3>No Wallet Available</h3>
                        <button onClick={onClose} className="close-btn">
                            <XIcon />
                        </button>
                    </div>

                    <div className="request-content">
                        <div className="request-site">
                            <div className="site-icon">🌐</div>
                            <div className="site-info">
                                <div className="site-name">{requestData.hostname}</div>
                                <div className="site-origin">{requestData.origin}</div>
                            </div>
                        </div>

                        <div className="request-message">
                            <p>You need to create a wallet before you can connect to this site.</p>
                        </div>
                    </div>

                    <div className="request-actions">
                        <button onClick={handleReject} className="btn btn-secondary">
                            <XIcon />
                            Cancel
                        </button>
                        <button onClick={() => {
                            // Close request dialog and don't close popup - let user create wallet
                            onClose();
                        }} className="btn btn-primary">
                            Create Wallet
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="request-dialog-overlay">
            <div className="request-dialog">
                <div className="request-header">
                    <h3>{requestData.title}</h3>
                    <button onClick={onClose} className="close-btn">
                        <XIcon />
                    </button>
                </div>

                <div className="request-content">
                    <div className="request-site">
                        <div className="site-icon">
                            <img
                                src={`https://www.google.com/s2/favicons?domain=${requestData.hostname}&sz=32`}
                                alt="Site favicon"
                                onError={(e) => {
                                    // Fallback to emoji if favicon fails to load
                                    const target = e.target as HTMLImageElement;
                                    const parent = target.parentElement!;
                                    parent.removeChild(target);
                                    parent.classList.add('fallback');
                                    parent.textContent = '🌐';
                                }}
                            />
                        </div>
                        <div className="site-info">
                            <div className="site-name">{requestData.hostname}</div>
                            <div className="site-origin">{requestData.origin}</div>
                        </div>
                    </div>

                    <div className="request-message">
                        <p>{requestData.message}</p>
                    </div>

                    {/* Wallet Selection for TRANSACTION and SIGN_MESSAGE */}
                    {(requestData.type === 'TRANSACTION' || requestData.type === 'SIGN_MESSAGE') && wallets.length > 1 && (
                        <div className="wallet-selection">
                            <div className="detail-row">
                                <span className="label">Wallet:</span>
                                <select
                                    value={selectedWalletForRequest?.id || ''}
                                    onChange={(e) => {
                                        const wallet = wallets.find(w => w.id === e.target.value);
                                        setSelectedWalletForRequest(wallet);
                                    }}
                                    className="wallet-selector"
                                >
                                    {!selectedWalletForRequest && <option value="">Select a wallet...</option>}
                                    {wallets.map(wallet => (
                                        <option key={wallet.id} value={wallet.id}>
                                            {wallet.name || `Wallet ${wallet.id}`} ({wallet.address?.substring(0, 8)}...)
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    )}

                    {/* CONNECT request shows all available wallets */}
                    {requestData.type === 'CONNECT' && wallets.length > 0 && (
                        <div className="connect-wallets">
                            <h4>Select Wallet to Connect:</h4>
                            <div className="wallet-list">
                                {wallets.map(wallet => (
                                    <div
                                        key={wallet.id}
                                        className={`wallet-item ${selectedWalletForRequest?.id === wallet.id ? 'selected' : ''}`}
                                        onClick={() => setSelectedWalletForRequest(wallet)}
                                    >
                                        <div className="wallet-checkbox">
                                            <input
                                                type="radio"
                                                name="connect-wallet"
                                                checked={selectedWalletForRequest?.id === wallet.id}
                                                onChange={() => setSelectedWalletForRequest(wallet)}
                                            />
                                        </div>
                                        <div className="wallet-info">
                                            <div className="wallet-name">{wallet.name || `Wallet ${wallet.id}`}</div>
                                            <div className="wallet-address">{wallet.address}</div>
                                            <div className="wallet-curve">{wallet.curve || 'secp256k1'}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* GET_WALLET_DATA request shows current wallet info */}
                    {requestData.type === 'GET_WALLET_DATA' && selectedWalletForRequest && (
                        <div className="wallet-data-info">
                            <h4>Wallet Information:</h4>
                            <div className="wallet-info">
                                <div className="wallet-name">{selectedWalletForRequest.name || `Wallet ${selectedWalletForRequest.id}`}</div>
                                <div className="wallet-address">{selectedWalletForRequest.address}</div>
                                <div className="wallet-curve">{selectedWalletForRequest.curve || 'secp256k1'}</div>
                            </div>
                        </div>
                    )}

                    {requestData.type === 'TRANSACTION' && requestData.request && (
                        <div className="transaction-details">
                            <div className="detail-row">
                                <span className="label">To:</span>
                                <span className="value">{requestData.request.to}</span>
                            </div>
                            <div className="detail-row">
                                <span className="label">Amount:</span>
                                <span className="value">{requestData.request.amount} {requestData.request.asset}</span>
                            </div>
                            {requestData.request.memo && (
                                <div className="detail-row">
                                    <span className="label">Memo:</span>
                                    <span className="value">{requestData.request.memo}</span>
                                </div>
                            )}
                        </div>
                    )}

                    {requestData.type === 'SIGN_MESSAGE' && requestData.request && (
                        <div className="message-details">
                            <div className="detail-row">
                                <span className="label">Message:</span>
                                <span className="value message-text">{requestData.request.message}</span>
                            </div>
                        </div>
                    )}
                </div>

                <div className="request-actions">
                    {error && (
                        <div className="error-message">
                            {error}
                        </div>
                    )}
                    <div className="request-buttons">
                        <button onClick={handleReject} className="btn btn-secondary" disabled={processing}>
                            <XIcon />
                            Reject
                        </button>
                        <button onClick={handleApprove} className="btn btn-primary" disabled={processing}>
                            {processing ? (
                                <>
                                    <div className="spinner-small"></div>
                                    Processing...
                                </>
                            ) : (
                                <>
                                    <CheckIcon />
                                    Approve
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
