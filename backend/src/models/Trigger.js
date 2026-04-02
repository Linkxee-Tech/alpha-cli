const mongoose = require('mongoose');

const triggerSchema = new mongoose.Schema(
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
    type: {
      type: String,
      enum: ['BUY', 'SELL'],
      required: true,
    },
    conditionType: {
      type: String,
      enum: ['PRICE_ABOVE', 'PRICE_BELOW', 'SMART_MONEY_INFLOW', 'EXCHANGE_OUTFLOW'],
      required: true,
    },
    targetValue: {
      type: Number,
      required: true,
    },
    amount: {
      type: Number, // Amount of asset to buy or sell
      required: true,
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'EXECUTED', 'CANCELLED'],
      default: 'ACTIVE',
    },
    market: {
      type: String,
      enum: ['CRYPTO', 'SP500', 'NASDAQ'],
      required: true,
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Trigger', triggerSchema);
