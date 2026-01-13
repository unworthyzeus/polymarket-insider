/**
 * Polymarket API Client for Vercel Edge Functions
 */

const DATA_API_BASE = 'https://data-api.polymarket.com';
const GAMMA_API_BASE = 'https://gamma-api.polymarket.com';

/**
 * Fetch recent trades
 */
export async function getTrades(options = {}) {
    const params = new URLSearchParams();

    if (options.limit) params.append('limit', options.limit);
    if (options.offset) params.append('offset', options.offset);
    if (options.market) params.append('market', options.market);
    if (options.user) params.append('user', options.user);
    if (options.start) params.append('start', options.start);
    if (options.end) params.append('end', options.end);
    if (options.filterType) params.append('filterType', options.filterType);
    if (options.filterAmount) params.append('filterAmount', options.filterAmount);
    if (options.sortBy) params.append('sortBy', options.sortBy);
    if (options.sortDirection) params.append('sortDirection', options.sortDirection);

    const url = `${DATA_API_BASE}/trades?${params.toString()}`;
    const response = await fetch(url, {
        headers: { 'Accept': 'application/json' }
    });

    if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
    }

    return response.json();
}

/**
 * Get user trades
 */
export async function getUserTrades(userAddress, options = {}) {
    return getTrades({ ...options, user: userAddress });
}

/**
 * Get large trades
 */
export async function getLargeTrades(minCash = 1000, options = {}) {
    return getTrades({
        ...options,
        filterType: 'CASH',
        filterAmount: minCash,
        sortBy: 'CASH',
        sortDirection: 'DESC'
    });
}

/**
 * Get market info
 */
export async function getMarketByConditionId(conditionId) {
    const url = `${GAMMA_API_BASE}/markets?conditionId=${conditionId}`;
    const response = await fetch(url);
    if (!response.ok) return null;
    const markets = await response.json();
    return markets[0] || null;
}
