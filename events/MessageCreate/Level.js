require('dotenv').config();
const { Events } = require('discord.js');
const path = require('path');
const Level = require(path.join(__dirname, '..', '..', 'models', 'Level'));
const LevelConfig = require(path.join(__dirname, '..', '..', 'models', 'LevelConfig'));
const LevelRoleMultiplier = require(path.join(__dirname, '..', '..', 'models', 'LevelRoleMultiplier'));
const cooldowns = new Set();

module.exports = {
	name: Events.MessageCreate,
	once: false,
	async execute(message) {

		//LEVEL
		if (!message.inGuild() || message.author.bot || cooldowns.has(message.author.id)) return;

		try {

			let xpToGive = null;
			let levelConfig = await LevelConfig.findOne({ where: { ServerID: message.guild.id } });

			if (levelConfig) xpToGive = levelConfig.TextXP; else xpToGive = 10

			if (levelConfig && levelConfig.Status == 1) {

				//ROLEMULTIPLIER

				////////////////////////////////////////////
				// Find all roles with boost numbers for the specified server
				const roles = await LevelRoleMultiplier.findAll({ where: { ServerID: message.guild.id } });

				if (roles) {

					// Filter the roles that the member has
					const memberRoles = message.member.roles.cache.filter(role => roles.some(r => r.RoleID === role.id));

					let highestBoostRoleBoost = 1;

					if (memberRoles.size != 0) {

						// Get the role with the highest boost number
						const highestBoostRole = memberRoles.reduce((prev, current) => {
							const prevRoleBoost = roles.find(r => r.RoleID === prev.id)?.Boost ?? 0;
							const currentRoleBoost = roles.find(r => r.RoleID === current.id)?.Boost ?? 0;
							return currentRoleBoost > prevRoleBoost ? current : prev;
						});

						// Get the boost number of the highestBoostRole
						highestBoostRoleBoost = roles.find(r => r.RoleID === highestBoostRole.id)?.Boost ?? 1;

					}

					xpToGive *= highestBoostRoleBoost;
				}

				////////////////////////////////////////////

				const query = await Level.findOne({ where: { ServerID: message.guild.id, MemberID: message.author.id } });

				// Unified logic for both existing and new users using cumulative XP model.
				const cumulative = require(path.join(__dirname, '..', '..', 'utils', 'calculateLevelXp'));

				let record = query;
				if (!record) {
					record = await Level.create({
						ServerID: message.guild.id,
						MemberID: message.author.id,
						xp: 0,
						xplevel: 0,
						level: 1
					});
				}

				// Add XP (after multipliers)
				record.xp += xpToGive;

				// Recalculate level from cumulative XP to avoid drift
				let newLevel = record.level;
				while (record.xp >= cumulative(newLevel + 1) && newLevel < 500) {
					newLevel++;
				}
				const leveledUp = newLevel !== record.level;
				record.level = newLevel;
				record.xplevel = record.xp - cumulative(newLevel); // progress inside current level

				await record.save();

				if (leveledUp) {
					try { await message.member.send(`🎉 ${message.member} leveled up to **Level ${record.level}**!`); } catch {}
				}

				cooldowns.add(message.author.id);
				setTimeout(() => cooldowns.delete(message.author.id), 60000);
			}

		} catch (error) {
			console.log(`Error giving xp: ${error}`);
		}
    }
}