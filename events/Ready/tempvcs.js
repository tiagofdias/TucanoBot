const { Events } = require('discord.js');

module.exports = {
    name: Events.ClientReady,
    once: true,
    async execute(client) {

        //Serve para remover os temp vcs que ficaram la sem ninguem após incialização.
        try {
            // Fetch all guilds the bot is a member of
            const guilds = client.guilds.cache.values();

            for (const guild of guilds) {
                // Fetch all voice channels in the guild
                const voiceChannels = guild.channels.cache.filter(channel => channel.type === 2);
               
                for (const [channelID, channel] of voiceChannels) {
                    // Check if the channel name is "Your Mom's Room"
                    if (channel.name === "Your Mom's Room") {
                        // Check if there are any members in the channel
                        if (channel.members.size === 0) {
                            // Delete the channel if it's empty
                            await channel.delete();
                        }
                    }
                }
            }
        } catch (error) {
            console.error('An error occurred:', error);
        }

    },

};