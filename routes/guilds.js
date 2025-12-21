const express = require('express');
const router = express.Router();
const { Client } = require('discord.js');

// Middleware to check authentication
const requireAuth = (req, res, next) => {
    if (!req.session.user) {
        return res.status(401).json({ error: 'Not authenticated' });
    }
    next();
};

// Middleware to check guild permission
const requireGuildPermission = (req, res, next) => {
    const guildId = req.params.guildId;
    const userGuilds = req.session.guilds || [];
    
    const guild = userGuilds.find(g => g.id === guildId);
    if (!guild) {
        return res.status(403).json({ error: 'Guild not found' });
    }
    
    // Check if user has MANAGE_GUILD permission (0x20)
    const hasPermission = (BigInt(guild.permissions) & BigInt(0x20)) !== BigInt(0);
    if (!hasPermission) {
        return res.status(403).json({ error: 'No permission to manage this guild' });
    }
    
    req.guild = guild;
    next();
};

// Get guilds user can manage (that the bot is in)
router.get('/', requireAuth, async (req, res) => {
    try {
        const userGuilds = req.session.guilds || [];
        
        // Filter guilds where user has MANAGE_GUILD permission
        const manageableGuilds = userGuilds.filter(guild => {
            const hasPermission = (BigInt(guild.permissions) & BigInt(0x20)) !== BigInt(0);
            return hasPermission;
        });

        // Get bot's client from global scope (set in index.js)
        const botClient = global.discordClient;
        
        // Filter to only include guilds where bot is present
        const botGuilds = manageableGuilds.filter(guild => {
            return botClient && botClient.guilds.cache.has(guild.id);
        }).map(guild => ({
            id: guild.id,
            name: guild.name,
            icon: guild.icon,
            iconUrl: guild.icon 
                ? `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png`
                : null
        }));

        res.json(botGuilds);
    } catch (error) {
        console.error('Error fetching guilds:', error);
        res.status(500).json({ error: 'Failed to fetch guilds' });
    }
});

// Get specific guild details
router.get('/:guildId', requireAuth, requireGuildPermission, async (req, res) => {
    try {
        const botClient = global.discordClient;
        const guild = botClient?.guilds.cache.get(req.params.guildId);
        
        if (!guild) {
            return res.status(404).json({ error: 'Bot is not in this guild' });
        }

        res.json({
            id: guild.id,
            name: guild.name,
            icon: guild.icon,
            iconUrl: guild.icon 
                ? `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png`
                : null,
            memberCount: guild.memberCount,
            channels: guild.channels.cache
                .filter(c => c.type === 0) // Text channels
                .map(c => ({ id: c.id, name: c.name })),
            roles: guild.roles.cache
                .filter(r => r.id !== guild.id) // Exclude @everyone
                .map(r => ({ id: r.id, name: r.name, color: r.hexColor }))
        });
    } catch (error) {
        console.error('Error fetching guild:', error);
        res.status(500).json({ error: 'Failed to fetch guild' });
    }
});

module.exports = router;
module.exports.requireAuth = requireAuth;
module.exports.requireGuildPermission = requireGuildPermission;
