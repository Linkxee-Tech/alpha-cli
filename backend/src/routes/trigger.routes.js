const express = require('express');
const router = express.Router();
const triggerController = require('../controllers/trigger.controller');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

// @route   POST /api/triggers
// @desc    Create a new autonomous trigger
router.post('/', triggerController.createTrigger);

// @route   GET /api/triggers
// @desc    List all triggers for the authenticated user
router.get('/', triggerController.getTriggers);

// @route   GET /api/triggers/portfolio
// @desc    Get current simulated wallet/positions
router.get('/portfolio', triggerController.getPositions);

// @route   DELETE /api/triggers/:id
// @desc    Cancel a specific trigger
router.delete('/:id', triggerController.cancelTrigger);

// @route   PUT /api/triggers/password
// @desc    Update CLI account password
router.put('/password', triggerController.updatePassword);

module.exports = router;
