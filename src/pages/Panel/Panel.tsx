import React, { useState, useEffect } from 'react';
import './Panel.css';

interface TestResult {
    success: boolean;
    data?: any;
    error?: string;
    timestamp: number;
}

const Panel: React.FC = () => {
    const [results, setResults] = useState<TestResult[]>([]);
    const [isWalletAvailable, setIsWalletAvailable] = useState(false);
    const [loading, setLoading] = useState<string | null>(null);

    useEffect(() => {
        checkWalletAvailability();
    }, []);

    const addResult = (result: Omit<TestResult, 'timestamp'>) => {
        setResults(prev => [{
            ...result,
            timestamp: Date.now()
        }, ...prev.slice(0, 9)]); // Keep last 10 results
    };

    const checkWalletAvailability = async () => {
        try {
            const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
            if (tabs[0]) {
                const result = await chrome.tabs.executeScript(tabs[0].id!, {
                    code: `
                        if (typeof window !== 'undefined' && window.quasar) {
                            'available';
                        } else {
                            'not-available';
                        }
                    `
                });
                setIsWalletAvailable(result[0] === 'available');
            }
        } catch (error) {
            console.error('Failed to check wallet availability:', error);
            setIsWalletAvailable(false);
        }
    };

    const executeInPage = async (code: string) => {
        try {
            const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
            if (!tabs[0]) {
                throw new Error('No active tab found');
            }

            const result = await chrome.tabs.executeScript(tabs[0].id!, {
                code: `
                    (async () => {
                        try {
                            ${code}
                        } catch (error) {
                            return { error: error.message };
                        }
                    })();
                `
            });

            return result[0];
        } catch (error) {
            throw new Error(`Failed to execute script: ${error instanceof Error ? error.message : String(error)}`);
        }
    };

    const testConnectWallet = async () => {
        setLoading('connect');
        try {
            const result = await executeInPage(`
                if (!window.quasar) {
                    return { error: 'Quasar wallet not available' };
                }
                
                const accounts = await window.quasar.connect();
                return { success: true, accounts };
            `);

            if (result.error) {
                addResult({ success: false, error: result.error });
            } else {
                addResult({ success: true, data: result });
                setIsWalletAvailable(true);
            }
        } catch (error) {
            addResult({ success: false, error: error instanceof Error ? error.message : String(error) });
        } finally {
            setLoading(null);
        }
    };

    const testGetAccounts = async () => {
        setLoading('accounts');
        try {
            const result = await executeInPage(`
                if (!window.quasar) {
                    return { error: 'Quasar wallet not available' };
                }
                
                const accounts = await window.quasar.getAccounts();
                return { success: true, accounts };
            `);

            if (result.error) {
                addResult({ success: false, error: result.error });
            } else {
                addResult({ success: true, data: result });
            }
        } catch (error) {
            addResult({ success: false, error: error instanceof Error ? error.message : String(error) });
        } finally {
            setLoading(null);
        }
    };

    const testGetAssets = async () => {
        setLoading('assets');
        try {
            const result = await executeInPage(`
                if (!window.quasar) {
                    return { error: 'Quasar wallet not available' };
                }
                
                const assets = await window.quasar.getAssets();
                return { success: true, assets };
            `);

            if (result.error) {
                addResult({ success: false, error: result.error });
            } else {
                addResult({ success: true, data: result });
            }
        } catch (error) {
            addResult({ success: false, error: error instanceof Error ? error.message : String(error) });
        } finally {
            setLoading(null);
        }
    };

    const testSendTransaction = async () => {
        setLoading('transaction');
        try {
            const result = await executeInPage(`
                if (!window.quasar) {
                    return { error: 'Quasar wallet not available' };
                }
                
                const tx = await window.quasar.sendTransaction({
                    to: '0xRecipient...Address',
                    amount: '1.0',
                    asset: 'STE',
                    memo: 'Test transaction from devtools'
                });
                return { success: true, transaction: tx };
            `);

            if (result.error) {
                addResult({ success: false, error: result.error });
            } else {
                addResult({ success: true, data: result });
            }
        } catch (error) {
            addResult({ success: false, error: error instanceof Error ? error.message : String(error) });
        } finally {
            setLoading(null);
        }
    };

    const testSignMessage = async () => {
        setLoading('sign');
        try {
            const result = await executeInPage(`
                if (!window.quasar) {
                    return { error: 'Quasar wallet not available' };
                }
                
                const signature = await window.quasar.signMessage('Hello from Quasar DevTools!');
                return { success: true, signature };
            `);

            if (result.error) {
                addResult({ success: false, error: result.error });
            } else {
                addResult({ success: true, data: result });
            }
        } catch (error) {
            addResult({ success: false, error: error instanceof Error ? error.message : String(error) });
        } finally {
            setLoading(null);
        }
    };

    const testDisconnect = async () => {
        setLoading('disconnect');
        try {
            const result = await executeInPage(`
                if (!window.quasar) {
                    return { error: 'Quasar wallet not available' };
                }
                
                await window.quasar.disconnect();
                return { success: true, message: 'Disconnected' };
            `);

            if (result.error) {
                addResult({ success: false, error: result.error });
            } else {
                addResult({ success: true, data: result });
                setIsWalletAvailable(false);
            }
        } catch (error) {
            addResult({ success: false, error: error instanceof Error ? error.message : String(error) });
        } finally {
            setLoading(null);
        }
    };

    const injectTestScript = async () => {
        setLoading('inject');
        try {
            const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
            if (!tabs[0]) {
                throw new Error('No active tab found');
            }

            await chrome.tabs.executeScript(tabs[0].id!, {
                code: `
                    // Create test interface in page
                    if (!document.getElementById('quasar-test-interface')) {
                        const testDiv = document.createElement('div');
                        testDiv.id = 'quasar-test-interface';
                        testDiv.style.cssText = \`
                            position: fixed;
                            top: 20px;
                            right: 20px;
                            background: #1f2937;
                            border: 2px solid #374151;
                            border-radius: 8px;
                            padding: 16px;
                            color: white;
                            font-family: monospace;
                            font-size: 12px;
                            z-index: 10000;
                            max-width: 300px;
                            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5);
                        \`;

                        const title = document.createElement('h3');
                        title.textContent = 'Quasar Wallet Test';
                        title.style.cssText = 'margin: 0 0 12px; color: #8b5cf6; font-size: 14px;';
                        testDiv.appendChild(title);

                        const status = document.createElement('div');
                        status.id = 'quasar-status';
                        status.style.cssText = 'margin-bottom: 12px; padding: 8px; border-radius: 4px;';
                        testDiv.appendChild(status);

                        const buttonStyle = \`
                            background: #374151; 
                            border: 1px solid #4b5563; 
                            color: white; 
                            padding: 6px 12px; 
                            margin: 2px; 
                            border-radius: 4px; 
                            cursor: pointer; 
                            font-size: 11px;
                            transition: background 0.2s;
                        \`;

                        const buttons = [
                            { text: 'Connect', action: () => window.quasar?.connect() },
                            { text: 'Get Accounts', action: () => window.quasar?.getAccounts() },
                            { text: 'Get Assets', action: () => window.quasar?.getAssets() },
                            { text: 'Send TX', action: () => window.quasar?.sendTransaction({
                                to: '0xTest...Address',
                                amount: '0.1',
                                asset: 'STE',
                                memo: 'Test from page'
                            }) },
                            { text: 'Sign Message', action: () => window.quasar?.signMessage('Test message') },
                            { text: 'Disconnect', action: () => window.quasar?.disconnect() },
                            { text: 'Close', action: () => testDiv.remove() }
                        ];

                        buttons.forEach(btn => {
                            const button = document.createElement('button');
                            button.textContent = btn.text;
                            button.style.cssText = buttonStyle;
                            button.onmouseover = () => button.style.background = '#4b5563';
                            button.onmouseout = () => button.style.background = '#374151';
                            button.onclick = async () => {
                                try {
                                    const result = await btn.action();
                                    console.log(\`\${btn.text} result:\`, result);
                                    updateStatus(\`\${btn.text}: Success\`, '#10b981');
                                } catch (error) {
                                    console.error(\`\${btn.text} error:\`, error);
                                    updateStatus(\`\${btn.text}: \${error.message}\`, '#ef4444');
                                }
                            };
                            testDiv.appendChild(button);
                        });

                        function updateStatus(message, color) {
                            status.textContent = message;
                            status.style.background = color + '20';
                            status.style.border = '1px solid ' + color;
                            status.style.color = color;
                        }

                        // Check initial wallet status
                        if (window.quasar) {
                            updateStatus('Wallet Available', '#10b981');
                        } else {
                            updateStatus('Wallet Not Available', '#ef4444');
                        }

                        document.body.appendChild(testDiv);
                    }
                `
            });

            addResult({ success: true, data: { message: 'Test interface injected into page' } });
        } catch (error) {
            addResult({ success: false, error: error instanceof Error ? error.message : String(error) });
        } finally {
            setLoading(null);
        }
    };

    const clearResults = () => {
        setResults([]);
    };

    return (
        <div className="devtools-panel">
            <div className="header">
                <h1>Quasar Wallet DevTools</h1>
                <div className="status">
                    <span className={`status-indicator ${isWalletAvailable ? 'connected' : 'disconnected'}`}></span>
                    <span>Wallet {isWalletAvailable ? 'Available' : 'Not Available'}</span>
                    <button onClick={checkWalletAvailability} className="refresh-btn">↻</button>
                </div>
            </div>

            <div className="test-section">
                <h2>Wallet API Tests</h2>
                <div className="button-grid">
                    <button 
                        onClick={testConnectWallet}
                        disabled={loading === 'connect'}
                        className="test-btn connect-btn"
                    >
                        {loading === 'connect' ? '...' : 'Connect Wallet'}
                    </button>
                    
                    <button 
                        onClick={testGetAccounts}
                        disabled={loading === 'accounts'}
                        className="test-btn"
                    >
                        {loading === 'accounts' ? '...' : 'Get Accounts'}
                    </button>
                    
                    <button 
                        onClick={testGetAssets}
                        disabled={loading === 'assets'}
                        className="test-btn"
                    >
                        {loading === 'assets' ? '...' : 'Get Assets'}
                    </button>
                    
                    <button 
                        onClick={testSendTransaction}
                        disabled={loading === 'transaction'}
                        className="test-btn transaction-btn"
                    >
                        {loading === 'transaction' ? '...' : 'Send Transaction'}
                    </button>
                    
                    <button 
                        onClick={testSignMessage}
                        disabled={loading === 'sign'}
                        className="test-btn"
                    >
                        {loading === 'sign' ? '...' : 'Sign Message'}
                    </button>
                    
                    <button 
                        onClick={testDisconnect}
                        disabled={loading === 'disconnect'}
                        className="test-btn disconnect-btn"
                    >
                        {loading === 'disconnect' ? '...' : 'Disconnect'}
                    </button>
                </div>

                <div className="utility-section">
                    <h3>Utilities</h3>
                    <button 
                        onClick={injectTestScript}
                        disabled={loading === 'inject'}
                        className="test-btn utility-btn"
                    >
                        {loading === 'inject' ? '...' : 'Inject Test Interface'}
                    </button>
                </div>
            </div>

            <div className="results-section">
                <div className="results-header">
                    <h2>Test Results</h2>
                    <button onClick={clearResults} className="clear-btn">Clear</button>
                </div>
                <div className="results-list">
                    {results.length === 0 ? (
                        <div className="no-results">No test results yet. Try running some tests above.</div>
                    ) : (
                        results.map((result, index) => (
                            <div key={index} className={`result-item ${result.success ? 'success' : 'error'}`}>
                                <div className="result-header">
                                    <span className={`result-status ${result.success ? 'success' : 'error'}`}>
                                        {result.success ? '✓' : '✗'}
                                    </span>
                                    <span className="result-time">
                                        {new Date(result.timestamp).toLocaleTimeString()}
                                    </span>
                                </div>
                                <div className="result-content">
                                    {result.success ? (
                                        <pre>{JSON.stringify(result.data, null, 2)}</pre>
                                    ) : (
                                        <div className="error-message">{result.error}</div>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default Panel;
