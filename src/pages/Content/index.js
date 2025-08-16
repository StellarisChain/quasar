import { printLine } from './modules/print';

console.log('Quasar Content Script - Starting...');
console.log('Must reload extension for modifications to take effect.');

printLine("Using the 'printLine' function from the Print Module");

// Inject wallet library into page
function injectWalletLibrary() {
    const script = document.createElement('script');
    script.src = chrome.runtime.getURL('wallet-injection.bundle.js');
    script.onload = function() {
        this.remove();
        console.log('Quasar wallet library injected successfully');
    };
    (document.head || document.documentElement).appendChild(script);
}

// Message handler for communication between page and extension
function setupMessageRelay() {
    // Listen for messages from injected script
    window.addEventListener('message', async (event) => {
        if (event.source !== window || !event.data.type?.startsWith('QUASAR_')) {
            return;
        }

        const { type, payload, requestId } = event.data;
        
        try {
            let response;
            let sendMessage = true;
            
            switch (type) {
                case 'QUASAR_CHECK_CONNECTION':
                    response = await chrome.runtime.sendMessage({
                        type: 'CHECK_CONNECTION',
                        origin: window.location.origin
                    });
                    break;

                case 'QUASAR_CONNECT':
                    response = await chrome.runtime.sendMessage({
                        type: 'CONNECT_WALLET',
                        origin: window.location.origin,
                        hostname: window.location.hostname
                    });
                    break;

                case 'QUASAR_DISCONNECT':
                    response = await chrome.runtime.sendMessage({
                        type: 'DISCONNECT_WALLET',
                        origin: window.location.origin
                    });
                    break;

                case 'QUASAR_GET_ASSETS':
                    response = await chrome.runtime.sendMessage({
                        type: 'GET_ASSETS',
                        payload,
                        origin: window.location.origin,
                        hostname: window.location.hostname
                    });
                    break;

                case 'QUASAR_SEND_TRANSACTION':
                    response = await chrome.runtime.sendMessage({
                        type: 'SEND_TRANSACTION',
                        payload,
                        origin: window.location.origin,
                        hostname: window.location.hostname
                    });
                    break;

                case 'QUASAR_SIGN_MESSAGE':
                    response = await chrome.runtime.sendMessage({
                        type: 'SIGN_MESSAGE',
                        payload,
                        origin: window.location.origin,
                        hostname: window.location.hostname
                    });
                    break;

                case 'QUASAR_SWITCH_CHAIN':
                    response = await chrome.runtime.sendMessage({
                        type: 'SWITCH_CHAIN',
                        payload,
                        origin: window.location.origin
                    });
                    break;

                case 'QUASAR_ADD_CHAIN':
                    response = await chrome.runtime.sendMessage({
                        type: 'ADD_CHAIN',
                        payload,
                        origin: window.location.origin
                    });
                    break;

                default:
                    if (type.endsWith('_RESPONSE')) {
                        sendMessage = false; // Don't send response for request types
                    } else {
                        throw new Error(`Unknown message type: ${type}`);
                    }
            }

            if (sendMessage) {
                // Send response back to injected script
                window.postMessage({
                    type: `${type}_RESPONSE`,
                    payload: response,
                    requestId
                }, '*');
            }

        } catch (error) {
            console.error('Content script error:', error);
            window.postMessage({
                type: `${type}_RESPONSE`,
                error: error.message,
                requestId
            }, '*');
        }
    });

    // Listen for messages from background script
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (message.type?.startsWith('QUASAR_EVENT_')) {
            // Forward events to injected script
            window.postMessage(message, '*');
        }
        return false;
    });
}

// Initialize content script
function initializeContentScript() {
    // Only inject on main frame
    if (window.self === window.top) {
        injectWalletLibrary();
        setupMessageRelay();
        console.log('Quasar Content Script - Ready!');
    }
}

// Run when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeContentScript);
} else {
    initializeContentScript();
}