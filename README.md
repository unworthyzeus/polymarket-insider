# 🔍 Polymarket Insider Detector

Real-time detection of suspicious trading activity on Polymarket. Now upgraded with **WebSocket Streaming** for 100% trade coverage and a **Premium Dashboard**.

## 🚀 Key Improvements

1.  **WebSocket Streaming**: Switched from polling to Polymarket's RTDS Activity Feed. Analyzes every single trade in real-time (~20 trades/sec).
2.  **Premium UI**: New dashboard with Glassmorphism, Inter typography, and improved mobile responsiveness.
3.  **Hetzner/VPS Optimized**: Designed to run as a persistent process on a VPS for continuous monitoring.

## 🛠️ Architecture

The system now supports two modes:
-   **Live Stream (Recommended)**: A persistent Node.js script (`scripts/stream.mjs`) that consumes the Polymarket WebSocket. Best for catching everything.
-   **Vercel Cron (Backup)**: A serverless function (`pages/api/cron.js`) that polls the API every 5 minutes. Best for low-maintenance monitoring.

## 📦 Setup

### 1. Environment Variables
Copy `.env.example` to `.env.local` and fill in your notification keys (Pushover, Telegram, or Discord).

```bash
PUSHOVER_USER_KEY=
PUSHOVER_API_TOKEN=
TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=
DISCORD_WEBHOOK_URL=
```

### 2. Live Stream (VPS)
To run the real-time analyzer (recommended for 100% coverage):
```bash
npm install
node scripts/stream.mjs
```
*Note: We recommend using `pm2` to keep the process alive on your VPS.*

### 3. Dashboard (Vercel)
To deploy the monitoring dashboard:
```bash
npm install
npm run dev
```

## 📊 Detection Logic
The system scores trades based on:
-   **Wallet Freshness**: New wallets with no previous history.
-   **Trade Size**: Large swaps ($1,000+) and Whale moves ($5,000+).
-   **Low Entry**: Buying into outcomes with <10% probability.
-   **Market Type**: Filtering out noise (sports) to focus on politics/crypto/insider-prone events.

## 📱 Notifications
Get instant alerts on your phone via:
-   **Pushover**: High-priority alerts with custom sounds.
-   **Telegram**: Rich markdown messages with quick links to markets and wallets.
-   **Discord**: Detailed embeds with color-coded severity.

## 🛰️ Scaling & Future Roadmap (Elies' Suggestions)

Following the architectural advice from Elies, the system is designed to scale beyond simple alerts. Here is the plan for full market coverage:

### 1. Full Market Analysis
- **Volume**: Polymarket generates ~50M trades per month (~20 per second).
- **Goal**: Analyze 100% of these trades without filtering.
- **Current Status**: The `stream.mjs` script is already capable of capturing this volume, but requires a stable environment to prevent disconnections.

### 2. VPS Deployment (Hetzner $5 Strategy)
- Running this 24/7 on serverless (Vercel/Cloudflare) is inefficient and expensive.
- **Implementation**: Deploy the `stream.mjs` on a $5/month VPS (like Hetzner or DigitalOcean).
- **Tooling**: Use `pm2` for process persistence and automatic restarts.

### 3. Local High-Performance Database
- Services like Convex (Free Tier) often require filtering down to 1-2% of trades to stay within limits.
- **The Upgrade**: Integrate a local **PostgreSQL or SQLite** database directly on the VPS.
- **Benefit**: Store and index 100% of trades locally. This allows for:
    - Long-term wallet tracking (identifying "serial" insiders).
    - Statistical analysis of win rates across 50M+ events.
    - Historical backtesting of detection signals.

### 4. Advanced Wallet Profiling
- Transition from "Snapshot Scoring" (one trade) to "Behavioral Scoring" (history of a wallet over months).
- Database-backed lookups for every new proxy wallet detected in the stream.

## ⚠️ Credits & Discussion
Based on the insights from **Elies Telecos** regarding the WebSocket endpoint and VPS-based database storage. This move from crons/polling to persistent streaming is what allows for true "Insider Detection" at scale.

---
*Created for real-time monitoring of prediction markets.*
