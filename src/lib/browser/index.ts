/**
 * Browser-specific utilities and configurations for Quasar wallet
 */

export { relayMap, type RelayMapType, type RelayMapKeys } from './relay-config.js';
export { default as QuasarWallet } from './wallet-injection.js';
export type {
    WalletAccount,
    Asset,
    TransactionRequest,
    TransactionResponse,
    WalletEvents
} from './wallet-injection.js';
