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
      required: true,
    },
    simulatedBalance: {
      type: Number,
      default: Number(process.env.INITIAL_SIMULATED_BALANCE) || 100000,
    },

  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);
