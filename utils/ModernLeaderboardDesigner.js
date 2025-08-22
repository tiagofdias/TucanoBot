const { createCanvas, loadImage, registerFont } = require('canvas');

class LeaderboardDesigner {
  constructor() {
    this.canvas = null;
    this.ctx = null;
  }

  async registerFonts() {
    try {
      registerFont('./Poppins/Poppins-Bold.ttf', { family: 'Poppins', weight: 'bold' });
      registerFont('./Poppins/Poppins-SemiBold.ttf', { family: 'Poppins', weight: '600' });
      registerFont('./Poppins/Poppins-Medium.ttf', { family: 'Poppins', weight: '500' });
      registerFont('./Poppins/Poppins-Regular.ttf', { family: 'Poppins', weight: 'normal' });
    } catch (error) {
      console.log('Poppins font loading failed:', error.message);
    }
  }

  async createLeaderboard(data) {
    const { players, title = 'Server Leaderboard' } = data;
    
    await this.registerFonts();
    
    const cardHeight = 100;
    const cardSpacing = 15;
    const padding = 40;
    const width = 800;
    const height = padding * 2 + (cardHeight * players.length) + (cardSpacing * (players.length - 1));
    
    this.canvas = createCanvas(width, height);
    this.ctx = this.canvas.getContext('2d');

    // Modern gradient background
    const bgGradient = this.ctx.createLinearGradient(0, 0, width, height);
    bgGradient.addColorStop(0, '#E6F3FF');
    bgGradient.addColorStop(1, '#F0F8FF');
    
    this.ctx.fillStyle = bgGradient;
    this.ctx.fillRect(0, 0, width, height);

    // Draw leaderboard cards
    for (let i = 0; i < players.length; i++) {
      const player = players[i];
      const cardY = padding + (cardHeight + cardSpacing) * i;
      await this.drawPlayerCard(player, cardY, i + 1);
    }

    return this.canvas.toBuffer('image/png');
  }

  async drawPlayerCard(playerData, cardY, position) {
    const ctx = this.ctx;
    const cardX = 40;
    const cardWidth = 720;
    const cardHeight = 110; // Increased height to fit bigger text
    
    // Card background with shadow
    ctx.shadowColor = 'rgba(0, 0, 0, 0.1)';
    ctx.shadowBlur = 10;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 2;
    
    ctx.fillStyle = '#2C2F36';
    this.drawRoundedRect(cardX, cardY, cardWidth, cardHeight, 20);
    
    // Reset shadow
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;

    // Draw position badge
    this.drawPositionBadge(position, cardX + 20, cardY + 20);

    // Draw avatar
    await this.drawAvatar(playerData.avatar, cardX + 90, cardY + 20, 60);
    
    // Draw user info
    this.drawUserInfo(playerData, cardX + 170, cardY, position);
  }

  drawPositionBadge(position, x, y) {
    const ctx = this.ctx;
    const size = 60;
    
    // Position badge colors for better visibility
    const positionStyles = {
      1: { color: '#FFFFFF', bgColor: '#FFD700', emoji: '#1' }, // Gold with white text
      2: { color: '#000000', bgColor: '#C0C0C0', emoji: '#2' }, // Silver with black text  
      3: { color: '#FFFFFF', bgColor: '#CD7F32', emoji: '#3' }  // Bronze with white text
    };

    const defaultStyle = { color: '#FFFFFF', bgColor: '#4A5568', emoji: `#${position}` };
    const style = positionStyles[position] || defaultStyle;
    
    // Badge background with rounded corners
    ctx.fillStyle = style.bgColor;
    this.drawRoundedRect(x, y, size, size, 15);
    
    // Badge text with high contrast
    ctx.fillStyle = style.color;
    ctx.font = 'bold 18px Poppins, Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(style.emoji, x + size/2, y + size/2);
  }

  async drawAvatar(avatarUrl, x, y, size) {
    const ctx = this.ctx;
    
    try {
      if (avatarUrl && avatarUrl !== 'undefined' && !avatarUrl.includes('null')) {
        const avatar = await loadImage(avatarUrl);
        
        // Draw avatar with clipping
        ctx.save();
        ctx.beginPath();
        ctx.arc(x + size/2, y + size/2, size/2, 0, Math.PI * 2);
        ctx.clip();
        ctx.drawImage(avatar, x, y, size, size);
        ctx.restore();
      } else {
        // Fallback avatar
        ctx.fillStyle = '#4F545C';
        ctx.beginPath();
        ctx.arc(x + size/2, y + size/2, size/2, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#72767D';
        ctx.font = `${size/2}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('👤', x + size/2, y + size/2);
      }
    } catch (error) {
      console.error('Avatar loading failed:', error);
      // Fallback avatar
      ctx.fillStyle = '#4F545C';
      ctx.beginPath();
      ctx.arc(x + size/2, y + size/2, size/2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  drawUserInfo(playerData, x, y, position) {
    const ctx = this.ctx;
    
    // Username
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 24px Poppins, Arial, sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(playerData.tag, x, y + 10);
    
    // Progress Bar (full width - extends to the end of the card)
    const progressBarY = y + 40;
    const progressBarWidth = 450; // Extended to fill most of the card
    const progressBarHeight = 45; // Taller to fit bigger text
    const progressRadius = 22;
    
    // Calculate progress
    const progress = Math.min(playerData.xp / playerData.max_xp, 1);
    
    // Progress bar colors based on position (matching reference image)
    const progressColors = {
      1: '#3B82F6', // Blue for #1
      2: '#EF4444', // Red/Pink for #2  
      3: '#EF4444', // Red/Pink for #3
    };
    
    const progressColor = progressColors[position] || '#10B981'; // Green for others
    
    // Progress bar background
    ctx.fillStyle = 'rgba(75, 85, 99, 0.3)';
    ctx.beginPath();
    ctx.roundRect(x, progressBarY, progressBarWidth, progressBarHeight, progressRadius);
    ctx.fill();
    
    // Progress bar fill
    ctx.fillStyle = progressColor;
    ctx.beginPath();
    ctx.roundRect(x, progressBarY, progressBarWidth * Math.max(0.1, progress), progressBarHeight, progressRadius);
    ctx.fill();
    
    // Level text on the left side of the progress bar (BIGGER)
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 20px Poppins, Arial, sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    const levelText = `Level ${playerData.level}`;
    ctx.fillText(levelText, x + 25, progressBarY + progressBarHeight / 2);
    
    // XP details on the right side of the progress bar (BIGGER)
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 18px Poppins, Arial, sans-serif';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    const xpText = `${playerData.xp.toLocaleString()}/${playerData.max_xp.toLocaleString()} XP`;
    ctx.fillText(xpText, x + progressBarWidth - 25, progressBarY + progressBarHeight / 2);
  }

  drawRoundedRect(x, y, width, height, radius) {
    const ctx = this.ctx;
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
    ctx.fill();
  }
}

module.exports = LeaderboardDesigner;
