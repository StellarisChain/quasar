import { browserAPI, getBrowserType } from '../../lib/browser-compat';

console.log('Quasar Background Script - Starting...');
console.log(`Browser detected: ${getBrowserType()}`);

// Store connected sites and pending requests
const connectedSites = new Set();
const pendingRequests = new Map();

// Example of using the cross-browser API
async function initializeExtension() {
    try {
        // Set up initial storage
        await browserAPI.storage.local.set({
            extensionInitialized: true,
            initTime: Date.now(),
            browser: getBrowserType(),
            connectedSites: []
        });

        console.log('Extension initialized successfully');
    } catch (error) {
        console.error('Failed to initialize extension:', error);
    }
}

// Open popup for user interaction
async function openWalletPopup(requestData) {
    try {
        // Store the request data
        const requestId = Math.random().toString(36).substr(2, 9);
        pendingRequests.set(requestId, requestData);

        // Open popup with request data
        const popup = await browserAPI.windows.create({
            url: `popup.html?request=${requestId}`,
            type: 'popup',
            width: 400,
            height: 600,
            focused: true
        });

        return { popupId: popup.id, requestId };
    } catch (error) {
        console.error('Failed to open wallet popup:', error);
        throw error;
    }
}

// Get wallet data from storage or popup
async function getWalletData() {
    try {
        const data = await browserAPI.storage.local.get(['wallets', 'selectedWallet']);

        // For testing purposes, return mock data if no wallets found
        if (!data.wallets || data.wallets.length === 0) {
            return {
                accounts: [
                    {
                        address: '0xA1b2...C3d4',
                        publicKey: '0xA1b2...C3d4_PUBLIC',
                        curve: 'secp256k1'
                    }
                ],
                assets: [
                    {
                        symbol: 'STE',
                        name: 'Stellaris',
                        balance: '158.67',
                        chain: 'Stellaris',
                        curve: 'secp256k1'
                    },
                    {
                        symbol: 'HAL',
                        name: 'Halogen',
                        balance: '2759.65',
                        chain: 'Halogen',
                        curve: 'secp256k1'
                    }
                ]
            };
        }

        // Convert stored wallet data to API format
        const selectedWallet = data.wallets.find(w => w.id === data.selectedWallet) || data.wallets[0];

        return {
            accounts: [{
                address: selectedWallet.address,
                publicKey: selectedWallet.public_key,
                curve: selectedWallet.curve || 'secp256k1'
            }],
            assets: selectedWallet.chains?.flatMap(chain =>
                [
                    {
                        symbol: chain.symbol,
                        name: chain.name,
                        balance: chain.balance,
                        chain: chain.name,
                        curve: selectedWallet.curve || 'secp256k1'
                    },
                    ...(chain.tokens || []).map(token => ({
                        symbol: token.symbol,
                        name: token.name,
                        balance: token.balance,
                        chain: chain.name,
                        curve: selectedWallet.curve || 'secp256k1'
                    }))
                ]
            ) || []
        };
    } catch (error) {
        console.error('Failed to get wallet data:', error);
        throw error;
    }
}

// Handle wallet connection request
async function handleConnectWallet(origin, hostname) {
    console.log(`Connection request from: ${hostname}`);

    // Check if already connected
    if (connectedSites.has(origin)) {
        const walletData = await getWalletData();
        return { success: true, accounts: walletData.accounts };
    }

    // Show connection popup to user
    try {
        const { popupId, requestId } = await openWalletPopup({
            type: 'CONNECT',
            origin,
            hostname,
            title: 'Connect Wallet',
            message: `${hostname} wants to connect to your wallet`
        });

        // Wait for user response
        return new Promise((resolve, reject) => {
            const cleanup = () => {
                pendingRequests.delete(requestId);
                browserAPI.windows.onRemoved.removeListener(windowClosedHandler);
            };

            const windowClosedHandler = (windowId) => {
                if (windowId === popupId) {
                    cleanup();
                    reject(new Error('User closed popup'));
                }
            };

            browserAPI.windows.onRemoved.addListener(windowClosedHandler);

            // Store resolve/reject for popup to call
            pendingRequests.set(requestId, {
                ...pendingRequests.get(requestId),
                resolve: (result) => {
                    cleanup();
                    if (result.success) {
                        connectedSites.add(origin);
                        browserAPI.storage.local.set({
                            connectedSites: Array.from(connectedSites)
                        });
                    }
                    resolve(result);
                },
                reject: (error) => {
                    cleanup();
                    reject(error);
                }
            });

            // Timeout after 2 minutes
            setTimeout(() => {
                if (pendingRequests.has(requestId)) {
                    cleanup();
                    reject(new Error('Request timeout'));
                }
            }, 120000);
        });
    } catch (error) {
        console.error('Failed to handle connect request:', error);
        throw error;
    }
}

