#!/usr/bin/env node
require('dotenv').config();
const { Command } = require('commander');
const chalk = require('chalk');
const gradient = require('gradient-string');
const Table = require('cli-table3');
const { authenticateViaBrowser, getToken, clearToken } = require('../utils/auth');

const program = new Command();
const BACKEND_URL = process.env.ALPHA_BACKEND_URL || 'https://alpha-cli.onrender.com/api';

program
    .name('alpha')
    .description('Alpha CLI – Autonomous Agent Onchain Toolkit (Powered by Nansen)')
    .version('1.0.0');

const checkAuth = () => {
    const token = getToken();
    if (!token) {
        console.log(chalk.red('❌ Not authenticated. Please run `alpha login` first.'));
        process.exit(1);
    }
    return token;
};

const authHeaders = (token) => ({ Authorization: `Bearer ${token}` });

const buildMarketTable = (items, cType) => {
    const table = new Table({
        head: [
            chalk.bold.white('Asset'),
            chalk.bold.white('Price'),
            chalk.bold.white('Trend / Conviction'),
        ],
        colWidths: [22, 16, 32],
        style: { border: ['grey'] },
    });

    items.forEach((asset) => {
        const name = asset.name || asset.symbol;
        const score = asset.trendScore ?? 0;
        let colorizer = chalk.blue;
        if (score >= 90) colorizer = chalk.green;
        else if (score < 50) colorizer = chalk.yellow;

        table.push([
            colorizer(name),
            chalk.white(`$${asset.price ?? '—'}`),
            colorizer(`Score: ${score}`),
        ]);
    });

    console.log(gradient.atlas(`\n─── Trending ${cType} Assets ───────────────────`));
    console.log(table.toString());
};

program
    .command('status')
    .description('Check authentication status and backend health')
    .action(async () => {
        const axios = require('axios');
        const token = getToken();

        console.log(gradient.pastel('\n  Alpha CLI – System Status\n'));

        // Auth status
        if (token) {
            console.log(chalk.green('  ✅ Authenticated') + chalk.grey('  (JWT stored locally)'));
        } else {
            console.log(chalk.yellow('  ⚠️  Not authenticated') + chalk.grey('  — run `alpha login`'));
        }

        // Backend health
        const healthUrl = `${BACKEND_URL.replace(/\/api$/, '')}/health`;
        try {
            const { data } = await axios.get(healthUrl, { timeout: 3000 });
            console.log(chalk.green('  ✅ Backend online') + chalk.grey(`  (${data.timestamp})`));
        } catch {
            console.log(chalk.red('  ❌ Backend offline') + chalk.grey(`  — check your BACKEND_URL or start it with \`npm run dev\` in /backend`));
        }

        console.log('');
    });

program
    .command('login')
    .description('Authenticate via Phantom Wallet through the browser')
    .action(async () => {
        try {
            console.log(gradient.pastel.multiline('\nWelcome to Alpha CLI\nPreparing Web3 Authentication...\n'));
            await authenticateViaBrowser();
            console.log(chalk.green('\n✅ Successfully authenticated! Your session is stored securely.\n'));
        } catch (err) {
            console.error(chalk.red('\n❌ Authentication Failed:'), err.message);
        }
    });

program
    .command('logout')
    .description('Clear the stored authentication session')
    .action(() => {
        clearToken();
        console.log(chalk.yellow('\n👋 Logged out. Your JWT has been cleared.\n'));
    });

