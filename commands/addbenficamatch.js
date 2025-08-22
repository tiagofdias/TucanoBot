const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('addbenficamatch')
        .setDescription('Add a known upcoming Benfica match manually (Admin only)')
        .addStringOption(option =>
            option.setName('opponent')
                .setDescription('The opponent team name')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('date')
                .setDescription('Match date (YYYY-MM-DD format)')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('time')
                .setDescription('Match time (HH:MM format, 24h)')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('competition')
                .setDescription('Competition name (e.g., Champions League)')
                .setRequired(true))
        .addBooleanOption(option =>
            option.setName('home')
                .setDescription('Is Benfica playing at home?')
                .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),
    
    async execute(interaction) {
        if (!interaction.member.permissions.has(PermissionFlagsBits.ManageChannels)) {
            return await interaction.reply({ 
                content: '❌ You need Manage Channels permission to use this command.', 
                ephemeral: true 
            });
        }

        const opponent = interaction.options.getString('opponent');
        const date = interaction.options.getString('date');
        const time = interaction.options.getString('time');
        const competition = interaction.options.getString('competition');
        const isHome = interaction.options.getBoolean('home');

        // Validate date format
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(date)) {
            return await interaction.reply({ 
                content: '❌ Invalid date format. Use YYYY-MM-DD (e.g., 2025-08-21)', 
                ephemeral: true 
            });
        }

        // Validate time format
        const timeRegex = /^\d{2}:\d{2}$/;
        if (!timeRegex.test(time)) {
            return await interaction.reply({ 
                content: '❌ Invalid time format. Use HH:MM in 24-hour format (e.g., 20:00)', 
                ephemeral: true 
            });
        }

        // Check if date is in the future
        const matchDateTime = new Date(date + 'T' + time + ':00');
        if (matchDateTime <= new Date()) {
            return await interaction.reply({ 
                content: '❌ Match date must be in the future.', 
                ephemeral: true 
            });
        }

        // Store the match (you could save this to database if needed)
        const matchInfo = {
            opponent,
            date,
            time,
            competition,
            isHome,
            addedBy: interaction.user.id,
            addedAt: new Date().toISOString()
        };

        // Calculate time until match for immediate feedback
        const now = new Date();
        const timeDiff = matchDateTime.getTime() - now.getTime();
        const daysUntil = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
        const hoursUntil = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

        let timeString = '';
        if (daysUntil > 0) {
            timeString = `${daysUntil} days and ${hoursUntil} hours`;
        } else if (hoursUntil > 0) {
            timeString = `${hoursUntil} hours`;
        } else {
            timeString = 'less than an hour';
        }

        const homeAwayText = isHome ? 'vs' : '@';
        const venueText = isHome ? 'at Estádio da Luz (Home)' : '(Away)';

        await interaction.reply({
            content: `✅ **Benfica Match Added!** 🔴⚪️🦅\n\n` +
                `**Benfica ${homeAwayText} ${opponent}**\n` +
                `📅 Date: ${matchDateTime.toLocaleDateString('en-GB')}\n` +
                `⏰ Time: ${matchDateTime.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}\n` +
                `🏆 Competition: ${competition}\n` +
                `🏟️ Venue: ${venueText}\n` +
                `⏳ **In ${timeString}**\n\n` +
                `*The automatic tracker will now monitor this match!*\n` +
                `*Red theme will activate 2 hours before kickoff* 🔴`,
            ephemeral: true
        });

        // Log for debugging
        console.log(`🔴⚪️ Manual match added: Benfica ${homeAwayText} ${opponent} on ${date} at ${time}`);
    },
};
