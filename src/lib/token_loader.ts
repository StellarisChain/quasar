// src/lib/token_loader.ts
// Utility to fetch and parse tokens.xml as JSON in a web environment

export interface Chain {
    Name: string;
    Symbol: string;
    Color: string;
    Node: string;
    TokenSupport?: boolean; // Optional, for compatibility with existing data
    SubTokens?: SubToken[]; // Optional, for contract tokens
    Curve: string; // e.g., "secp256k1" or "p256"
}

// contract tokens
export interface SubToken {
    Symbol: string;
    Name: string;
    Color: string;
}

/**
 * Loads and parses the tokens.xml file from the public/static assets folder.
 * Returns a Promise resolving to the tokens as a JSON object.
 */
export async function loadTokensXmlAsJson(url: string = 'tokens.xml'): Promise<Chain[]> {
    // In browser extension context, use chrome.runtime.getURL to get the correct path
    let fetchUrl = url;
    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.getURL) {
        fetchUrl = chrome.runtime.getURL(url);
    } else if (typeof (globalThis as any).browser !== 'undefined' && (globalThis as any).browser.runtime && (globalThis as any).browser.runtime.getURL) {
        // Firefox compatibility
        fetchUrl = (globalThis as any).browser.runtime.getURL(url);
    }

    try {
        const response = await fetch(fetchUrl);
        if (!response.ok) throw new Error(`Failed to fetch tokens.xml from ${fetchUrl}: ${response.status} ${response.statusText}`);
        const xmlText = await response.text();

        if (!xmlText || xmlText.trim().length === 0) {
            throw new Error('Empty tokens.xml file');
        }

        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlText, 'application/xml');

        // Check for XML parsing errors
        const parserError = xmlDoc.querySelector('parsererror');
        if (parserError) {
            throw new Error(`XML parsing error: ${parserError.textContent}`);
        }

        // Parse XML to JSON
        const tokens: Chain[] = Array.from(xmlDoc.getElementsByTagName('Token')).map(tokenEl => ({
            Name: tokenEl.getElementsByTagName('Name')[0]?.textContent || '',
            Symbol: tokenEl.getElementsByTagName('Symbol')[0]?.textContent || '',
            Color: tokenEl.getElementsByTagName('Color')[0]?.textContent || '',
            Node: tokenEl.getElementsByTagName('Node')[0]?.textContent || '',
            TokenSupport: tokenEl.getElementsByTagName('TokenSupport')[0]?.textContent === 'true',
            SubTokens: Array.from(tokenEl.getElementsByTagName('SubToken')).map(subTokenEl => ({
                Symbol: subTokenEl.getElementsByTagName('Symbol')[0]?.textContent || '',
                Name: subTokenEl.getElementsByTagName('Name')[0]?.textContent || '',
                Color: subTokenEl.getElementsByTagName('Color')[0]?.textContent || ''
            })),
            Curve: tokenEl.getElementsByTagName('Curve')[0]?.textContent || '',
        }));

        return tokens;
    } catch (error) {
        console.warn('Failed to load tokens.xml, returning fallback data:', error);
        // Return fallback token data
        return getFallbackTokens();
    }
}

/**
 * Returns fallback token data when tokens.xml cannot be loaded
 */
function getFallbackTokens(): Chain[] {
    return [
        {
            Name: 'Halogen',
            Symbol: 'HAL',
            Color: '#ff4545ff',
            Node: 'https://halogen-node.connor33341.dev',
            TokenSupport: true,
            Curve: 'secp256k1',
            SubTokens: [
                {
                    Symbol: 'ARG',
                    Name: 'Argentum',
                    Color: '#c0c0c0'
                },
                {
                    Symbol: 'AST',
                    Name: 'Astatine',
                    Color: '#ffcc00'
                }
            ]
        },
        {
            Name: 'Stellaris',
            Symbol: 'STE',
            Color: '#9945FF',
            Node: 'https://stellaris-node.connor33341.dev',
            TokenSupport: true,
            Curve: 'secp256k1',
            SubTokens: []
        },
        {
            Name: 'Classic Stellaris',
            Symbol: 'cSTE',
            Color: '#161616',
            Node: 'https://cstellaris-node.connor33341.dev',
            TokenSupport: false,
            Curve: 'p256',
            SubTokens: []
        },
        {
            Name: 'Denaro',
            Symbol: 'DNR',
            Color: '#21a9af',
            Node: 'https://denaro-node.gaetano.eu.org',
            TokenSupport: false,
            Curve: 'p256',
            SubTokens: []
        }
    ];
}

/**
 * Filters tokens by supported curve type
 * @param tokens - Array of Chain objects
 * @param curve - The curve type to filter by ('secp256k1' | 'p256')
 * @returns Filtered array of chains that support the specified curve
 */
export function filterTokensByCurve(tokens: Chain[], curve: string): Chain[] {
    return tokens.filter(token => token.Curve === curve);
}

/**
 * Gets available curve types from all tokens
 * @param tokens - Array of Chain objects
 * @returns Array of unique curve types
 */
export function getAvailableCurves(tokens: Chain[]): string[] {
    const curves = new Set<string>();
    tokens.forEach(token => {
        if (token.Curve) {
            curves.add(token.Curve);
        }
    });
    return Array.from(curves);
}
