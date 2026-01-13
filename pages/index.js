import { useState, useEffect } from 'react';
import Head from 'next/head';

export default function Home() {
    const [alerts, setAlerts] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [lastUpdate, setLastUpdate] = useState(null);
    const [testStatus, setTestStatus] = useState(null);

    const fetchAlerts = async () => {
        try {
            const res = await fetch('/api/alerts');
            const data = await res.json();
            setAlerts(data.alerts || []);
            setStats(data.stats || null);
            setLastUpdate(new Date().toLocaleTimeString());
        } catch (error) {
            console.error('Error fetching alerts:', error);
        } finally {
            setLoading(false);
        }
    };

    const testNotification = async () => {
        setTestStatus('sending');
        try {
            const res = await fetch('/api/test-notification', { method: 'POST' });
            const data = await res.json();
            setTestStatus(data.success ? 'success' : 'failed');
            setTimeout(() => setTestStatus(null), 3000);
        } catch (error) {
            setTestStatus('failed');
            setTimeout(() => setTestStatus(null), 3000);
        }
    };

    useEffect(() => {
        fetchAlerts();
        const interval = setInterval(fetchAlerts, 30000);
        return () => clearInterval(interval);
    }, []);

    return (
        <>
            <Head>
                <title>Polymarket Insider Detector</title>
                <meta name="description" content="Real-time detection of insider trading on Polymarket" />
                <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🔍</text></svg>" />
            </Head>

            <div className="container">
                <header>
                    <h1>🔍 Polymarket Insider Detector</h1>
                    <p className="subtitle">Real-time detection of suspicious trading activity</p>
                </header>

                <div className="stats-grid">
                    <div className="stat-card">
                        <div className="stat-value">{stats?.alertsGenerated ?? '--'}</div>
                        <div className="stat-label">Alerts (24h)</div>
                    </div>
                    <div className="stat-card critical">
                        <div className="stat-value">{stats?.critical ?? '--'}</div>
                        <div className="stat-label">Critical</div>
                    </div>
                    <div className="stat-card high">
                        <div className="stat-value">{stats?.high ?? '--'}</div>
                        <div className="stat-label">High</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-value">{stats?.tradesAnalyzed ?? '--'}</div>
                        <div className="stat-label">Trades Analyzed</div>
                    </div>
                </div>

                <div className="controls">
                    <button onClick={fetchAlerts} className="btn">
                        🔄 Refresh
                    </button>
                    <button
                        onClick={testNotification}
                        className={`btn ${testStatus === 'success' ? 'success' : testStatus === 'failed' ? 'error' : ''}`}
                        disabled={testStatus === 'sending'}
                    >
                        {testStatus === 'sending' ? '📤 Sending...' :
                            testStatus === 'success' ? '✅ Sent!' :
                                testStatus === 'failed' ? '❌ Check Config' :
                                    '📱 Test Notification'}
                    </button>
                    <span className="last-update">
                        Last update: {lastUpdate || '--'}
                    </span>
                </div>

                <div className="alerts-container">
                    {loading ? (
                        <div className="loading">Loading alerts...</div>
                    ) : alerts.length === 0 ? (
                        <div className="no-alerts">
                            <span className="emoji">✅</span>
                            <p>No suspicious activity detected in the last 24 hours</p>
                        </div>
                    ) : (
                        alerts.map((alert, idx) => (
                            <div key={idx} className={`alert ${alert.alertLevel.toLowerCase()}`}>
                                <div className="alert-header">
                                    <span className="score">Score: {alert.score}</span>
                                    <span className={`level level-${alert.alertLevel.toLowerCase()}`}>
                                        {alert.alertLevel}
                                    </span>
                                </div>

                                <h3 className="market-title">{alert.trade.title || 'Unknown Market'}</h3>

                                <div className="trade-details">
                                    <div className="detail">
                                        <span className="label">Side</span>
                                        <span className={`value ${alert.trade.side.toLowerCase()}`}>
                                            {alert.trade.side}
                                        </span>
                                    </div>
                                    <div className="detail">
                                        <span className="label">Value</span>
                                        <span className="value">${alert.tradeValue?.toFixed(2)}</span>
                                    </div>
                                    <div className="detail">
                                        <span className="label">Price</span>
                                        <span className="value">{alert.priceInCents?.toFixed(1)}¢</span>
                                    </div>
                                    <div className="detail">
                                        <span className="label">Time</span>
                                        <span className="value">{new Date(alert.timestamp).toLocaleString()}</span>
                                    </div>
                                </div>

                                <div className="signals">
                                    {alert.signals?.map((signal, i) => (
                                        <span key={i} className={`signal ${signal.severity}`}>
                                            {signal.type}
                                        </span>
                                    ))}
                                </div>

                                <div className="links">
                                    <a href={`https://polymarket.com/event/${alert.trade.eventSlug}`} target="_blank" rel="noopener noreferrer">
                                        📊 Market
                                    </a>
                                    <a href={`https://polymarket.com/profile/${alert.trade.proxyWallet}`} target="_blank" rel="noopener noreferrer">
                                        👤 Wallet
                                    </a>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                <footer>
                    <p>Cron runs every 5 minutes • Phone notifications via Pushover/Telegram/Discord</p>
                </footer>
            </div>

            <style jsx>{`
                .container {
                    min-height: 100vh;
                    background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
                    color: #e0e0e0;
                    padding: 20px;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                }

                header {
                    text-align: center;
                    padding: 30px 0;
                }

                h1 {
                    font-size: 2.5rem;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    margin-bottom: 10px;
                }

                .subtitle {
                    color: #888;
                }

                .stats-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
                    gap: 15px;
                    margin-bottom: 20px;
                    max-width: 800px;
                    margin-left: auto;
                    margin-right: auto;
                }

                .stat-card {
                    background: rgba(255, 255, 255, 0.05);
                    border-radius: 12px;
                    padding: 20px;
                    text-align: center;
                    border: 1px solid rgba(255, 255, 255, 0.1);
                }

                .stat-card.critical { border-color: #ff4757; }
                .stat-card.high { border-color: #ffa502; }

                .stat-value {
                    font-size: 2rem;
                    font-weight: bold;
                    color: #667eea;
                }

                .stat-card.critical .stat-value { color: #ff4757; }
                .stat-card.high .stat-value { color: #ffa502; }

                .stat-label {
                    color: #888;
                    font-size: 0.85rem;
                    margin-top: 5px;
                }

                .controls {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 15px;
                    margin-bottom: 20px;
                    flex-wrap: wrap;
                }

                .btn {
                    padding: 10px 20px;
                    background: rgba(102, 126, 234, 0.2);
                    border: 1px solid rgba(102, 126, 234, 0.4);
                    border-radius: 8px;
                    color: #667eea;
                    cursor: pointer;
                    font-size: 0.9rem;
                    transition: all 0.2s;
                }

                .btn:hover {
                    background: rgba(102, 126, 234, 0.3);
                }

                .btn.success {
                    background: rgba(0, 200, 83, 0.2);
                    border-color: #00c853;
                    color: #00c853;
                }

                .btn.error {
                    background: rgba(255, 71, 87, 0.2);
                    border-color: #ff4757;
                    color: #ff4757;
                }

                .last-update {
                    color: #666;
                    font-size: 0.85rem;
                }

                .alerts-container {
                    max-width: 800px;
                    margin: 0 auto;
                }

                .loading, .no-alerts {
                    text-align: center;
                    padding: 60px 20px;
                    color: #888;
                }

                .no-alerts .emoji {
                    font-size: 3rem;
                    display: block;
                    margin-bottom: 10px;
                }

                .alert {
                    background: rgba(255, 255, 255, 0.05);
                    border-radius: 12px;
                    padding: 20px;
                    margin-bottom: 15px;
                    border-left: 4px solid #667eea;
                }

                .alert.critical {
                    border-left-color: #ff4757;
                    background: rgba(255, 71, 87, 0.1);
                }

                .alert.high {
                    border-left-color: #ffa502;
                }

                .alert-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 10px;
                }

                .score {
                    font-weight: bold;
                    font-size: 1.1rem;
                }

                .level {
                    padding: 4px 12px;
                    border-radius: 20px;
                    font-size: 0.75rem;
                    font-weight: bold;
                }

                .level-critical { background: #ff4757; color: white; }
                .level-high { background: #ffa502; color: black; }
                .level-medium { background: #ffd93d; color: black; }

                .market-title {
                    font-size: 1.1rem;
                    margin-bottom: 15px;
                    color: #fff;
                }

                .trade-details {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
                    gap: 10px;
                    margin-bottom: 15px;
                }

                .detail {
                    background: rgba(0, 0, 0, 0.2);
                    padding: 8px 12px;
                    border-radius: 6px;
                }

                .detail .label {
                    font-size: 0.7rem;
                    color: #888;
                    text-transform: uppercase;
                    display: block;
                }

                .detail .value {
                    color: #fff;
                }

                .detail .value.buy { color: #00c853; }
                .detail .value.sell { color: #ff4757; }

                .signals {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 8px;
                    margin-bottom: 15px;
                }

                .signal {
                    padding: 4px 10px;
                    background: rgba(102, 126, 234, 0.2);
                    border: 1px solid rgba(102, 126, 234, 0.4);
                    border-radius: 15px;
                    font-size: 0.7rem;
                    color: #667eea;
                }

                .signal.high, .signal.critical {
                    background: rgba(255, 71, 87, 0.2);
                    border-color: rgba(255, 71, 87, 0.4);
                    color: #ff4757;
                }

                .links {
                    display: flex;
                    gap: 15px;
                }

                .links a {
                    color: #667eea;
                    text-decoration: none;
                    font-size: 0.85rem;
                }

                .links a:hover {
                    text-decoration: underline;
                }

                footer {
                    text-align: center;
                    padding: 30px;
                    color: #555;
                    font-size: 0.85rem;
                }
            `}</style>
        </>
    );
}