program
    .command('market')
    .description('Show trending assets powered by Nansen smart-money data')
    .option('-c, --crypto', 'Trending crypto from Nansen (default)')
    .option('-s, --sp500', 'Trending S&P 500 assets via Yahoo Finance')
    .option('-n, --nsd', 'Trending NASDAQ assets via Yahoo Finance')
    .option('-f, --nft', 'NFT Market Indexes (Nansen)')
    .option('-m, --macro', 'Smart Money Holdings \u0026 Macro (Nansen)')
    .action(async (options) => {
        const token = checkAuth();
        const axios = require('axios');

        let url = `${BACKEND_URL}/market/crypto/trending`;
        let cType = 'CRYPTO';

        if (options.sp500) { url = `${BACKEND_URL}/market/tradfi/sp500`; cType = 'S&P 500'; }
        else if (options.nsd) { url = `${BACKEND_URL}/market/tradfi/nsd`; cType = 'NASDAQ'; }
        else if (options.nft || options.macro) {
            console.log(chalk.cyan(`\n🔍 Fetching Nansen Market Macro Insights...`));
            try {
                const { data } = await axios.get(`${BACKEND_URL}/market/macro`, { headers: authHeaders(token) });
                if (options.nft) {
                    console.log(gradient.atlas(`\n─── Nansen NFT Indexes ──────────────────────────`));
                    console.log(JSON.stringify(data.nftIndexes, null, 2));
                } else {
                    console.log(gradient.atlas(`\n─── Smart Money Holdings ─────────────────────────`));
                    console.log(JSON.stringify(data.smartMoneyHoldings, null, 2));
                }
                return;
            } catch (err) {
                console.error(chalk.red('Macro fetch failed:'), err.response?.data?.error || err.message);
                return;
            }
        }

        console.log(chalk.cyan(`\n🔍 Fetching ${cType} market data...`));

        try {
            const { data } = await axios.get(url, { headers: authHeaders(token) });
            const items = data.data || data.assets || [];

            if (!items.length) {
                console.log(chalk.yellow('No data returned.'));
                return;
            }

            buildMarketTable(items, cType);
        } catch (err) {
            console.error(chalk.red('Failed to fetch market data:'), err.response?.data?.error || err.message);
        }
    });

program
    .command('lookup <id>')
    .description('Deep dive into an asset via Nansen or Yahoo Finance')
    .action(async (id) => {
        const token = checkAuth();
        const axios = require('axios');

        console.log(chalk.cyan(`\n🔍 Fetching deep insights for ${chalk.bold(id)}...`));

        try {
            const { data } = await axios.get(`${BACKEND_URL}/market/lookup/${id}`, { headers: authHeaders(token) });

            if (data.type === 'tradfi') {
                const q = data.data;
                const table = new Table({ style: { border: ['grey'] } });
                table.push(
                    [chalk.grey('Symbol'), chalk.white(q.symbol)],
                    [chalk.grey('Name'), chalk.white(q.longName || q.shortName || '—')],
                    [chalk.grey('Price'), chalk.green(`$${q.regularMarketPrice}`)],
                    [chalk.grey('Change %'), (q.regularMarketChangePercent >= 0 ? chalk.green : chalk.red)(`${q.regularMarketChangePercent?.toFixed(2)}%`)],
                    [chalk.grey('52W High'), chalk.white(`$${q.fiftyTwoWeekHigh}`)],
                    [chalk.grey('52W Low'), chalk.white(`$${q.fiftyTwoWeekLow}`)],
                    [chalk.grey('Market Cap'), chalk.white(q.marketCap ? `$${(q.marketCap / 1e9).toFixed(2)}B` : '—')],
                );
                console.log(gradient.atlas(`\n─── TradFi Insight: ${id.toUpperCase()} ─────────────`));
                console.log(table.toString());
            } else {
                console.log(gradient.atlas(`\n─── Nansen Crypto Insight: ${id.toUpperCase()} ──────`));
                console.log(JSON.stringify(data.nansenInsights, null, 2));
            }
        } catch (err) {
            console.error(chalk.red('Lookup failed:'), err.response?.data?.error || err.message);
        }
    });

// ─────────────────────────────────────────────────────────────────────────────
// WALLET COMMAND
// ─────────────────────────────────────────────────────────────────────────────
program
    .command('wallet <address>')
    .description('Deep dive into a wallet using Nansen Profiler \u0026 Balances')
    .action(async (address) => {
        const token = checkAuth();
        const axios = require('axios');

        console.log(chalk.cyan(`\n🔍 Profiling wallet: ${chalk.bold(address)}...`));

        try {
            const { data } = await axios.get(`${BACKEND_URL}/market/wallet/${address}`, { headers: authHeaders(token) });
            console.log(gradient.atlas(`\n─── Nansen Wallet Insights ──────────────────────`));
            console.log(JSON.stringify(data, null, 2));
        } catch (err) {
            console.error(chalk.red('Wallet profiling failed:'), err.response?.data?.error || err.message);
        }
    });

