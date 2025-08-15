import React, { useState, useEffect } from 'react';
import { XIcon, CheckIcon } from '../../components/Icons';
import { walletOperations } from './WalletOperations';
import './RequestDialog.css';

export interface RequestData {
  type: 'CONNECT' | 'TRANSACTION' | 'SIGN_MESSAGE';
  origin: string;
  hostname: string;
  title: string;
  message: string;
  request?: any;
}

interface RequestDialogProps {
  requestId: string;
  selectedWallet?: any; // Will receive wallet from parent
  onApprove: (result: any) => void;
  onReject: (reason?: string) => void;
  onClose: () => void;
}

export const RequestDialog: React.FC<RequestDialogProps> = ({ 
  requestId, 
  selectedWallet,
  onApprove, 
  onReject, 
  onClose 
}) => {
  const [requestData, setRequestData] = useState<RequestData | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
          // Check if wallet is available
          if (!selectedWallet) {
            throw new Error('No wallet available. Please create a wallet first.');
          }

          // Use actual wallet data
          const accounts = walletOperations.getWalletAccounts(selectedWallet);
          
          result = {
            success: true,
            accounts: accounts
          };
          break;
          
        case 'TRANSACTION':
          if (!selectedWallet) {
            throw new Error('No wallet available for transaction.');
          }
          
          // Perform actual transaction signing
          const txHash = await walletOperations.signTransaction(selectedWallet, requestData.request);
          
          result = {
            success: true,
            txHash: txHash
          };
          break;
          
        case 'SIGN_MESSAGE':
          if (!selectedWallet) {
            throw new Error('No wallet available for signing.');
          }
          
          // Perform actual message signing
          const signature = await walletOperations.signMessage(selectedWallet, requestData.request.message);
          
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
  if (requestData.type === 'CONNECT' && !selectedWallet) {
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
            <div className="site-icon">🌐</div>
            <div className="site-info">
              <div className="site-name">{requestData.hostname}</div>
              <div className="site-origin">{requestData.origin}</div>
            </div>
          </div>

          <div className="request-message">
            <p>{requestData.message}</p>
          </div>

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
