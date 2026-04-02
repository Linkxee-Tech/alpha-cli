// Mocking/Wrapping Nansen API endpoints for the purpose of the build challenge
// We will hit 10 unique Nansen API endpoints for Agent tools to utilize.
// Assumes Node structure and env variable: NANSEN_API_KEY

class NansenService {
  constructor() {
    this.baseURL = 'https://api.nansen.ai/v1'; // Standard API base config
    this.apiKey = process.env.NANSEN_API_KEY;
  }

  async fetchFromNansen(endpoint, params = {}) {
    if(!this.apiKey) {
      // Return mocked responses if no API key is set to allow testing
      return this._getMockedResponse(endpoint);
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

  // Provides mocked data for demonstration if API keys are not present
  _getMockedResponse(endpoint) {
    if (endpoint.includes('/trending/tokens')) {
       return [
          { symbol: 'SOL', name: 'Solana', price: 145.2, trendScore: 98, isHot: true },
          { symbol: 'ETH', name: 'Ethereum', price: 3804.1, trendScore: 85, isHot: false },
          { symbol: 'JUP', name: 'Jupiter', price: 1.2, trendScore: 78, isHot: false }
       ];
    }
    if (endpoint.includes('/smart-money/token-flows')) {
       return [
          { symbol: 'SOL', inflow: 15400000, colorIndicator: 'GREEN' }, // Highly trending
          { symbol: 'WIF', inflow: -200000, colorIndicator: 'ORANGE' }  // Not so trending
       ];
    }
    if (endpoint.includes('/wallet/')) {
        return { totalValue: 42000, tokens: [{ symbol: 'USDC', balance: 14000 }, { symbol: 'SOL', balance: 200 }]};
    }
    // Generic robust fallback mock
    return { mockStatus: "success", generatedForEndpoint: endpoint, _note: "Set NANSEN_API_KEY in backend .env to use real data." };
  }
}

module.exports = new NansenService();
