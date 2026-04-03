class NansenService {
  constructor() {
    this.baseURL = process.env.NANSEN_API_URL || 'https://api.nansen.ai/v1';
    this.apiKey = process.env.NANSEN_API_KEY;
  }

  async fetchFromNansen(endpoint, params = {}) {
    if (!this.apiKey) {
      throw new Error('NANSEN_API_KEY is required but not provided in environment.');
    }

    const url = new URL(`${this.baseURL}${endpoint}`);
    Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));

    const response = await fetch(url.toString(), {
      headers: {
        'api-key': this.apiKey,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Nansen API returned ${response.status}`);
    }

    return await response.json();
  }

  // 1. Trending Tokens / Hot Contracts
  async getTrendingTokens() {
    return this.fetchFromNansen('/trending/tokens');
  }

  // 2. Smart Money Token Flows
  async getSmartMoneyTokenFlows() {
    return this.fetchFromNansen('/smart-money/token-flows');
  }

  // 3. Token Balances for Wallet
  async getTokenBalances(walletAddress) {
    return this.fetchFromNansen(`/wallet/${walletAddress}/balances`);
  }

  // 4. Exchange Flows for a specific token
  async getExchangeFlows(tokenId) {
    return this.fetchFromNansen(`/token/${tokenId}/exchange-flows`);
  }

  // 5. Token Holders data
  async getTokenHolders(tokenId) {
    return this.fetchFromNansen(`/token/${tokenId}/holders`);
  }

  // 6. Cross-Chain Smart Money Holdings
  async getSmartMoneyHoldings() {
    return this.fetchFromNansen('/smart-money/holdings');
  }

  // 7. Wallet Profiler
  async getWalletProfiler(walletAddress) {
    return this.fetchFromNansen(`/wallet/${walletAddress}/profiler`);
  }

  // 8. NFT Indexes (Market macro trend proxy)
  async getNFTIndexes() {
    return this.fetchFromNansen('/nft/indexes');
  }

  // 9. Entity Token Flow (e.g. tracking Alameda, Binance)
  async getEntityFlows(entityName) {
    return this.fetchFromNansen(`/entities/${entityName}/flows`);
  }

  // 10. Macro Signals / Token God Mode snapshot
  async getMacroSignals(tokenId) {
    return this.fetchFromNansen(`/token/${tokenId}/macro-signals`);
  }
}

module.exports = new NansenService();
