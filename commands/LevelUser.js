const { SlashCommandBuilder, ApplicationCommandOptionType, AttachmentBuilder, EmbedBuilder } = require('discord.js');
const { Op, Sequelize, QueryTypes } = require('sequelize');

let canvacord; // lazy
const RankCardDesigner = require('../utils/RankCardDesigner');
const LeaderboardDesigner = require('../utils/LeaderboardDesigner');
const ModernLeaderboardDesigner = require('../utils/ModernLeaderboardDesigner');
const Level = require('../models/Level');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('level')
    .setDescription('Get the rank or set the XP of a user.')
    .addSubcommand(subcommand =>
      subcommand
        .setName('rank')
        .setDescription('Get the rank of a user.')
        .addUserOption(option =>
          option.setName('user')
            .setDescription('The user to get the rank for.')
            .setRequired(true),
        ),
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('toplvl')
        .setDescription('Shows the TOP 10 members with the most XP inside the server.')
    ),

  async execute(interaction) {

    if (!interaction.inGuild()) {
      interaction.reply('You can only run this command inside a server.');
      return;
    }

    // CRITICAL: Defer immediately to prevent timeout (deferReply gives 15 min instead of 3 sec)
    await interaction.deferReply({ flags: 64 });

    switch (interaction.options.getSubcommand()) {

      case "rank":

        const checkbot = interaction.options.get('user').user;
        if (checkbot && checkbot.bot) return interaction.editReply({ content: 'Bots cannot be ranked.' });

        const Member = interaction.options.get('user')?.value;

        const member = await interaction.guild.members.fetch(Member);

        const count = await Level.findOne({ where: { ServerID: interaction.guildId.toString(), MemberID: Member }, order: [['xp', 'DESC'],], });

        if (count === null) return interaction.editReply({ content: `This user doesn't have rank yet.` });

        let level = count.level;
        let currentXP = count.xplevel; // XP progress towards next level  
        let requiredXP = 3 * (level ** 2); // XP needed for next level
        let username = member.user.username;
        let discriminator = member.user.discriminator;
        let status;

        try {
          status = member.presence.status;
        }
        catch {
          status = 'offline'
        }

        //rank
        const position = await Level.sequelize.query(`
        SELECT COUNT(*) + 1 as position FROM Level WHERE ServerID = :serverId AND xp > ( SELECT xp FROM Level WHERE ServerID = :serverId AND MemberID = :memberId)`,
          {
            replacements: {
              serverId: interaction.guildId,
              memberId: Member
            },
            type: QueryTypes.SELECT
          });

        try {
          // Use our beautiful custom rank card designer
          const rankCardDesigner = new RankCardDesigner();
          const cardBuffer = await rankCardDesigner.createRankCard({
            username: username,
            discriminator: discriminator,
            avatar: member.user.displayAvatarURL({ extension: 'png', size: 256 }),
            level: level,
            currentXP: currentXP,
            requiredXP: requiredXP,
            rank: position[0].position,
            status: status
          });

          const attachment = new AttachmentBuilder(cardBuffer, { name: 'rank-card.png' });
          interaction.editReply({ files: [attachment] });

        } catch (error) {
          console.error('Error creating custom rank card:', error);
          
          // Fallback to canvacord if custom card fails
          if (!canvacord) canvacord = require('canvacord');
          const rank = new canvacord.Rank()
            .setAvatar(member.user.displayAvatarURL({ size: 256 }))
            .setRank(position[0].position)
            .setLevel(level)
            .setCurrentXP(currentXP)
            .setRequiredXP(requiredXP)
            .setStatus(status)
            .setProgressBar('#00ffff', 'COLOR')
            .setUsername(username)
            .setDiscriminator(discriminator);

          const data = await rank.build();
          const attachment = new AttachmentBuilder(data, 'avatar.png');
          interaction.editReply({ files: [attachment] });
        }

        break;

      case "toplvl":

        try {

          const levels = await Level.findAll({
            where: { ServerID: interaction.guild.id },
            order: [['xp', 'DESC']],
            limit: 10
          });

          const leaderboardData = levels.map((level, index) => {
            const member = interaction.guild.members.cache.get(level.MemberID);
            if (member) {
              // Use new cumulative XP formula to match /rank command
              const cumulative = require('../utils/CalculateLevelXP');
              const levelStart = cumulative(level.level);
              const nextLevelStart = cumulative(level.level + 1);
              
              // Fix: Check if stored xp matches cumulative formula
              // If not, use xplevel field (legacy data compatibility)
              let currentXP;
              if (level.xp < levelStart) {
                // XP is stored as progress within current level
                currentXP = level.xplevel || level.xp;
              } else {
                // XP is cumulative total
                currentXP = level.xp - levelStart;
              }
              if (currentXP < 0) currentXP = 0;
              let requiredXP = nextLevelStart - levelStart; // XP needed for next level
              
              return {
                avatar: member.user.displayAvatarURL({ extension: 'png', size: 128 }),
                tag: member.user.username,
                level: level.level,
                xp: currentXP,
                max_xp: requiredXP,
                top: index + 1
              };
            } else {
              return null;
            }
          }).filter(leaderboardEntry => leaderboardEntry !== null);

          if (leaderboardData.length === 0) {
            return interaction.editReply({ content: 'No users found in the leaderboard.' });
          }

          try {
            // Use our beautiful modern leaderboard designer (inspired by the reference image)
            const modernLeaderboardDesigner = new ModernLeaderboardDesigner();
            const leaderboardBuffer = await modernLeaderboardDesigner.createLeaderboard({
              players: leaderboardData,
              title: `${interaction.guild.name} Leaderboard`
            });

            const attachment = new AttachmentBuilder(leaderboardBuffer, { name: 'leaderboard.png' });
            interaction.editReply({ files: [attachment] });

          } catch (error) {
            console.error('Error creating custom leaderboard:', error);
            
            // Fallback to beautiful text-based leaderboard
            let leaderboardText = '';
            
            leaderboardData.forEach((user, index) => {
              const position = index + 1;
              const medal = position === 1 ? '🥇' : position === 2 ? '🥈' : position === 3 ? '🥉' : `${position}.`;
              const progressBar = createProgressBar(user.xp, user.max_xp);
              leaderboardText += `${medal} **${user.tag}**\n`;
              leaderboardText += `   Level ${user.level} • ${user.xp}/${user.max_xp} XP\n`;
              leaderboardText += `   ${progressBar}\n\n`;
            });

            const embed = new EmbedBuilder()
              .setTitle(`🏆 ${interaction.guild.name} Leaderboard`)
              .setDescription(leaderboardText || 'No users found.')
              .setColor('#FFD700')
              .setTimestamp()
              .setFooter({ text: 'Keep leveling up!' });

            interaction.editReply({ embeds: [embed] });
          }

        } catch (error) {
          console.error('Error in toplvl command:', error);
          interaction.editReply({ content: 'An error occurred while generating the leaderboard.' });
        }

        break;

    }
  },
};

// Helper function for text progress bar
function createProgressBar(current, max, length = 10) {
  const progress = Math.min(current / max, 1);
  const filled = Math.round(length * progress);
  const empty = length - filled;
  
  const filledBar = '█'.repeat(filled);
  const emptyBar = '░'.repeat(empty);
  
  return `${filledBar}${emptyBar} ${Math.round(progress * 100)}%`;
}
