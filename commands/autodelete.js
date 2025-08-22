const { SlashCommandBuilder, ChannelType, EmbedBuilder } = require('discord.js');

const AutoDelete = require('../models/AutoDelete');
const Suggestions = require('../models/Suggestions');
const AutoPublish = require('../models/AutoPublish');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('autodelete')
		.setDescription('autodeletes a message')
		.addSubcommand(subcommand =>
			subcommand
				.setName('add')
				.setDescription('deletes a message in a channel after x seconds')
				.addNumberOption(option =>
					option
						.setName('seconds')
						.setDescription('After x seconds the message will be deleted.')
						.setRequired(true)
				)
				.addChannelOption(option =>
					option
						.setName('channel')
						.setDescription('The channel where the messages will be deleted.')
						.setRequired(true)
						.addChannelTypes(ChannelType.GuildText)
				)
		)
		.addSubcommand(subcommand =>
			subcommand
				.setName('remove')
				.setDescription('Removes a channel from the list')
				.addChannelOption(option =>
					option
						.setName('channel')
						.setDescription('The channel where the bot will stop deleting messages.')
						.setRequired(true)
						.addChannelTypes(ChannelType.GuildText)
				)
		)
		.addSubcommand(subcommand =>
			subcommand
				.setName('list')
				.setDescription('list all the channels where the autodelete is running.')
		)
	,
	async execute(interaction) {

		try {
			// Reply immediately to prevent timeout
			await interaction.reply({ content: '🔄 Processing your request...', flags: 64 });

			if (interaction.options.getSubcommand()) {

				var QueryChannel;

				switch (interaction.options.getSubcommand()) {
					case "add":

						const Seconds = parseInt(interaction.options.get('seconds').value);
						const Channel = interaction.options.get('channel').value;

						//Validações

						const QuerySuggestions = await Suggestions.count({ where: { ServerID: interaction.guildId.toString(), ChannelID: Channel }, });
						if (QuerySuggestions == 1) return interaction.editReply({ content: `<#${Channel}> is already a suggestions channel. You cannot set an autodelete channel here.` });

						const QueryAutoPublish = await AutoPublish.count({ where: { ServerID: interaction.guildId.toString(), ChannelID: Channel }, });
						if (QueryAutoPublish == 1) return interaction.editReply({ content: `<#${Channel}> is already an autopublish channel. You cannot set an autodelete channel here.` });

						//Verifica se o Channel já existe na BD. Se não existir, adiciona.
						QueryChannel = await AutoDelete.count({ where: { ChannelID: Channel } });

						//UPDATE
						if (QueryChannel === 1) {

							const UPDATE = await AutoDelete.update({ Seconds: Seconds }, { where: { ChannelID: Channel } });

							interaction.editReply({ content: `The messages inside <#${Channel}> are now being removed every ${Seconds} seconds.` });
						}
						else {

							//Inserir ChannelID e Segundos na BD
							try {

								const INSERT = await AutoDelete.create({
									ServerID: interaction.guildId.toString(),
									ChannelID: Channel.toString(),
									Seconds: Seconds,
								});

								interaction.editReply({ content: `Your messages will now be deleted every ${Seconds} seconds inside <#${Channel}>.` });

							}
							catch (error) {
								if (error.name === 'SequelizeUniqueConstraintError') {
									return interaction.editReply({ content: 'That tag already exists.' });
								}

								return interaction.editReply({ content: 'Something went wrong with adding a tag.' });
							}
						}

						break;

					case "remove":

						//Verifica se o Channel já existe na BD. Se não existir, adiciona.
						QueryChannel = await AutoDelete.count({ where: { ChannelID: interaction.options.get('channel').value } });

						//Verifica se o Channel já existe na lista.
						if (QueryChannel === 1) {

							const DELETE = await AutoDelete.destroy({ where: { ChannelID: interaction.options.get('channel').value } });

							interaction.editReply({ content: `<#${interaction.options.get('channel').value}> has been successfully removed from the list` });

						} else {
							interaction.editReply({ content: `<#${interaction.options.get('channel').value}> is not in the list` });
						}

						break;

						case "list":
							//Conta os registos
							QueryChannel = await AutoDelete.count({ where: { ServerID: interaction.guildId.toString() } });
						
							if (QueryChannel > 0) {
								const Lista = await AutoDelete.findAll({ where: { ServerID: interaction.guildId.toString() } });
								let Description = '';
						
								for (let element of Lista) {
									const ChannelName = interaction.guild.channels.cache.find(channel => channel.id === element.ChannelID);
									if (ChannelName) {
										Description += ` ${ChannelName} every ${element.Seconds} seconds 
										`;
									}
								}
						
								if (Description.length > 0) {
									//Description = Description.substring(9, Description.length - 2);
						
									let embed = new EmbedBuilder()
										.setTitle("Channel List")
										.setDescription(`The toucan is deleting messages from: \n ${Description} `)
										.setColor('Green');
						
									interaction.editReply({ embeds: [embed] });
								} else {
									interaction.editReply({ content: `The list is empty` });
								}
							} else {
								interaction.editReply({ content: `The list is empty` });
							}
							break;
						
				}

			}

		} catch (error) {
			if (error.name === 'SequelizeUniqueConstraintError') {
				return interaction.editReply('That tag already exists.');
			}

			console.log(error);

			return interaction.editReply('Something went wrong with adding a tag.');
		}

		// await interaction.reply('Pong!');
	},
};
