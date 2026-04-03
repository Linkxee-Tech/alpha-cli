const express = require('express');
const router = express.Router();
const marketController = require('../controllers/market.controller');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

router.get('/crypto/trending', marketController.getCryptoMarket);
router.get('/tradfi/:market', marketController.getTradFiMarket);
router.get('/lookup/:id', marketController.lookupAsset);

router.get('/wallet/:address', marketController.getWalletInsights);
router.get('/entities/:name', marketController.getEntityFlows);
router.get('/macro', marketController.getMarketMacro);

module.exports = router;
