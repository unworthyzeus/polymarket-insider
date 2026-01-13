/**
 * Notification Service
 * Supports: Pushover (iOS/Android), Telegram, Discord
 * 
 * Configure via environment variables:
 * - PUSHOVER_USER_KEY: Your Pushover user key
 * - PUSHOVER_API_TOKEN: Your Pushover app token
 * - TELEGRAM_BOT_TOKEN: Your Telegram bot token
 * - TELEGRAM_CHAT_ID: Your Telegram chat ID
 * - DISCORD_WEBHOOK_URL: Your Discord webhook URL
 */

/**
 * Send Pushover notification (iOS/Android app)
 * Get your keys at: https://pushover.net
 */
export async function sendPushover(alert) {
    const userKey = process.env.PUSHOVER_USER_KEY;
    const apiToken = process.env.PUSHOVER_API_TOKEN;

    if (!userKey || !apiToken) {
        console.log('Pushover not configured');
        return false;
    }

    const priority = alert.alertLevel === 'CRITICAL' ? 1 : 0;
    const sound = alert.alertLevel === 'CRITICAL' ? 'siren' : 'pushover';

    const message = formatAlertMessage(alert);

    try {
        const response = await fetch('https://api.pushover.net/1/messages.json', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                token: apiToken,
                user: userKey,
                title: `🚨 ${alert.alertLevel} - Score ${alert.score}`,
                message,
                priority,
                sound,
                url: `https://polymarket.com/event/${alert.trade.eventSlug}`,
                url_title: 'View Market'
            })
        });

        return response.ok;
    } catch (error) {
        console.error('Pushover error:', error);
        return false;
    }
}

/**
 * Send Telegram notification
 * Create bot via @BotFather, get chat ID by messaging the bot and visiting:
 * https://api.telegram.org/bot<TOKEN>/getUpdates
 */
export async function sendTelegram(alert) {
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    if (!botToken || !chatId) {
        console.log('Telegram not configured');
        return false;
    }

    const emoji = alert.alertLevel === 'CRITICAL' ? '🔴' : alert.alertLevel === 'HIGH' ? '🟠' : '🟡';

    const message = `
${emoji} *${alert.alertLevel} ALERT* - Score: ${alert.score}

*Market:* ${alert.trade.title || 'Unknown'}
*Side:* ${alert.trade.side}
*Value:* $${alert.tradeValue.toFixed(2)}
*Price:* ${alert.priceInCents.toFixed(1)}¢

*Signals:*
${alert.signals.map(s => `• ${s.type}`).join('\n')}

[View Market](https://polymarket.com/event/${alert.trade.eventSlug})
[View Wallet](https://polymarket.com/profile/${alert.trade.proxyWallet})
    `.trim();

    try {
        const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: chatId,
                text: message,
                parse_mode: 'Markdown',
                disable_web_page_preview: true
            })
        });

        return response.ok;
    } catch (error) {
        console.error('Telegram error:', error);
        return false;
    }
}

/**
 * Send Discord notification
 */
export async function sendDiscord(alert) {
    const webhookUrl = process.env.DISCORD_WEBHOOK_URL;

    if (!webhookUrl) {
        console.log('Discord not configured');
        return false;
    }

    const color = alert.alertLevel === 'CRITICAL' ? 0xFF0000 :
        alert.alertLevel === 'HIGH' ? 0xFFA500 : 0xFFFF00;

    try {
        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                embeds: [{
                    title: `🚨 ${alert.alertLevel} Alert - Score: ${alert.score}`,
                    color,
                    fields: [
                        { name: 'Market', value: alert.trade.title || 'Unknown', inline: false },
                        { name: 'Side', value: alert.trade.side, inline: true },
                        { name: 'Value', value: `$${alert.tradeValue.toFixed(2)}`, inline: true },
                        { name: 'Price', value: `${alert.priceInCents.toFixed(1)}¢`, inline: true },
                        { name: 'Signals', value: alert.signals.map(s => s.type).join(', '), inline: false }
                    ],
                    url: `https://polymarket.com/event/${alert.trade.eventSlug}`,
                    timestamp: alert.timestamp
                }]
            })
        });

        return response.ok;
    } catch (error) {
        console.error('Discord error:', error);
        return false;
    }
}

/**
 * Format alert message for text notifications
 */
function formatAlertMessage(alert) {
    return `Market: ${alert.trade.title || 'Unknown'}
Side: ${alert.trade.side}
Value: $${alert.tradeValue.toFixed(2)}
Price: ${alert.priceInCents.toFixed(1)}¢
Signals: ${alert.signals.map(s => s.type).join(', ')}`;
}

/**
 * Send notification to all configured channels
 */
export async function sendAllNotifications(alert) {
    const results = await Promise.all([
        sendPushover(alert),
        sendTelegram(alert),
        sendDiscord(alert)
    ]);

    return results.some(r => r === true);
}
