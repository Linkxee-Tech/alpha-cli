const Trigger = require('../models/Trigger');
const User = require('../models/User');
const Position = require('../models/Position');

const { validationResult } = require('express-validator');

// @desc Set a new Paper Trading trigger based on conditions
exports.createTrigger = async (req, res) => {
    // 1. Validate Input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const { assetId, type, conditionType, targetValue, amount, market } = req.body;
        
        // Additional business logic validation
        if (Number(amount) <= 0) {
            return res.status(400).json({ error: 'Amount must be greater than zero' });
        }

        const trigger = new Trigger({
            userId: req.user.id,
            assetId,
            type: type.toUpperCase(), // BUY / SELL
            conditionType,
            targetValue: Number(targetValue),
            amount: Number(amount),
            market: market.toUpperCase()
        });

        await trigger.save();
        res.status(201).json({ message: 'Autonomous trigger set', trigger });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
};

exports.getTriggers = async (req, res) => {
    try {
        const triggers = await Trigger.find({ userId: req.user.id });
        res.json({ triggers });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
};

exports.getPositions = async (req, res) => {
    try {
        const positions = await Position.find({ userId: req.user.id });
        const user = await User.findById(req.user.id);
        res.json({ positions, simulatedBalance: user.simulatedBalance });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
};

exports.updatePassword = async (req, res) => {
    try {
        const { newPassword } = req.body;
        const user = await User.findById(req.user.id);
        user.password = newPassword;
        await user.save();
        res.json({ message: 'Password updated successfully' });
    } catch(e) {
        res.status(500).json({ error: e.message });
    }
};

exports.cancelTrigger = async (req, res) => {
    try {
        const trigger = await Trigger.findOne({ _id: req.params.id, userId: req.user.id });
        if (!trigger) return res.status(404).json({ error: 'Trigger not found or not owned by you' });
        if (trigger.status !== 'ACTIVE') return res.status(400).json({ error: `Cannot cancel a trigger with status: ${trigger.status}` });

        trigger.status = 'CANCELLED';
        await trigger.save();
        res.json({ message: 'Trigger cancelled successfully', trigger });
    } catch(e) {
        res.status(500).json({ error: e.message });
    }
};
