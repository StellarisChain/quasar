/**
 * Test for GET_BROWSER_INFO functionality
 * This test demonstrates how to use the getBrowserInfo method
 */

// Test the getBrowserInfo functionality
async function testGetBrowserInfo() {
    console.log('Testing GET_BROWSER_INFO functionality...');
    
    // Wait for quasar wallet to be ready
    await new Promise((resolve) => {
        if (window.quasar) {
            resolve();
        } else {
            window.addEventListener('quasar:ready', resolve, { once: true });
        }
    });

    try {
        // Test the getBrowserInfo method
        console.log('Calling getBrowserInfo()...');
        const browserInfo = await window.quasar.getBrowserInfo();
        
        console.log('Browser Info:', browserInfo);
        console.log('Browser Type:', browserInfo.browser);
        console.log('Extension Version:', browserInfo.version);
        console.log('Manifest Version:', browserInfo.manifestVersion);
        console.log('Extension ID:', browserInfo.extensionId);
        console.log('Extension Name:', browserInfo.name);
        console.log('Platform:', browserInfo.platform);
        
        // Test the cached getters
        console.log('\nTesting cached getters...');
        console.log('Cached browserInfo:', window.quasar.browserInfo);
        console.log('Quick browser info:', window.quasar.quickBrowserInfo);
        console.log('Extension version (cached):', window.quasar.extensionVersion);
        
        // Test availability check
        console.log('\nTesting wallet availability...');
        console.log('Is wallet available:', window.quasar.isAvailable);
        
        // Display available message types for debugging
        console.log('\nAvailable message types:', window.quasar.availableMessageTypes);
        
        return { success: true, browserInfo };
        
    } catch (error) {
        console.error('Failed to get browser info:', error);
        return { success: false, error: error.message };
    }
}

// Auto-run test if this script is loaded in a test environment
if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', async () => {
        console.log('DOM loaded, starting browser info test...');
        const result = await testGetBrowserInfo();
        
        // Display results in the page if possible
        const resultDiv = document.createElement('div');
        resultDiv.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            background: ${result.success ? '#d4edda' : '#f8d7da'};
            color: ${result.success ? '#155724' : '#721c24'};
            padding: 15px;
            border-radius: 8px;
            border: 1px solid ${result.success ? '#c3e6cb' : '#f5c6cb'};
            font-family: monospace;
            font-size: 12px;
            max-width: 400px;
            z-index: 10000;
            white-space: pre-wrap;
        `;
        
        if (result.success) {
            resultDiv.textContent = `✅ Browser Info Test Passed\n\nBrowser: ${result.browserInfo.browser}\nVersion: ${result.browserInfo.version}\nManifest: ${result.browserInfo.manifestVersion}\nExtension ID: ${result.browserInfo.extensionId}\nName: ${result.browserInfo.name}`;
        } else {
            resultDiv.textContent = `❌ Browser Info Test Failed\n\nError: ${result.error}`;
        }
        
        document.body.appendChild(resultDiv);
        
        // Auto-remove after 10 seconds
        setTimeout(() => {
            if (resultDiv.parentNode) {
                resultDiv.parentNode.removeChild(resultDiv);
            }
        }, 10000);
    });
}

// Export for manual testing
if (typeof window !== 'undefined') {
    window.testGetBrowserInfo = testGetBrowserInfo;
}
