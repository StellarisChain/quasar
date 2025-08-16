/**
 * Quasar Wallet Injection Library
 * This library gets injected into webpages to provide wallet functionality
 */

export interface WalletAccount {
    address: string;
    publicKey: string;
    curve: string;
}

export interface Asset {
    symbol: string;
    name: string;
    balance: string;
    chain: string;
    curve: string;
}

export interface TransactionRequest {
    to: string;
    amount: string;
    asset: string;
    memo?: string;
    chain?: string;
}

export interface TransactionResponse {
    success: boolean;
    txHash?: string;
    error?: string;
}

export interface WalletEvents {
    accountsChanged: (accounts: WalletAccount[]) => void;
    chainChanged: (chainId: string) => void;
    connect: () => void;
    disconnect: () => void;
}

class QuasarWallet {
    private isConnected = false;
    private accounts: WalletAccount[] = [];
    private eventListeners: Partial<WalletEvents> = {};
    private _extensionVersion: string | null = null;

    constructor() {
        // Listen for messages from content script
        window.addEventListener('message', this.handleMessage.bind(this));

        // Initialize connection check
        this.checkConnection();
    }

    private handleMessage(event: MessageEvent) {
        if (event.source !== window || !event.data.type?.startsWith('QUASAR_')) {
            return;
        }

        const { type, payload } = event.data;

        switch (type) {
            case 'QUASAR_ACCOUNTS_CHANGED':
                this.accounts = payload.accounts;
                this.isConnected = payload.accounts.length > 0;
                this.eventListeners.accountsChanged?.(payload.accounts);
                break;

            case 'QUASAR_CHAIN_CHANGED':
                this.eventListeners.chainChanged?.(payload.chainId);
                break;

            case 'QUASAR_CONNECTED':
                this.isConnected = true;
                this.accounts = payload.accounts;
                this.eventListeners.connect?.();
                break;

            case 'GET_BROWSER_INFO':
                this._extensionVersion = payload.version;
                break;

            case 'QUASAR_DISCONNECTED':
                this.isConnected = false;
                this.accounts = [];
                this.eventListeners.disconnect?.();
                break;

            case 'QUASAR_DEVTOOLS_EXECUTE':
                this.handleDevToolsExecution(event.data);
                break;
        }
    }

    private async handleDevToolsExecution(data: any) {
        const { payload, requestId } = data;
        const { code } = payload;

        try {
            // Create an async function from the code and execute it
            const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor;
            const func = new AsyncFunction(`
                const window = arguments[0];
                ${code}
            `);
            
            const result = await func(window);
            
            // Send response back to content script
            window.postMessage({
                type: 'QUASAR_DEVTOOLS_EXECUTE_RESPONSE',
                payload: result,
                requestId
            }, '*');
            
        } catch (error) {
            // Send error response
            window.postMessage({
                type: 'QUASAR_DEVTOOLS_EXECUTE_RESPONSE',
                payload: { error: error instanceof Error ? error.message : String(error) },
                requestId
            }, '*');
        }
    }

    private sendMessage(type: string, payload?: any): Promise<any> {
        return new Promise((resolve, reject) => {
            const requestId = Math.random().toString(36).substr(2, 9);

            const handleResponse = (event: MessageEvent) => {
                if (event.source !== window ||
                    event.data.type !== `${type}_RESPONSE` ||
                    event.data.requestId !== requestId) {
                    return;
                }

                window.removeEventListener('message', handleResponse);

                if (event.data.error) {
                    reject(new Error(event.data.error));
                } else {
                    resolve(event.data.payload);
                }
            };

            window.addEventListener('message', handleResponse);

            // Send message to content script
            window.postMessage({
                type,
                payload,
                requestId
            }, '*');

            // Timeout after 30 seconds
            setTimeout(() => {
                window.removeEventListener('message', handleResponse);
                reject(new Error('Request timeout'));
            }, 30000);
        });
    }

    private checkConnection() {
        this.sendMessage('QUASAR_CHECK_CONNECTION').catch(() => {
            // Wallet not available
            this.isConnected = false;
        });
    }

    // Public API methods
    async connect(): Promise<WalletAccount[]> {
        try {
            const result = await this.sendMessage('QUASAR_CONNECT');
            if (result && result.accounts) {
                this.isConnected = true;
                this.accounts = result.accounts;
                return result.accounts;
            } else {
                this.isConnected = false;
                this.accounts = [];
                throw new Error('No accounts returned from wallet');
            }
        } catch (error) {
            this.isConnected = false;
            this.accounts = [];
            throw error;
        }
    }

    async disconnect(): Promise<void> {
        await this.sendMessage('QUASAR_DISCONNECT');
        this.isConnected = false;
        this.accounts = [];
    }

    async getAccounts(): Promise<WalletAccount[]> {
        if (!this.isConnected) {
            throw new Error('Wallet not connected');
        }
        return this.accounts;
    }

    async getAssets(address?: string): Promise<Asset[]> {
        if (!this.isConnected) {
            throw new Error('Wallet not connected');
        }

        const result = await this.sendMessage('QUASAR_GET_ASSETS', { address });
        return result.assets;
    }

    async sendTransaction(request: TransactionRequest): Promise<TransactionResponse> {
        if (!this.isConnected) {
            throw new Error('Wallet not connected');
        }

        const result = await this.sendMessage('QUASAR_SEND_TRANSACTION', request);
        return result;
    }

    async signMessage(message: string, address?: string): Promise<string> {
        if (!this.isConnected) {
            throw new Error('Wallet not connected');
        }

        const result = await this.sendMessage('QUASAR_SIGN_MESSAGE', { message, address });
        return result.signature;
    }

    // Event listeners
    on<K extends keyof WalletEvents>(event: K, callback: WalletEvents[K]): void {
        this.eventListeners[event] = callback;
    }

    off<K extends keyof WalletEvents>(event: K): void {
        delete this.eventListeners[event];
    }

    // Getters
    get connected(): boolean {
        return this.isConnected;
    }

    get address(): string | null {
        return this.accounts[0]?.address || null;
    }

    get accountsList(): WalletAccount[] {
        return this.accounts;
    }

    get isAvailable(): boolean {
        return !!window.quasar;
    }

    get extensionVersion(): string | null {
        return this._extensionVersion;
    }
}

// Inject wallet into window
declare global {
    interface Window {
        quasar?: QuasarWallet;
    }
}

// Initialize and expose wallet
if (typeof window !== 'undefined') {
    window.quasar = new QuasarWallet();

    // Dispatch ready event
    window.dispatchEvent(new CustomEvent('quasar:ready', {
        detail: { wallet: window.quasar }
    }));
}

export default QuasarWallet;
