const Canvas = require('canvas');
const path = require('path');

class RankCardDesigner {
  constructor() {
    // Card dimensions
    this.width = 900;
    this.height = 300;
  }

  async createRankCard(options) {
    const {
      username,
      discriminator,
      avatar,
      level,
      currentXP,
      requiredXP,
      rank,
      status = 'offline'
    } = options;

    // Create canvas
    const canvas = Canvas.createCanvas(this.width, this.height);
    const ctx = canvas.getContext('2d');

    // Enable anti-aliasing for smoother graphics
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // Create gradient background
    await this.drawBackground(ctx);

    // Draw decorative elements
    await this.drawDecorations(ctx);

    // Draw avatar with glow effect
    await this.drawAvatar(ctx, avatar, status);

    // Draw user information
    await this.drawUserInfo(ctx, username, discriminator, rank, level);

    // Draw XP progress bar
    await this.drawXPBar(ctx, currentXP, requiredXP);

    // Draw level badge
    await this.drawLevelBadge(ctx, level);

    return canvas.toBuffer('image/png');
  }

  async drawBackground(ctx) {
    // Main gradient background
    const gradient = ctx.createLinearGradient(0, 0, this.width, this.height);
    gradient.addColorStop(0, '#667eea');
    gradient.addColorStop(0.5, '#764ba2');
    gradient.addColorStop(1, '#f093fb');
    
    ctx.fillStyle = gradient;
    this.roundedRect(ctx, 0, 0, this.width, this.height, 25);
    ctx.fill();

    // Overlay pattern
    ctx.globalAlpha = 0.1;
    for (let i = 0; i < 50; i++) {
      const x = Math.random() * this.width;
      const y = Math.random() * this.height;
      const size = Math.random() * 3 + 1;
      
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // Glass effect overlay
    const glassGradient = ctx.createLinearGradient(0, 0, 0, this.height);
    glassGradient.addColorStop(0, 'rgba(255, 255, 255, 0.2)');
    glassGradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.05)');
    glassGradient.addColorStop(1, 'rgba(0, 0, 0, 0.1)');
    
    ctx.fillStyle = glassGradient;
    this.roundedRect(ctx, 10, 10, this.width - 20, this.height - 20, 20);
    ctx.fill();
  }

