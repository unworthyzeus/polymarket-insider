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

            <div className="dashboard">
                <header className="header">
                    <div className="header-content">
                        <div className="logo-container">
                            <span className="logo-emoji">🔍</span>
                            <h1>Polymarket Insider</h1>
                        </div>
                        <p className="subtitle">Real-time detection of suspicious trading activity</p>
                    </div>
                </header>

                <main className="content">
                    <section className="stats-section">
                        <div className="stats-grid">
                            <div className="stat-card">
                                <span className="stat-label">Alerts (24h)</span>
                                <div className="stat-value">{stats?.alertsGenerated ?? '0'}</div>
                            </div>
                            <div className="stat-card critical">
                                <span className="stat-label">Critical</span>
                                <div className="stat-value">{stats?.critical ?? '0'}</div>
                            </div>
                            <div className="stat-card high">
                                <span className="stat-label">High</span>
                                <div className="stat-value">{stats?.high ?? '0'}</div>
                            </div>
                            <div className="stat-card analyzed">
                                <span className="stat-label">Analyzed</span>
                                <div className="stat-value">{stats?.tradesAnalyzed ?? '0'}</div>
                            </div>
                        </div>
                    </section>

                    <div className="actions-bar">
                        <div className="actions-left">
                            <button onClick={fetchAlerts} className="btn-action refresh">
                                <span className="btn-icon">🔄</span>
                                <span>Refresh</span>
                            </button>
                            <button
                                onClick={testNotification}
                                className={`btn-action test ${testStatus || ''}`}
                                disabled={testStatus === 'sending'}
                            >
                                <span className="btn-icon">{
                                    testStatus === 'sending' ? '📤' :
                                        testStatus === 'success' ? '✅' :
                                            testStatus === 'failed' ? '❌' : '📱'
                                }</span>
                                <span>{
                                    testStatus === 'sending' ? 'Sending...' :
                                        testStatus === 'success' ? 'Sent!' :
                                            testStatus === 'failed' ? 'Error' : 'Test'
                                }</span>
                            </button>
                        </div>
                        <div className="last-update">
                            <span className="dot pulse"></span>
                            Live Updates • {lastUpdate || '--'}
                        </div>
                    </div>

                    <div className="alerts-feed">
                        {loading ? (
                            <div className="loading-state">
                                <div className="spinner"></div>
                                <p>Scanning markets...</p>
                            </div>
                        ) : alerts.length === 0 ? (
                            <div className="empty-state">
                                <div className="empty-icon">✅</div>
                                <h3>All Clear</h3>
                                <p>No suspicious activity detected in the last 24 hours.</p>
                            </div>
                        ) : (
                            <div className="alerts-list">
                                {alerts.map((alert, idx) => (
                                    <div key={idx} className={`alert-card ${alert.alertLevel.toLowerCase()}`}>
                                        <div className="alert-header">
                                            <div className="market-info">
                                                <h3 className="market-title">{alert.trade.title || 'Unknown Market'}</h3>
                                                <span className={`badge level-${alert.alertLevel.toLowerCase()}`}>
                                                    {alert.alertLevel}
                                                </span>
                                            </div>
                                            <div className="alert-score">
                                                <span className="score-label">TRUST SCORE</span>
                                                <span className="score-value">{alert.score}</span>
                                            </div>
                                        </div>

                                        <div className="trade-meta">
                                            <div className="meta-item">
                                                <span className="label">SIDE</span>
                                                <span className={`value side-${alert.trade.side.toLowerCase()}`}>
                                                    {alert.trade.side}
                                                </span>
                                            </div>
                                            <div className="meta-item">
                                                <span className="label">VALUE</span>
                                                <span className="value highlighting">${alert.tradeValue?.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                            </div>
                                            <div className="meta-item">
                                                <span className="label">PRICE</span>
                                                <span className="value">{alert.priceInCents?.toFixed(1)}¢</span>
                                            </div>
                                            <div className="meta-item time">
                                                <span className="label">DETECTED</span>
                                                <span className="value">{new Date(alert.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                            </div>
                                        </div>

                                        <div className="signals-container">
                                            {alert.signals?.map((signal, i) => (
                                                <span key={i} className={`signal-tag ${signal.severity}`}>
                                                    {signal.type.replace(/_/g, ' ')}
                                                </span>
                                            ))}
                                        </div>

                                        <div className="card-footer">
                                            <a href={`https://polymarket.com/event/${alert.trade.eventSlug}`} target="_blank" rel="noopener noreferrer" className="footer-link">
                                                <span className="link-icon">📊</span> View Market
                                            </a>
                                            <a href={`https://polymarket.com/profile/${alert.trade.proxyWallet}`} target="_blank" rel="noopener noreferrer" className="footer-link">
                                                <span className="link-icon">👤</span> View Wallet
                                            </a>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </main>

                <footer className="footer">
                    <p>Continuous monitoring powered by Polymarket WebSockets • Running on decentralized infra</p>
                </footer>
            </div>

            <style jsx global>{`
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

                :root {
                    --bg-dark: #0a0b10;
                    --card-bg: rgba(23, 25, 35, 0.7);
                    --border-color: rgba(255, 255, 255, 0.08);
                    --accent-blue: #3b82f6;
                    --accent-purple: #8b5cf6;
                    --critical-red: #ef4444;
                    --high-orange: #f59e0b;
                    --text-primary: #f8fafc;
                    --text-secondary: #94a3b8;
                    --buy-green: #22c55e;
                }

                * {
                    box-sizing: border-box;
                    margin: 0;
                    padding: 0;
                }

                body {
                    background-color: var(--bg-dark);
                    color: var(--text-primary);
                    font-family: 'Inter', -apple-system, sans-serif;
                    -webkit-font-smoothing: antialiased;
                }

                .dashboard {
                    min-height: 100vh;
                    background: 
                        radial-gradient(circle at 0% 0%, rgba(59, 130, 246, 0.05) 0%, transparent 50%),
                        radial-gradient(circle at 100% 100%, rgba(139, 92, 246, 0.05) 0%, transparent 50%),
                        var(--bg-dark);
                    padding-bottom: 40px;
                }

                .header {
                    padding: 40px 20px;
                    text-align: center;
                }

                .logo-container {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 12px;
                    margin-bottom: 8px;
                }

                .logo-emoji {
                    font-size: 2.5rem;
                    filter: drop-shadow(0 0 10px rgba(59, 130, 246, 0.3));
                }

                h1 {
                    font-size: 2.5rem;
                    font-weight: 800;
                    letter-spacing: -0.025em;
                    background: linear-gradient(to right, #60a5fa, #a78bfa);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                }

                .subtitle {
                    color: var(--text-secondary);
                    font-size: 1.1rem;
                }

                .content {
                    max-width: 900px;
                    margin: 0 auto;
                    padding: 0 20px;
                }

                .stats-section {
                    margin-bottom: 32px;
                }

                .stats-grid {
                    display: grid;
                    grid-template-columns: repeat(4, 1fr);
                    gap: 16px;
                }

                .stat-card {
                    background: var(--card-bg);
                    backdrop-filter: blur(12px);
                    border: 1px solid var(--border-color);
                    border-radius: 16px;
                    padding: 20px;
                    display: flex;
                    flex-direction: column;
                    gap: 4px;
                    transition: transform 0.2s;
                }

                .stat-card:hover {
                    transform: translateY(-2px);
                }

                .stat-label {
                    font-size: 0.75rem;
                    font-weight: 600;
                    color: var(--text-secondary);
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                }

                .stat-value {
                    font-size: 1.8rem;
                    font-weight: 700;
                    color: white;
                }

                .stat-card.critical { border-color: rgba(239, 68, 68, 0.3); }
                .stat-card.critical .stat-value { color: var(--critical-red); }
                .stat-card.high { border-color: rgba(245, 158, 11, 0.3); }
                .stat-card.high .stat-value { color: var(--high-orange); }

                .actions-bar {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 24px;
                    padding: 0 4px;
                }

                .actions-left {
                    display: flex;
                    gap: 12px;
                }

                .btn-action {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 10px 18px;
                    border-radius: 12px;
                    font-size: 0.9rem;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s;
                    border: 1px solid var(--border-color);
                    background: rgba(255, 255, 255, 0.03);
                    color: var(--text-primary);
                }

                .btn-action:hover {
                    background: rgba(255, 255, 255, 0.08);
                    border-color: rgba(255, 255, 255, 0.2);
                }

                .btn-action.test.success { color: var(--buy-green); border-color: rgba(34, 197, 94, 0.3); }
                .btn-action.test.failed { color: var(--critical-red); border-color: rgba(239, 68, 68, 0.3); }

                .last-update {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    color: var(--text-secondary);
                    font-size: 0.85rem;
                }

                .dot {
                    width: 8px;
                    height: 8px;
                    background: #22c55e;
                    border-radius: 50%;
                }

                .pulse {
                    box-shadow: 0 0 0 rgba(34, 197, 94, 0.4);
                    animation: pulse 2s infinite;
                }

                @keyframes pulse {
                    0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.7); }
                    70% { transform: scale(1); box-shadow: 0 0 0 10px rgba(34, 197, 94, 0); }
                    100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(34, 197, 94, 0); }
                }

                .alert-card {
                    background: var(--card-bg);
                    backdrop-filter: blur(12px);
                    border: 1px solid var(--border-color);
                    border-radius: 20px;
                    padding: 24px;
                    margin-bottom: 20px;
                    position: relative;
                    overflow: hidden;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                }

                .alert-card:hover {
                    border-color: rgba(255, 255, 255, 0.15);
                    transform: translateY(-4px);
                    box-shadow: 0 12px 24px -8px rgba(0, 0, 0, 0.5);
                }

                .alert-card.critical {
                    background: linear-gradient(145deg, rgba(239, 68, 68, 0.05), rgba(23, 25, 35, 0.7));
                    border-left: 4px solid var(--critical-red);
                }

                .alert-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    margin-bottom: 20px;
                }

                .market-info {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                }

                .market-title {
                    font-size: 1.25rem;
                    font-weight: 700;
                    line-height: 1.4;
                    color: white;
                }

                .badge {
                    display: inline-flex;
                    padding: 4px 12px;
                    border-radius: 99px;
                    font-size: 0.7rem;
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                    width: fit-content;
                }

                .level-critical { background: rgba(239, 68, 68, 0.2); color: #fca5a5; border: 1px solid rgba(239, 68, 68, 0.3); }
                .level-high { background: rgba(245, 158, 11, 0.2); color: #fcd34d; border: 1px solid rgba(245, 158, 11, 0.3); }
                .level-medium { background: rgba(59, 130, 246, 0.2); color: #93c5fd; border: 1px solid rgba(59, 130, 246, 0.3); }

                .alert-score {
                    text-align: right;
                    background: rgba(0, 0, 0, 0.2);
                    padding: 8px 16px;
                    border-radius: 12px;
                }

                .score-label {
                    display: block;
                    font-size: 0.6rem;
                    font-weight: 700;
                    color: var(--text-secondary);
                    margin-bottom: 2px;
                }

                .score-value {
                    font-size: 1.4rem;
                    font-weight: 800;
                    color: white;
                }

                .trade-meta {
                    display: grid;
                    grid-template-columns: repeat(4, 1fr);
                    gap: 16px;
                    margin-bottom: 24px;
                }

                .meta-item {
                    display: flex;
                    flex-direction: column;
                    gap: 4px;
                }

                .meta-item .label {
                    font-size: 0.65rem;
                    font-weight: 600;
                    color: var(--text-secondary);
                    letter-spacing: 0.05em;
                }

                .meta-item .value {
                    font-size: 1.05rem;
                    font-weight: 600;
                    color: white;
                }

                .highlighting { color: #fff !important; font-variant-numeric: tabular-nums; }
                .side-buy { color: var(--buy-green) !important; }
                .side-sell { color: var(--critical-red) !important; }

                .signals-container {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 8px;
                    margin-bottom: 24px;
                }

                .signal-tag {
                    padding: 6px 12px;
                    border-radius: 8px;
                    font-size: 0.75rem;
                    font-weight: 500;
                    background: rgba(255, 255, 255, 0.05);
                    color: var(--text-secondary);
                    border: 1px solid var(--border-color);
                }

                .signal-tag.high, .signal-tag.critical {
                    border-color: rgba(239, 68, 68, 0.2);
                    color: #f87171;
                }

                .card-footer {
                    display: flex;
                    gap: 24px;
                    padding-top: 20px;
                    border-top: 1px solid var(--border-color);
                }

                .footer-link {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    color: var(--accent-blue);
                    text-decoration: none;
                    font-size: 0.85rem;
                    font-weight: 600;
                    transition: color 0.2s;
                }

                .footer-link:hover {
                    color: #60a5fa;
                }

                .btn-icon, .link-icon {
                    font-size: 1rem;
                }

                .footer {
                    text-align: center;
                    padding: 40px;
                    color: var(--text-secondary);
                    font-size: 0.85rem;
                    opacity: 0.6;
                }

                @media (max-width: 768px) {
                    .stats-grid {
                        grid-template-columns: repeat(2, 1fr);
                    }
                    
                    .trade-meta {
                        grid-template-columns: repeat(2, 1fr);
                        gap: 20px;
                    }

                    h1 { font-size: 2rem; }
                    
                    .actions-bar {
                        flex-direction: column;
                        align-items: flex-start;
                        gap: 16px;
                    }

                    .last-update {
                        order: -1;
                    }
                }

                .loading-state {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    padding: 100px 0;
                    color: var(--text-secondary);
                }

                .spinner {
                    width: 40px;
                    height: 40px;
                    border: 3px solid rgba(59, 130, 246, 0.1);
                    border-top-color: var(--accent-blue);
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                    margin-bottom: 16px;
                }

                @keyframes spin {
                    to { transform: rotate(360deg); }
                }

                .empty-state {
                    text-align: center;
                    padding: 100px 20px;
                }

                .empty-icon {
                    font-size: 4rem;
                    margin-bottom: 24px;
                }

                .empty-state h3 {
                    font-size: 1.5rem;
                    margin-bottom: 12px;
                }

                .empty-state p {
                    color: var(--text-secondary);
                }
            `}</style>

        </>
    );
}
