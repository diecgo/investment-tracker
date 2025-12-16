/**
 * Price Service
 * Fetches current prices from external APIs:
 * - Stocks/ETFs: Yahoo Finance (via public query endpoint)
 * - Crypto: CoinGecko (free API, no key required)
 */

interface PriceResult {
    symbol: string;
    price: number | null;
    currency: string;
    error?: string;
}

// Map of common crypto symbols to CoinGecko IDs
const CRYPTO_MAP: Record<string, string> = {
    'BTC': 'bitcoin',
    'ETH': 'ethereum',
    'SOL': 'solana',
    'ADA': 'cardano',
    'XRP': 'ripple',
    'DOT': 'polkadot',
    'DOGE': 'dogecoin',
    'AVAX': 'avalanche-2',
    'MATIC': 'matic-network',
    'LINK': 'chainlink',
    'UNI': 'uniswap',
    'ATOM': 'cosmos',
    'LTC': 'litecoin',
    'BCH': 'bitcoin-cash',
    'NEAR': 'near',
    'APT': 'aptos',
    'ARB': 'arbitrum',
    'OP': 'optimism',
};

/**
 * Fetch stock/ETF price from Yahoo Finance
 * Uses a CORS proxy to bypass browser restrictions
 */
async function fetchStockPrice(symbol: string, retries: number = 2): Promise<PriceResult> {
    try {
        // Yahoo Finance v7 Quote API
        const yahooUrl = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${encodeURIComponent(symbol)}`;

        // Use api.allorigins.win/raw (More reliable than corsproxy.io in some regions)
        const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(yahooUrl)}`;

        const response = await fetch(proxyUrl);

        if (response.status === 429 && retries > 0) {
            console.log(`Rate limited for ${symbol}, retrying in 1s...`);
            await new Promise(resolve => setTimeout(resolve, 1000));
            return fetchStockPrice(symbol, retries - 1);
        }

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        let data;
        try {
            data = await response.json();
        } catch (e) {
            throw new Error('Invalid JSON response from proxy');
        }

        const result = data.quoteResponse?.result?.[0];

        if (!result) {
            if (retries > 0) {
                await new Promise(resolve => setTimeout(resolve, 1000));
                return fetchStockPrice(symbol, retries - 1);
            }
            throw new Error('Symbol not found in Yahoo Finance');
        }

        const price = result.regularMarketPrice;
        const currency = result.currency || 'EUR';

        if (price === undefined || price === null) {
            throw new Error('Price not available');
        }

        console.log(`✓ ${symbol}: ${price} ${currency}`);

        return {
            symbol,
            price: Number(price),
            currency
        };
    } catch (error: any) {
        // Fallback to the old method (Chart API via allorigins get)
        if (retries > 0 && !error.message.includes('Fallback')) {
            console.log(`Primary method failed for ${symbol} (${error.message}), trying fallback...`);
            return fetchStockPriceFallback(symbol, retries - 1);
        }

        console.error(`✗ ${symbol}:`, error.message);
        return {
            symbol,
            price: null,
            currency: 'EUR',
            error: error.message || 'Failed to fetch price'
        };
    }
}

/**
 * Fallback method using allorigins.win and chart API (Old method)
 */
async function fetchStockPriceFallback(symbol: string, _retries: number = 1): Promise<PriceResult> {
    try {
        const yahooUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=1d`;
        const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(yahooUrl)}`;

        const response = await fetch(proxyUrl);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const proxyData = await response.json();
        if (!proxyData.contents) throw new Error('No data from proxy');

        const data = JSON.parse(proxyData.contents);
        const result = data.chart?.result?.[0];

        if (!result) throw new Error('Symbol not found');

        const price = result.meta?.regularMarketPrice;
        const currency = result.meta?.currency || 'EUR';

        if (price === null || price === undefined) throw new Error('Price not available');

        return { symbol, price: Number(price), currency };
    } catch (error: any) {
        throw new Error(`Fallback failed: ${error.message}`);
    }
}

/**
 * Fetch crypto price from CoinGecko
 */
async function fetchCryptoPrice(symbol: string): Promise<PriceResult> {
    try {
        const coinId = CRYPTO_MAP[symbol.toUpperCase()];

        if (!coinId) {
            // Try to use the symbol directly as a search term
            return {
                symbol,
                price: null,
                currency: 'EUR',
                error: `Crypto ${symbol} not recognized. Add to CRYPTO_MAP.`
            };
        }

        const url = `https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=eur`;

        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();

        if (!data[coinId]) {
            throw new Error('Coin not found');
        }

        const price = data[coinId].eur;

        return {
            symbol,
            price: Number(price),
            currency: 'EUR'
        };
    } catch (error: any) {
        console.error(`Error fetching crypto ${symbol}:`, error);
        return {
            symbol,
            price: null,
            currency: 'EUR',
            error: error.message || 'Failed to fetch price'
        };
    }
}

/**
 * Fetch price based on investment type
 */
export async function fetchPrice(symbol: string, type: string): Promise<PriceResult> {
    if (type === 'Crypto') {
        return fetchCryptoPrice(symbol);
    } else {
        return fetchStockPrice(symbol);
    }
}

/**
 * Fetch multiple prices at once
 */
export async function fetchMultiplePrices(
    investments: Array<{ symbol: string; type: string }>
): Promise<Map<string, PriceResult>> {
    const results = new Map<string, PriceResult>();

    // Process sequentially with larger delays to avoid rate limiting
    for (let i = 0; i < investments.length; i++) {
        const inv = investments[i];

        // Add 500ms delay between requests (skip first)
        if (i > 0) {
            await new Promise(resolve => setTimeout(resolve, 500));
        }

        const result = await fetchPrice(inv.symbol, inv.type);
        results.set(inv.symbol, result);
    }

    return results;
}

/**
 * Convert USD price to EUR
 * Uses a fixed approximate rate for simplicity
 * In production, you'd want to fetch the current exchange rate
 */
export function convertUsdToEur(usdPrice: number, rate: number = 0.92): number {
    return usdPrice * rate;
}
