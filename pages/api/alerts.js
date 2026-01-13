/**
 * Alerts API Route
 * Returns current alerts for the dashboard
 */

import { getTrades } from '@/lib/api.js';
import { analyzeTrades, CONFIG } from '@/lib/detector.js';

export default async function handler(req, res) {
    // Allow CORS for dashboard
    res.setHeader('Access-Control-Allow-Origin', '*');

    try {
        // Get trades from last 24 hours
        const startTime = Math.floor(Date.now() / 1000 - 86400);

        const trades = await getTrades({
            start: startTime,
            limit: 500,
            filterType: 'CASH',
            filterAmount: CONFIG.minSuspiciousTradeSizeUSD,
            sortBy: 'CASH',
            sortDirection: 'DESC'
        });

        const result = await analyzeTrades(trades);

        return res.status(200).json({
            alerts: result.alerts.slice(0, 50),
            stats: {
                tradesAnalyzed: trades.length,
                sportsFiltered: result.sportsFiltered,
                alertsGenerated: result.alerts.length,
                critical: result.alerts.filter(a => a.alertLevel === 'CRITICAL').length,
                high: result.alerts.filter(a => a.alertLevel === 'HIGH').length,
                medium: result.alerts.filter(a => a.alertLevel === 'MEDIUM').length
            },
            lastUpdated: new Date().toISOString()
        });

    } catch (error) {
        console.error('Alerts API error:', error);
        return res.status(500).json({
            error: 'Failed to fetch alerts',
            message: error.message
        });
    }
}
