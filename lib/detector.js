/**
 * Detection configuration and logic
 */

export const CONFIG = {
    // Wallet thresholds
    maxUniqueMarketsForFreshWallet: 4,
    maxWalletAgeDaysForNew: 30,

    // Trade thresholds
    minSuspiciousTradeSizeUSD: 1000,
    whaleTradeThresholdUSD: 5000,
    extremeWhaleThresholdUSD: 10000,

    // Price thresholds
    maxLowPriceEntryCents: 15,
    extremeLowPriceEntryCents: 10,

    // Scoring
    scores: {
        freshWallet: 30,
        newWallet: 20,
        largeTrade: 25,
        whaleTrade: 40,
        extremeWhaleTrade: 60,
        lowPriceEntry: 20,
        extremeLowPriceEntry: 35,
        nicheMarket: 15,
        anonymousWallet: 20,
        highRiskCategory: 10
    },

    // Alert levels
    minAlertScore: 50,
    highPriorityScore: 75,
    criticalScore: 100
};

/**
 * Check if trade is sports-related (should be excluded)
 */
export function isSportsTrade(trade) {
    const slug = (trade.slug || trade.eventSlug || '').toLowerCase();
    const title = (trade.title || '').toLowerCase();
    const icon = (trade.icon || '').toLowerCase();

    // Explicitly NOT sports - crypto/price markets
    const cryptoPatterns = [
        /bitcoin|btc|ethereum|eth|solana|sol|xrp|crypto/i,
        /up or down/i,
        /updown/i,
        /price.*will/i,
        /reach.*\$/i
    ];

    for (const pattern of cryptoPatterns) {
        if (pattern.test(slug) || pattern.test(title)) {
            return false; // Definitely not sports
        }
    }

    // Check slug prefixes for sports leagues
    const sportsSlugPrefixes = [
        'nfl-', 'nba-', 'mlb-', 'nhl-', 'mls-', 'ufc-',
        'epl-', 'lal-', 'sea-', 'fl1-', 'cbb-', 'cfb-',
        'wta-', 'atp-', 'pga-', 'lpga-', 'acn-', 'f1-'
    ];

    for (const prefix of sportsSlugPrefixes) {
        if (slug.startsWith(prefix)) {
            return true;
        }
    }

    // Check for sports teams/leagues in title
    const sportsTeamPatterns = [
        // NFL teams
        /\b(patriots|cowboys|eagles|chiefs|bills|rams|49ers|packers|dolphins|broncos|ravens|steelers|bengals|browns|titans|colts|texans|jaguars|commanders|giants|jets|saints|falcons|panthers|buccaneers|vikings|lions|bears|seahawks|cardinals|chargers|raiders)\b/i,
        // NBA teams  
        /\b(lakers|celtics|warriors|bulls|heat|knicks|nets|bucks|76ers|suns|nuggets|mavericks|grizzlies|pelicans|spurs|rockets|thunder|blazers|jazz|clippers|kings|timberwolves|pistons|pacers|hawks|hornets|wizards|magic|cavaliers|raptors)\b/i,
        // MLB teams
        /\b(yankees|dodgers|mets|cubs|red sox|braves|astros|padres|phillies|cardinals|marlins|brewers|giants|rangers|guardians|twins|orioles|rays|mariners|blue jays|tigers|royals|angels|white sox|rockies|reds|diamondbacks|nationals|pirates|athletics)\b/i,
        // NHL teams
        /\b(bruins|rangers|maple leafs|canadiens|penguins|blackhawks|flyers|red wings|avalanche|lightning|panthers|oilers|flames|canucks|sharks|kings|ducks|devils|islanders|capitals|blues|predators|stars|wild|jets|hurricanes|senators|sabres|blue jackets|kraken|golden knights|coyotes)\b/i,
        // Soccer clubs - includes FC, United, etc
        /\b(manchester city|manchester united|liverpool|chelsea|arsenal|tottenham|barcelona|real madrid|bayern|juventus|psg|inter|milan|borussia|atletico|fc\s+\w+|sporting|benfica|porto|ajax|feyenoord)\b/i,
        // Generic FC pattern
        /\bfc\s/i,
        /\sfc\b/i
    ];

    for (const pattern of sportsTeamPatterns) {
        if (pattern.test(title)) {
            return true;
        }
    }

    // Check for sports betting terms
    if (/\bspread:?\s/i.test(title) || /\bo\/u\s*\d/i.test(title) || /\bmoneyline\b/i.test(title)) {
        return true;
    }

    // Check for "will X win" patterns for sports
    if (/will\s+(the\s+)?[\w\s]+\s+win\s+(on|against|vs|super bowl|world series|championship|the\s+game|game\s+\d)/i.test(title)) {
        return true;
    }

    // Super Bowl, World Series, etc
    if (/super\s*bowl|world\s*series|stanley\s*cup|nba\s*finals|champions\s*league|premier\s*league|la\s*liga|serie\s*a|bundesliga/i.test(title)) {
        return true;
    }

    // Check icon URL for sports leagues
    const sportsIcons = [
        'nfl', 'nba', 'mlb', 'nhl', 'ufc', 'ncaa',
        'basketball', 'football', 'soccer', 'tennis',
        'premier-league', 'serie-a', 'la-liga', 'bundesliga',
        'africa-cup', 'champions-league'
    ];

    for (const sportIcon of sportsIcons) {
        if (icon.includes(sportIcon)) {
            return true;
        }
    }

    return false;
}

