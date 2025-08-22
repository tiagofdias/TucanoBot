const { SlashCommandBuilder, EmbedBuilder, ChannelType, PermissionFlagsBits } = require('discord.js');
const AutoScreenshot = require('../models/AutoScreenshot');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('autoscreenshot')
        .setDescription('Configure automatic screenshot for URLs in specific channels')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
        .addSubcommand(subcommand =>
            subcommand.setName('add')
                .setDescription('Enable automatic screenshots in a channel')
                .addChannelOption(option =>
                    option.setName('channel')
                        .setDescription('The channel to enable automatic screenshots')
                        .addChannelTypes(ChannelType.GuildText)
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand.setName('remove')
                .setDescription('Disable automatic screenshots in a channel')
                .addChannelOption(option =>
                    option.setName('channel')
                        .setDescription('The channel to disable automatic screenshots')
                        .addChannelTypes(ChannelType.GuildText)
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand.setName('list')
                .setDescription('List all channels with automatic screenshots enabled')),

    async execute(interaction) {
        if (!interaction.inGuild()) {
            return interaction.reply({ content: 'This command can only be used in a server.', ephemeral: true });
        }

        const subcommand = interaction.options.getSubcommand();

        try {
            switch (subcommand) {
                case 'add': {
                    const channel = interaction.options.getChannel('channel');
                    
                    // Check if already exists
                    const existing = await AutoScreenshot.findOne({
                        where: { ServerID: interaction.guildId, ChannelID: channel.id }
                    });
                    
                    if (existing) {
                        return interaction.reply({ 
                            content: `🔄 Automatic screenshots are already enabled in ${channel}.`, 
                            ephemeral: true 
                        });
                    }
                    
                    // Add to database
                    await AutoScreenshot.create({
                        ServerID: interaction.guildId,
                        ChannelID: channel.id
                    });
                    
                    const embed = new EmbedBuilder()
                        .setTitle('📸 Automatic Screenshots Enabled')
                        .setDescription(`URLs posted in ${channel} will now automatically generate screenshots.`)
                        .setColor('Green')
                        .setTimestamp();
                    
                    return interaction.reply({ embeds: [embed], ephemeral: true });
                }

                case 'remove': {
                    const channel = interaction.options.getChannel('channel');
                    
                    // Remove from database
                    const deleted = await AutoScreenshot.destroy({
                        where: { ServerID: interaction.guildId, ChannelID: channel.id }
                    });
                    
                    if (deleted === 0) {
                        return interaction.reply({ 
                            content: `❌ Automatic screenshots were not enabled in ${channel}.`, 
                            ephemeral: true 
                        });
                    }
                    
                    const embed = new EmbedBuilder()
                        .setTitle('📸 Automatic Screenshots Disabled')
                        .setDescription(`URLs posted in ${channel} will no longer generate automatic screenshots.`)
                        .setColor('Red')
                        .setTimestamp();
                    
                    return interaction.reply({ embeds: [embed], ephemeral: true });
                }

                case 'list': {
                    const channels = await AutoScreenshot.findAll({
                        where: { ServerID: interaction.guildId }
                    });
                    
                    if (channels.length === 0) {
                        return interaction.reply({ 
                            content: '📋 No channels have automatic screenshots enabled.', 
                            ephemeral: true 
                        });
                    }
                    
                    let channelList = '';
                    for (const channel of channels) {
                        const discordChannel = interaction.guild.channels.cache.get(channel.ChannelID);
                        if (discordChannel) {
                            channelList += `• ${discordChannel}\n`;
                        } else {
                            channelList += `• #deleted-channel (${channel.ChannelID})\n`;
                        }
                    }
                    
                    const embed = new EmbedBuilder()
                        .setTitle('📸 Automatic Screenshots Enabled In:')
                        .setDescription(channelList || 'No valid channels found.')
                        .setColor('Blue')
                        .setTimestamp();
                    
                    return interaction.reply({ embeds: [embed], ephemeral: true });
                }
            }
        } catch (error) {
            console.error('AutoScreenshot command error:', error);
            return interaction.reply({ 
                content: '❌ An error occurred while configuring automatic screenshots.', 
                ephemeral: true 
            });
        }
    }
};
