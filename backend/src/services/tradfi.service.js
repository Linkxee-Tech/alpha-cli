const yahooFinance = require('yahoo-finance2').default;

class TradFiService {
  
  // Gets general information for given tickers (used for lookup)
  async lookupAsset(ticker) {
    try {
      const quote = await yahooFinance.quote(ticker);
      return quote;
    } catch (error) {
      console.error(`Error fetching Yahoo Finance quote for ${ticker}:`, error.message);
      return null;
    }
  }

  // S&P 500 approximation
  async getSP500Trending() {
     // Usually we fetch components or the index.
     // For proxying trending, we might fetch a curated list of top SP500 tech/growth tickers
     const topTickers = ['AAPL', 'MSFT', 'NVDA', 'GOOGL', 'AMZN', 'META', 'TSLA'];
     return this._getQuotesForList(topTickers);
  }

  // NASDAQ approximation
  async getNASDAQTrending() {
    const qqqTickers = ['AMD', 'NFLX', 'INTC', 'CSCO', 'PEP', 'AVGO'];
    return this._getQuotesForList(qqqTickers);
  }

  async _getQuotesForList(tickers) {
      const results = [];
      for(const ticker of tickers) {
          try {
              const quote = await yahooFinance.quote(ticker);
              results.push({
                 symbol: quote.symbol,
                 name: quote.longName || quote.shortName,
                 price: quote.regularMarketPrice,
                 changePercent: quote.regularMarketChangePercent,
                 trendScore: quote.regularMarketChangePercent > 2 ? 90 : (quote.regularMarketChangePercent > 0 ? 50 : 20)
              });
          } catch(e) {
              console.warn(`Failed getting quote for ${ticker}`);
          }
      }
      return results;
  }
}

module.exports = new TradFiService();
