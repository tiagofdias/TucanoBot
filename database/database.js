// Database setup: prefer DATABASE_URL (Postgres) when provided (Render managed DB),
// otherwise fall back to local SQLite storage (useful for local dev).
const { Sequelize } = require('sequelize');

let sequelize;

if (process.env.DATABASE_URL) {
	// Use Postgres when DATABASE_URL is provided by Render or other providers.
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
	// Local SQLite (default)
	sequelize = new Sequelize({
		dialect: 'sqlite',
		storage: process.env.DATABASE_PATH || 'database.sqlite',
		logging: false,
	});
}

module.exports = sequelize;