// Database setup: prefer DATABASE_URL (Postgres) when provided, otherwise use local SQLite
const { Sequelize } = require('sequelize');

let sequelize;

if (process.env.DATABASE_URL) {
	sequelize = new Sequelize(process.env.DATABASE_URL, {
		dialect: 'postgres',
		protocol: 'postgres',
		logging: false,
		dialectOptions: (process.env.NODE_ENV === 'production') ? {
			ssl: {
				require: true,
				rejectUnauthorized: false,
			},
		} : {},
	});
} else {
	sequelize = new Sequelize({
		dialect: 'sqlite',
		storage: process.env.DATABASE_PATH || 'database.sqlite',
		logging: false,
	});
}

module.exports = sequelize;