  async drawDecorations(ctx) {
    // Simplified decorations for better performance
    ctx.save();
    
    // Top right decoration
    ctx.translate(this.width - 80, 40);
    ctx.rotate(Math.PI / 6);
    
    const decorGradient = ctx.createLinearGradient(-30, -30, 30, 30);
    decorGradient.addColorStop(0, 'rgba(255, 255, 255, 0.3)');
    decorGradient.addColorStop(1, 'rgba(255, 255, 255, 0.1)');
    
    ctx.fillStyle = decorGradient;
    ctx.fillRect(-30, -30, 60, 60);
    
    ctx.restore();

    // Bottom left decoration
    ctx.save();
    ctx.translate(60, this.height - 60);
    ctx.rotate(-Math.PI / 4);
    
    ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.beginPath();
    ctx.arc(0, 0, 25, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.restore();

    // Reduced sparkle effects for performance
    const sparkles = [
      { x: 200, y: 50, size: 2 },
      { x: 650, y: 80, size: 2 },
    ];

    sparkles.forEach(sparkle => {
      this.drawSparkle(ctx, sparkle.x, sparkle.y, sparkle.size);
    });
  }

  drawSparkle(ctx, x, y, size) {
    ctx.save();
    ctx.translate(x, y);
    
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.shadowColor = '#ffffff';
    ctx.shadowBlur = 10;
    
    // Draw 4-pointed star
    ctx.beginPath();
    for (let i = 0; i < 4; i++) {
      ctx.lineTo(0, -size);
      ctx.rotate(Math.PI / 2);
      ctx.lineTo(0, -size / 2);
      ctx.rotate(Math.PI / 2);
    }
    ctx.closePath();
    ctx.fill();
    
    ctx.restore();
  }

  async drawAvatar(ctx, avatarUrl, status) {
    try {
      // Set a timeout for avatar loading to prevent hanging
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
      
      // Load avatar image with timeout
      const avatarImage = await Canvas.loadImage(avatarUrl);
      clearTimeout(timeoutId);
      
      const avatarSize = 120;
      const avatarX = 50;
      const avatarY = this.height / 2 - avatarSize / 2;

      // Draw glow effect
      ctx.save();
      ctx.shadowColor = '#ffffff';
      ctx.shadowBlur = 20;
      ctx.globalAlpha = 0.6;
      
      ctx.beginPath();
      ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2 + 5, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      
      ctx.restore();

      // Draw avatar with border
      ctx.save();
      ctx.beginPath();
      ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();

      ctx.drawImage(avatarImage, avatarX, avatarY, avatarSize, avatarSize);
      ctx.restore();

      // Draw border
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
      ctx.stroke();

      // Draw status indicator
      this.drawStatusIndicator(ctx, avatarX + avatarSize - 25, avatarY + avatarSize - 25, status);

    } catch (error) {
      console.error('Error loading avatar:', error);
      // Draw placeholder avatar
      const avatarSize = 120;
      const avatarX = 50;
      const avatarY = this.height / 2 - avatarSize / 2;
      
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
      ctx.fill();
      
      // Draw border
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 4;
      ctx.stroke();
      
      // Draw status indicator
      this.drawStatusIndicator(ctx, avatarX + avatarSize - 25, avatarY + avatarSize - 25, status);
    }
  }

  drawStatusIndicator(ctx, x, y, status) {
    const colors = {
      online: '#43b581',
      idle: '#faa61a',
      dnd: '#f04747',
      offline: '#747f8d'
    };

    ctx.fillStyle = colors[status] || colors.offline;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    
    ctx.beginPath();
    ctx.arc(x, y, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }

  async drawUserInfo(ctx, username, discriminator, rank, level) {
    const startX = 200;
    const startY = 80;

    // Username
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 36px Arial, sans-serif';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    ctx.shadowBlur = 5;
    ctx.fillText(username, startX, startY);

    // Discriminator (if exists)
    if (discriminator && discriminator !== '0') {
      const usernameWidth = ctx.measureText(username).width;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.font = 'normal 24px Arial, sans-serif';
      ctx.fillText(`#${discriminator}`, startX + usernameWidth + 10, startY);
    }

    // Rank
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 18px Arial, sans-serif';
    ctx.fillText(`RANK #${rank}`, startX, startY + 40);

    ctx.shadowColor = 'transparent';
  }

  async drawXPBar(ctx, currentXP, requiredXP) {
    const barX = 200;
    const barY = this.height - 80;
    const barWidth = 500;
    const barHeight = 25;
    
    // Ensure we don't divide by zero and handle edge cases
    const progress = requiredXP > 0 ? Math.min(Math.max(currentXP / requiredXP, 0), 1) : 0;

    // Background bar
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    this.roundedRect(ctx, barX, barY, barWidth, barHeight, 12);
    ctx.fill();

    // Only draw progress if there's actual progress to show
    if (progress > 0) {
      // Progress bar with gradient
      const progressGradient = ctx.createLinearGradient(barX, barY, barX + barWidth, barY);
      progressGradient.addColorStop(0, '#00d2ff');
      progressGradient.addColorStop(0.5, '#3a7bd5');
      progressGradient.addColorStop(1, '#00d2ff');
      
      ctx.fillStyle = progressGradient;
      const progressWidth = Math.max(barWidth * progress, 1); // Ensure at least 1px if there's any progress
      this.roundedRect(ctx, barX, barY, progressWidth, barHeight, 12);
      ctx.fill();

      // Glow effect on progress bar
      ctx.save();
      ctx.shadowColor = '#00d2ff';
      ctx.shadowBlur = 15;
      ctx.globalAlpha = 0.8;
      this.roundedRect(ctx, barX, barY, progressWidth, barHeight, 12);
      ctx.fill();
      ctx.restore();
    }

    // XP text
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 16px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
    ctx.shadowBlur = 3;
    ctx.fillText(`${Math.floor(currentXP).toLocaleString()} / ${Math.floor(requiredXP).toLocaleString()} XP`, 
                 barX + barWidth / 2, barY - 10);
    ctx.textAlign = 'left';
    ctx.shadowColor = 'transparent';
  }

  async drawLevelBadge(ctx, level) {
    const badgeX = this.width - 120;
    const badgeY = 50;
    const badgeSize = 80;

    // Badge background with gradient
    const badgeGradient = ctx.createRadialGradient(
      badgeX + badgeSize / 2, badgeY + badgeSize / 2, 0,
      badgeX + badgeSize / 2, badgeY + badgeSize / 2, badgeSize / 2
    );
    badgeGradient.addColorStop(0, '#ffd700');
    badgeGradient.addColorStop(0.7, '#ffb347');
    badgeGradient.addColorStop(1, '#ff8c00');

    ctx.fillStyle = badgeGradient;
    ctx.beginPath();
    ctx.arc(badgeX + badgeSize / 2, badgeY + badgeSize / 2, badgeSize / 2, 0, Math.PI * 2);
    ctx.fill();

    // Badge border
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Glow effect
    ctx.save();
    ctx.shadowColor = '#ffd700';
    ctx.shadowBlur = 20;
    ctx.globalAlpha = 0.7;
    ctx.beginPath();
    ctx.arc(badgeX + badgeSize / 2, badgeY + badgeSize / 2, badgeSize / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Level text
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 24px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(level.toString(), 
                 badgeX + badgeSize / 2, 
                 badgeY + badgeSize / 2);
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
  }

  roundedRect(ctx, x, y, width, height, radius) {
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
  }
}

module.exports = RankCardDesigner;
