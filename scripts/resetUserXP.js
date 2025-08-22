// Usage: node scripts/resetUserXP.js <memberId> <level> <xpInLevel>
// Example: node scripts/resetUserXP.js 123456789012345678 49 6398
require('dotenv').config();
const path = require('path');
const sequelize = require(path.join(__dirname, '..', 'database', 'database'));
const Level = require(path.join(__dirname, '..', 'models', 'Level'));
const cumulative = require(path.join(__dirname, '..', 'utils', 'calculateLevelXp'));

// Initialize Sequelize models
Level.init(sequelize);

async function main() {
  const [memberId, levelArg, xpInLevelArg] = process.argv.slice(2);
  if (!memberId || !levelArg) {
    console.log('Arguments missing.');
    console.log('Usage: node scripts/resetUserXP.js <memberId> <level> [xpInLevel]');
    process.exit(1);
  }
  const level = parseInt(levelArg, 10);
  if (isNaN(level) || level < 1) {
    console.log('Invalid level.');
    process.exit(1);
  }
  let xpInLevel = xpInLevelArg ? parseInt(xpInLevelArg, 10) : 0;
  if (isNaN(xpInLevel) || xpInLevel < 0) xpInLevel = 0;

  const levelStart = cumulative(level);
  const nextStart = cumulative(level + 1);
  const maxInLevel = nextStart - levelStart - 1;
  if (xpInLevel > maxInLevel) xpInLevel = maxInLevel;
  const totalXP = levelStart + xpInLevel;

  try {
    await sequelize.sync();
    let rec = await Level.findOne({ where: { MemberID: memberId } });
    if (!rec) {
      rec = await Level.create({ ServerID: 'UNKNOWN', MemberID: memberId, xp: totalXP, xplevel: xpInLevel, level });
      console.log(`Created new record for ${memberId}`);
    } else {
      console.log(`Before -> Level: ${rec.level} TotalXP: ${rec.xp} XPInLevel: ${rec.xplevel}`);
      rec.level = level;
      rec.xp = totalXP;
      rec.xplevel = xpInLevel;
      await rec.save();
      console.log(`After  -> Level: ${rec.level} TotalXP: ${rec.xp} XPInLevel: ${rec.xplevel}`);
    }
    console.log('Reset complete.');
  } catch (e) {
    console.error('Error resetting user XP:', e);
    process.exit(1);
  } finally {
    if (sequelize) await sequelize.close().catch(() => {});
  }
}

main();
