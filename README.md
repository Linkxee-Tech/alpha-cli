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

### Market Data

| Command                | Description                                       |
|------------------------|---------------------------------------------------|
| `alpha market`         | Trending crypto via Nansen smart-money data        |
| `alpha market --sp500` | Trending S&P 500 stocks via Yahoo Finance          |
| `alpha market --nsd`   | Trending NASDAQ stocks via Yahoo Finance           |
| `alpha lookup <id>`    | Deep dive into an asset (crypto or stock ticker)   |
| `alpha watch <asset>`  | Live-poll asset price every 30s (Ctrl+C to stop)   |

### Paper Trading & Triggers

| Command                                              | Description                              |
|------------------------------------------------------|------------------------------------------|
| `alpha positions`                                    | View simulated portfolio & open positions |
| `alpha trigger buy <id> <condition> <target> <amt> <market>`  | Set a BUY trigger                |
| `alpha trigger sell <id> <condition> <target> <amt> <market>` | Set a SELL trigger               |
| `alpha trigger list`                                 | List all your triggers                    |
| `alpha trigger cancel <id>`                          | Cancel an active trigger                  |

**Condition types:** `PRICE_ABOVE`, `PRICE_BELOW`, `SMART_MONEY_INFLOW`, `EXCHANGE_OUTFLOW`  
**Market types:** `CRYPTO`, `SP500`, `NASDAQ`

#### Example

```bash
# Buy 10 units of SOL when price drops below $140
alpha trigger buy SOL PRICE_BELOW 140 10 CRYPTO

# Sell 5 shares of AAPL when price goes above $200
alpha trigger sell AAPL PRICE_ABOVE 200 5 SP500
```

---

## Nansen API Integration

The backend integrates with **10 Nansen API endpoints** for on-chain analytics:

1. `GET /trending/tokens` — Hot contracts & trending tokens
2. `GET /smart-money/token-flows` — Smart money inflows/outflows
3. `GET /wallet/:address/balances` — Token balances for a wallet
4. `GET /token/:id/exchange-flows` — Exchange flow data
5. `GET /token/:id/holders` — Token holder distribution
6. `GET /smart-money/holdings` — Cross-chain smart money holdings
7. `GET /wallet/:address/profiler` — Wallet profiler
8. `GET /nft/indexes` — NFT market indexes
9. `GET /entities/:name/flows` — Entity-level token flow
10. `GET /token/:id/macro-signals` — Token God Mode macro signals

> **Note:** If `NANSEN_API_KEY` is not set in `.env`, the backend will return mock data so the CLI can be demonstrated without API access.

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