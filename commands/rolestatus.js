const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

const RoleStatus = require('../models/RoleStatus');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('rolestatus')
        .setDescription('Assign a role to a type of status (EX: Listening, Streaming or Playing)')
        .addSubcommand(subcommand =>
            subcommand
                .setName('add')
                .setDescription('Add a role to a type of status')
                .addIntegerOption(option =>
                    option
                        .setName('role-type')
                        .setDescription('Choose the role type that you want.')
                        .setRequired(true)
                        .addChoices(
                            { name: 'add a stage channel role.', value: 6 },
                            { name: 'add a recording role.', value: 5 },
                            { name: 'add a voice channel role.', value: 7 },
                            { name: 'add a screen sharing role.', value: 3 },
                            { name: 'add a listening to Spotify role.', value: 2 },
                            { name: 'add a streaming role.', value: 1 },
                            { name: 'add a gaming role.', value: 0 },
                        ),
                )
                .addRoleOption(option =>
                    option
                        .setName('role')
                        .setDescription('The role that will be added to the user.')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('remove')
                .setDescription('Removes a role from the list')
                .addIntegerOption(option =>
                    option
                        .setName('role-type')
                        .setDescription('Choose the role type that you want.')
                        .setRequired(true)
                        .addChoices(
                            { name: 'Remove the stage channel role.', value: 6 },
                            { name: 'Remove the recording role.', value: 5 },
                            { name: 'Remove the voice channel role.', value: 7 },
                            { name: 'Remove the screen sharing role.', value: 3 },
                            { name: 'Remove the listening to Spotify role.', value: 2 },
                            { name: 'Remove the streaming role.', value: 1 },
                            { name: 'Remove the gaming role.', value: 0 },
                        ),
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('list')
                .setDescription('List all the roles')
        ),
    async execute(interaction) {
        if (interaction.options.getSubcommand()) {

            //Isto tudo é para verificar se a role do bot tá no topo da hierarquia.
            ///////////////////////////////////////////////////////////
            const client = interaction.client;
            const guild = client.guilds.cache.get(interaction.guild.id);
            // Get all the roles in the server as an array
            const roles = Array.from(guild.roles.cache.values());
            // assume `roles` is an array of all roles in the hierarchy
            let highestRole = null;
            roles.forEach(role => { if (!highestRole || role.position > highestRole.position) highestRole = role; });

            if (highestRole.name !== 'Toucan Bot') return interaction.reply({ content: `The operation was cancelled. In order for this command to function properly, you must prioritize the Toucan Bot role and place it at the highest point in your roles hierarchy.`, ephemeral: true, });

            //////////////////////////////////////////////////////////

            switch (interaction.options.getSubcommand()) {

                case "add":

                    const roletype = parseInt(interaction.options.get('role-type').value);
                    const role = interaction.options.get('role').value;

                    RoleStatus.count({ where: { ServerID: interaction.guildId.toString(), Roletype: roletype } })
                        .then(QueryRoleStatus => {
                            if (QueryRoleStatus === 0) {
                                RoleStatus.create({
                                    ServerID: interaction.guildId.toString(),
                                    RoleID: role,
                                    Roletype: roletype
                                })
                                    .then(() => interaction.reply({ content: "Your role was successfully added", ephemeral: true }))
                                    .catch(error => {
                                        if (error.name === 'SequelizeUniqueConstraintError') {
                                            interaction.reply('That tag already exists.');
                                        } else
                                            interaction.reply('Something went wrong.');

                                    });
                            } else
                                interaction.reply({ content: "The status is already being used by another role.", ephemeral: true });

                        });

                    break;

                case "remove":

                    const roletype2 = parseInt(interaction.options.get('role-type').value);
                    const count = await RoleStatus.count({ where: { ServerID: interaction.guildId.toString(), Roletype: roletype2 } });

                    if (count > 0) {
                        await RoleStatus.destroy({ where: { ServerID: interaction.guildId.toString(), Roletype: roletype2 } });
                        interaction.reply({ content: `The status role was successfully removed.`, ephemeral: true });
                    } else
                        interaction.reply({ content: `There's no roles inside this status.`, ephemeral: true });


                    break;

                case "list":

                    const serverId = interaction.guildId.toString();
                    const list = await RoleStatus.findAll({ where: { ServerID: serverId } });

                    if (list.length > 0) {

                        const description = "These are the saved status roles:\n\n" + list.map(function (element) {

                            let TipoRole;
                            switch (element.Roletype) {
                                case 0:
                                    TipoRole = 'Gaming Role';
                                    break;
                                case 1:
                                    TipoRole = 'Streaming Role';
                                    break;
                                case 2:
                                    TipoRole = 'Listening Role';
                                    break;
                                case 3:
                                    TipoRole = 'Screen Sharing Role';
                                    break;
                                case 7:
                                    TipoRole = 'In a Voice Channel Role';
                                    break;
                                case 5:
                                    TipoRole = 'Recording Role';
                                    break;
                                case 6:
                                    TipoRole = 'Stage Channel Role';
                                    break;
                            }

                            return `<@&${element.RoleID}> - ${TipoRole} \n`;
                        }).join('');

                        const embed = new EmbedBuilder()
                            .setTitle("Status Roles List")
                            .setDescription(description)
                            .setColor('Yellow');

                        interaction.reply({ embeds: [embed], ephemeral: true });
                    } else
                        interaction.reply({ content: `The list is empty`, ephemeral: true });


                    break;
            }
        }
    },
};