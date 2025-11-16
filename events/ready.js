//First, lets require the database definition file:
const db = require('../database/database');
const AutoDelete = require('../models/AutoDelete');
const VanityRoles = require('../models/VanityRoles');
const RoleStatus = require('../models/RoleStatus');
const PersistantRoles = require('../models/PersistantRoles');
const PersistantRoles2 = require('../models/PersistantRoles2');
const CHATGPT = require('../models/CHATGPT');
const AutoRole = require('../models/AutoRole');
const AutoPublish = require('../models/AutoPublish');
const Suggestions = require('../models/Suggestions');
const AutoScreenshot = require('../models/AutoScreenshot');
const Level = require('../models/Level');
const { Events, ActivityType } = require('discord.js');
const { model } = require('../database/database');
const autorole = require('../commands/autorole');

let status = [
	{
	  name: 'with your Mom',
	  type: ActivityType.Playing,
	},
	{
	  name: 'your Mom Live',
	  type: ActivityType.Streaming,
	  url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
	},
		{
	  name: 'GTA VI',
	  type: ActivityType.Streaming,
	  url: 'https://www.youtube.com/watch?v=npSctPLfIDo',
	},
	{
	  name: 'Mind games with the members',
	  type: ActivityType.Playing,
	},
	{
	  name: "Benfica",
	  type: ActivityType.Watching,
	},
	{
	  name: "Afonso wasting money",
	  type: ActivityType.Watching,
	},
	{
	  name: "PPAP videos",
	  type: ActivityType.Watching,
	},
	{
	  name: "Error 404: Motivation not found",
	  type: ActivityType.Watching,
	},
  ];
  

module.exports = {
	name: Events.ClientReady,
	once: true,
	execute(client) {
		db.authenticate()
        .then(() => {
            console.log('Logged in to DB!');
			// config.init(db); // initiates the table config
            // config.sync(); //creates the table, if it doesn't already exist
			
			AutoDelete.init(db); // initiates the table GuildPresenceRoles
			AutoDelete.sync(); //creates the table, if it doesn't already exist

			VanityRoles.init(db); // initiates the table GuildPresenceRoles
			VanityRoles.sync(); //creates the table, if it doesn't already exist

			RoleStatus.init(db);
			RoleStatus.sync();
 
			CHATGPT.init(db);
			CHATGPT.sync(); 

			PersistantRoles.init(db);
			PersistantRoles.sync(); 

			PersistantRoles2.init(db);
			PersistantRoles2.sync(); 

			AutoRole.init(db);
			AutoRole.sync(); 

			AutoPublish.init(db);
			AutoPublish.sync(); 

			Suggestions.init(db);
			Suggestions.sync(); 

			AutoScreenshot.init(db);
			AutoScreenshot.sync(); 

			Level.init(db);
			Level.sync(); 

			// Removed previous automatic XP overwrite block to preserve legitimate progression.

			console.log(`Ready! Logged in as ${client.user.tag}`);

			setInterval(() => {
				let random = Math.floor(Math.random() * status.length);
				client.user.setActivity(status[random]);
			}, 10000);
        })
        .catch(err => console.log(err));

	},
};
