// src/lib/token_loader.ts
// Utility to fetch and parse tokens.xml as JSON in a web environment

export interface Token {
    Name: string;
    Symbol: string;
    Color: string;
    Node: string;
}


/**
 * Loads and parses the tokens.xml file from the public/static assets folder.
 * Returns a Promise resolving to the tokens as a JSON object.
 */
export async function loadTokensXmlAsJson(url: string = 'tokens.xml'): Promise<Token[]> {
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch tokens.xml');
    const xmlText = await response.text();
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlText, 'application/xml');

    // Parse XML to JSON
    const tokens: Token[] = Array.from(xmlDoc.getElementsByTagName('Token')).map(tokenEl => ({
        Name: tokenEl.getElementsByTagName('Name')[0]?.textContent || '',
        Symbol: tokenEl.getElementsByTagName('Symbol')[0]?.textContent || '',
        Color: tokenEl.getElementsByTagName('Color')[0]?.textContent || '',
        Node: tokenEl.getElementsByTagName('Node')[0]?.textContent || '',
    }));

    return tokens;
}
