/**
 * Simple test to verify token loading functionality
 * This can be used to debug token loading issues
 */

import { loadTokensXmlAsJson, filterTokensByCurve, getAvailableCurves } from '../lib/token_loader';

export async function testTokenLoading() {
    console.log('Testing token loading...');

    try {
        // Test loading tokens
        const tokens = await loadTokensXmlAsJson();
        console.log(`✅ Successfully loaded ${tokens.length} tokens`);

        // Log each token
        tokens.forEach(token => {
            console.log(`  - ${token.Name} (${token.Symbol}) - Curve: ${token.Curve}`);
        });

        // Test curve filtering
        const curves = getAvailableCurves(tokens);
        console.log(`✅ Available curves: ${curves.join(', ')}`);

        // Test filtering by each curve
        curves.forEach(curve => {
            const filtered = filterTokensByCurve(tokens, curve);
            console.log(`✅ ${curve} curve supports ${filtered.length} assets: ${filtered.map(t => t.Symbol).join(', ')}`);
        });

        return { success: true, tokens, curves };

    } catch (error) {
        console.error('❌ Token loading failed:', error);
        return { success: false, error };
    }
}

// Auto-run test in browser console for debugging
if (typeof window !== 'undefined') {
    (window as any).testTokenLoading = testTokenLoading;
    console.log('Token loading test function available as window.testTokenLoading()');
}
