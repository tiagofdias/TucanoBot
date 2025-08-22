// Require Sequelize
const { Sequelize } = require('sequelize');

module.exports = new Sequelize('database', 'user', 'password', {
	host: 'localhost',
	dialect: 'sqlite',
	logging: false,
	// SQLite only
	storage: process.env.DATABASE_PATH || 'database.sqlite',
});