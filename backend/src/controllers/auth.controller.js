const nacl = require('tweetnacl');
const { PublicKey } = require('@solana/web3.js');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');

// Dynamically import bs58 due to ESM only from v6+
let bs58;
(async () => {
   bs58 = (await import('bs58')).default;
})();

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_super_secret_for_hackathon';

exports.getNonce = async (req, res) => {
  try {
    const { publicKey } = req.body;
    if (!publicKey) return res.status(400).json({ error: 'Public key is required' });

    const nonce = crypto.randomBytes(32).toString('hex');
    const message = `Sign this message to authenticate with Alpha CLI.\nNonce: ${nonce}`;
    
    // We update or create the user with the new nonce
    let user = await User.findOne({ walletAddress: publicKey });
    if (!user) {
      user = new User({ walletAddress: publicKey, nonce, password: 'pending_setup' });
    } else {
      user.nonce = nonce;
    }
    await user.save();

    res.json({ message });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.verifySignature = async (req, res) => {
  try {
    const { publicKey, signature, message, password } = req.body;
    
    if (!publicKey || !signature || !message) {
      return res.status(400).json({ error: 'Missing required signature payload' });
    }

    const user = await User.findOne({ walletAddress: publicKey });
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Validate that the signed message actually contains our db stored nonce
    if (!message.includes(user.nonce)) {
       return res.status(401).json({ error: 'Invalid or expired nonce' });
    }

    const signatureUint8 = bs58.decode(signature);
    const messageUint8 = new TextEncoder().encode(message);
    const pubKeyUint8 = bs58.decode(publicKey);

    const isValid = nacl.sign.detached.verify(messageUint8, signatureUint8, pubKeyUint8);

    if (!isValid) {
      return res.status(401).json({ error: 'Invalid signature' });
    }

    // Set or Validate account-level password
    if (user.password === 'pending_setup' && password) {
       user.password = password; // In production, we'd hash this (e.g. bcrypt)
       await user.save();
    } else if (password && user.password !== password) {
       return res.status(401).json({ error: 'Invalid account-level password' });
    } else if (user.password !== 'pending_setup' && !password) {
       return res.status(401).json({ error: 'Account-level password required' });
    }

    const token = jwt.sign(
      { id: user._id, wallet: publicKey },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({ token, message: 'Authentication successful' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
