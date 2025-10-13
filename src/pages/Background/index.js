import { browserAPI, getBrowserType } from '../../lib/browser-compat';

console.log('Quasar Background Script - Starting...');
console.log(`Browser detected: ${getBrowserType()}`);

// Store connected sites and pending requests
const connectedSites = new Set(); // Legacy: store origins for backward compatibility
const connectedSitesData = new Map(); // Cache wallet data for connected sites
const pendingRequests = new Map();

// NEW: Store site connections per wallet with permissions
// Format: Map<walletAddress, Map<origin, SiteConnection>>
const walletSiteConnections = new Map();

// Example of using the cross-browser API
async function initializeExtension() {
    try {
        // Get existing connected sites from storage
        const existingData = await browserAPI.storage.local.get(['connectedSites', 'walletSiteConnections']);
        
        // Legacy connected sites
        if (existingData.connectedSites && Array.isArray(existingData.connectedSites)) {
            existingData.connectedSites.forEach(site => connectedSites.add(site));
            console.log('Restored connected sites:', existingData.connectedSites);
        }

        // NEW: Restore wallet site connections
        if (existingData.walletSiteConnections) {
            try {
                const parsed = JSON.parse(existingData.walletSiteConnections);
                Object.entries(parsed).forEach(([walletAddress, sites]) => {
                    const sitesMap = new Map(Object.entries(sites));
                    walletSiteConnections.set(walletAddress, sitesMap);
                });
                console.log('Restored wallet site connections:', walletSiteConnections.size, 'wallets');
            } catch (e) {
                console.error('Failed to parse walletSiteConnections:', e);
            }
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

// NEW: Helper to save wallet site connections to storage
async function saveWalletSiteConnections() {
    try {
        // Convert Maps to plain objects for storage
        const serializable = {};
        walletSiteConnections.forEach((sitesMap, walletAddress) => {
            serializable[walletAddress] = Object.fromEntries(sitesMap);
        });
        
        await browserAPI.storage.local.set({
            walletSiteConnections: JSON.stringify(serializable)
        });
    } catch (error) {
        console.error('Failed to save wallet site connections:', error);
    }
}

// NEW: Add a site connection for a wallet
function addSiteConnection(walletAddress, origin, hostname, permissions) {
    if (!walletSiteConnections.has(walletAddress)) {
        walletSiteConnections.set(walletAddress, new Map());
    }
    
    const now = Date.now();
    const connection = {
        origin,
        hostname,
        walletAddress,
        permissions,
        connectedAt: now,
        lastUsed: now
    };
    
    walletSiteConnections.get(walletAddress).set(origin, connection);
    saveWalletSiteConnections();
    
    console.log(`Added site connection for wallet ${walletAddress}: ${hostname}`);
}

// NEW: Update last used time for a connection
function updateSiteConnectionLastUsed(walletAddress, origin) {
    if (walletSiteConnections.has(walletAddress)) {
        const sitesMap = walletSiteConnections.get(walletAddress);
        if (sitesMap.has(origin)) {
            const connection = sitesMap.get(origin);
            connection.lastUsed = Date.now();
            sitesMap.set(origin, connection);
            saveWalletSiteConnections();
        }
    }
}

// NEW: Remove a site connection for a wallet
function removeSiteConnection(walletAddress, origin) {
    if (walletSiteConnections.has(walletAddress)) {
        const sitesMap = walletSiteConnections.get(walletAddress);
        sitesMap.delete(origin);
        
        if (sitesMap.size === 0) {
            walletSiteConnections.delete(walletAddress);
        }
        
        saveWalletSiteConnections();
        console.log(`Removed site connection for wallet ${walletAddress}: ${origin}`);
        return true;
    }
    return false;
}

// NEW: Get all site connections for a wallet
function getSiteConnectionsForWallet(walletAddress) {
    if (!walletSiteConnections.has(walletAddress)) {
        return [];
    }
    return Array.from(walletSiteConnections.get(walletAddress).values());
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
async function handleConnectWallet(origin, hostname, connectionParams = null) {
    console.log(`Connection request from: ${hostname}${connectionParams?.address ? ` for address: ${connectionParams.address}` : ''}${connectionParams?.return_private_key ? ' [PRIVATE KEY REQUESTED]' : ''}`);

    // Check if already connected
    if (connectedSites.has(origin)) {
        // For already connected sites, we need to get wallet data from popup
        // since we don't store it in background script
        const { popupId, requestId } = await openWalletPopup({
            type: 'GET_WALLET_DATA',
            origin,
            hostname,
            title: 'Get Wallet Data',
            message: `Getting wallet data for ${hostname}`,
            requestedAddress: connectionParams?.address,
            connectionParams
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
            message: connectionParams?.address
                ? `${hostname} wants to connect to wallet with address: ${connectionParams.address}`
                : `${hostname} wants to connect to your wallet`,
            requestedAddress: connectionParams?.address,
            connectionParams
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
                        
                        // NEW: Store per-wallet site connection with permissions
                        if (result.walletAddress) {
                            const permissions = {
                                returnPrivateKey: connectionParams?.return_private_key || false,
                                filter: connectionParams?.filter || undefined,
                                specificAddress: connectionParams?.address || undefined
                            };
                            addSiteConnection(result.walletAddress, origin, hostname, permissions);
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
                handleConnectWallet(message.origin, message.hostname, message.payload).then(result => {
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

            case 'GET_WALLET_SITE_CONNECTIONS':
                // Get all site connections for a specific wallet
                if (!message.walletAddress) {
                    sendResponse({ success: false, error: 'Wallet address required' });
                    break;
                }
                const connections = getSiteConnectionsForWallet(message.walletAddress);
                sendResponse({ success: true, connections });
                break;

            case 'REMOVE_WALLET_SITE_CONNECTION':
                // Remove a specific site connection from a wallet
                if (!message.walletAddress || !message.origin) {
                    sendResponse({ success: false, error: 'Wallet address and origin required' });
                    break;
                }
                const removed = removeSiteConnection(message.walletAddress, message.origin);
                
                // Also remove from legacy connectedSites if no other wallets are connected to this origin
                let stillConnected = false;
                // eslint-disable-next-line no-unused-vars
                for (const [_walletAddr, sitesMap] of walletSiteConnections) {
                    if (sitesMap.has(message.origin)) {
                        stillConnected = true;
                        break;
                    }
                }
                if (!stillConnected) {
                    connectedSites.delete(message.origin);
                    connectedSitesData.delete(message.origin);
                    browserAPI.storage.local.set({
                        connectedSites: Array.from(connectedSites)
                    });
                }
                
                sendResponse({ success: removed });
                break;

            case 'STORE_SITE_CONNECTION':
                // Store a new site connection with permissions
                if (!message.walletAddress || !message.origin || !message.hostname) {
                    sendResponse({ success: false, error: 'Wallet address, origin, and hostname required' });
                    break;
                }
                addSiteConnection(
                    message.walletAddress,
                    message.origin,
                    message.hostname,
                    message.permissions || {}
                );
                sendResponse({ success: true });
                break;

            default:
                sendResponse({ error: 'Unknown message type' });
        }
    });
}

console.log('Quasar Background Script - Ready!');
