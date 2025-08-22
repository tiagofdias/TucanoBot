require('dotenv').config();

const db = require('./database/database');
const {
  Client,
  GatewayIntentBits,
  ActivityType,
  EmbedBuilder,
  Events,
  Collection,
  GuildVoice,
  GuildMember,
  GuildPresences,
  Guilds,
  GuildMembers,
  ChannelType,
  ButtonBuilder,
  ButtonStyle,
  PermissionFlagsBits,
  ActionRowBuilder,
  Routes,
  REST,
  Component,
  ComponentType,
} = require('discord.js');
const fs = require('node:fs');
const path = require('node:path');

const commands = [];
const guildCommands = []; // Guild-specific commands

const commandFiles = fs.readdirSync('./commands').filter((file) => file.endsWith('.js'));

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildPresences,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMembers,
  ],
});

client.commands = new Collection();

for (const file of commandFiles) {
  const command = require(`./commands/${file}`);

  if ('data' in command && 'execute' in command) {
    client.commands.set(command.data.name, command);

    if (command.guildID === process.env.GUILD_ID) {
      // Guild-specific command
      guildCommands.push(command.data.toJSON());
    } else {
      // Global command
      commands.push(command.data.toJSON());
    }
  } else {
    console.log(`[WARNING] The command file ${file} is missing a required "data" or "execute" property.`);
  }
}

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

(async () => {
  try {
    console.log(`Started refreshing ${commands.length} application (/) commands.`);

    // Deploy global commands
    const globalData = await rest.put(
      Routes.applicationCommands(process.env.CLIENT_ID),
      { body: commands },
    );

    console.log(`Successfully deployed ${globalData.length} global application (/) commands.`);

    // Deploy guild-specific commands
    const guildData = await rest.put(
      Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
      { body: guildCommands },
    );

    console.log(`Successfully deployed ${guildData.length} guild-specific application (/) commands.`);
  } catch (error) {
    console.error(error);
  }
})();

/* const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter((file) => file.endsWith('.js'));

for (const file of eventFiles) {
  const filePath = path.join(eventsPath, file);
  const event = require(filePath);
  if (event.once) {
    client.once(event.name, (...args) => event.execute(...args));
  } else {
    client.on(event.name, (...args) => event.execute(...args));
  }
} */

// IMPORTANT: On Windows the filesystem is case-insensitive, but Discloud runs on Linux.
// The folder in the repo is named 'events', so we must reference it with the exact same casing
// or the bot will crash in production with MODULE_NOT_FOUND.
const eventsPath = path.join(__dirname, 'events');

const loadEvents = (dir) => {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.lstatSync(filePath);
    if (stat.isDirectory()) {
      loadEvents(filePath);
    } else {
      const event = require(filePath);
      if (event.once) {
        client.once(event.name, (...args) => event.execute(...args));
      } else {
        client.on(event.name, (...args) => event.execute(...args));
      }
    }
  }
};

loadEvents(eventsPath);

client.login(process.env.DISCORD_TOKEN);
