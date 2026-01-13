/**
 * Test Notifications API Route
 * Sends a test notification to verify your setup
 */

import { sendPushover, sendTelegram, sendDiscord } from '@/lib/notifications.js';

export default async function handler(req, res) {
    // Allow GET for easy testing in browser
    if (req.method !== 'POST' && req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // Check which services are configured
    const configured = {
        telegram: !!(process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID),
        pushover: !!(process.env.PUSHOVER_USER_KEY && process.env.PUSHOVER_API_TOKEN),
        discord: !!process.env.DISCORD_WEBHOOK_URL
    };

    // Create a test alert
    const testAlert = {
        alertLevel: 'HIGH',
        score: 85,
        tradeValue: 5000.00,
        priceInCents: 7.5,
        signals: [
            { type: 'FRESH_WALLET' },
            { type: 'WHALE_TRADE' },
            { type: 'LOW_PRICE_ENTRY' }
        ],
        trade: {
            title: '🧪 TEST ALERT - Insider Detector Working!',
            side: 'BUY',
            eventSlug: 'test-event',
            proxyWallet: '0x1234567890abcdef'
        },
        timestamp: new Date().toISOString()
    };

    const results = {
        telegram: configured.telegram ? await sendTelegram(testAlert) : 'not_configured',
        pushover: configured.pushover ? await sendPushover(testAlert) : 'not_configured',
        discord: configured.discord ? await sendDiscord(testAlert) : 'not_configured'
    };

    const anyConfigured = Object.values(configured).some(c => c === true);
    const anySent = Object.values(results).some(r => r === true);

    // Build helpful message
    let message;
    if (!anyConfigured) {
        message = 'No notification services configured. Add TELEGRAM_BOT_TOKEN + TELEGRAM_CHAT_ID to your .env.local file.';
    } else if (anySent) {
        message = 'Test notification sent! Check your phone/app.';
    } else {
        message = 'Notification configured but failed to send. Check your tokens/IDs.';
    }

    return res.status(anySent || !anyConfigured ? 200 : 500).json({
        success: anySent,
        configured,
        results,
        message,
        help: {
            telegram: 'Set TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID',
            pushover: 'Set PUSHOVER_USER_KEY and PUSHOVER_API_TOKEN',
            discord: 'Set DISCORD_WEBHOOK_URL'
        }
    });
}