/**
 * Score a trade for insider signals
 */
export function scoreTrade(trade, walletInfo = {}) {
    let score = 0;
    const signals = [];

    const tradeValue = trade.size * trade.price;
    const priceInCents = trade.price * 100;

    // Wallet signals
    if (walletInfo.uniqueMarkets !== undefined && walletInfo.uniqueMarkets <= CONFIG.maxUniqueMarketsForFreshWallet) {
        score += CONFIG.scores.freshWallet;
        signals.push({ type: 'FRESH_WALLET', severity: 'high', value: walletInfo.uniqueMarkets });
    }

    if (walletInfo.daysOld !== undefined && walletInfo.daysOld <= CONFIG.maxWalletAgeDaysForNew) {
        score += CONFIG.scores.newWallet;
        signals.push({ type: 'NEW_WALLET', severity: 'medium', value: walletInfo.daysOld });
    }

    if (!trade.pseudonym && !trade.name) {
        score += CONFIG.scores.anonymousWallet;
        signals.push({ type: 'ANONYMOUS', severity: 'low' });
    }

    // Trade size signals
    if (tradeValue >= CONFIG.extremeWhaleThresholdUSD) {
        score += CONFIG.scores.extremeWhaleTrade;
        signals.push({ type: 'EXTREME_WHALE', severity: 'critical', value: tradeValue });
    } else if (tradeValue >= CONFIG.whaleTradeThresholdUSD) {
        score += CONFIG.scores.whaleTrade;
        signals.push({ type: 'WHALE_TRADE', severity: 'high', value: tradeValue });
    } else if (tradeValue >= CONFIG.minSuspiciousTradeSizeUSD) {
        score += CONFIG.scores.largeTrade;
        signals.push({ type: 'LARGE_TRADE', severity: 'medium', value: tradeValue });
    }

    // Price entry signals
    if (trade.side === 'BUY') {
        if (priceInCents <= CONFIG.extremeLowPriceEntryCents) {
            score += CONFIG.scores.extremeLowPriceEntry;
            signals.push({ type: 'EXTREME_LOW_ENTRY', severity: 'high', value: priceInCents });
        } else if (priceInCents <= CONFIG.maxLowPriceEntryCents) {
            score += CONFIG.scores.lowPriceEntry;
            signals.push({ type: 'LOW_PRICE_ENTRY', severity: 'medium', value: priceInCents });
        }
    }

    // Determine alert level
    let alertLevel = 'LOW';
    if (score >= CONFIG.criticalScore) alertLevel = 'CRITICAL';
    else if (score >= CONFIG.highPriorityScore) alertLevel = 'HIGH';
    else if (score >= CONFIG.minAlertScore) alertLevel = 'MEDIUM';

    return {
        score,
        signals,
        alertLevel,
        tradeValue,
        priceInCents
    };
}

/**
 * Analyze trades and return alerts
 */
export async function analyzeTrades(trades) {
    const alerts = [];

    // Filter out sports trades
    const nonSportsTrades = trades.filter(t => !isSportsTrade(t));

    for (const trade of nonSportsTrades) {
        const tradeValue = trade.size * trade.price;
        if (tradeValue < CONFIG.minSuspiciousTradeSizeUSD) continue;

        // For simplicity, we don't fetch full wallet history in cron
        // The trade itself gives us enough signals
        const result = scoreTrade(trade, {});

        if (result.score >= CONFIG.minAlertScore) {
            alerts.push({
                trade,
                ...result,
                timestamp: new Date(trade.timestamp * 1000).toISOString()
            });
        }
    }

    // Sort by score
    alerts.sort((a, b) => b.score - a.score);

    return {
        alerts,
        totalTrades: trades.length,
        sportsFiltered: trades.length - nonSportsTrades.length,
        analyzed: nonSportsTrades.length
    };
}
