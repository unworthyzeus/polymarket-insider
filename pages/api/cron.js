/**
 * Cron Job API Route
 * Runs every 5 minutes via Vercel Cron
 * Checks for suspicious trades and sends notifications
 */

import { getTrades } from '@/lib/api.js';
import { analyzeTrades, CONFIG } from '@/lib/detector.js';
import { sendAllNotifications } from '@/lib/notifications.js';

// Store last checked timestamp (in production, use a database like Vercel KV)
let lastTimestamp = null;

export default async function handler(req, res) {
    // Verify this is a cron request (optional security)
    const authHeader = req.headers.authorization;
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        // Allow in development
        if (process.env.NODE_ENV === 'production') {
            return res.status(401).json({ error: 'Unauthorized' });
        }
    }

    try {
        // Get trades from last 10 minutes (with some overlap for safety)
        const startTime = lastTimestamp || Math.floor(Date.now() / 1000 - 600);

        console.log(`Fetching trades since ${new Date(startTime * 1000).toISOString()}`);

        // Fetch large trades (potential whales)
        const trades = await getTrades({
            start: startTime,
            limit: 200,
            filterType: 'CASH',
            filterAmount: CONFIG.minSuspiciousTradeSizeUSD,
            sortBy: 'TIMESTAMP',
            sortDirection: 'DESC'
        });

        console.log(`Found ${trades.length} trades above $${CONFIG.minSuspiciousTradeSizeUSD}`);

        // Update last timestamp
        if (trades.length > 0) {
            lastTimestamp = Math.max(...trades.map(t => t.timestamp));
        } else {
            lastTimestamp = Math.floor(Date.now() / 1000);
        }

        // Analyze trades
        const result = await analyzeTrades(trades);

        console.log(`Analysis complete: ${result.alerts.length} alerts, ${result.sportsFiltered} sports filtered`);

        // Send notifications for HIGH and CRITICAL alerts
        const notificationResults = [];
        for (const alert of result.alerts) {
            if (alert.alertLevel === 'CRITICAL' || alert.alertLevel === 'HIGH') {
                console.log(`Sending notification for ${alert.alertLevel} alert: ${alert.trade.title}`);
                const sent = await sendAllNotifications(alert);
                notificationResults.push({
                    market: alert.trade.title,
                    level: alert.alertLevel,
                    score: alert.score,
                    notified: sent
                });
            }
        }

        return res.status(200).json({
            success: true,
            timestamp: new Date().toISOString(),
            tradesChecked: trades.length,
            alertsGenerated: result.alerts.length,
            notificationsSent: notificationResults.length,
            notifications: notificationResults,
            summary: {
                critical: result.alerts.filter(a => a.alertLevel === 'CRITICAL').length,
                high: result.alerts.filter(a => a.alertLevel === 'HIGH').length,
                medium: result.alerts.filter(a => a.alertLevel === 'MEDIUM').length,
                sportsFiltered: result.sportsFiltered
            }
        });

    } catch (error) {
        console.error('Cron error:', error);
        return res.status(500).json({
            error: 'Internal error',
            message: error.message
        });
    }
}
