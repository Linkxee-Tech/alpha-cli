const Trigger = require('../models/Trigger');
const User = require('../models/User');
const Position = require('../models/Position');

// @desc Set a new Paper Trading trigger based on conditions
exports.createTrigger = async (req, res) => {
    try {
        const { assetId, type, conditionType, targetValue, amount, market } = req.body;
        const trigger = new Trigger({
            userId: req.user.id, // Set by authentication middleware
            assetId,
            type: type.toUpperCase(), // BUY / SELL
            conditionType,
            targetValue,
            amount,
            market
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
