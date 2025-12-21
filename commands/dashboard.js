const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('dashboard')
        .setDescription('Get the link to the TucanoBot dashboard'),

    async execute(interaction) {
        const dashboardUrl = process.env.DASHBOARD_URL || 'https://tucanobot.onrender.com/dashboard';
        
        const embed = new EmbedBuilder()
            .setTitle('🎛️ TucanoBot Dashboard')
            .setDescription(`Click the button below to access the dashboard:\n\n[**Open Dashboard**](${dashboardUrl})`)
            .setColor('#5865F2')
            .setFooter({ text: 'Manage your server settings, levels, birthdays, and more!' })
            .setTimestamp();
        
        await interaction.reply({ embeds: [embed], ephemeral: true });
    },
};
