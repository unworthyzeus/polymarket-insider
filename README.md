# Polymarket Insider Detector - Vercel Edition

A real-time insider trading detector for Polymarket with phone notifications.

## Features

- 🔄 **Automatic Monitoring** - Cron job runs every 5 minutes
- 📱 **Phone Notifications** - Pushover, Telegram, or Discord
- 🎯 **Sports Filtering** - Focuses on politics, crypto, and tech markets
- 📊 **Web Dashboard** - View alerts in real-time
- 🚨 **Smart Scoring** - Multi-signal detection system

## Quick Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/YOUR_USERNAME/polymarket-insider-vercel)

## Setup Instructions

### 1. Deploy to Vercel

```bash
cd polymarket-insider-vercel
npm install
vercel
```

### 2. Configure Notifications

Choose one or more notification methods:

#### Option A: Pushover (Recommended for iOS/Android)

1. Download [Pushover app](https://pushover.net) on your phone
2. Create account and get your **User Key**
3. Create an application to get your **API Token**
4. Add to Vercel Environment Variables:
   - `PUSHOVER_USER_KEY` = your user key
   - `PUSHOVER_API_TOKEN` = your app token

#### Option B: Telegram Bot

1. Message [@BotFather](https://t.me/BotFather) on Telegram
2. Create a new bot with `/newbot`
3. Copy the **Bot Token**
4. Start a chat with your bot, then visit:
   `https://api.telegram.org/bot<TOKEN>/getUpdates`
5. Find your **Chat ID** in the response
6. Add to Vercel Environment Variables:
   - `TELEGRAM_BOT_TOKEN` = your bot token
   - `TELEGRAM_CHAT_ID` = your chat ID

#### Option C: Discord Webhook

1. In Discord, go to Server Settings → Integrations → Webhooks
2. Create a new webhook and copy the URL
3. Add to Vercel Environment Variables:
   - `DISCORD_WEBHOOK_URL` = your webhook URL

### 3. Enable Cron Jobs

Vercel Pro/Enterprise is required for cron jobs. The free tier allows manual triggering.

For Vercel Pro, cron is automatically configured via `vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/cron",
      "schedule": "*/5 * * * *"
    }
  ]
}
```

### 4. Test Your Setup

Visit your deployed site and click "📱 Test Notification" to verify everything works.

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `PUSHOVER_USER_KEY` | Pushover user key | Optional |
| `PUSHOVER_API_TOKEN` | Pushover app token | Optional |
| `TELEGRAM_BOT_TOKEN` | Telegram bot token | Optional |
| `TELEGRAM_CHAT_ID` | Telegram chat ID | Optional |
| `DISCORD_WEBHOOK_URL` | Discord webhook URL | Optional |
| `CRON_SECRET` | Secret for cron auth (optional security) | Optional |

## API Endpoints

- `GET /api/alerts` - Fetch current alerts
- `GET /api/cron` - Run detection (called by Vercel cron)
- `POST /api/test-notification` - Send test notification

## Detection Signals

| Signal | Score | Description |
|--------|-------|-------------|
| FRESH_WALLET | +30 | Wallet has traded ≤4 markets |
| NEW_WALLET | +20 | Wallet is <30 days old |
| EXTREME_WHALE | +60 | Trade >$10,000 |
| WHALE_TRADE | +40 | Trade >$5,000 |
| EXTREME_LOW_ENTRY | +35 | Buying at <10¢ |
| LOW_PRICE_ENTRY | +20 | Buying at <15¢ |
| ANONYMOUS | +20 | No username set |

## Alert Levels

- **CRITICAL** (Score ≥100): Immediate notification
- **HIGH** (Score ≥75): Immediate notification
- **MEDIUM** (Score ≥50): Dashboard only

## Limitations

- Free Vercel tier: No automatic cron, manual refresh only
- Vercel Pro: Cron runs every 5 minutes minimum
- Historical wallet data may be limited by Polymarket API

## License

MIT
