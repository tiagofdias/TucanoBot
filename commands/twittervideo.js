const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { createVideoAlternatives, isTwitterUrl } = require('../utils/TwitterVideoExtractor');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('twittervideo')
		.setDescription('Extract video from an X.com (Twitter) URL')
		.addStringOption(option =>
			option.setName('url')
				.setDescription('The X.com URL containing a video')
				.setRequired(true)
		),
	async execute(interaction) {
		const url = interaction.options.getString('url');
		
		// Validate if it's a Twitter/X.com URL
		if (!isTwitterUrl(url)) {
			return await interaction.reply({
				content: '❌ **Error:** Please provide a valid X.com (Twitter) URL.',
				ephemeral: true
			});
		}

		try {
			await interaction.deferReply();
			
			console.log(`[TWITTER VIDEO COMMAND] Processing URL: ${url}`);
			
			const alternatives = createVideoAlternatives(url);
			
			if (alternatives.length > 0) {
				const embed = new EmbedBuilder()
					.setColor('#1DA1F2')
					.setTitle('🎥 X.com Video - Alternative Viewers')
					.setDescription('Having trouble viewing the video? Try these alternative links:')
					.setURL(url);
				
				for (let i = 0; i < alternatives.length; i++) {
					embed.addFields([
						{
							name: `${alternatives[i].name}`,
							value: `[${alternatives[i].description}](${alternatives[i].url})`,
							inline: true
						}
					]);
				}
				
				embed.addFields([
					{
						name: '🔗 Original',
						value: `[View on X.com](${url})`,
						inline: true
					}
				]);
				
				embed.setFooter({ text: 'Enhanced video viewing options by TucanoBot' });
				embed.setTimestamp();
				
				await interaction.editReply({
					embeds: [embed]
				});
				
				console.log(`[TWITTER VIDEO COMMAND] Successfully provided alternatives for: ${url}`);
			} else {
				const errorEmbed = new EmbedBuilder()
					.setColor('#FF0000')
					.setTitle('❌ Could Not Process URL')
					.setDescription('Unable to create alternative video viewing options for this X.com URL.')
					.setTimestamp();
				
				await interaction.editReply({
					embeds: [errorEmbed]
				});
			}
			
		} catch (error) {
			console.error(`[TWITTER VIDEO COMMAND] Error: ${error.message}`);
			
			const errorEmbed = new EmbedBuilder()
				.setColor('#FF0000')
				.setTitle('❌ Error Processing Video')
				.setDescription('An error occurred while trying to extract the video from the X.com URL.')
				.addFields([
					{
						name: 'Error Details',
						value: error.message,
						inline: false
					}
				])
				.setTimestamp();
			
			await interaction.editReply({
				embeds: [errorEmbed]
			});
		}
	},
};
