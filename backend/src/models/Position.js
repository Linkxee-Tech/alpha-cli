const mongoose = require('mongoose');

const positionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    assetId: {
      type: String,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    averageBuyPrice: {
      type: Number,
      required: true,
    },
    market: {
      type: String,
      enum: ['CRYPTO', 'SP500', 'NASDAQ'],
      required: true,
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Position', positionSchema);
