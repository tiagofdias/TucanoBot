const { SlashCommandBuilder, ApplicationCommandOptionType, AttachmentBuilder, } = require('discord.js');
const { Op, Sequelize, QueryTypes } = require('sequelize');

// Lazy load heavy dependency when command actually runs to save RAM during idle.
let canvacord;
const RankCardDesigner = require('../utils/RankCardDesigner');
const CleanRankCardDesigner = require('../utils/CleanRankCardDesigner');
const Level = require('../models/Level');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('rank')
    .setDescription('gets the rank of a user.')
    .addUserOption(option =>
      option.setName('user')
        .setDescription('The user to get the rank for. (Leave empty for yourself)')
        .setRequired(false)),

  async execute(interaction) {
    try {
      if (!interaction.inGuild()) {
        return interaction.reply({ content: 'You can only run this command inside a server.', flags: 64 });
      }

      // CRITICAL: Defer immediately to prevent timeout (must respond within 3 seconds)
      await interaction.deferReply({ flags: 64 });

      // Use the specified user or the command author
      const targetUser = interaction.options.getUser('user') || interaction.user;
      const Member = targetUser.id;
      
      if (targetUser.bot) {
        return interaction.editReply({ content: 'Bots cannot be ranked.' });
      }

      // Now do the heavy work after deferring
      const member = await interaction.guild.members.fetch(Member).catch(err => {
        console.error('Failed to fetch member:', err);
        return null;
      });

      if (!member) {
        return interaction.editReply({ content: 'Could not find that user in this server.' });
      }

      const count = await Level.findOne({ 
        where: { ServerID: interaction.guildId.toString(), MemberID: Member }, 
        order: [['xp', 'DESC']] 
      }).catch(err => {
        console.error('Database error:', err);
        return null;
      });

      if (!count) {
        return interaction.editReply({ content: 'This user has no rank data yet.' });
      }

  const cumulative = require('../utils/CalculateLevelXP');
  let level = count.level;
  // Progress inside current level already stored, but recompute for safety
  const levelStart = cumulative(level);
  const nextLevelStart = cumulative(level + 1);
  let currentXP = count.xp - levelStart; // ensure aligned with total xp
  if (currentXP < 0) currentXP = 0; // guard against legacy data
  let requiredXP = nextLevelStart - levelStart;
      let username = member.user.username;
      let discriminator = member.user.discriminator;
      let status = member.presence?.status || 'offline';

      // Get rank position - use Sequelize count for better compatibility
      let rankPosition = 1;
      try {
        const higherRanked = await Level.count({
          where: {
            ServerID: interaction.guildId.toString(),
            xp: { [Op.gt]: count.xp }
          }
        });
        rankPosition = higherRanked + 1;
      } catch (err) {
        console.error('Rank query error:', err);
        rankPosition = 1;
      }

      try {
        // Use the beautiful clean rank card designer
        const cleanRankCardDesigner = new CleanRankCardDesigner();
        const cardBuffer = await cleanRankCardDesigner.createRankCard({
          username: username,
          avatar: member.user.displayAvatarURL({ extension: 'png', size: 256 }),
          level: level,
          currentXP: currentXP,
          requiredXP: requiredXP,
          rank: rankPosition,
          status: status
        });

        const attachment = new AttachmentBuilder(cardBuffer, { name: 'rank-card.png' });
        await interaction.editReply({ content: '', files: [attachment] });

      } catch (cardError) {
        console.error('Clean rank card failed, trying original:', cardError);
        
        // Fallback to original custom designer
        try {
          const rankCardDesigner = new RankCardDesigner();
          const cardBuffer = await rankCardDesigner.createRankCard({
            username: username,
            discriminator: discriminator,
            avatar: member.user.displayAvatarURL({ extension: 'png', size: 256 }),
            level: level,
            currentXP: currentXP,
            requiredXP: requiredXP,
            rank: rankPosition,
            status: status
          });

          const attachment = new AttachmentBuilder(cardBuffer, { name: 'rank-card.png' });
          await interaction.editReply({ content: '', files: [attachment] });

        } catch (originalError) {
          console.error('Original rank card failed, using canvacord:', originalError);
          
          // Final fallback to canvacord
          try {
            if (!canvacord) canvacord = require('canvacord');
            const rank = new canvacord.Rank()
              .setAvatar(member.user.displayAvatarURL({ size: 256 }))
              .setRank(rankPosition)
              .setLevel(level)
              .setCurrentXP(currentXP)
              .setRequiredXP(requiredXP)
              .setStatus(status)
              .setProgressBar('#00ffff', 'COLOR')
              .setUsername(username)
              .setDiscriminator(discriminator);

            const data = await rank.build();
            const attachment = new AttachmentBuilder(data);
            await interaction.editReply({ content: '', files: [attachment] });
          } catch (fallbackError) {
            console.error('All rank card methods failed:', fallbackError);
            await interaction.editReply({ 
              content: `**${username}**\nLevel: ${level}\nXP: ${currentXP.toLocaleString()} / ${requiredXP.toLocaleString()}\nRank: #${rankPosition}` 
            });
          }
        }
      }

    } catch (error) {
      console.error('Critical error in rank command:', error);
      
      // Try to respond if we haven't already
      try {
        if (!interaction.replied && !interaction.deferred) {
          await interaction.reply({ content: 'An error occurred. Please try again.', flags: 64 });
        } else {
          await interaction.editReply({ content: 'An error occurred while generating the rank card.' });
        }
      } catch (replyError) {
        console.error('Failed to send error message:', replyError);
      }
    }
  },
};
