const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');

// @route   POST /api/auth/nonce
// @desc    Get a secure challenge message for wallet to sign
router.post('/nonce', authController.getNonce);

// @route   POST /api/auth/verify
// @desc    Verify signed message and return JWT
router.post('/verify', authController.verifySignature);

module.exports = router;
