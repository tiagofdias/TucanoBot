// Bulk reset all users based on leaderboard image data
require('dotenv').config();
const path = require('path');
const sequelize = require(path.join(__dirname, '..', 'database', 'database'));
const Level = require(path.join(__dirname, '..', 'models', 'Level'));
const cumulative = require(path.join(__dirname, '..', 'utils', 'calculateLevelXp'));

// Initialize Sequelize models
Level.init(sequelize);

// Leaderboard data from the image
const leaderboardData = [
  { username: 'tiagofdias', level: 49, xpInLevel: 6398, maxXpInLevel: 7203 },
  { username: 'palextiago', level: 41, xpInLevel: 1495, maxXpInLevel: 5043 },
  { username: 'psantos1704', level: 36, xpInLevel: 3012, maxXpInLevel: 3888 },
  { username: 'fonsi', level: 28, xpInLevel: 266, maxXpInLevel: 2352 },
  { username: 'rodrigo5600', level: 19, xpInLevel: 302, maxXpInLevel: 1083 },
  { username: 'casanova_fr', level: 16, xpInLevel: 170, maxXpInLevel: 768 },
  { username: 'zet76', level: 15, xpInLevel: 632, maxXpInLevel: 675 },
  { username: 'danielsbento', level: 15, xpInLevel: 632, maxXpInLevel: 675 },
  { username: 'cabraodocrl', level: 12, xpInLevel: 387, maxXpInLevel: 432 }
];

async function main() {
  try {
    await sequelize.sync();
    
    console.log('🔄 Starting bulk XP reset for all leaderboard users...\n');
    
    // Get all users sorted by XP descending (current leaderboard order)
    const allUsers = await Level.findAll({
      order: [['xp', 'DESC']],
      limit: 20
    });
    
    console.log(`Found ${allUsers.length} users in database\n`);
    
    // Reset each user based on their position in leaderboard
    for (let i = 0; i < leaderboardData.length && i < allUsers.length; i++) {
      const user = allUsers[i];
      const targetData = leaderboardData[i];
      
      // Calculate correct XP values using new cumulative formula
      const levelStart = cumulative(targetData.level);
      const nextStart = cumulative(targetData.level + 1);
      let xpInLevel = targetData.xpInLevel;
      const maxInLevel = nextStart - levelStart - 1;
      
      // Ensure xp in level doesn't exceed maximum for that level
      if (xpInLevel > maxInLevel) xpInLevel = maxInLevel;
      
      const totalXP = levelStart + xpInLevel;
      
      console.log(`--- Resetting User #${i + 1}: ${targetData.username} ---`);
      console.log(`MemberID: ${user.MemberID}`);
      console.log(`Before -> Level: ${user.level}, Total XP: ${user.xp}, XP in Level: ${user.xplevel}`);
      console.log(`Target -> Level: ${targetData.level}, XP in Level: ${xpInLevel}`);
      console.log(`After  -> Level: ${targetData.level}, Total XP: ${totalXP}, XP in Level: ${xpInLevel}`);
      
      // Update the user record
      user.level = targetData.level;
      user.xp = totalXP;
      user.xplevel = xpInLevel;
      await user.save();
      
      console.log('✅ Reset complete!\n');
    }
    
    // Also normalize any remaining high-level users to reasonable levels
    const { Op } = require('sequelize');
    const remainingUsers = await Level.findAll({
      where: {
        level: { [Op.gt]: 30 }
      },
      order: [['xp', 'DESC']],
      offset: leaderboardData.length
    });
    
    if (remainingUsers.length > 0) {
      console.log(`--- Normalizing ${remainingUsers.length} additional high-level users ---`);
      
      for (const user of remainingUsers) {
        // Reset to a reasonable level (10-25 based on their current position)
        const newLevel = Math.min(25, Math.max(10, Math.floor(user.level * 0.4)));
        const newTotalXP = cumulative(newLevel);
        
        console.log(`Normalizing MemberID ${user.MemberID}: Level ${user.level} -> ${newLevel}`);
        
        user.level = newLevel;
        user.xp = newTotalXP;
        user.xplevel = 0;
        await user.save();
      }
      
      console.log('✅ Additional users normalized!\n');
    }
    
    console.log('🎉 Bulk XP reset complete!');
    console.log('All users now have correct XP values based on the leaderboard.');
    
  } catch (error) {
    console.error('❌ Error during bulk reset:', error);
    process.exit(1);
  } finally {
    if (sequelize) await sequelize.close().catch(() => {});
  }
}

main();
