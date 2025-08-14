import React, { useState, useEffect } from 'react';
import { CheckIcon, XMarkIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

interface WalletRequest {
    type: 'CONNECT' | 'TRANSACTION' | 'SIGN_MESSAGE';
    origin: string;
    hostname: string;
    title: string;
    message: string;
    request?: any;
}

interface WalletRequestModalProps {
    requestId: string | null;
    onApprove: (result: any) => void;
    onReject: (reason: string) => void;
}

const WalletRequestModal: React.FC<WalletRequestModalProps> = ({
    requestId,
    onApprove,
    onReject
}) => {
    const [request, setRequest] = useState<WalletRequest | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (requestId) {
            loadRequest(requestId);
        }
    }, [requestId]);

    const loadRequest = async (id: string) => {
        try {
            setLoading(true);
            const response = await chrome.runtime.sendMessage({
                type: 'GET_PENDING_REQUEST',
                requestId: id
            });

            if (response.success) {
                setRequest(response.request);
            } else {
                setError(response.error);
            }
        } catch (err) {
            setError('Failed to load request');
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async () => {
        if (!request) return;

        try {
            setLoading(true);
            
            let result;
            switch (request.type) {
                case 'CONNECT':
                    result = {
                        success: true,
                        accounts: [
                            {
                                address: '0xA1b2...C3d4',
                                publicKey: '0xA1b2...C3d4_PUBLIC',
                                curve: 'secp256k1'
                            }
                        ]
                    };
                    break;

                case 'TRANSACTION':
                    // Simulate transaction processing
                    await new Promise(resolve => setTimeout(resolve, 1000));
                    result = {
                        success: true,
                        txHash: '0x' + Math.random().toString(16).substr(2, 64)
                    };
                    break;

                case 'SIGN_MESSAGE':
                    result = {
                        success: true,
                        signature: '0x' + Math.random().toString(16).substr(2, 128)
                    };
                    break;

                default:
                    throw new Error('Unknown request type');
            }

            onApprove(result);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to process request');
        } finally {
            setLoading(false);
        }
    };

    const handleReject = () => {
        onReject('User rejected the request');
    };

    if (loading && !request) {
        return (
            <div className="wallet-request-modal loading">
                <div className="modal-content">
                    <div className="loading-spinner">
                        <div className="spinner"></div>
                        <p>Loading request...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="wallet-request-modal error">
                <div className="modal-content">
                    <div className="error-content">
                        <ExclamationTriangleIcon className="error-icon" />
                        <h3>Error</h3>
                        <p>{error}</p>
                        <button onClick={() => window.close()}>Close</button>
                    </div>
                </div>
            </div>
        );
    }

    if (!request) {
        return null;
    }

    return (
        <div className="wallet-request-modal">
            <div className="modal-content">
                <div className="modal-header">
                    <div className="site-info">
                        <div className="site-icon">🌐</div>
                        <div className="site-details">
                            <h3>{request.hostname}</h3>
                            <p className="origin">{request.origin}</p>
                        </div>
                    </div>
                </div>

                <div className="modal-body">
                    <h2>{request.title}</h2>
                    <p className="request-message">{request.message}</p>

                    {request.type === 'CONNECT' && (
                        <div className="connect-details">
                            <div className="permission-list">
                                <h4>This site will be able to:</h4>
                                <ul>
                                    <li>View your wallet address</li>
                                    <li>View your account balance</li>
                                    <li>Request transaction approval</li>
                                    <li>Request message signing</li>
                                </ul>
                            </div>
                        </div>
                    )}

                    {request.type === 'TRANSACTION' && request.request && (
                        <div className="transaction-details">
                            <div className="transaction-summary">
                                <div className="detail-row">
                                    <span className="label">To:</span>
                                    <span className="value">{request.request.to}</span>
                                </div>
                                <div className="detail-row">
                                    <span className="label">Amount:</span>
                                    <span className="value">{request.request.amount} {request.request.asset}</span>
                                </div>
                                {request.request.memo && (
                                    <div className="detail-row">
                                        <span className="label">Memo:</span>
                                        <span className="value">{request.request.memo}</span>
                                    </div>
                                )}
                                {request.request.chain && (
                                    <div className="detail-row">
                                        <span className="label">Chain:</span>
                                        <span className="value">{request.request.chain}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {request.type === 'SIGN_MESSAGE' && request.request && (
                        <div className="message-details">
                            <div className="message-content">
                                <h4>Message to sign:</h4>
                                <div className="message-text">
                                    {request.request.message}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="modal-footer">
                    <button
                        className="reject-btn"
                        onClick={handleReject}
                        disabled={loading}
                    >
                        <XMarkIcon />
                        Reject
                    </button>
                    <button
                        className="approve-btn"
                        onClick={handleApprove}
                        disabled={loading}
                    >
                        {loading ? (
                            <div className="btn-spinner"></div>
                        ) : (
                            <CheckIcon />
                        )}
                        {request.type === 'CONNECT' ? 'Connect' : 
                         request.type === 'TRANSACTION' ? 'Send' : 'Sign'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default WalletRequestModal;
