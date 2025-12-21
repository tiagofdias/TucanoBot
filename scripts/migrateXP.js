/**
 * Migration Script: Recalculate XP to match current level for all users
 * 
 * This script will set each user's total XP to the minimum required for their current level,
 * plus any xplevel progress they have in the current level.
 * 
 * Run with: node scripts/migrateXP.js
 */

require('dotenv').config();
const path = require('path');
const sequelize = require(path.join(__dirname, '..', 'database', 'database'));
const Level = require(path.join(__dirname, '..', 'models', 'Level'));
const cumulative = require(path.join(__dirname, '..', 'utils', 'CalculateLevelXP'));

// Initialize models
Level.init(sequelize);

async function migrateXP() {
    try {
        console.log('Connecting to database...');
        await sequelize.authenticate();
        console.log('Connected!\n');

        // Get all level records
        const records = await Level.findAll();
        console.log(`Found ${records.length} user records to migrate.\n`);

        let updated = 0;
        let skipped = 0;

        for (const record of records) {
            const level = record.level || 1;
            const xplevel = record.xplevel || 0;
            
            // Calculate what the total XP should be
            const levelStartXP = cumulative(level);
            const expectedTotalXP = levelStartXP + xplevel;
            
            // Check if current XP is already correct (within tolerance)
            if (record.xp === expectedTotalXP) {
                skipped++;
                continue;
            }

            const oldXP = record.xp;
            record.xp = expectedTotalXP;
            
            // Also ensure xplevel doesn't exceed what's needed for next level
            const xpForNextLevel = cumulative(level + 1) - levelStartXP;
            if (record.xplevel >= xpForNextLevel) {
                record.xplevel = 0; // Reset if it's somehow invalid
            }

            await record.save();
            updated++;
            
            console.log(`[${record.MemberID}] Level ${level}: XP ${oldXP} → ${expectedTotalXP} (xplevel: ${xplevel})`);
        }

        console.log(`\n✅ Migration complete!`);
        console.log(`   Updated: ${updated} records`);
        console.log(`   Skipped: ${skipped} records (already correct)`);
        
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
}

migrateXP();
