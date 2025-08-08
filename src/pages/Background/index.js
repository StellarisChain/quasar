import { browserAPI, getBrowserType } from '../../lib/browser-compat';

console.log('Quasar Background Script - Starting...');
console.log(`Browser detected: ${getBrowserType()}`);

// Example of using the cross-browser API
async function initializeExtension() {
    try {
        // Set up initial storage
        await browserAPI.storage.local.set({
            extensionInitialized: true,
            initTime: Date.now(),
            browser: getBrowserType()
        });

        console.log('Extension initialized successfully');
    } catch (error) {
        console.error('Failed to initialize extension:', error);
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
                sendResponse({
                    browser: getBrowserType(),
                    version: '5.0.4',
                    manifestVersion: chrome?.runtime?.getManifest?.()?.manifest_version || 'unknown'
                });
                break;

            case 'GET_EXTENSION_DATA':
                browserAPI.storage.local.get(null).then(data => {
                    sendResponse({ success: true, data });
                }).catch(error => {
                    sendResponse({ success: false, error: error.message });
                });
                return true; // Will respond asynchronously

            default:
                sendResponse({ error: 'Unknown message type' });
        }
    });
}

console.log('Quasar Background Script - Ready!');