// ─────────────────────────────────────────────────────────────────────────────
// ENTITY COMMAND
// ─────────────────────────────────────────────────────────────────────────────
program
    .command('entity <name>')
    .description('Track token flows for a specific entity (e.g., Binance, Alameda)')
    .action(async (name) => {
        const token = checkAuth();
        const axios = require('axios');

        console.log(chalk.cyan(`\n🔍 Tracking entity flows: ${chalk.bold(name)}...`));

        try {
            const { data } = await axios.get(`${BACKEND_URL}/market/entities/${name}`, { headers: authHeaders(token) });
            console.log(gradient.atlas(`\n─── Nansen Entity Flows: ${name.toUpperCase()} ───`));
            console.log(JSON.stringify(data.flows, null, 2));
        } catch (err) {
            console.error(chalk.red('Entity tracking failed:'), err.response?.data?.error || err.message);
        }
    });

program
    .command('positions')
    .description('View your simulated portfolio and open positions')
    .action(async () => {
        const token = checkAuth();
        const axios = require('axios');

        try {
            const { data } = await axios.get(`${BACKEND_URL}/triggers/portfolio`, { headers: authHeaders(token) });

            console.log(gradient.pastel(`\n  💰 Simulated Balance: ${chalk.bold.green('$' + data.simulatedBalance?.toLocaleString())}\n`));

            if (!data.positions?.length) {
                console.log(chalk.grey('  No open positions. Use `alpha trigger buy` to start paper trading.\n'));
                return;
            }

            const table = new Table({
                head: [chalk.bold.white('Asset'), chalk.bold.white('Market'), chalk.bold.white('Amount'), chalk.bold.white('Avg Buy Price')],
                colWidths: [18, 12, 14, 18],
                style: { border: ['grey'] },
            });

            data.positions.forEach((pos) => {
                table.push([
                    chalk.cyan(pos.assetId),
                    chalk.white(pos.market),
                    chalk.white(pos.amount),
                    chalk.green(`$${pos.averageBuyPrice}`),
                ]);
            });

            console.log(chalk.bold('  📊 Open Positions:'));
            console.log(table.toString());
        } catch (err) {
            console.error(chalk.red('Failed to fetch portfolio:'), err.response?.data?.error || err.message);
        }
    });

program
    .command('watch <asset>')
    .description('Live-poll an asset every 30s (Ctrl+C to stop)')
    .option('-i, --interval <seconds>', 'Polling interval in seconds', '30')
    .action(async (asset, options) => {
        const token = checkAuth();
        const axios = require('axios');
        const intervalMs = parseInt(options.interval, 10) * 1000;

        console.log(gradient.atlas(`\n👁  Watching ${chalk.bold(asset)} every ${options.interval}s — Press Ctrl+C to stop\n`));

        const fetch = async () => {
            const ts = new Date().toLocaleTimeString();
            try {
                const { data } = await axios.get(`${BACKEND_URL}/market/lookup/${asset}`, { headers: authHeaders(token) });

                if (data.type === 'tradfi') {
                    const q = data.data;
                    const change = q.regularMarketChangePercent?.toFixed(2);
                    const arrow = change >= 0 ? '▲' : '▼';
                    const colorizer = change >= 0 ? chalk.green : chalk.red;
                    console.log(
                        chalk.grey(`[${ts}]`) +
                        chalk.white(` ${q.symbol}`) +
                        `  $${q.regularMarketPrice}` +
                        `  ` + colorizer(`${arrow} ${change}%`)
                    );
                } else {
                    const flows = data.nansenInsights?.flows;
                    console.log(chalk.grey(`[${ts}]`), chalk.white(asset.toUpperCase()), '—', chalk.cyan('Nansen data:'), JSON.stringify(flows ?? data.nansenInsights, null, 0));
                }
            } catch (err) {
                console.log(chalk.grey(`[${ts}]`), chalk.red('Error:'), err.response?.data?.error || err.message);
            }
        };

        await fetch(); // Immediate first tick
        setInterval(fetch, intervalMs);
    });

const triggerCmd = program
    .command('trigger')
    .description('Manage autonomous smart-money paper-trading triggers');

