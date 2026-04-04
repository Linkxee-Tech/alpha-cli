const nansenService = require('../services/nansen.service');
const tradfiService = require('../services/tradfi.service');

exports.getCryptoMarket = async (req, res) => {
  try {
    const { min_usd, chains = 'solana' } = req.query;
    const chainList = chains.split(',');

    const trending = await nansenService.getTrendingTokens();
    const netflow = await nansenService.getSmartMoneyNetflow(chainList, {
      value_usd: min_usd ? { min: Number(min_usd) } : undefined
    });

    res.json({
      market: 'crypto',
      data: trending,
      netflow: netflow
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getTradFiMarket = async (req, res) => {
  try {
    const { market } = req.params; // 'nsd' or 'sp500'
    let assets = [];

    if (market === 'nsd') {
      assets = await tradfiService.getNASDAQTrending();
    } else if (market === 'sp500') {
      assets = await tradfiService.getSP500Trending();
    } else {
      return res.status(400).json({ error: 'Invalid market type' });
    }

    res.json({
      market,
      assets
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.lookupAsset = async (req, res) => {
  try {
    const { id } = req.params;

    let tradFiData = await tradfiService.lookupAsset(id);
    if (tradFiData) {
      return res.json({ type: 'tradfi', data: tradFiData });
    }

    const flows = await nansenService.getExchangeFlows(id);
    const holders = await nansenService.getTokenHolders(id);
    const macro = await nansenService.getMacroSignals(id);

    res.json({
      type: 'crypto',
      nansenInsights: {
        flows,
        holders,
        macro
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getWalletInsights = async (req, res) => {
  try {
    const { address } = req.params;
    const balances = await nansenService.getTokenBalances(address);
    const profiler = await nansenService.getWalletProfiler(address);

    res.json({
      address,
      balances,
      profiler
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getEntityFlows = async (req, res) => {
  try {
    const { name } = req.params;
    const flows = await nansenService.getEntityFlows(name);
    res.json({ entity: name, flows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getMarketMacro = async (req, res) => {
  try {
    const { chains = 'solana,ethereum' } = req.query;
    const chainList = chains.split(',');

    const nftIndexes = await nansenService.getNFTIndexes();
    const smHoldings = await nansenService.getSmartMoneyHoldings(chainList, {
      value_usd: { min: 50000 } // Default high-conviction whale filter for macro
    });

    res.json({
      nftIndexes,
      smartMoneyHoldings: smHoldings
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getDeepNetflow = async (req, res) => {
  try {
    let { 
      chains = 'solana', 
      sort = '24h', 
      direction = 'DESC',
      sector,
      labels,
      include_stablecoins = 'false'
    } = req.query;

    // Sanitize sort and direction
    const allowedSorts = ['1h', '24h', '7d', '30d'];
    if (!allowedSorts.includes(sort)) sort = '24h';
    
    direction = direction.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    const chainList = chains ? String(chains).split(',') : ['solana'];
    const smartMoneyLabels = labels ? String(labels).split(',') : ['Fund', 'Smart Trader'];
    
    const sortFieldMap = {
      '1h': 'net_flow_1h_usd',
      '24h': 'net_flow_24h_usd',
      '7d': 'net_flow_7d_usd',
      '30d': 'net_flow_30d_usd'
    };

    const nansenOptions = {
      chains: chainList,
      filters: {
        include_stablecoins: include_stablecoins === 'true',
        include_smart_money_labels: smartMoneyLabels,
        token_sectors: sector ? [String(sector)] : undefined
      },
      order_by: [{
        field: sortFieldMap[sort],
        direction
      }],
      pagination: { page: 1, per_page: 50 }
    };

    const data = await nansenService.getSmartMoneyNetflow(nansenOptions);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getHistoricalHoldings = async (req, res) => {
  try {
    const { symbol, from, to, chains = 'solana' } = req.query;
    if (!symbol) return res.status(400).json({ error: 'Token symbol is required' });

    const chainList = chains ? String(chains).split(',') : ['solana'];
    const options = {
      date_range: { 
        from: from || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        to: to || new Date().toISOString().split('T')[0]
      },
      chains: chainList,
      filters: { 
        token_symbol: symbol.toUpperCase(),
        include_smart_money_labels: ['Fund', 'Smart Trader']
      },
      order_by: [{ field: 'date', direction: 'ASC' }] // Ascending for conviction calculation
    };

    const result = await nansenService.getSmartMoneyHistoricalHoldings(options);
    const data = result.data || [];

    // Calculate Conviction Score (Consecutive days of balance increase)
    let convictionDays = 0;
    let maxConsecutive = 0;
    let prevBalance = 0;

    data.forEach(day => {
      if (prevBalance !== 0 && day.balance > prevBalance) {
        convictionDays++;
        maxConsecutive = Math.max(maxConsecutive, convictionDays);
      } else if (day.balance < prevBalance) {
        convictionDays = 0;
      }
      prevBalance = day.balance;
    });

    let score = 'LOW';
    if (maxConsecutive >= 5) score = 'HIGH';
    else if (maxConsecutive >= 3) score = 'MEDIUM';

    res.json({
      symbol: symbol.toUpperCase(),
      convictionScore: score,
      consecutiveDays: maxConsecutive,
      history: [...data].reverse() // Reverse to DESC for display
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
