const express = require('express');
const router = express.Router();
const marketController = require('../controllers/market.controller');
const authMiddleware = require('../middleware/auth');

// All market routes require a valid JWT
router.use(authMiddleware);

// @route   GET /api/market/crypto/trending
// @desc    Get trending crypto using Nansen API
router.get('/crypto/trending', marketController.getCryptoMarket);

// @route   GET /api/market/tradfi/:market
// @desc    Get trending TradFi assets (sp500/nsd)
router.get('/tradfi/:market', marketController.getTradFiMarket);

// @route   GET /api/market/lookup/:id
// @desc    Lookup a specific asset for deeper insights
router.get('/lookup/:id', marketController.lookupAsset);

module.exports = router;
