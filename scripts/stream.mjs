/**
 * Polymarket Real-time Trade Stream (ESM)
 * 
 * This script connects to Polymarket's WebSocket feed to analyze all trades in real-time.
 * It uses the same detection logic as the Vercel cron job but provides 24/7 monitoring.
 * 
 * Usage: node scripts/stream.mjs
 */

import WebSocket from 'ws';
import { analyzeTrades } from '../lib/detector.js';
import { sendAllNotifications } from '../lib/notifications.js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '../.env.local') });

// Constants
const WSS_URL = 'wss://ws-live-data.polymarket.com'; // RTDS endpoint
const RECONNECT_DELAY = 5000;

let tradesBuffer = [];
const BUFFER_SIZE = 5; // Process in small batches for real-time feel

async function connect() {
    console.log(`\n🚀 Starting Polymarket Real-time Stream...`);
    console.log(`📍 Connecting to: ${WSS_URL}`);

    const ws = new WebSocket(WSS_URL);

    ws.on('open', () => {
        console.log('✅ Connected to Polymarket WebSocket');

        // Subscribe to activity feed (includes trades)
        const subMsg = {
            type: 'subscribe',
            topic: 'activity'
        };
        ws.send(JSON.stringify(subMsg));
        console.log('📡 Subscribed to activity feed (All Trades)');

        // Ping every 20 seconds to keep alive
        const pingInterval = setInterval(() => {
            if (ws.readyState === WebSocket.OPEN) {
                ws.ping();
            }
        }, 20000);

        ws.on('close', () => {
            clearInterval(pingInterval);
        });
    });

    ws.on('message', async (data) => {
        try {
            const message = JSON.parse(data.toString());

            // Check if it's a trade activity
            if (message.type === 'activity' && message.activity_type === 'trade') {
                const trade = message.data;

                // Polymarket RTDS format to Detector format
                const formattedTrade = {
                    title: trade.market_title || trade.title || 'Unknown',
                    eventSlug: trade.event_slug || '',
                    side: (trade.side || 'buy').toUpperCase(),
                    size: parseFloat(trade.size || 0),
                    price: parseFloat(trade.price || 0),
                    timestamp: Math.floor(Date.now() / 1000),
                    proxyWallet: trade.proxy_wallet || trade.user_address || '0x000...',
                    proxyWalletName: trade.proxy_wallet_name || trade.user_name || null,
                    slug: trade.slug || trade.event_slug || '',
                    conditionId: trade.condition_id
                };

                // Skip if size or price is missing
                if (!formattedTrade.size || !formattedTrade.price) return;

                tradesBuffer.push(formattedTrade);

                if (tradesBuffer.length >= BUFFER_SIZE) {
                    await processBuffer();
                }
            }
        } catch (error) {
            console.error('❌ Error processing message:', error);
        }
    });

    ws.on('error', (error) => {
        console.error('❌ WebSocket error:', error.message);
    });

    ws.on('close', () => {
        console.log(`⚠️ WebSocket closed. Reconnecting in ${RECONNECT_DELAY / 1000}s...`);
        setTimeout(connect, RECONNECT_DELAY);
    });
}

async function processBuffer() {
    const tradesToProcess = [...tradesBuffer];
    tradesBuffer = [];

    // console.log(`🔍 Analyzing ${tradesToProcess.length} trades from stream...`);

    try {
        const result = await analyzeTrades(tradesToProcess);

        for (const alert of result.alerts) {
            // Log every alert found to console
            const color = alert.alertLevel === 'CRITICAL' ? '\x1b[31m' : alert.alertLevel === 'HIGH' ? '\x1b[33m' : '\x1b[36m';
            const reset = '\x1b[0m';

            console.log(`${color}[${alert.alertLevel}]${reset} Score ${alert.score} | ${alert.trade.title} | $${alert.tradeValue.toFixed(2)}`);

            // Send notifications for HIGH and CRITICAL
            if (alert.alertLevel === 'CRITICAL' || alert.alertLevel === 'HIGH') {
                console.log(`📤 Sending ${alert.alertLevel} notification...`);
                await sendAllNotifications(alert);
            }
        }
    } catch (error) {
        console.error('❌ Error during analysis:', error);
    }
}

// Global error handling
process.on('uncaughtException', (err) => {
    console.error('💥 Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
});

connect();
