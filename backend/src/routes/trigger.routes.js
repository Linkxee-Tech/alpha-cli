const express = require('express');
const router = express.Router();
const triggerController = require('../controllers/trigger.controller');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

router.post('/', triggerController.createTrigger);

router.get('/', triggerController.getTriggers);
router.get('/portfolio', triggerController.getPositions);

router.delete('/:id', triggerController.cancelTrigger);

router.put('/password', triggerController.updatePassword);

module.exports = router;
