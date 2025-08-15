/**
 * Browser compatibility utilities for cross-browser extension development
 */

import browser from 'webextension-polyfill';

// Detect browser type
export const getBrowserType = (): string => {
    if (typeof navigator !== 'undefined' && navigator.userAgent) {
        if (navigator.userAgent.includes('Firefox')) {
            return 'firefox';
        } else if (navigator.userAgent.includes('Chrome')) {
            return 'chrome';
        } else if (navigator.userAgent.includes('Edge')) {
            return 'edge';
        }
    }

    // Fallback detection
    if (typeof browser !== 'undefined') {
        return 'firefox';
    } else if (typeof chrome !== 'undefined') {
        return 'chrome';
    }
    return 'unknown';
};

// Cross-browser API wrapper using webextension-polyfill
export const browserAPI = {
    // Tabs API
    tabs: {
        query: browser.tabs.query,
        create: browser.tabs.create,
        update: browser.tabs.update,
        remove: browser.tabs.remove,
    },

    // Storage API
    storage: {
        local: {
            get: browser.storage.local.get,
            set: browser.storage.local.set,
            remove: browser.storage.local.remove,
            clear: browser.storage.local.clear,
        },
        sync: {
            get: browser.storage.sync.get,
            set: browser.storage.sync.set,
            remove: browser.storage.sync.remove,
            clear: browser.storage.sync.clear,
        }
    },

    // Runtime API
    runtime: {
        sendMessage: browser.runtime.sendMessage,
        onMessage: browser.runtime.onMessage,
        onInstalled: browser.runtime.onInstalled,
        getURL: browser.runtime.getURL,
        id: browser.runtime.id,
        lastError: browser.runtime.lastError,
    },

    // Action API (browser.action in MV3, browser.browserAction in MV2)
    action: (() => {
        // Try to use the modern action API first, fall back to browserAction
        const actionAPI = (browser as any).action || (browser as any).browserAction;
        return actionAPI ? {
            setPopup: actionAPI.setPopup,
            setBadgeText: actionAPI.setBadgeText,
            setBadgeBackgroundColor: actionAPI.setBadgeBackgroundColor,
            setIcon: actionAPI.setIcon,
            setTitle: actionAPI.setTitle,
        } : null;
    })(),

    // Scripting API (Chrome MV3) or Tabs API (Firefox/Chrome MV2)
    scripting: {
        executeScript: async (injection: any) => {
            if ((browser as any).scripting) {
                // Chrome MV3
                return (browser as any).scripting.executeScript(injection);
            } else {
                // Firefox or Chrome MV2 - use tabs.executeScript
                return browser.tabs.executeScript(injection.target.tabId, {
                    code: injection.func ? `(${injection.func})()` : injection.code,
                    file: injection.files ? injection.files[0] : undefined
                });
            }
        }
    },

    // Permissions API
    permissions: {
        request: browser.permissions.request,
        contains: browser.permissions.contains,
        remove: browser.permissions.remove,
    },

    // Windows API
    windows: {
        create: browser.windows.create,
        update: browser.windows.update,
        remove: browser.windows.remove,
        get: browser.windows.get,
        getAll: browser.windows.getAll,
        getCurrent: browser.windows.getCurrent,
        onCreated: browser.windows.onCreated,
        onRemoved: browser.windows.onRemoved,
        onFocusChanged: browser.windows.onFocusChanged,
    }
};

export default browserAPI;
