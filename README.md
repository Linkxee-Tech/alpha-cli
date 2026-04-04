# 🧠 Alpha CLI — Autonomous Agent Onchain Toolkit

> A terminal-first autonomous agent for crypto & TradFi markets.  
> Powered by **Nansen** (on-chain analytics) + **Yahoo Finance** (traditional markets) with **Phantom Wallet** authentication.

Built for the [Nansen CLI Build Challenge](https://nansen.ai).

---

## Architecture

```
alpha-cli/
├── backend/          Express + MongoDB API server
│   ├── src/
│   │   ├── controllers/   Route handlers (auth, market, triggers)
│   │   ├── middleware/     JWT authentication guard
│   │   ├── models/         Mongoose schemas (User, Trigger, Position)
│   │   ├── routes/         Express route definitions
│   │   └── services/       Nansen API, Yahoo Finance, Trigger Engine
│   └── index.js           Server entrypoint
├── cli/              Command-line interface
│   ├── bin/alpha.js       CLI entrypoint (Commander.js)
│   └── utils/auth.js      Phantom wallet auth flow via browser
└── (alpha-cli-ui/)   Next.js Phantom Wallet authentication UI
```

### Data Flow

```
CLI (alpha login) → opens browser → Next.js UI → Phantom wallet sign
  → Backend verifies signature → returns JWT → CLI stores JWT locally
  → all subsequent CLI commands send JWT in Authorization header
```

---

## Setup

### Prerequisites

- **Node.js** ≥ 18
- **MongoDB** running locally (or a remote URI)
- **Phantom Wallet** browser extension

### 1. Backend

```bash
cd backend
cp .env.example .env     # Edit with your MongoDB URI & secrets
npm install
npm run dev              # Starts on http://localhost:4000
```

### 2. Auth UI

```bash
cd ../alpha-cli-ui       # Separate repo
npm install
npm run dev              # Starts on http://localhost:3000
```

### 3. CLI

```bash
cd ../cli
npm install
npm link                 # Makes `alpha` available globally
```

---

## CLI Commands

### Authentication

| Command         | Description                               |
|-----------------|-------------------------------------------|
| `alpha login`   | Open browser → Phantom sign → store JWT   |
| `alpha logout`  | Clear stored authentication session       |
| `alpha status`  | Check auth status & backend health        |

### Market Data & Discovery

| Command                | Description                                       |
|------------------------|---------------------------------------------------|
| `alpha market`         | Trending crypto via Nansen smart-money data        |
| `alpha flow`           | **[NEW]** Smart Money Netflow Explorer (1h/24h/7d) |
| `alpha history <sym>`  | **[NEW]** Historical SM Analysis & Conviction Score|
| `alpha market --nft`   | NFT Market Indexes via Nansen                      |
| `alpha market --macro` | Smart Money Holdings & Macro (Nansen)              |
| `alpha market --sp500` | Trending S&P 500 stocks via Yahoo Finance          |
| `alpha market --nsd`   | Trending NASDAQ stocks via Yahoo Finance           |
| `alpha lookup <id>`    | Deep dive into an asset (crypto or stock ticker)   |
| `alpha watch <asset>`  | Live-poll asset price every 30s (Ctrl+C to stop)   |

### Portfolio & Wallet Insights

| Command                | Description                                       |
|------------------------|---------------------------------------------------|
| `alpha positions`      | View simulated portfolio & open positions         |
| `alpha wallet <addr>`  | Deep profile a wallet via Nansen                   |
| `alpha entity <name>`  | Track entity token flows (e.g. Binance)            |

### Paper Trading & Triggers

| Command                                              | Description                              |
|------------------------------------------------------|------------------------------------------|
| `alpha trigger buy <id> <condition> <target> <amt> <market>`  | Set a BUY trigger                |
| `alpha trigger sell <id> <condition> <target> <amt> <market>` | Set a SELL trigger               |
| `alpha trigger list`                                 | List all your triggers                    |
| `alpha trigger cancel <id>`                          | Cancel an active trigger                  |

**Condition types:** `PRICE_ABOVE`, `PRICE_BELOW`, `SMART_MONEY_INFLOW`, `EXCHANGE_OUTFLOW`  
**Market types:** `CRYPTO`, `SP500`, `NASDAQ`

---

## Production Guardrails

The toolkit is **Production Ready** with built-in security and robustness:

1. **Rate Limiting**: Backend protected by `express-rate-limit` (100 req / 15 min).
2. **Input Validation**: All trigger and market queries are sanitized via `express-validator`.
3. **Resilient Startup**: Backend awaits MongoDB connectivity before accepting traffic.
4. **Fail-Fast CLI**: CLI automatically falls back to production URLs if `.env` is missing.

---

## Nansen API Integration (v1)

The backend leverages **Nansen v1 Smart Money** endpoints for high-fidelity data:

1. `POST /api/v1/smart-money/netflow` — Aggregated token flows (accumulation/distribution)
2. `POST /api/v1/smart-money/historical-holdings` — Time-series snapshots & trend analysis
3. `POST /api/v1/smart-money/holdings` — Cross-chain whale balances
4. `POST /api/v1/smart-money/dex-trades` — Real-time DEX activity
5. `GET /v1/trending/tokens` — Hot contracts
6. `GET /v1/wallet/:address/balances` — Wallet profiling
7. `GET /v1/token/:id/exchange-flows` — CEX flows
8. `GET /v1/nft/indexes` — NFT macro proxy
9. `GET /v1/entities/:name/flows` — Entity tracking
10. `GET /v1/token/:id/macro-signals` — God Mode signals

> **Note:** Requires a `NANSEN_API_KEY` for live data. Defaults to mock data for demo if key is missing.

---

## Autonomous Trigger Engine

The backend runs a **cron job every 60 seconds** that:

1. Fetches all `ACTIVE` triggers from MongoDB
2. For each trigger, fetches the live price/flow data from Nansen or Yahoo Finance
3. Evaluates the trigger condition (`PRICE_ABOVE`, `PRICE_BELOW`, etc.)
4. If the condition is met, executes a **simulated paper trade**:
   - **BUY:** Deducts cost from `User.simulatedBalance`, creates/updates a `Position`
   - **SELL:** Adds proceeds to `User.simulatedBalance`, reduces/removes a `Position`
5. Marks the trigger as `EXECUTED`

Each new user starts with a **$100,000 simulated paper-trading balance**.

---

## Tech Stack

| Component     | Technology                                     |
|---------------|------------------------------------------------|
| CLI           | Node.js, Commander.js, Chalk, cli-table3       |
| Backend       | Express 5, MongoDB/Mongoose, JWT               |
| Auth UI       | Next.js 15, Solana wallet-adapter, Tailwind CSS |
| Market Data   | Nansen API, Yahoo Finance (yahoo-finance2)     |
| Auth          | Phantom Wallet (Ed25519 signature + tweetnacl) |
| Scheduler     | node-cron                                      |

---

## License

MIT