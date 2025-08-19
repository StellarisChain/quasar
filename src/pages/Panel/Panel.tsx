import React, { useState, useEffect } from 'react';
import { browserAPI } from '../../lib/browser-compat';
import './Panel.css';

interface TestResult {
    success: boolean;
    data?: any;
    error?: string;
    timestamp: number;
}

interface TransactionParams {
    to: string;
    amount: string;
    asset: string;
    memo: string;
}

interface SignMessageParams {
    message: string;
    encoding?: 'utf8' | 'hex';
}

interface ConnectParams {
    address?: string;
    return_private_key?: boolean;
}

interface DialogState {
    type: 'transaction' | 'sign' | 'connect' | null;
    isOpen: boolean;
}

const Panel: React.FC = () => {
    const [results, setResults] = useState<TestResult[]>([]);
    const [isWalletAvailable, setIsWalletAvailable] = useState(false);
    const [loading, setLoading] = useState<string | null>(null);
    const [extensionContextValid, setExtensionContextValid] = useState(true);

    // Dialog state
    const [dialogState, setDialogState] = useState<DialogState>({ type: null, isOpen: false });

    // Form states for different dialogs
    const [transactionForm, setTransactionForm] = useState<TransactionParams>({
        to: '0x742d35cc6634c0532925a3b8d17c93fb',
        amount: '1.0',
        asset: 'STE',
        memo: 'Test transaction from devtools'
    });

    const [signMessageForm, setSignMessageForm] = useState<SignMessageParams>({
        message: 'Hello from Quasar DevTools!',
        encoding: 'utf8'
    });

    const [connectForm, setConnectForm] = useState<ConnectParams>({
        address: undefined,
        return_private_key: false,
        chainId: undefined,
        requestedChains: []
    });

    useEffect(() => {
        checkWalletAvailability();

        // Check extension context validity periodically
        const interval = setInterval(() => {
            if (!browserAPI.tabs || !browserAPI.scripting) {
                setExtensionContextValid(false);
                clearInterval(interval);
            }
        }, 5000);

        // Keyboard shortcuts
        const handleKeydown = (e: KeyboardEvent) => {
            if (e.ctrlKey || e.metaKey) {
                switch (e.key) {
                    case 'k':
                        e.preventDefault();
                        clearResults();
                        break;
                    case 'r':
                        e.preventDefault();
                        checkWalletAvailability();
                        break;
                    case 'c':
                        e.preventDefault();
                        if (!loading) openConnectDialog();
                        break;
                    case 't':
                        e.preventDefault();
                        if (!loading) openTransactionDialog();
                        break;
                    case 's':
                        e.preventDefault();
                        if (!loading) openSignDialog();
                        break;
                }
            }
        };

        document.addEventListener('keydown', handleKeydown);

        return () => {
            clearInterval(interval);
            document.removeEventListener('keydown', handleKeydown);
        };
    }, [loading]);

    const addResult = (result: Omit<TestResult, 'timestamp'>) => {
        setResults(prev => [{
            ...result,
            timestamp: Date.now()
        }, ...prev.slice(0, 9)]); // Keep last 10 results
    };

    const checkWalletAvailability = async () => {
        try {
            // Check if extension context is still valid
            if (!browserAPI.scripting.available) {
                console.warn('Extension context invalidated, skipping wallet check');
                setIsWalletAvailable(false);
                return;
            }

            const tabs = await browserAPI.tabs.query({ active: true, currentWindow: true });
            if (tabs[0]) {
                const result = await browserAPI.scripting.executeScript({
                    target: { tabId: tabs[0].id! },
                    func: () => {
                        return typeof window !== 'undefined' && window.quasar ? 'available' : 'not-available';
                    }
                });
                setIsWalletAvailable(result[0]?.result === 'available');
            }
        } catch (error) {
            console.error('Failed to check wallet availability:', error);
            setIsWalletAvailable(false);
        }
    };

    const executeInPage = async (code: string) => {
        try {
            // Check if extension context is still valid
            if (!browserAPI.scripting.available) {
                throw new Error('Extension context invalidated');
            }

            const tabs = await browserAPI.tabs.query({ active: true, currentWindow: true });
            if (!tabs[0]) {
                throw new Error('No active tab found');
            }

            const result = await browserAPI.scripting.executeScript({
                target: { tabId: tabs[0].id! },
                func: (code: string) => {
                    return (async () => {
                        try {
                            // Use a custom event to communicate with the page context
                            // This bypasses CSP restrictions
                            return new Promise((resolve) => {
                                const eventId = 'quasar-devtools-' + Math.random().toString(36).substr(2, 9);

                                // Listen for the response
                                const handleResponse = (event: CustomEvent) => {
                                    if (event.detail.id === eventId) {
                                        document.removeEventListener('quasar-devtools-response', handleResponse as EventListener);
                                        resolve(event.detail.result);
                                    }
                                };

                                document.addEventListener('quasar-devtools-response', handleResponse as EventListener);

                                // Send the code to page context
                                document.dispatchEvent(new CustomEvent('quasar-devtools-execute', {
                                    detail: { id: eventId, code }
                                }));

                                // Timeout after 10 seconds
                                setTimeout(() => {
                                    document.removeEventListener('quasar-devtools-response', handleResponse as EventListener);
                                    resolve({ error: 'Timeout waiting for response' });
                                }, 10000);
                            });
                        } catch (error) {
                            return { error: error instanceof Error ? error.message : String(error) };
                        }
                    })();
                },
                args: [code]
            });

            return result[0]?.result;
        } catch (error) {
            throw new Error(`Failed to execute script: ${error instanceof Error ? error.message : String(error)}`);
        }
    };

    const testConnectWallet = async (params?: ConnectParams) => {
        setLoading('connect');
        try {
            const connectParams = params || connectForm;
            let connectCode = `
                if (!window.quasar) {
                    return { error: 'Quasar wallet not available' };
                }
                
                const accounts = await window.quasar.connect(`;

            if (connectParams.chainId || connectParams.requestedChains?.length) {
                connectCode += JSON.stringify(connectParams);
            }

            connectCode += `);
                return { success: true, accounts };
            `;

            const result = await executeInPage(connectCode);

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
            setDialogState({ type: null, isOpen: false });
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

    const testSendTransaction = async (params?: TransactionParams) => {
        setLoading('transaction');
        try {
            const txParams = params || transactionForm;
            const result = await executeInPage(`
                if (!window.quasar) {
                    return { error: 'Quasar wallet not available' };
                }
                
                const tx = await window.quasar.sendTransaction(${JSON.stringify(txParams)});
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
            setDialogState({ type: null, isOpen: false });
        }
    };

    const testSignMessage = async (params?: SignMessageParams) => {
        setLoading('sign');
        try {
            const signParams = params || signMessageForm;
            const result = await executeInPage(`
                if (!window.quasar) {
                    return { error: 'Quasar wallet not available' };
                }
                
                const signature = await window.quasar.signMessage('${signParams.message}');
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
            setDialogState({ type: null, isOpen: false });
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
            // Check if extension context is still valid
            if (!browserAPI.scripting.available) {
                throw new Error('Extension context invalidated');
            }

            const tabs = await browserAPI.tabs.query({ active: true, currentWindow: true });
            if (!tabs[0]) {
                throw new Error('No active tab found');
            }

            await browserAPI.scripting.executeScript({
                target: { tabId: tabs[0].id! },
                func: () => {
                    // Create test interface in page
                    if (!document.getElementById('quasar-test-interface')) {
                        const testDiv = document.createElement('div');
                        testDiv.id = 'quasar-test-interface';
                        testDiv.style.cssText = `
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
                        `;

                        const title = document.createElement('h3');
                        title.textContent = 'Quasar Wallet Test';
                        title.style.cssText = 'margin: 0 0 12px; color: #8b5cf6; font-size: 14px;';
                        testDiv.appendChild(title);

                        const status = document.createElement('div');
                        status.id = 'quasar-status';
                        status.style.cssText = 'margin-bottom: 12px; padding: 8px; border-radius: 4px;';
                        testDiv.appendChild(status);

                        const buttonStyle = `
                            background: #374151; 
                            border: 1px solid #4b5563; 
                            color: white; 
                            padding: 6px 12px; 
                            margin: 2px; 
                            border-radius: 4px; 
                            cursor: pointer; 
                            font-size: 11px;
                            transition: background 0.2s;
                        `;

                        const buttons = [
                            { text: 'Connect', action: () => (window as any).quasar?.connect() },
                            { text: 'Get Accounts', action: () => (window as any).quasar?.getAccounts() },
                            { text: 'Get Assets', action: () => (window as any).quasar?.getAssets() },
                            {
                                text: 'Send TX', action: () => (window as any).quasar?.sendTransaction({
                                    to: '0xTest...Address',
                                    amount: '0.1',
                                    asset: 'STE',
                                    memo: 'Test from page'
                                })
                            },
                            { text: 'Sign Message', action: () => (window as any).quasar?.signMessage('Test message') },
                            { text: 'Disconnect', action: () => (window as any).quasar?.disconnect() },
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
                                    console.log(`${btn.text} result:`, result);
                                    updateStatus(`${btn.text}: Success`, '#10b981');
                                } catch (error: any) {
                                    console.error(`${btn.text} error:`, error);
                                    updateStatus(`${btn.text}: ${error.message}`, '#ef4444');
                                }
                            };
                            testDiv.appendChild(button);
                        });

                        const updateStatus = (message: string, color: string) => {
                            status.textContent = message;
                            status.style.background = color + '20';
                            status.style.border = '1px solid ' + color;
                            status.style.color = color;
                        };

                        // Check initial wallet status
                        if ((window as any).quasar) {
                            updateStatus('Wallet Available', '#10b981');
                        } else {
                            updateStatus('Wallet Not Available', '#ef4444');
                        }

                        document.body.appendChild(testDiv);
                    }
                }
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

    const exportResults = () => {
        const exportData = {
            timestamp: new Date().toISOString(),
            results: results.map(r => ({
                ...r,
                timestamp: new Date(r.timestamp).toISOString()
            }))
        };

        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `quasar-devtools-results-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const copyResult = (result: TestResult) => {
        const resultText = result.success
            ? JSON.stringify(result.data, null, 2)
            : result.error;

        navigator.clipboard.writeText(resultText || '').then(() => {
            // Could add a toast notification here
            console.log('Result copied to clipboard');
        });
    };

    // Dialog handlers
    const openConnectDialog = () => setDialogState({ type: 'connect', isOpen: true });
    const openTransactionDialog = () => setDialogState({ type: 'transaction', isOpen: true });
    const openSignDialog = () => setDialogState({ type: 'sign', isOpen: true });
    const closeDialog = () => setDialogState({ type: null, isOpen: false });

    // Dialog submit handlers
    const handleConnectSubmit = () => {
        testConnectWallet(connectForm);
    };

    const handleTransactionSubmit = () => {
        // Basic validation
        if (!transactionForm.to.trim()) {
            addResult({ success: false, error: 'Recipient address is required' });
            return;
        }
        if (!transactionForm.amount.trim()) {
            addResult({ success: false, error: 'Amount is required' });
            return;
        }
        if (isNaN(Number(transactionForm.amount))) {
            addResult({ success: false, error: 'Amount must be a valid number' });
            return;
        }
        if (Number(transactionForm.amount) <= 0) {
            addResult({ success: false, error: 'Amount must be greater than 0' });
            return;
        }

        testSendTransaction(transactionForm);
    };

    const handleSignSubmit = () => {
        if (!signMessageForm.message.trim()) {
            addResult({ success: false, error: 'Message is required' });
            return;
        }

        testSignMessage(signMessageForm);
    };

    // Preset handlers
    const applyTransactionPreset = (preset: 'small' | 'large' | 'token') => {
        const presets = {
            small: {
                to: '0x742d35cc6634c0532925a3b8d17c93fb',
                amount: '0.001',
                asset: 'STE',
                memo: 'Small test transaction'
            },
            large: {
                to: '0x742d35cc6634c0532925a3b8d17c93fb',
                amount: '100.0',
                asset: 'STE',
                memo: 'Large test transaction'
            },
            token: {
                to: '0x742d35cc6634c0532925a3b8d17c93fb',
                amount: '10.0',
                asset: 'USDT',
                memo: 'Token transfer test'
            }
        };
        setTransactionForm(presets[preset]);
    };

    const applySignPreset = (preset: 'simple' | 'long' | 'json') => {
        const presets = {
            simple: {
                message: 'Hello Quasar!',
                encoding: 'utf8' as const
            },
            long: {
                message: 'This is a longer message to test signature handling with more complex text content that includes special characters: !@#$%^&*()_+-=[]{}|;:,.<>?',
                encoding: 'utf8' as const
            },
            json: {
                message: JSON.stringify({
                    action: 'authenticate',
                    timestamp: Date.now(),
                    nonce: Math.random().toString(36)
                }, null, 2),
                encoding: 'utf8' as const
            }
        };
        setSignMessageForm(presets[preset]);
    };

    // Modal component
    const Modal: React.FC<{ children: React.ReactNode; title: string; onClose: () => void }> = ({ children, title, onClose }) => (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h3>{title}</h3>
                    <button className="modal-close" onClick={onClose}>✕</button>
                </div>
                <div className="modal-body">
                    {children}
                </div>
            </div>
        </div>
    );

    // Connect Dialog
    const ConnectDialog: React.FC = () => (
        <Modal title="Connect Wallet" onClose={closeDialog}>
            <div className="dialog-form">
                <div className="preset-section">
                    <label>Quick Presets:</label>
                    <div className="preset-buttons">
                        <button
                            type="button"
                            className="preset-btn"
                            onClick={() => setConnectForm({ address: undefined, return_private_key: false, chainId: undefined, requestedChains: [] })}
                        >
                            Default
                        </button>
                        <button
                            type="button"
                            className="preset-btn"
                            onClick={() => setConnectForm({ address: undefined, return_private_key: false, chainId: 'stellaris', requestedChains: ['stellaris'] })}
                        >
                            Stellaris
                        </button>
                        <button
                            type="button"
                            className="preset-btn"
                            onClick={() => setConnectForm({ address: undefined, return_private_key: false, chainId: 'ethereum', requestedChains: ['ethereum', 'polygon'] })}
                        >
                            Multi-chain
                        </button>
                        <button
                            type="button"
                            className="preset-btn"
                            onClick={() => setConnectForm({ address: undefined, return_private_key: true, chainId: undefined, requestedChains: [] })}
                            style={{ background: '#ff6b6b', color: 'white' }}
                        >
                            Test Private Key
                        </button>
                    </div>
                </div>
                <div className="form-group">
                    <label>Specific Address (optional)</label>
                    <input
                        type="text"
                        value={connectForm.address || ''}
                        onChange={(e) => setConnectForm({ ...connectForm, address: e.target.value || undefined })}
                        placeholder="e.g., 0x1234567890abcdef..."
                    />
                    <small style={{ color: '#666', fontSize: '11px' }}>
                        Connect to a specific wallet address
                    </small>
                </div>
                <div className="form-group">
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <input
                            type="checkbox"
                            checked={connectForm.return_private_key || false}
                            onChange={(e) => setConnectForm({ ...connectForm, return_private_key: e.target.checked })}
                        />
                        Request Private Key Access
                    </label>
                    <small style={{ color: '#ff6b6b', fontSize: '11px' }}>
                        ⚠️ WARNING: This grants full access to the wallet. Only use for testing!
                    </small>
                </div>
                <div className="form-group">
                    <label>Chain ID (optional)</label>
                    <input
                        type="text"
                        value={connectForm.chainId || ''}
                        onChange={(e) => setConnectForm({ ...connectForm, chainId: e.target.value || undefined })}
                        placeholder="e.g., ethereum, stellaris"
                    />
                    <small style={{ color: '#666', fontSize: '11px' }}>
                        Preferred chain to connect to
                    </small>
                </div>
                <div className="form-group">
                    <label>Requested Chains (optional, comma-separated)</label>
                    <input
                        type="text"
                        value={connectForm.requestedChains?.join(', ') || ''}
                        onChange={(e) => setConnectForm({
                            ...connectForm,
                            requestedChains: e.target.value ? e.target.value.split(',').map(s => s.trim()) : []
                        })}
                        placeholder="e.g., ethereum, stellaris, bitcoin"
                    />
                    <small style={{ color: '#666', fontSize: '11px' }}>
                        List of chains your app supports
                    </small>
                </div>
                <div className="dialog-actions">
                    <button className="btn-secondary" onClick={closeDialog}>Cancel</button>
                    <button
                        className="btn-primary"
                        onClick={handleConnectSubmit}
                        disabled={loading === 'connect'}
                    >
                        {loading === 'connect' ? 'Connecting...' : 'Connect'}
                    </button>
                </div>
            </div>
        </Modal>
    );

    // Transaction Dialog
    const TransactionDialog: React.FC = () => (
        <Modal title="Send Transaction" onClose={closeDialog}>
            <div className="dialog-form">
                <div className="preset-section">
                    <label>Quick Presets:</label>
                    <div className="preset-buttons">
                        <button
                            type="button"
                            className="preset-btn"
                            onClick={() => applyTransactionPreset('small')}
                        >
                            Small TX
                        </button>
                        <button
                            type="button"
                            className="preset-btn"
                            onClick={() => applyTransactionPreset('large')}
                        >
                            Large TX
                        </button>
                        <button
                            type="button"
                            className="preset-btn"
                            onClick={() => applyTransactionPreset('token')}
                        >
                            Token TX
                        </button>
                    </div>
                </div>
                <div className="form-group">
                    <label>To Address *</label>
                    <input
                        type="text"
                        value={transactionForm.to}
                        onChange={(e) => setTransactionForm({ ...transactionForm, to: e.target.value })}
                        placeholder="0x742d35cc6634c0532925a3b8d17c93fb"
                        required
                    />
                </div>
                <div className="form-group">
                    <label>Amount *</label>
                    <input
                        type="text"
                        value={transactionForm.amount}
                        onChange={(e) => setTransactionForm({ ...transactionForm, amount: e.target.value })}
                        placeholder="1.0"
                        required
                    />
                </div>
                <div className="form-group">
                    <label>Asset *</label>
                    <select
                        value={transactionForm.asset}
                        onChange={(e) => setTransactionForm({ ...transactionForm, asset: e.target.value })}
                    >
                        <option value="STE">STE</option>
                        <option value="ETH">ETH</option>
                        <option value="BTC">BTC</option>
                        <option value="USDT">USDT</option>
                        <option value="USDC">USDC</option>
                    </select>
                </div>
                <div className="form-group">
                    <label>Memo</label>
                    <textarea
                        value={transactionForm.memo}
                        onChange={(e) => setTransactionForm({ ...transactionForm, memo: e.target.value })}
                        placeholder="Transaction memo (optional)"
                        rows={3}
                    />
                </div>
                <div className="dialog-actions">
                    <button className="btn-secondary" onClick={closeDialog}>Cancel</button>
                    <button
                        className="btn-primary"
                        onClick={handleTransactionSubmit}
                        disabled={loading === 'transaction' || !transactionForm.to || !transactionForm.amount}
                    >
                        {loading === 'transaction' ? 'Sending...' : 'Send Transaction'}
                    </button>
                </div>
            </div>
        </Modal>
    );

    // Sign Message Dialog
    const SignMessageDialog: React.FC = () => (
        <Modal title="Sign Message" onClose={closeDialog}>
            <div className="dialog-form">
                <div className="preset-section">
                    <label>Quick Presets:</label>
                    <div className="preset-buttons">
                        <button
                            type="button"
                            className="preset-btn"
                            onClick={() => applySignPreset('simple')}
                        >
                            Simple
                        </button>
                        <button
                            type="button"
                            className="preset-btn"
                            onClick={() => applySignPreset('long')}
                        >
                            Long Text
                        </button>
                        <button
                            type="button"
                            className="preset-btn"
                            onClick={() => applySignPreset('json')}
                        >
                            JSON Data
                        </button>
                    </div>
                </div>
                <div className="form-group">
                    <label>Message *</label>
                    <textarea
                        value={signMessageForm.message}
                        onChange={(e) => setSignMessageForm({ ...signMessageForm, message: e.target.value })}
                        placeholder="Enter message to sign..."
                        rows={4}
                        required
                    />
                </div>
                <div className="form-group">
                    <label>Encoding</label>
                    <select
                        value={signMessageForm.encoding}
                        onChange={(e) => setSignMessageForm({ ...signMessageForm, encoding: e.target.value as 'utf8' | 'hex' })}
                    >
                        <option value="utf8">UTF-8</option>
                        <option value="hex">Hex</option>
                    </select>
                </div>
                <div className="dialog-actions">
                    <button className="btn-secondary" onClick={closeDialog}>Cancel</button>
                    <button
                        className="btn-primary"
                        onClick={handleSignSubmit}
                        disabled={loading === 'sign' || !signMessageForm.message}
                    >
                        {loading === 'sign' ? 'Signing...' : 'Sign Message'}
                    </button>
                </div>
            </div>
        </Modal>
    );

    return (
        <div className="devtools-panel">
            <div className="header">
                <h1>Quasar Wallet DevTools</h1>
                <div className="status">
                    <span className={`status-indicator ${isWalletAvailable ? 'connected' : 'disconnected'}`}></span>
                    <span>Wallet {isWalletAvailable ? 'Available' : 'Not Available'}</span>
                    <button onClick={checkWalletAvailability} className="refresh-btn">↻</button>
                </div>
                {!extensionContextValid && (
                    <div className="error-banner" style={{
                        background: '#ef4444',
                        color: 'white',
                        padding: '8px',
                        borderRadius: '4px',
                        marginTop: '8px',
                        fontSize: '12px'
                    }}>
                        Extension context invalidated. Please reload the devtools.
                    </div>
                )}
            </div>

            <div className="test-section">
                <h2>Wallet API Tests</h2>
                <div className="button-grid">
                    <button
                        onClick={openConnectDialog}
                        disabled={!!loading}
                        className="test-btn connect-btn"
                    >
                        Connect Wallet
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
                        onClick={openTransactionDialog}
                        disabled={!!loading}
                        className="test-btn transaction-btn"
                    >
                        Send Transaction
                    </button>

                    <button
                        onClick={openSignDialog}
                        disabled={!!loading}
                        className="test-btn"
                    >
                        Sign Message
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
                    <div className="utility-buttons">
                        <button
                            onClick={injectTestScript}
                            disabled={loading === 'inject'}
                            className="test-btn utility-btn"
                        >
                            {loading === 'inject' ? '...' : 'Inject Test Interface'}
                        </button>

                        <button
                            onClick={() => testConnectWallet()}
                            disabled={!!loading}
                            className="test-btn utility-btn"
                            title="Quick connect without parameters"
                        >
                            Quick Connect
                        </button>

                        <button
                            onClick={() => testSendTransaction({
                                to: '0x742d35cc6634c0532925a3b8d17c93fb',
                                amount: '0.1',
                                asset: 'STE',
                                memo: 'Quick test transaction'
                            })}
                            disabled={!!loading}
                            className="test-btn utility-btn"
                            title="Send a quick test transaction"
                        >
                            Quick Send
                        </button>

                        <button
                            onClick={() => testSignMessage({
                                message: 'Quick test signature',
                                encoding: 'utf8'
                            })}
                            disabled={!!loading}
                            className="test-btn utility-btn"
                            title="Sign a quick test message"
                        >
                            Quick Sign
                        </button>
                    </div>

                    <div className="help-section">
                        <h4>Keyboard Shortcuts</h4>
                        <div className="shortcuts">
                            <div className="shortcut">
                                <kbd>Ctrl/Cmd + C</kbd> <span>Connect Dialog</span>
                            </div>
                            <div className="shortcut">
                                <kbd>Ctrl/Cmd + T</kbd> <span>Transaction Dialog</span>
                            </div>
                            <div className="shortcut">
                                <kbd>Ctrl/Cmd + S</kbd> <span>Sign Dialog</span>
                            </div>
                            <div className="shortcut">
                                <kbd>Ctrl/Cmd + R</kbd> <span>Refresh Wallet Status</span>
                            </div>
                            <div className="shortcut">
                                <kbd>Ctrl/Cmd + K</kbd> <span>Clear Results</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="results-section">
                <div className="results-header">
                    <h2>Test Results</h2>
                    <div className="results-actions">
                        {results.length > 0 && (
                            <button onClick={exportResults} className="export-btn" title="Export results as JSON">
                                📥 Export
                            </button>
                        )}
                        <button onClick={clearResults} className="clear-btn">Clear</button>
                    </div>
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
                                    <button
                                        className="copy-result-btn"
                                        onClick={() => copyResult(result)}
                                        title="Copy result to clipboard"
                                    >
                                        📋
                                    </button>
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

            {/* Dialogs */}
            {dialogState.isOpen && dialogState.type === 'connect' && <ConnectDialog />}
            {dialogState.isOpen && dialogState.type === 'transaction' && <TransactionDialog />}
            {dialogState.isOpen && dialogState.type === 'sign' && <SignMessageDialog />}
        </div>
    );
};

export default Panel;
