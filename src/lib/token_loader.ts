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
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch tokens.xml');
    const xmlText = await response.text();
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlText, 'application/xml');

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
}
