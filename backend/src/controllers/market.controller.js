const nansenService = require('../services/nansen.service');
const tradfiService = require('../services/tradfi.service');

exports.getCryptoMarket = async (req, res) => {
  try {
    const trending = await nansenService.getTrendingTokens();
    const flows = await nansenService.getSmartMoneyTokenFlows();

    // In a real scenario, we merge this data and generate a trend score indicating Green/Blue/Orange
    res.json({
      market: 'crypto',
      data: trending,
      flows: flows
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
    const nftIndexes = await nansenService.getNFTIndexes();
    const smHoldings = await nansenService.getSmartMoneyHoldings();

    res.json({
      nftIndexes,
      smartMoneyHoldings: smHoldings
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
