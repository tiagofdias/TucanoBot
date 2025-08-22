const { SlashCommandBuilder, ChannelType, EmbedBuilder } = require('discord.js');
const TempVCS = require('../models/TempVCS');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('temporaryvcs')
        .setDescription('temporary voice channel generators')
        .addSubcommand(subcommand =>
            subcommand
                .setName('add')
                .setDescription("Adds a temporary voice channel generator to the server.")
                .addChannelOption(option =>
                    option
                        .setName('channel')
                        .setDescription('The channel where the temporary voice channels will be generated.')
                        .setRequired(true)
                        .addChannelTypes(ChannelType.GuildVoice)
                )
                .addNumberOption(option =>
                    option
                        .setName('userlimit')
                        .setDescription('the voice channel user limit.')
                        .setRequired(true)
                )
                .addNumberOption(option =>
                    option
                        .setName('bitrate')
                        .setDescription('The voice channel user limit (between 8 and 96).')
                        .setRequired(true)
                        .setMinValue(8)
                        .setMaxValue(96)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('remove')
                .setDescription('Removes a temporary voice channel generator from the server.')
                .addChannelOption(option =>
                    option
                        .setName('channel')
                        .setDescription('The channel where the temporary voice channels will stop being generated generated.')
                        .setRequired(true)
                        .addChannelTypes(ChannelType.GuildVoice)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('list')
                .setDescription('list all the voice channel generators working inside the server.')
        ),

    async execute(interaction) {

        if (interaction.options.getSubcommand()) {

            switch (interaction.options.getSubcommand()) {
                case "add":

                    try {

                        const VCGenerator = interaction.options.get('channel').value;
                        const userlimit = interaction.options.get('userlimit').value;
                        const bitrate = interaction.options.get('bitrate').value;

                        console.log(VCGenerator);
                        console.log(userlimit);
                        console.log(bitrate);
                        //INSERT E UPDATE

                        const existingRecord = await TempVCS.findOne({ where: { VCID: VCGenerator.toString() } });

                        if (existingRecord) {
                            await TempVCS.update(
                                { ServerID: interaction.guildId.toString(), UserLimit: userlimit, BitRate: bitrate },
                                { where: { VCID: VCGenerator.toString() } }
                            );
                        } else {
                            await TempVCS.create({
                                ServerID: interaction.guildId.toString(),
                                VCID: VCGenerator.toString(),
                                UserLimit: userlimit,
                                BitRate: bitrate
                            });
                        }

                        interaction.reply({ content: `The operation was concluded successfully`, ephemeral: true });

                    }
                    catch (error) {
                        if (error.name === 'SequelizeUniqueConstraintError') return interaction.reply('That tag already exists.');
                        return interaction.reply('Something went wrong with adding a tag.');
                    }

                    break;

                case "remove":

                    try {
                        const VCGenerator = interaction.options.get('channel').value;

                        const deletedRows = await TempVCS.destroy({ where: { VCID: VCGenerator } });

                        if (deletedRows > 0)
                            interaction.reply({ content: `<#${VCGenerator}> has been successfully removed from the list`, ephemeral: true });
                        else
                            interaction.reply({ content: `<#${VCGenerator}> is not in the list`, ephemeral: true });

                    } catch (error) {
                        console.error(error);
                        interaction.reply({ content: 'An error occurred while removing the voice channel from the list.', ephemeral: true });
                    }

                    break;

                case "list":

                    try {
                        const serverID = interaction.guildId.toString();

                        const count = await TempVCS.count({ where: { ServerID: serverID } });

                        if (count > 0) {
                            const channels = await TempVCS.findAll({ where: { ServerID: serverID } });

                            const channelNames = await Promise.all(
                                channels.map(async (channel) => {
                                    const channelName = await interaction.guild.channels.fetch(channel.VCID);
                                    return channelName.toString();
                                })
                            );

                            const embed = new EmbedBuilder()
                                .setTitle('Voice Generator Channels List')
                                .setDescription(`These are the voice generators currently working inside this server: \n\n ${channelNames.join('\n')}`)
                                .setColor('Green');

                            interaction.reply({ embeds: [embed], ephemeral: true });
                        } else
                            interaction.reply({ content: 'The list is empty', ephemeral: true });

                    } catch (error) {
                        console.error(error);
                        interaction.reply({ content: 'An error occurred while listing the channels.', ephemeral: true });
                    }

                    break;
            }
        }
    },
};
