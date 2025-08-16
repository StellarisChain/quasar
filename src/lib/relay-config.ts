/**
 * Shared relay configuration for message passing between content script and wallet injection
 */

export const relayMap = {
    'QUASAR_CHECK_CONNECTION': {
        type: 'CHECK_CONNECTION',
        includePayload: false,
        includeHostname: false
    },
    'QUASAR_CONNECT': {
        type: 'CONNECT_WALLET',
        includePayload: false,
        includeHostname: true
    },
    'QUASAR_DISCONNECT': {
        type: 'DISCONNECT_WALLET',
        includePayload: false,
        includeHostname: false
    },
    'QUASAR_GET_ASSETS': {
        type: 'GET_ASSETS',
        includePayload: true,
        includeHostname: true
    },
    'QUASAR_SEND_TRANSACTION': {
        type: 'SEND_TRANSACTION',
        includePayload: true,
        includeHostname: true
    },
    'QUASAR_SIGN_MESSAGE': {
        type: 'SIGN_MESSAGE',
        includePayload: true,
        includeHostname: true
    }
} as const;

export type RelayMapType = typeof relayMap;
export type RelayMapKeys = keyof typeof relayMap;
