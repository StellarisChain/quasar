import { browserAPI, getBrowserType } from '../../lib/browser-compat';

console.log('Quasar Background Script - Starting...');
console.log(`Browser detected: ${getBrowserType()}`);

// Store connected sites and pending requests
const connectedSites = new Set();
const connectedSitesData = new Map(); // Cache wallet data for connected sites
const pendingRequests = new Map();

// Example of using the cross-browser API
async function initializeExtension() {
    try {
        // Get existing connected sites from storage
        const existingData = await browserAPI.storage.local.get(['connectedSites']);
        if (existingData.connectedSites && Array.isArray(existingData.connectedSites)) {
            existingData.connectedSites.forEach(site => connectedSites.add(site));
            console.log('Restored connected sites:', existingData.connectedSites);
        }

        // Set up initial storage
        await browserAPI.storage.local.set({
            extensionInitialized: true,
            initTime: Date.now(),
            browser: getBrowserType(),
            connectedSites: Array.from(connectedSites)
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
// Note: Wallet data is retrieved from the popup when user accepts connection,
// not from localStorage in the background script
async function getWalletData(origin = null, hostname = null) {
    try {
        // If origin is provided, check if site is authorized
        if (origin && hostname && !connectedSites.has(origin)) {
            console.log(`Requesting authorization for: ${hostname}`);

            // Show connection popup to user for authorization
            // The popup will return the wallet data when accepted
            const connectionResult = await handleConnectWallet(origin, hostname);
            if (!connectionResult.success) {
                throw new Error('Site not authorized to access wallet data');
            }

            // Return the wallet data from the popup
            return connectionResult.walletData;
        }

        // If site is already connected, return cached wallet data
        if (origin && hostname && connectedSites.has(origin)) {
            console.log(`Getting cached wallet data for already connected site: ${hostname}`);

            const cachedData = connectedSitesData.get(origin);
            if (cachedData) {
                return cachedData;
            }

            // If no cached data, fall back to getting fresh data via popup
            console.log(`No cached data found, getting fresh data for: ${hostname}`);
            const connectionResult = await handleConnectWallet(origin, hostname);
            if (!connectionResult.success) {
                throw new Error('Failed to get wallet data for connected site');
            }

            return connectionResult.walletData;
        }

        // Should not reach here
        throw new Error('No origin/hostname provided or invalid state');
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
        // For already connected sites, we need to get wallet data from popup
        // since we don't store it in background script
        const { popupId, requestId } = await openWalletPopup({
            type: 'GET_WALLET_DATA',
            origin,
            hostname,
            title: 'Get Wallet Data',
            message: `Getting wallet data for ${hostname}`
        });

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

            pendingRequests.set(requestId, {
                ...pendingRequests.get(requestId),
                resolve: (result) => {
                    cleanup();
                    resolve(result);
                    // Cache the wallet data for future requests
                    if (result.walletData) {
                        connectedSitesData.set(origin, result.walletData);
                    }
                },
                reject: (error) => {
                    cleanup();
                    reject(error);
                }
            });

            setTimeout(() => {
                if (pendingRequests.has(requestId)) {
                    cleanup();
                    reject(new Error('Request timeout'));
                }
            }, 30000);
        });
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
                        // Cache the wallet data for future requests
                        if (result.walletData) {
                            connectedSitesData.set(origin, result.walletData);
                        }
                        browserAPI.storage.local.set({
                            connectedSites: Array.from(connectedSites)
                        });
                        // Expect wallet data to be included in the result
                        resolve({
                            success: true,
                            accounts: result.walletData?.accounts || [],
                            walletData: result.walletData
                        });
                    } else {
                        resolve(result);
                    }
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
                const manifest = browserAPI.runtime.getManifest() || {};
                const version = manifest.version || '0.0.0-dev';
                const browserType = getBrowserType();
                sendResponse({
                    browser: browserType,
                    version: version,
                    manifestVersion: manifest.manifest_version || 'unknown',
                    extensionId: browserAPI.runtime.id,
                    name: manifest.name || 'Quasar Wallet',
                    platform: navigator?.platform || 'unknown',
                    userAgent: navigator?.userAgent || 'unknown'
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
                const isConnected = connectedSites.has(message.origin);
                sendResponse({
                    success: true,
                    connected: isConnected,
                    accounts: [] // Don't return accounts for just checking connection
                });
                break;

            case 'CONNECT_WALLET':
                handleConnectWallet(message.origin, message.hostname).then(result => {
                    sendResponse(result);
                }).catch(error => {
                    sendResponse({ success: false, error: error.message });
                });
                return true;

            case 'GET_ACCOUNTS':
                if (!connectedSites.has(message.origin)) {
                    sendResponse({ success: false, error: 'Site not connected' });
                    break;
                }
                // Extract hostname from origin if not provided
                const accountsHostname = message.hostname || new URL(message.origin).hostname;
                getWalletData(message.origin, accountsHostname).then(walletData => {
                    sendResponse({ success: true, accounts: walletData.accounts });
                }).catch(error => {
                    sendResponse({ success: false, error: error.message });
                });
                return true;

            case 'DISCONNECT_WALLET':
                connectedSites.delete(message.origin);
                connectedSitesData.delete(message.origin); // Clear cached data
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
                // Extract hostname from origin if not provided
                const hostname = message.hostname || new URL(message.origin).hostname;
                getWalletData(message.origin, hostname).then(walletData => {
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
                // Extract hostname from origin if not provided
                const signHostname = message.hostname || new URL(message.origin).hostname;
                getWalletData(message.origin, signHostname).then(walletData => {
                    // Handle message signing (implement as needed)
                    sendResponse({ success: true, signature: '0x...' });
                }).catch(error => {
                    sendResponse({ success: false, error: error.message });
                });
                return true;

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
