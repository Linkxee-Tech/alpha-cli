const express = require('express');
const router = express.Router();
const triggerController = require('../controllers/trigger.controller');
const authMiddleware = require('../middleware/auth');

const { body } = require('express-validator');

router.use(authMiddleware);

const triggerValidation = [
    body('assetId').notEmpty().withMessage('Asset ID is required'),
    body('type').isIn(['BUY', 'SELL']).withMessage('Type must be BUY or SELL'),
    body('conditionType').notEmpty().withMessage('Condition type is required'),
    body('targetValue').isNumeric().withMessage('Target value must be a number'),
    body('amount').isNumeric().withMessage('Amount must be a number'),
    body('market').notEmpty().withMessage('Market is required')
];

router.post('/', triggerValidation, triggerController.createTrigger);

router.get('/', triggerController.getTriggers);
router.get('/portfolio', triggerController.getPositions);

router.delete('/:id', triggerController.cancelTrigger);

router.put('/password', triggerController.updatePassword);

module.exports = router;
