const express = require('express');
const router = express.Router();
const { requireAuth, requireGuildPermission } = require('./guilds');

const Birthday = require('../models/Birthday');
const BirthdayConfig = require('../models/BirthdayConfig');

// Get birthday config
router.get('/:guildId/birthdays/config', requireAuth, requireGuildPermission, async (req, res) => {
    try {
        let config = await BirthdayConfig.findOne({ where: { ServerID: req.params.guildId } });
        res.json(config || { ServerID: req.params.guildId, ChannelID: null, Status: false });
    } catch (error) {
        console.error('Error fetching birthday config:', error);
        res.status(500).json({ error: 'Failed to fetch birthday config' });
    }
});

// Update birthday config
router.put('/:guildId/birthdays/config', requireAuth, requireGuildPermission, async (req, res) => {
    try {
        const { ChannelID, Status } = req.body;

        const [config, created] = await BirthdayConfig.findOrCreate({
            where: { ServerID: req.params.guildId },
            defaults: { ServerID: req.params.guildId }
        });

        await config.update({
            ChannelID: ChannelID ?? config.ChannelID,
            Status: Status ?? config.Status
        });

        res.json(config);
    } catch (error) {
        console.error('Error updating birthday config:', error);
        res.status(500).json({ error: 'Failed to update birthday config' });
    }
});

// Get all birthdays for a guild
router.get('/:guildId/birthdays', requireAuth, requireGuildPermission, async (req, res) => {
    try {
        const birthdays = await Birthday.findAll({ 
            where: { ServerID: req.params.guildId },
            order: [['Month', 'ASC'], ['Day', 'ASC']]
        });

        const botClient = global.discordClient;
        const guild = botClient?.guilds.cache.get(req.params.guildId);

        const enriched = await Promise.all(birthdays.map(async (b) => {
            let username = 'Unknown User';
            let avatar = null;
            
            try {
                const member = await guild?.members.fetch(b.MemberID).catch(() => null);
                if (member) {
                    username = member.user.username;
                    avatar = member.user.displayAvatarURL({ size: 64 });
                }
            } catch (e) {}

            return {
                id: b.id,
                memberId: b.MemberID,
                username,
                avatar,
                day: b.Day,
                month: b.Month
            };
        }));

        res.json(enriched);
    } catch (error) {
        console.error('Error fetching birthdays:', error);
        res.status(500).json({ error: 'Failed to fetch birthdays' });
    }
});

// Delete a birthday
router.delete('/:guildId/birthdays/:memberId', requireAuth, requireGuildPermission, async (req, res) => {
    try {
        await Birthday.destroy({
            where: { ServerID: req.params.guildId, MemberID: req.params.memberId }
        });
        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting birthday:', error);
        res.status(500).json({ error: 'Failed to delete birthday' });
    }
});

module.exports = router;