// trigger buy
triggerCmd
    .command('buy <id> <condition> <target> <amount> <market>')
    .description('Set a BUY trigger. Example: alpha trigger buy SOL PRICE_BELOW 140 10 CRYPTO')
    .action(async (id, condition, target, amount, market) => {
        const token = checkAuth();
        const axios = require('axios');
        try {
            const { data } = await axios.post(
                `${BACKEND_URL}/triggers`,
                { assetId: id, type: 'BUY', conditionType: condition, targetValue: Number(target), amount: Number(amount), market: market.toUpperCase() },
                { headers: authHeaders(token) }
            );
            console.log(chalk.green(`\n✅ BUY trigger set! Agent will buy ${amount} ${id} when ${condition} reaches ${target}`));
            console.log(chalk.grey(`   Trigger ID: ${data.trigger._id}\n`));
        } catch (err) {
            console.error(chalk.red('Failed to set trigger:'), err.response?.data?.error || err.message);
        }
    });

// trigger sell
triggerCmd
    .command('sell <id> <condition> <target> <amount> <market>')
    .description('Set a SELL trigger. Example: alpha trigger sell SOL PRICE_ABOVE 200 10 CRYPTO')
    .action(async (id, condition, target, amount, market) => {
        const token = checkAuth();
        const axios = require('axios');
        try {
            const { data } = await axios.post(
                `${BACKEND_URL}/triggers`,
                { assetId: id, type: 'SELL', conditionType: condition, targetValue: Number(target), amount: Number(amount), market: market.toUpperCase() },
                { headers: authHeaders(token) }
            );
            console.log(chalk.green(`\n✅ SELL trigger set! Agent will sell ${amount} ${id} when ${condition} reaches ${target}`));
            console.log(chalk.grey(`   Trigger ID: ${data.trigger._id}\n`));
        } catch (err) {
            console.error(chalk.red('Failed to set trigger:'), err.response?.data?.error || err.message);
        }
    });

// trigger list
triggerCmd
    .command('list')
    .description('List all your active and past triggers')
    .action(async () => {
        const token = checkAuth();
        const axios = require('axios');
        try {
            const { data } = await axios.get(`${BACKEND_URL}/triggers`, { headers: authHeaders(token) });

            if (!data.triggers?.length) {
                console.log(chalk.yellow('\n  No triggers found. Use `alpha trigger buy` or `alpha trigger sell` to create one.\n'));
                return;
            }

            const table = new Table({
                head: [
                    chalk.bold.white('ID'),
                    chalk.bold.white('Asset'),
                    chalk.bold.white('Type'),
                    chalk.bold.white('Condition'),
                    chalk.bold.white('Target'),
                    chalk.bold.white('Amount'),
                    chalk.bold.white('Market'),
                    chalk.bold.white('Status'),
                ],
                colWidths: [28, 12, 8, 22, 12, 10, 10, 12],
                style: { border: ['grey'] },
            });

            data.triggers.forEach((t) => {
                const statusColor =
                    t.status === 'ACTIVE' ? chalk.green :
                        t.status === 'EXECUTED' ? chalk.blue : chalk.red;

                table.push([
                    chalk.grey(t._id),
                    chalk.cyan(t.assetId),
                    t.type === 'BUY' ? chalk.green(t.type) : chalk.red(t.type),
                    chalk.white(t.conditionType),
                    chalk.white(t.targetValue),
                    chalk.white(t.amount),
                    chalk.white(t.market),
                    statusColor(t.status),
                ]);
            });

            console.log(gradient.atlas('\n─── Triggers ──────────────────────────────'));
            console.log(table.toString());
            console.log('');
        } catch (err) {
            console.error(chalk.red('Failed to fetch triggers:'), err.response?.data?.error || err.message);
        }
    });

// trigger cancel
triggerCmd
    .command('cancel <id>')
    .description('Cancel an active trigger by its ID')
    .action(async (id) => {
        const token = checkAuth();
        const axios = require('axios');
        try {
            await axios.delete(`${BACKEND_URL}/triggers/${id}`, { headers: authHeaders(token) });
            console.log(chalk.yellow(`\n⛔ Trigger ${chalk.bold(id)} has been cancelled.\n`));
        } catch (err) {
            console.error(chalk.red('Failed to cancel trigger:'), err.response?.data?.error || err.message);
        }
    });

program.parse();
