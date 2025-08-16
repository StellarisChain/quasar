import { printLine } from './modules/print';
import { relayMap } from '../../lib/relay-config.js';

console.log('Quasar Content Script - Starting...');
console.log('Must reload extension for modifications to take effect.');

printLine("Using the 'printLine' function from the Print Module");

// Inject wallet library into page
function injectWalletLibrary() {
    const script = document.createElement('script');
    script.src = chrome.runtime.getURL('wallet-injection.bundle.js');
    script.onload = function () {
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

            // Check if this is a response message type
            if (type.endsWith('_RESPONSE')) {
                sendMessage = false; // Don't send response for request types
            } else if (relayMap[type]) {
                // Use relayMap to handle known message types dynamically
                const config = relayMap[type];
                const message = {
                    type: config.type,
                    origin: window.location.origin
                };

                // Add payload if required
                if (config.includePayload && payload) {
                    message.payload = payload;
                }

                // Add hostname if required
                if (config.includeHostname) {
                    message.hostname = window.location.hostname;
                }

                response = await chrome.runtime.sendMessage(message);
            } else {
                throw new Error(`Unknown message type: ${type}`);
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

// Setup DevTools communication
function setupDevToolsRelay() {
    // Listen for DevTools execute requests
    document.addEventListener('quasar-devtools-execute', async (event) => {
        const { id, code } = event.detail;

        try {
            // Forward to page context via postMessage
            window.postMessage({
                type: 'QUASAR_DEVTOOLS_EXECUTE',
                payload: { id, code },
                requestId: id
            }, '*');
        } catch (error) {
            // Send error response
            document.dispatchEvent(new CustomEvent('quasar-devtools-response', {
                detail: { id, result: { error: error.message } }
            }));
        }
    });

    // Listen for responses from page context
    window.addEventListener('message', (event) => {
        if (event.source !== window || event.data.type !== 'QUASAR_DEVTOOLS_EXECUTE_RESPONSE') {
            return;
        }

        const { payload, requestId } = event.data;

        // Forward response to DevTools
        document.dispatchEvent(new CustomEvent('quasar-devtools-response', {
            detail: { id: requestId, result: payload }
        }));
    });
}

// Initialize content script
function initializeContentScript() {
    // Only inject on main frame
    if (window.self === window.top) {
        injectWalletLibrary();
        setupMessageRelay();
        setupDevToolsRelay();
        console.log('Quasar Content Script - Ready!');
    }
}

// Run when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeContentScript);
} else {
    initializeContentScript();
}