const cron = require('node-cron');
const Trigger = require('../models/Trigger');
const Position = require('../models/Position');
const User = require('../models/User');
const nansenService = require('./nansen.service');
const tradfiService = require('./tradfi.service');

// Evaluate triggers every 1 minute
const startTriggerEngine = () => {
    console.log('🤖 Autonomous Trigger Engine Started...');
    cron.schedule('* * * * *', async () => {
        try {
            const activeTriggers = await Trigger.find({ status: 'ACTIVE' });
            if (activeTriggers.length === 0) return;

            console.log(`[Engine] Evaluating ${activeTriggers.length} active trigger(s)...`);

            // In a real optimized system, we bulk-fetch prices instead of individual fetches
            for (const trigger of activeTriggers) {
                await evaluateTrigger(trigger);
            }
        } catch (e) {
            console.error('Trigger Engine Error:', e.message);
        }
    });
};

const evaluateTrigger = async (trigger) => {
    let liveValue = 0;

    try {
        // 1. Fetch relevant market data based on trigger market type
        if (trigger.market === 'CRYPTO') {
            if (trigger.conditionType.includes('PRICE')) {
                const trending = await nansenService.getTrendingTokens();
                const tokenInfo = trending.find(
                    t => t.symbol.toLowerCase() === trigger.assetId.toLowerCase() ||
                         t.name.toLowerCase() === trigger.assetId.toLowerCase()
                );
                if (tokenInfo) liveValue = tokenInfo.price;
            } else if (trigger.conditionType === 'SMART_MONEY_INFLOW') {
                const flows = await nansenService.getSmartMoneyTokenFlows();
                const flowInfo = flows.find(
                    t => t.symbol.toLowerCase() === trigger.assetId.toLowerCase()
                );
                if (flowInfo) liveValue = flowInfo.inflow;
            }
        } else {
            // TradFi (SP500 / NASDAQ)
            const dt = await tradfiService.lookupAsset(trigger.assetId);
            if (dt) liveValue = dt.regularMarketPrice;
        }

        // 2. Evaluate condition
        let conditionMet = false;
        if (trigger.conditionType === 'PRICE_BELOW' && liveValue > 0 && liveValue <= trigger.targetValue) conditionMet = true;
        if (trigger.conditionType === 'PRICE_ABOVE' && liveValue >= trigger.targetValue) conditionMet = true;
        if (trigger.conditionType === 'SMART_MONEY_INFLOW' && liveValue >= trigger.targetValue) conditionMet = true;
        if (trigger.conditionType === 'EXCHANGE_OUTFLOW' && liveValue > 0 && liveValue >= trigger.targetValue) conditionMet = true;

        // 3. Execute paper trade if condition is met
        if (conditionMet) {
            console.log(`[AGENT] 🚀 Executing ${trigger.type} for ${trigger.assetId} | Live: ${liveValue} | Target: ${trigger.targetValue}`);
            await executePaperTrade(trigger, liveValue);
        }
    } catch (e) {
        console.error(`[Engine] Failed evaluating trigger ${trigger._id}:`, e.message);
    }
};

/**
 * Executes a simulated paper trade:
 *  - BUY:  deducts cost from User.simulatedBalance, upserts a Position
 *  - SELL: adds revenue to User.simulatedBalance, closes/reduces Position
 */
const executePaperTrade = async (trigger, executionPrice) => {
    const user = await User.findById(trigger.userId);
    if (!user) return;

    const totalCost = trigger.amount * executionPrice;

    if (trigger.type === 'BUY') {
        if (user.simulatedBalance < totalCost) {
            console.warn(`[Engine] Insufficient balance for ${trigger.assetId} BUY. Cancelling trigger.`);
            trigger.status = 'CANCELLED';
            await trigger.save();
            return;
        }

        // Deduct from balance
        user.simulatedBalance = parseFloat((user.simulatedBalance - totalCost).toFixed(2));

        // Upsert position
        const existingPosition = await Position.findOne({ userId: trigger.userId, assetId: trigger.assetId, market: trigger.market });

        if (existingPosition) {
            // Average into the existing position
            const totalShares = existingPosition.amount + trigger.amount;
            const newAvg = ((existingPosition.averageBuyPrice * existingPosition.amount) + (executionPrice * trigger.amount)) / totalShares;
            existingPosition.amount = totalShares;
            existingPosition.averageBuyPrice = parseFloat(newAvg.toFixed(6));
            await existingPosition.save();
        } else {
            await Position.create({
                userId: trigger.userId,
                assetId: trigger.assetId,
                amount: trigger.amount,
                averageBuyPrice: executionPrice,
                market: trigger.market,
            });
        }

    } else if (trigger.type === 'SELL') {
        const existingPosition = await Position.findOne({ userId: trigger.userId, assetId: trigger.assetId, market: trigger.market });

        if (!existingPosition || existingPosition.amount < trigger.amount) {
            console.warn(`[Engine] Insufficient position to SELL ${trigger.assetId}. Cancelling trigger.`);
            trigger.status = 'CANCELLED';
            await trigger.save();
            return;
        }

        // Add proceeds to balance
        user.simulatedBalance = parseFloat((user.simulatedBalance + totalCost).toFixed(2));

        // Reduce or delete position
        existingPosition.amount -= trigger.amount;
        if (existingPosition.amount <= 0) {
            await existingPosition.deleteOne();
        } else {
            await existingPosition.save();
        }
    }

    // Mark trigger as executed
    trigger.status = 'EXECUTED';
    await Promise.all([trigger.save(), user.save()]);

    console.log(`[Engine] ✅ Paper trade complete. New balance: $${user.simulatedBalance}`);
};

module.exports = { startTriggerEngine };
