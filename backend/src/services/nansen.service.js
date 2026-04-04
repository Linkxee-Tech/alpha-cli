class NansenService {
  constructor() {
    this.baseURL = process.env.NANSEN_API_URL || 'https://api.nansen.ai';
    this.apiKey = process.env.NANSEN_API_KEY;
  }

  async fetchFromNansen(endpoint, options = {}) {
    if (!this.apiKey) {
      throw new Error('NANSEN_API_KEY is required but not provided in environment.');
    }

    const { method = 'GET', params = {}, body = null } = options;
    const url = new URL(`${this.baseURL}${endpoint}`);

    // Append query params for GET requests
    if (method === 'GET') {
      Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));
    }

    const fetchOptions = {
      method,
      headers: {
        'apikey': this.apiKey, // v1 uses lowercase apikey
        'Content-Type': 'application/json'
      }
    };

    if (body) {
      fetchOptions.body = JSON.stringify(body);
    }

    const response = await fetch(url.toString(), fetchOptions);

    if (!response.ok) {
      throw new Error(`Nansen API returned ${response.status}`);
    }

    return await response.json();
  }

  // 1. Trending Tokens / Hot Contracts
  async getTrendingTokens() {
    return this.fetchFromNansen('/v1/trending/tokens');
  }

  // 2. Smart Money Token Flows (v2 pattern) - Keep for compatibility
  async getSmartMoneyTokenFlows() {
    return this.fetchFromNansen('/v1/smart-money/token-flows');
  }

  // ─── Smart Money v1 Endpoints (New) ─────────────────────────────────────────

  /**
   * Net capital flows (inflows vs outflows)
   * Supports: chains, filters (labels, sectors, stablecoins), pagination, and order_by
   */
  async getSmartMoneyNetflow(options = {}) {
    const { 
      chains = ['solana'], 
      filters = { include_stablecoins: false, include_smart_money_labels: ['Fund', 'Smart Trader'] }, 
      pagination = { page: 1, per_page: 50 },
      order_by = [{ field: 'net_flow_24h_usd', direction: 'DESC' }]
    } = options;

    return this.fetchFromNansen('/api/v1/smart-money/netflow', {
      method: 'POST',
      body: { chains, filters, pagination, order_by }
    });
  }

  /**
   * Real-time DEX trading activity
   */
  async getSmartMoneyDexTrades(chains = ['solana'], filters = {}, pagination = { page: 1, per_page: 50 }) {
    return this.fetchFromNansen('/api/v1/smart-money/dex-trades', {
      method: 'POST',
      body: { chains, filters, pagination }
    });
  }

  /**
   * DCA strategies on Jupiter (Solana specific)
   */
  async getSmartMoneyDCAs(filters = {}, pagination = { page: 1, per_page: 50 }) {
    return this.fetchFromNansen('/api/v1/smart-money/dcas', {
      method: 'POST',
      body: { chains: ['solana'], filters, pagination }
    });
  }

  /**
   * Historical snapshots of aggregated smart money holdings
   */
  async getSmartMoneyHistoricalHoldings(options = {}) {
    const { 
      date_range = { from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] }, 
      chains = ['solana'], 
      filters = { include_smart_money_labels: ['Fund', 'Smart Trader'] }, 
      pagination = { page: 1, per_page: 50 },
      order_by = [{ field: 'date', direction: 'DESC' }]
    } = options;

    return this.fetchFromNansen('/api/v1/smart-money/historical-holdings', {
      method: 'POST',
      body: { date_range, chains, filters, pagination, order_by }
    });
  }

  // ─────────────────────────────────────────────────────────────────────────────

  // 3. Token Balances for Wallet
  async getTokenBalances(walletAddress) {
    return this.fetchFromNansen(`/v1/wallet/${walletAddress}/balances`);
  }

  // 4. Exchange Flows for a specific token
  async getExchangeFlows(tokenId) {
    return this.fetchFromNansen(`/v1/token/${tokenId}/exchange-flows`);
  }

  // 5. Token Holders data
  async getTokenHolders(tokenId) {
    return this.fetchFromNansen(`/v1/token/${tokenId}/holders`);
  }

  // 7. Wallet Profiler
  async getWalletProfiler(walletAddress) {
    return this.fetchFromNansen(`/v1/wallet/${walletAddress}/profiler`);
  }

  // 8. NFT Indexes (Market macro trend proxy)
  async getNFTIndexes() {
    return this.fetchFromNansen('/v1/nft/indexes');
  }

  // 9. Entity Token Flow (e.g. tracking Alameda, Binance)
  async getEntityFlows(entityName) {
    return this.fetchFromNansen(`/v1/entities/${entityName}/flows`);
  }

  // 10. Macro Signals / Token God Mode snapshot
  async getMacroSignals(tokenId) {
    return this.fetchFromNansen(`/v1/token/${tokenId}/macro-signals`);
  }
}

module.exports = new NansenService();