// Handle transaction request
async function handleSendTransaction(request, origin, hostname) {
    console.log(`Transaction request from: ${hostname}`, request);

    if (!connectedSites.has(origin)) {
        throw new Error('Site not connected to wallet');
    }

    try {
        const { popupId, requestId } = await openWalletPopup({
            type: 'TRANSACTION',
            origin,
            hostname,
            request,
            title: 'Transaction Request',
            message: `${hostname} wants to send ${request.amount} ${request.asset} to ${request.to}`
        });

        // Wait for user response
        return new Promise((resolve, reject) => {
            const cleanup = () => {
                pendingRequests.delete(requestId);
                browserAPI.windows.onRemoved.removeListener(windowClosedHandler);
            };

            const windowClosedHandler = (windowId) => {
                if (windowId === popupId) {
                    cleanup();
                    reject(new Error('User closed popup'));
                }
            };

            browserAPI.windows.onRemoved.addListener(windowClosedHandler);

            // Store resolve/reject for popup to call
            pendingRequests.set(requestId, {
                ...pendingRequests.get(requestId),
                resolve: (result) => {
                    cleanup();
                    resolve(result);
                },
                reject: (error) => {
                    cleanup();
                    reject(error);
                }
            });

            // Timeout after 5 minutes
            setTimeout(() => {
                if (pendingRequests.has(requestId)) {
                    cleanup();
                    reject(new Error('Request timeout'));
                }
            }, 300000);
        });
    } catch (error) {
        console.error('Failed to handle transaction request:', error);
        throw error;
    }
}

// Listen for extension installation
if (browserAPI.runtime.onInstalled) {
    browserAPI.runtime.onInstalled.addListener((details) => {
        console.log('Extension installed/updated:', details);
        initializeExtension();
    });
} else {
    // Fallback for browsers that don't support onInstalled
    initializeExtension();
}

// Listen for messages from content scripts and popup
if (browserAPI.runtime.onMessage) {
    browserAPI.runtime.onMessage.addListener((message, sender, sendResponse) => {
        console.log('Background received message:', message);

        // Handle different message types
        switch (message.type) {
            case 'GET_BROWSER_INFO':
                // Get version from manifest or use fallback
                const manifest = chrome?.runtime?.getManifest?.() || {};
                const version = manifest.version || '0.0.0-dev';
                sendResponse({
                    browser: getBrowserType(),
                    version: version,
                    manifestVersion: manifest.manifest_version || 'unknown'
                });
                break;

            case 'GET_EXTENSION_DATA':
                browserAPI.storage.local.get(null).then(data => {
                    sendResponse({ success: true, data });
                }).catch(error => {
                    sendResponse({ success: false, error: error.message });
                });
                return true; // Will respond asynchronously

            case 'CHECK_CONNECTION':
                getWalletData().then(walletData => {
                    const isConnected = connectedSites.has(message.origin);
                    sendResponse({
                        success: true,
                        connected: isConnected,
                        accounts: isConnected ? walletData.accounts : []
                    });
                }).catch(error => {
                    sendResponse({ success: false, error: error.message });
                });
                return true;

            case 'CONNECT_WALLET':
                handleConnectWallet(message.origin, message.hostname).then(result => {
                    sendResponse(result);
                }).catch(error => {
                    sendResponse({ success: false, error: error.message });
                });
                return true;

            case 'DISCONNECT_WALLET':
                connectedSites.delete(message.origin);
                browserAPI.storage.local.set({
                    connectedSites: Array.from(connectedSites)
                });
                sendResponse({ success: true });
                break;

            case 'GET_ASSETS':
                if (!connectedSites.has(message.origin)) {
                    sendResponse({ success: false, error: 'Site not connected' });
                    break;
                }
                getWalletData().then(walletData => {
                    sendResponse({ success: true, assets: walletData.assets });
                }).catch(error => {
                    sendResponse({ success: false, error: error.message });
                });
                return true;

            case 'SEND_TRANSACTION':
                handleSendTransaction(message.payload, message.origin, message.hostname).then(result => {
                    sendResponse(result);
                }).catch(error => {
                    sendResponse({ success: false, error: error.message });
                });
                return true;

            case 'SIGN_MESSAGE':
                if (!connectedSites.has(message.origin)) {
                    sendResponse({ success: false, error: 'Site not connected' });
                    break;
                }
                // Handle message signing (implement as needed)
                sendResponse({ success: true, signature: '0x...' });
                break;

            case 'GET_PENDING_REQUEST':
                const requestData = pendingRequests.get(message.requestId);
                if (requestData) {
                    sendResponse({ success: true, request: requestData });
                } else {
                    sendResponse({ success: false, error: 'Request not found' });
                }
                break;

            case 'RESOLVE_REQUEST':
                const request = pendingRequests.get(message.requestId);
                if (request && request.resolve) {
                    request.resolve(message.result);
                    sendResponse({ success: true });
                } else {
                    sendResponse({ success: false, error: 'Request not found' });
                }
                break;

            case 'REJECT_REQUEST':
                const rejectRequest = pendingRequests.get(message.requestId);
                if (rejectRequest && rejectRequest.reject) {
                    rejectRequest.reject(new Error(message.reason || 'User rejected'));
                    sendResponse({ success: true });
                } else {
                    sendResponse({ success: false, error: 'Request not found' });
                }
                break;

            default:
                sendResponse({ error: 'Unknown message type' });
        }
    });
}

console.log('Quasar Background Script - Ready!');
