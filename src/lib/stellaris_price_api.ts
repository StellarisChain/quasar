/**
 * Stellaris Price API Utilities
 * Handles fetching price data from Stellaris-based blockchain nodes
 */

export interface StellarisPriceData {
    price: number;
    change24h: number;
    historicalPrices: number[];
}

export interface StellarisPriceResponse {
    price: number;
    historical_prices?: number[];
    change_24h?: number;
}

/**
 * Fetches price data from a Stellaris-based chain's /price endpoint
 * @param nodeUrl - The base URL of the Stellaris node
 * @returns Promise resolving to price data or null if failed
 */
export async function fetchStellarisChainPrice(nodeUrl: string): Promise<StellarisPriceData | null> {
    try {
        // Ensure nodeUrl has proper format
        const baseUrl = nodeUrl.endsWith('/') ? nodeUrl.slice(0, -1) : nodeUrl;
        const priceEndpoint = `${baseUrl}/price`;

        console.log(`Fetching Stellaris price data from: ${priceEndpoint}`);

        const response = await fetch(priceEndpoint, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            // Add timeout to prevent hanging (if AbortSignal.timeout is available)
            ...(typeof AbortSignal !== 'undefined' && AbortSignal.timeout ? {
                signal: AbortSignal.timeout(10000) // 10 second timeout
            } : {})
        });

        if (!response.ok) {
            console.warn(`Failed to fetch Stellaris price from ${priceEndpoint}: ${response.status} ${response.statusText}`);
            return null;
        }

        const data: StellarisPriceResponse = await response.json();

        // Validate response structure
        if (typeof data.price !== 'number') {
            console.warn(`Invalid price data from ${priceEndpoint}:`, data);
            return null;
        }

        // Extract historical prices for chart data (default to 24 points if available)
        const historicalPrices = data.historical_prices || [];

        // If no historical data, generate a simple chart based on current price and change
        let chartData: number[] = historicalPrices;
        if (chartData.length === 0) {
            const currentPrice = data.price;
            const change24h = data.change_24h || 0;

            // Generate 24 points representing hourly prices over 24h
            const startPrice = currentPrice / (1 + change24h / 100); // Calculate starting price 24h ago
            chartData = [];

            for (let i = 0; i < 24; i++) {
                // Simple linear progression from start to current price
                const progress = i / 23; // 0 to 1
                const price = startPrice + (currentPrice - startPrice) * progress;
                chartData.push(Number(price.toFixed(4)));
            }
        }

        return {
            price: data.price,
            change24h: data.change_24h || 0,
            historicalPrices: chartData
        };

    } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
            console.warn(`Stellaris price fetch timeout for ${nodeUrl}`);
        } else {
            console.warn(`Error fetching Stellaris price from ${nodeUrl}:`, error);
        }
        return null;
    }
}

/**
 * Fetches price data for multiple Stellaris chains in parallel
 * @param chainNodeMap - Map of chain symbol to node URL
 * @returns Promise resolving to price data map
 */
export async function fetchMultipleStellarisChainPrices(
    chainNodeMap: Record<string, string>
): Promise<Record<string, StellarisPriceData>> {
    const pricePromises = Object.entries(chainNodeMap).map(async ([symbol, nodeUrl]) => {
        const priceData = await fetchStellarisChainPrice(nodeUrl);
        return { symbol, priceData };
    });

    const results = await Promise.allSettled(pricePromises);
    const priceMap: Record<string, StellarisPriceData> = {};

    results.forEach((result, index) => {
        if (result.status === 'fulfilled' && result.value.priceData) {
            priceMap[result.value.symbol] = result.value.priceData;
        } else {
            const symbol = Object.keys(chainNodeMap)[index];
            console.warn(`Failed to fetch price data for ${symbol}:`,
                result.status === 'rejected' ? result.reason : 'No data returned');
        }
    });

    return priceMap;
}

/**
 * Checks if a chain is Stellaris-based by examining its node URL
 * @param nodeUrl - The node URL to check
 * @returns true if it appears to be a Stellaris-based chain
 */
export function isStellarisBasedChain(nodeUrl: string): boolean {
    if (!nodeUrl) return false;

    // Common patterns for Stellaris-based chains
    const stellarisPatterns = [
        'stellaris',
        'halogen',
        'cstellaris',
        // Add more patterns as needed
    ];

    const lowerUrl = nodeUrl.toLowerCase();
    return stellarisPatterns.some(pattern => lowerUrl.includes(pattern));
}