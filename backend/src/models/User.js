const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    walletAddress: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    nonce: {
      type: String,
      required: true,
    },
    password: {
      type: String,
      required: true, // Account level password constraint
    },
    // Paper trading simulated balances
    simulatedBalance: {
      type: Number,
      default: 100000, // Starts with $100,000 in paper trading balance
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);
