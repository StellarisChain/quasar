import React, { useState, useEffect } from 'react';
import Popup from './Popup';
import WalletRequestModal from '../../components/WalletRequestModal';
import '../../components/WalletRequestModal.css';

const PopupWrapper = () => {
    const [requestId, setRequestId] = useState<string | null>(null);

    useEffect(() => {
        // Check if this popup was opened for a wallet request
        const urlParams = new URLSearchParams(window.location.search);
        const reqId = urlParams.get('request');
        if (reqId) {
            setRequestId(reqId);
        }
    }, []);

    const handleApprove = async (result: any) => {
        if (requestId) {
            try {
                await chrome.runtime.sendMessage({
                    type: 'RESOLVE_REQUEST',
                    requestId,
                    result
                });
                window.close();
            } catch (error) {
                console.error('Failed to approve request:', error);
            }
        }
    };

    const handleReject = async (reason: string) => {
        if (requestId) {
            try {
                await chrome.runtime.sendMessage({
                    type: 'REJECT_REQUEST',
                    requestId,
                    reason
                });
                window.close();
            } catch (error) {
                console.error('Failed to reject request:', error);
            }
        }
    };

    // If this is a wallet request popup, show the modal
    if (requestId) {
        return (
            <WalletRequestModal
                requestId={requestId}
                onApprove={handleApprove}
                onReject={handleReject}
            />
        );
    }

    // Otherwise, show the normal popup
    return <Popup />;
};

export default PopupWrapper;
